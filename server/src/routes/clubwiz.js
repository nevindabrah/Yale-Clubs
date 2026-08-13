/**
 * ClubWiz — the in-app assistant.
 *
 * Two modes, one tool layer (see clubwiz-tools.js):
 *
 *   live     ANTHROPIC_API_KEY is set. Claude runs a tool-use loop over the
 *            catalog and the signed-in user's own data, and writes the answer.
 *   offline  No API key. A deterministic keyword router calls the same tools
 *            and formats the result. Less conversational, still correct and
 *            still useful — the feature is never simply broken.
 *
 * The mode is reported to the client so the UI can label it honestly.
 * See DECISIONS.md D-018.
 */
const express = require('express');
const { requireAuth } = require('../auth');
const { TOOL_DEFS, runTool } = require('../clubwiz-tools');

const router = express.Router();

const MODEL = process.env.CLUBWIZ_MODEL || 'claude-opus-5';
const EFFORT = process.env.CLUBWIZ_EFFORT || 'low';
const MAX_TOOL_ROUNDS = 6;

const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client = null;
function anthropic() {
  if (!client) {
    const Anthropic = require('@anthropic-ai/sdk');
    client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  }
  return client;
}

function systemPrompt(user, portal) {
  return `You are ClubWiz, the assistant built into YaleClubs — a catalog of Yale undergraduate
organizations with a student portal and a separate officer portal.

You are talking to ${user.full_name}, signed in to the ${portal} portal${
    user.class_year ? `, class of ${user.class_year}` : ''
  }${user.major ? `, studying ${user.major}` : ''}.

How to help:
- Answer from the tools, never from memory. You do not know Yale's club roster independently, and
  a plausible-sounding club that is not in the catalog is worse than saying you could not find one.
- Look things up before recommending. Call my_memberships before suggesting clubs so you do not
  recommend something they already belong to.
- Recommendations should account for the time they already committed. If someone is at 15 hours a
  week across four clubs, say so rather than adding a fifth.
- Refer to clubs by name and mention their page is at /club/<slug> when it would help.

Two things about this app you should get right:
- Student and officer accounts are separate logins on the same email. An officer account cannot
  join clubs, and a student account cannot review applications. If someone asks to do the other
  portal's thing, tell them to switch accounts rather than saying it is impossible.
- Meeting times, room locations, contact emails, deadlines and member counts in this build are
  demo data. If someone is about to act on one, say plainly that they should confirm with the club.

Style: direct and brief. Two or three sentences for a simple question. Use a short list when
comparing several clubs, prose otherwise. No preamble — answer first.`;
}

/** POST /api/clubwiz — body { messages: [{role:'user'|'assistant', content:string}] } */
router.post('/', requireAuth, async (req, res) => {
  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = incoming
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-16)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Send at least one user message.' });
  }

  if (!hasKey()) {
    return res.json(await offlineAnswer(messages, req.user));
  }

  try {
    res.json(await liveAnswer(messages, req.user));
  } catch (err) {
    console.error('ClubWiz live mode failed:', err.status || '', err.message);
    // Never leave the user with a dead assistant — degrade to the offline path.
    const fallback = await offlineAnswer(messages, req.user);
    res.json({
      ...fallback,
      degraded: true,
      note: 'The AI service was unreachable, so this answer came from a direct catalog lookup.',
    });
  }
});

/** GET /api/clubwiz/status — lets the UI label the mode without a round trip. */
router.get('/status', requireAuth, (_req, res) => {
  res.json({ mode: hasKey() ? 'live' : 'offline', model: hasKey() ? MODEL : null });
});

// ---------------------------------------------------------------------
// Live mode — Claude with tool use
// ---------------------------------------------------------------------

/**
 * Manual tool-use loop rather than the SDK's beta tool runner: this keeps the
 * app on the stable `messages.create` surface with no beta dependency, and
 * every tool call is executed with the caller's identity injected server-side
 * so the model cannot widen its own scope. See DECISIONS.md D-018.
 */
async function liveAnswer(messages, user) {
  const convo = [...messages];
  const toolsUsed = [];
  let rounds = 0;

  while (rounds++ < MAX_TOOL_ROUNDS) {
    const response = await createMessage({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt(user, user.account_type),
      thinking: { type: 'adaptive' },
      output_config: { effort: EFFORT },
      tools: TOOL_DEFS,
      messages: convo,
    });

    if (response.stop_reason === 'refusal') {
      return { reply: 'I can’t help with that one. Ask me about clubs, deadlines or your schedule.', tools_used: toolsUsed, mode: 'live' };
    }

    const toolUses = response.content.filter((b) => b.type === 'tool_use');

    if (!toolUses.length) {
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return {
        reply: text || 'I could not find anything for that. Try naming an interest or a club.',
        tools_used: toolsUsed,
        mode: 'live',
      };
    }

    // Preserve the assistant turn verbatim — tool_use blocks must round-trip.
    convo.push({ role: 'assistant', content: response.content });

    const results = [];
    for (const call of toolUses) {
      toolsUsed.push(call.name);
      const output = await runTool(call.name, call.input, user);
      results.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: JSON.stringify(output).slice(0, 60000),
      });
    }
    // All results for one assistant turn go back in a single user message.
    convo.push({ role: 'user', content: results });
  }

  return {
    reply: 'That took more lookups than I have room for. Try asking something more specific.',
    tools_used: toolsUsed,
    mode: 'live',
  };
}

/**
 * Server-side refusal fallbacks are opt-in and Claude-API-only. If the beta is
 * not available to this key the request 400s, so retry once without it rather
 * than failing the turn.
 */
let fallbacksSupported = process.env.CLUBWIZ_FALLBACKS !== 'off';

async function createMessage(params) {
  if (fallbacksSupported) {
    try {
      return await anthropic().beta.messages.create({
        ...params,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
    } catch (err) {
      if (err.status !== 400) throw err;
      console.warn('ClubWiz: server-side fallbacks unavailable, continuing without them.');
      fallbacksSupported = false;
    }
  }
  return anthropic().messages.create(params);
}

// ---------------------------------------------------------------------
// Offline mode — deterministic routing over the same tools
// ---------------------------------------------------------------------

const CATEGORY_HINTS = [
  [/a\s?cappella|sing|choir|chorus|vocal/i, 'Music & A Cappella'],
  [/orchestra|band|instrument|jazz|opera/i, 'Music & A Cappella'],
  [/theat|drama|improv|comedy|sketch|dance|perform/i, 'Performing Arts'],
  [/newspaper|journal|magazine|write|writing|report|radio|publica/i, 'Publications & Media'],
  [/politic|debate|advocacy|campaign|activis/i, 'Political & Advocacy'],
  [/consult|finance|business|invest|entrepreneur|startup|pre-?prof/i, 'Pre-Professional'],
  [/engineer|robot|code|coding|software|comput|stem|science|hack|tech/i, 'STEM & Engineering'],
  [/cultur|identity|heritage|asian|black|latin|african|queer|lgbt|women/i, 'Cultural & Identity'],
  [/service|volunteer|charity|community|tutor|homeless|refugee/i, 'Community Service'],
  [/sport|athlet|team|frisbee|soccer|climb|outdoor|hike|sail|ski|rugby/i, 'Club Sports & Outdoors'],
  [/relig|faith|christ|jewish|muslim|hindu|worship|church/i, 'Religious & Spiritual'],
  [/health|wellness|counsel|mental/i, 'Health & Wellness'],
  [/chess|anime|game|hobby|recreation/i, 'Hobbies & Recreation'],
  [/model un|mock trial|debate team|academic/i, 'Academic & Debate'],
];

const fmtHours = (h) => `${Number(h) % 1 === 0 ? Number(h) : Number(h).toFixed(1)} hrs/wk`;

const STOPWORDS = new Set([
  'what', 'which', 'who', 'whom', 'that', 'this', 'these', 'those', 'there',
  'about', 'have', 'has', 'with', 'from', 'into', 'like', 'want', 'need',
  'club', 'clubs', 'yale', 'some', 'any', 'good', 'best', 'find', 'show',
  'tell', 'give', 'looking', 'interested', 'would', 'could', 'should', 'been',
  'join', 'joining', 'more', 'most', 'other', 'something', 'anything', 'please',
]);

/** Content words only — a LIKE against a whole sentence matches nothing. */
function keywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    .slice(0, 3)
    .join(' ');
}

function describeClub(c) {
  const join = c.application_required
    ? c.applications_open ? 'apply' : 'applications closed'
    : 'open to join';
  return `**${c.name}** — ${c.category} · ${fmtHours(c.commitment_hours)} · ${c.member_count} members · ${join}`;
}

async function offlineAnswer(messages, user) {
  const text = messages[messages.length - 1].content.trim();
  const lower = text.toLowerCase();
  const toolsUsed = [];
  const call = async (name, input) => {
    toolsUsed.push(name);
    return runTool(name, input, user);
  };
  const done = (reply) => ({ reply, tools_used: toolsUsed, mode: 'offline' });

  // --- the user's own schedule -----------------------------------------
  if (/\b(my |our )?(schedule|calendar|this week|next week|meeting|when do|what do i have)\b/i.test(lower)) {
    const r = await call('my_schedule', { days: /next week|two weeks|fortnight/.test(lower) ? 14 : 7 });
    if (r.note) return done(r.note);
    if (!r.count) return done('Nothing on your calendar in that window. Once you join clubs, their meetings appear here automatically.');
    const lines = r.events.slice(0, 8).map((e) => {
      const d = new Date(e.starts_at);
      return `- ${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} — ${e.title} (${e.club_name})${e.location ? ` · ${e.location}` : ''}`;
    });
    return done(`You have ${r.count} event${r.count === 1 ? '' : 's'} in the next ${r.window_days} days:\n\n${lines.join('\n')}`);
  }

  // --- deadlines --------------------------------------------------------
  if (/\bdeadline|due|closing|closes|last day|apply by\b/i.test(lower)) {
    const r = await call('open_deadlines', { limit: 8 });
    if (!r.clubs.length) return done('No applications are open with an upcoming deadline right now.');
    const lines = r.clubs.map(
      (c) => `- **${c.name}** — ${c.application_deadline} (${c.days_left <= 0 ? 'today' : `${c.days_left} days left`})`
    );
    return done(`Applications closing soonest:\n\n${lines.join('\n')}`);
  }

  // --- officer summary --------------------------------------------------
  if (user.account_type === 'officer' && /\b(my club|manage|applicant|application|roster|member|inbox)\b/i.test(lower)) {
    const r = await call('my_officer_summary', {});
    if (r.note) return done(r.note);
    if (!r.clubs.length) return done('No clubs are attached to this officer account yet.');
    const lines = r.clubs.map(
      (c) => `- **${c.name}** (${c.title}) — ${c.members} members · ${c.new_applications} new applications · ${c.in_progress} in review · ${c.unread_messages} unread`
    );
    return done(`Here is where your clubs stand:\n\n${lines.join('\n')}`);
  }

  // --- the user's own clubs --------------------------------------------
  if (/\b(my clubs|what am i in|am i in|my membership|my application|did i get)\b/i.test(lower)) {
    const r = await call('my_memberships', {});
    if (r.note) return done(r.note);
    const parts = [];
    if (r.memberships.length) {
      parts.push(
        `You are in ${r.memberships.length} club${r.memberships.length === 1 ? '' : 's'} — about ${r.estimated_weekly_hours} hrs/week:\n` +
          r.memberships.map((m) => `- ${m.name}${m.meeting_day ? ` (${m.meeting_day}s ${m.meeting_time})` : ''}`).join('\n')
      );
    } else {
      parts.push('You have not joined any clubs yet.');
    }
    if (r.applications.length) {
      parts.push(
        `\nApplications:\n` +
          r.applications.map((a) => `- ${a.name} — ${a.status.replace('_', ' ')}`).join('\n')
      );
    }
    return done(parts.join('\n'));
  }

  // --- categories -------------------------------------------------------
  if (/\b(categor|what kinds|types of club|what sort)\b/i.test(lower)) {
    const r = await call('list_categories', {});
    return done(
      `The catalog has ${r.categories.length} categories:\n\n` +
        r.categories.map((c) => `- ${c.category} — ${c.clubs} clubs (avg ${c.avg_hours} hrs/wk)`).join('\n')
    );
  }

  // --- recommendations --------------------------------------------------
  if (/\b(recommend|suggest|should i join|what club|find me|looking for|interested in|help me find)\b/i.test(lower)) {
    const mine = await call('my_memberships', {});
    const hinted = CATEGORY_HINTS.find(([re]) => re.test(lower));
    const maxHours = /\b(low|light|not much|little) (time|commitment)|casual|relaxed\b/i.test(lower) ? 4 : undefined;

    const r = await call('search_clubs', {
      category: hinted ? hinted[1] : undefined,
      query: hinted ? undefined : keywords(text),
      max_hours: maxHours,
      accepting_only: true,
      limit: 6,
    });

    const already = new Set((mine.memberships || []).map((m) => m.slug));
    const picks = r.clubs.filter((c) => !already.has(c.slug)).slice(0, 5);
    if (!picks.length) return done('I could not find a good match for that. Try naming an activity — "improv", "sailing", "consulting".');

    const load = mine.estimated_weekly_hours
      ? `You are already at roughly ${mine.estimated_weekly_hours} hrs/week, so factor that in. `
      : '';
    return done(`${load}Based on the catalog:\n\n${picks.map(describeClub).join('\n')}`);
  }

  // --- a specific named club -------------------------------------------
  // People type "tell me about the Whiffenpoofs", not the exact catalog name
  // ("The Whiffenpoofs of Yale"), so fall through to the near-match list.
  const asked = text
    .replace(/^(tell me about|tell me|what is|what's|whats|who are|who is|info on|about)\s+/i, '')
    .replace(/[?.!]+$/, '')
    .trim();
  let named = await call('get_club', { club: asked });
  if (!named.found && named.did_you_mean?.length) {
    named = await call('get_club', { club: named.did_you_mean[0].slug });
  }
  if (!named.found) {
    const stripped = asked.replace(/^(the|a|an)\s+/i, '');
    if (stripped !== asked) {
      const retry = await call('get_club', { club: stripped });
      if (retry.found) named = retry;
      else if (retry.did_you_mean?.length) named = await call('get_club', { club: retry.did_you_mean[0].slug });
    }
  }
  if (named.found) {
    const c = named.club;
    return done(
      `**${c.name}** — ${c.category}${c.founded_year ? `, founded ${c.founded_year}` : ''}\n\n` +
        `${c.description}\n\n` +
        `- Meets: ${c.meets || 'no standing meeting'}${c.location ? ` at ${c.location}` : ''}\n` +
        `- Members: ${c.member_count} · ${fmtHours(c.commitment_hours)}\n` +
        `- Joining: ${c.how_to_join}${c.application_deadline ? ` (deadline ${c.application_deadline})` : ''}\n\n` +
        `Full page: /club/${c.slug}`
    );
  }

  // --- last resort: keyword search --------------------------------------
  // Search the content words, not the whole sentence — a LIKE against
  // "what clubs are good for me" matches nothing.
  const hinted = CATEGORY_HINTS.find(([re]) => re.test(lower));
  const search = await call('search_clubs', {
    category: hinted ? hinted[1] : undefined,
    query: hinted ? undefined : keywords(text),
    limit: 6,
  });
  if (search.clubs.length) {
    return done(
      `${search.total_matches} club${search.total_matches === 1 ? '' : 's'} match that. The closest:\n\n` +
        search.clubs.map(describeClub).join('\n')
    );
  }

  return done(
    'I could not find anything for that. I can help you search the catalog, check application ' +
      'deadlines, look at your own clubs, or see what is on your calendar — try one of those.'
  );
}

module.exports = router;
