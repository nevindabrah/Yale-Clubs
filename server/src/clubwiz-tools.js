/**
 * ClubWiz tools.
 *
 * Every tool is a plain async function over the same MySQL data the rest of
 * the app uses. They are the *only* way ClubWiz reaches data — it never gets
 * raw SQL — and each one is scoped to the requesting user, so the assistant
 * cannot read another student's applications or another club's roster.
 *
 * The same registry backs both modes: the Claude tool-use loop and the
 * offline keyword fallback. See DECISIONS.md D-018.
 */
const { q, one } = require('./db');

/** JSON Schema definitions handed to the model. */
const TOOL_DEFS = [
  {
    name: 'search_clubs',
    description:
      'Search the Yale club catalog. Use this whenever the student asks what clubs exist, ' +
      'asks for recommendations, or names an interest ("a cappella", "consulting", "service"). ' +
      'Returns matching clubs with their category, weekly hours, member count, rating and how to join.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text keywords, e.g. "improv comedy" or "sailing".' },
        category: {
          type: 'string',
          description: 'Exact category name. Call list_categories first if unsure.',
        },
        max_hours: { type: 'number', description: 'Only clubs at or under this weekly time commitment.' },
        application_required: {
          type: 'boolean',
          description: 'true = only clubs that require an application; false = only open-join clubs.',
        },
        accepting_only: { type: 'boolean', description: 'Only clubs currently accepting members.' },
        limit: { type: 'integer', description: 'Max results, 1-15. Default 8.' },
      },
    },
  },
  {
    name: 'get_club',
    description:
      'Full detail for one club by slug or exact name: description, meeting time and place, ' +
      'officers, application questions, deadline, and upcoming public events.',
    input_schema: {
      type: 'object',
      properties: { club: { type: 'string', description: 'Club slug or full name.' } },
      required: ['club'],
    },
  },
  {
    name: 'list_categories',
    description: 'List every club category with how many clubs are in each.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'my_memberships',
    description:
      "The signed-in student's own clubs, applications (with status) and saved clubs. " +
      'Use before recommending anything so you do not suggest a club they are already in.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'my_schedule',
    description:
      "The signed-in student's upcoming club events and meetings. Use for questions like " +
      '"what do I have this week" or "when does my next meeting start".',
    input_schema: {
      type: 'object',
      properties: { days: { type: 'integer', description: 'How far ahead to look, 1-90. Default 14.' } },
    },
  },
  {
    name: 'open_deadlines',
    description:
      'Clubs whose applications are open, ordered by deadline. Use for "what deadlines are coming up".',
    input_schema: {
      type: 'object',
      properties: { limit: { type: 'integer', description: 'Max results, 1-15. Default 10.' } },
    },
  },
  {
    name: 'my_officer_summary',
    description:
      'For officer accounts only: the clubs this officer manages, with pending application ' +
      'counts, member counts, unread message counts and upcoming events.',
    input_schema: { type: 'object', properties: {} },
  },
];

const clamp = (n, lo, hi, dflt) => {
  const v = Number.parseInt(n, 10);
  return Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : dflt;
};

/** Implementations. `user` is the authenticated requester — never client-supplied. */
const TOOLS = {
  async list_categories() {
    const rows = await q(
      `SELECT category, COUNT(*) AS clubs,
              ROUND(AVG(commitment_hours), 1) AS avg_hours
         FROM clubs WHERE is_active = 1
        GROUP BY category ORDER BY clubs DESC`
    );
    return { categories: rows };
  },

  async search_clubs(input) {
    const where = ['c.is_active = 1'];
    const params = [];

    if (input.query && String(input.query).trim()) {
      const term = `%${String(input.query).trim()}%`;
      where.push('(c.name LIKE ? OR c.acronym LIKE ? OR c.tagline LIKE ? OR c.description LIKE ? OR c.category LIKE ? OR c.subcategory LIKE ?)');
      params.push(term, term, term, term, term, term);
    }
    if (input.category) {
      where.push('c.category = ?');
      params.push(String(input.category));
    }
    if (input.max_hours != null) {
      where.push('c.commitment_hours <= ?');
      params.push(Number(input.max_hours));
    }
    if (typeof input.application_required === 'boolean') {
      where.push('c.application_required = ?');
      params.push(input.application_required ? 1 : 0);
    }
    if (input.accepting_only) where.push('c.accepting_members = 1');

    const limit = clamp(input.limit, 1, 15, 8);
    const clubs = await q(
      `SELECT c.slug, c.name, c.acronym, c.category, c.tagline, c.founded_year,
              c.commitment_hours, c.rating, c.selectivity,
              c.application_required, c.applications_open, c.application_deadline,
              c.accepting_members, c.meeting_day, c.meeting_time, c.meeting_location,
              (SELECT COUNT(*) FROM memberships m
                WHERE m.club_id = c.id AND m.status = 'active') AS member_count
         FROM clubs c
        WHERE ${where.join(' AND ')}
        ORDER BY c.rating DESC, c.name
        LIMIT ${limit}`,
      params
    );
    const [{ total }] = await q(
      `SELECT COUNT(*) AS total FROM clubs c WHERE ${where.join(' AND ')}`,
      params
    );
    return { total_matches: total, showing: clubs.length, clubs };
  },

  async get_club(input) {
    const key = String(input.club || '').trim();
    const club = await one(
      `SELECT c.*, (SELECT COUNT(*) FROM memberships m
                     WHERE m.club_id = c.id AND m.status = 'active') AS member_count
         FROM clubs c
        WHERE c.slug = ? OR LOWER(c.name) = LOWER(?) OR LOWER(c.acronym) = LOWER(?)
        LIMIT 1`,
      [key, key, key]
    );
    if (!club) {
      const near = await q(
        'SELECT slug, name FROM clubs WHERE name LIKE ? OR acronym LIKE ? LIMIT 5',
        [`%${key}%`, `%${key}%`]
      );
      return { found: false, did_you_mean: near };
    }

    const officers = await q(
      `SELECT u.full_name, co.title FROM club_officers co
         JOIN users u ON u.id = co.user_id
        WHERE co.club_id = ? ORDER BY co.is_primary DESC LIMIT 6`,
      [club.id]
    );
    const questions = await q(
      'SELECT prompt, max_words FROM application_questions WHERE club_id = ? ORDER BY sort_order',
      [club.id]
    );
    const events = await q(
      `SELECT title, event_type, starts_at, location FROM events
        WHERE club_id = ? AND visibility = 'public' AND starts_at >= NOW()
        ORDER BY starts_at LIMIT 5`,
      [club.id]
    );

    return {
      found: true,
      club: {
        slug: club.slug, name: club.name, acronym: club.acronym,
        category: club.category, subcategory: club.subcategory,
        tagline: club.tagline, description: club.description,
        founded_year: club.founded_year,
        meets: club.meeting_day ? `${club.meeting_day}s at ${club.meeting_time}` : null,
        location: club.meeting_location,
        member_count: club.member_count,
        commitment_hours: club.commitment_hours,
        rating: club.rating, selectivity: club.selectivity,
        how_to_join: club.application_required
          ? (club.applications_open ? 'Application required, currently open' : 'Application required, currently closed')
          : (club.accepting_members ? 'Open — join instantly, no application' : 'Not accepting members'),
        application_deadline: club.application_deadline,
      },
      officers,
      application_questions: questions,
      upcoming_public_events: events,
    };
  },

  async my_memberships(_input, user) {
    if (user.account_type !== 'student') {
      return { note: 'This is an officer account. Officer accounts do not hold memberships — that is what the separate student account is for.' };
    }
    const memberships = await q(
      `SELECT c.name, c.slug, c.category, m.role, m.joined_at, c.commitment_hours,
              c.meeting_day, c.meeting_time
         FROM memberships m JOIN clubs c ON c.id = m.club_id
        WHERE m.user_id = ? AND m.status = 'active' ORDER BY c.name`,
      [user.id]
    );
    const applications = await q(
      `SELECT c.name, c.slug, a.status, a.submitted_at, a.decided_at
         FROM applications a JOIN clubs c ON c.id = a.club_id
        WHERE a.user_id = ? ORDER BY a.submitted_at DESC`,
      [user.id]
    );
    const saved = await q(
      `SELECT c.name, c.slug, c.application_deadline FROM bookmarks b
         JOIN clubs c ON c.id = b.club_id WHERE b.user_id = ? ORDER BY c.name`,
      [user.id]
    );
    const totalHours = memberships.reduce((s, m) => s + Number(m.commitment_hours || 0), 0);
    return {
      memberships, applications, saved,
      estimated_weekly_hours: Math.round(totalHours * 10) / 10,
    };
  },

  async my_schedule(input, user) {
    if (user.account_type !== 'student') {
      return { note: 'Officer accounts do not have a personal club calendar. Use my_officer_summary.' };
    }
    const days = clamp(input?.days, 1, 90, 14);
    const events = await q(
      `SELECT e.title, e.event_type, e.starts_at, e.location, c.name AS club_name, c.slug
         FROM events e
         JOIN clubs c ON c.id = e.club_id
         JOIN memberships m ON m.club_id = c.id AND m.user_id = ? AND m.status = 'active'
        WHERE e.starts_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ${days} DAY)
        ORDER BY e.starts_at LIMIT 40`,
      [user.id]
    );
    return { window_days: days, count: events.length, events };
  },

  async open_deadlines(input) {
    const limit = clamp(input?.limit, 1, 15, 10);
    const clubs = await q(
      `SELECT slug, name, category, application_deadline, selectivity,
              DATEDIFF(application_deadline, CURDATE()) AS days_left
         FROM clubs
        WHERE applications_open = 1 AND application_deadline IS NOT NULL
          AND application_deadline >= CURDATE()
        ORDER BY application_deadline LIMIT ${limit}`
    );
    return { clubs };
  },

  async my_officer_summary(_input, user) {
    if (user.account_type !== 'officer') {
      return { note: 'This is a student account, so it manages no clubs. Officer accounts are separate.' };
    }
    const clubs = await q(
      `SELECT c.name, c.slug, co.title,
              (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.id AND m.status = 'active') AS members,
              (SELECT COUNT(*) FROM applications a WHERE a.club_id = c.id AND a.status = 'submitted') AS new_applications,
              (SELECT COUNT(*) FROM applications a WHERE a.club_id = c.id AND a.status IN ('under_review','interview')) AS in_progress,
              (SELECT COUNT(*) FROM events e WHERE e.club_id = c.id AND e.starts_at >= NOW()) AS upcoming_events,
              (SELECT COUNT(*) FROM messages msg JOIN message_threads t ON t.id = msg.thread_id
                WHERE t.club_id = c.id AND msg.sender_side = 'student' AND msg.read_at IS NULL) AS unread_messages
         FROM club_officers co JOIN clubs c ON c.id = co.club_id
        WHERE co.user_id = ? ORDER BY c.name`,
      [user.id]
    );
    return { clubs };
  },
};

/** Run a tool by name with the caller's identity. Unknown names are an error. */
async function runTool(name, input, user) {
  const fn = TOOLS[name];
  if (!fn) return { error: `Unknown tool "${name}".` };
  try {
    return await fn(input || {}, user);
  } catch (err) {
    console.error(`ClubWiz tool ${name} failed:`, err.message);
    return { error: 'That lookup failed. Try a different phrasing.' };
  }
}

module.exports = { TOOL_DEFS, TOOLS, runTool };
