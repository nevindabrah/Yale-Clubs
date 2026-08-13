const express = require('express');
const { q, one, run, transaction } = require('../db');
const { requireOfficer, requireClubOfficer } = require('../auth');

const router = express.Router();
router.use(requireOfficer);

const DECISION_STATUSES = ['submitted', 'under_review', 'interview', 'accepted', 'rejected'];

/** GET /api/officer/clubs — clubs this officer account manages, with counters. */
router.get('/clubs', async (req, res) => {
  const clubs = await q(
    `SELECT c.id, c.slug, c.name, c.acronym, c.category, c.logo_hue,
            c.application_required, c.applications_open, c.application_deadline,
            c.accepting_members, co.title, co.is_primary,
            (SELECT COUNT(*) FROM memberships m
              WHERE m.club_id = c.id AND m.status = 'active') AS member_count,
            (SELECT COUNT(*) FROM applications a
              WHERE a.club_id = c.id AND a.status IN ('submitted','under_review','interview'))
              AS pending_applications,
            (SELECT COUNT(*) FROM events e
              WHERE e.club_id = c.id AND e.starts_at >= NOW()) AS upcoming_events,
            (SELECT COUNT(*) FROM messages msg
               JOIN message_threads t ON t.id = msg.thread_id
              WHERE t.club_id = c.id AND msg.sender_side = 'student' AND msg.read_at IS NULL)
              AS unread_messages
       FROM club_officers co JOIN clubs c ON c.id = co.club_id
      WHERE co.user_id = ?
      ORDER BY co.is_primary DESC, c.name`,
    [req.user.id]
  );
  res.json({ clubs });
});

/** GET /api/officer/clubs/:clubId — management overview for one club. */
router.get('/clubs/:clubId', requireClubOfficer, async (req, res) => {
  const club = await one('SELECT * FROM clubs WHERE id = ?', [req.clubId]);

  const stats = await one(
    `SELECT
       (SELECT COUNT(*) FROM memberships WHERE club_id = ? AND status = 'active') AS members,
       (SELECT COUNT(*) FROM applications WHERE club_id = ? AND status = 'submitted') AS new_applications,
       (SELECT COUNT(*) FROM applications WHERE club_id = ? AND status = 'under_review') AS in_review,
       (SELECT COUNT(*) FROM applications WHERE club_id = ? AND status = 'interview') AS interviewing,
       (SELECT COUNT(*) FROM applications WHERE club_id = ? AND status = 'accepted') AS accepted,
       (SELECT COUNT(*) FROM applications WHERE club_id = ? AND status = 'rejected') AS rejected,
       (SELECT COUNT(*) FROM events WHERE club_id = ? AND starts_at >= NOW()) AS upcoming_events,
       (SELECT COUNT(*) FROM bookmarks WHERE club_id = ?) AS bookmarks`,
    Array(8).fill(req.clubId)
  );

  const classBreakdown = await q(
    `SELECT u.class_year, COUNT(*) AS count
       FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.club_id = ? AND m.status = 'active' AND u.class_year IS NOT NULL
      GROUP BY u.class_year ORDER BY u.class_year`,
    [req.clubId]
  );

  const officers = await q(
    `SELECT u.id, u.full_name, u.email, u.pronouns, u.avatar_hue, co.title, co.is_primary
       FROM club_officers co JOIN users u ON u.id = co.user_id
      WHERE co.club_id = ? ORDER BY co.is_primary DESC, co.title`,
    [req.clubId]
  );

  const events = await q(
    `SELECT e.*, (SELECT COUNT(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going')
              AS going_count
       FROM events e WHERE e.club_id = ? AND e.starts_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY e.starts_at LIMIT 25`,
    [req.clubId]
  );

  const announcements = await q(
    `SELECT a.*, u.full_name AS posted_by_name
       FROM announcements a LEFT JOIN users u ON u.id = a.posted_by
      WHERE a.club_id = ? ORDER BY a.pinned DESC, a.posted_at DESC LIMIT 20`,
    [req.clubId]
  );

  res.json({ club, stats, classBreakdown, officers, events, announcements, my_title: req.officerTitle });
});

// ---------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------

/** GET /api/officer/clubs/:clubId/applications?status=... */
router.get('/clubs/:clubId/applications', requireClubOfficer, async (req, res) => {
  const params = [req.clubId];
  let filter = '';
  if (req.query.status && req.query.status !== 'all') {
    filter = 'AND a.status = ?';
    params.push(req.query.status);
  }
  const applications = await q(
    `SELECT a.id, a.status, a.submitted_at, a.decided_at, a.rating, a.internal_note,
            u.id AS user_id, u.full_name, u.email, u.class_year, u.major,
            u.residential_college, u.pronouns, u.avatar_hue,
            d.full_name AS decided_by_name
       FROM applications a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN users d ON d.id = a.decided_by
      WHERE a.club_id = ? ${filter}
      ORDER BY FIELD(a.status,'submitted','under_review','interview','accepted','rejected','withdrawn'),
               a.submitted_at`,
    params
  );
  res.json({ applications });
});

/** GET /api/officer/applications/:id — full application including answers. */
router.get('/applications/:id', async (req, res) => {
  const app = await one(
    `SELECT a.*, u.full_name, u.email, u.class_year, u.major, u.residential_college,
            u.pronouns, u.bio, u.avatar_hue, c.name AS club_name, c.id AS club_id
       FROM applications a
       JOIN users u ON u.id = a.user_id
       JOIN clubs c ON c.id = a.club_id
      WHERE a.id = ?`,
    [Number(req.params.id)]
  );
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
    app.club_id,
    req.user.id,
  ]);
  if (!manages) return res.status(403).json({ error: 'You do not manage this club.' });

  const answers = await q(
    `SELECT qq.id AS question_id, qq.prompt, qq.help_text, aa.answer
       FROM application_questions qq
       LEFT JOIN application_answers aa
              ON aa.question_id = qq.id AND aa.application_id = ?
      WHERE qq.club_id = ?
      ORDER BY qq.sort_order`,
    [app.id, app.club_id]
  );

  // Context an officer legitimately needs: what else is this applicant in?
  const otherMemberships = await q(
    `SELECT c.name, c.slug, m.role FROM memberships m JOIN clubs c ON c.id = m.club_id
      WHERE m.user_id = ? AND m.status = 'active' ORDER BY c.name`,
    [app.user_id]
  );

  res.json({ application: app, answers, other_memberships: otherMemberships });
});

/**
 * PATCH /api/officer/applications/:id
 * body: { status, decision_note, internal_note, rating }
 * Accepting an application also creates the membership, in one transaction.
 */
router.patch('/applications/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status, decision_note, internal_note, rating } = req.body || {};

  const app = await one('SELECT * FROM applications WHERE id = ?', [id]);
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
    app.club_id,
    req.user.id,
  ]);
  if (!manages) return res.status(403).json({ error: 'You do not manage this club.' });

  if (status && !DECISION_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Unknown application status.' });
  }
  if (app.status === 'withdrawn') {
    return res.status(409).json({ error: 'The applicant withdrew this application.' });
  }

  const isFinal = status === 'accepted' || status === 'rejected';

  await transaction(async (conn) => {
    await conn.execute(
      `UPDATE applications
          SET status = COALESCE(?, status),
              decision_note = COALESCE(?, decision_note),
              internal_note = COALESCE(?, internal_note),
              rating = COALESCE(?, rating),
              decided_at = CASE WHEN ? = 1 THEN NOW() ELSE decided_at END,
              decided_by = CASE WHEN ? = 1 THEN ? ELSE decided_by END
        WHERE id = ?`,
      [
        status || null,
        decision_note ?? null,
        internal_note ?? null,
        rating ?? null,
        isFinal ? 1 : 0,
        isFinal ? 1 : 0,
        req.user.id,
        id,
      ]
    );

    if (status === 'accepted') {
      await conn.execute(
        `INSERT INTO memberships (club_id, user_id, source) VALUES (?,?, 'application')
         ON DUPLICATE KEY UPDATE status = 'active'`,
        [app.club_id, app.user_id]
      );
    }
    if (status === 'rejected') {
      // An earlier acceptance that is being reversed should not leave a member.
      await conn.execute(
        "DELETE FROM memberships WHERE club_id = ? AND user_id = ? AND source = 'application'",
        [app.club_id, app.user_id]
      );
    }
  });

  const updated = await one('SELECT * FROM applications WHERE id = ?', [id]);
  res.json({ application: updated });
});

// ---------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------

/** GET /api/officer/clubs/:clubId/members */
router.get('/clubs/:clubId/members', requireClubOfficer, async (req, res) => {
  const members = await q(
    `SELECT m.id, m.role, m.status, m.source, m.joined_at, m.notes,
            u.id AS user_id, u.full_name, u.email, u.class_year, u.major,
            u.residential_college, u.pronouns, u.avatar_hue,
            (SELECT COUNT(*) FROM event_rsvps r
               JOIN events e ON e.id = r.event_id
              WHERE e.club_id = m.club_id AND r.user_id = u.id AND r.status = 'going')
              AS events_attended
       FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.club_id = ?
      ORDER BY FIELD(m.status,'active','inactive','alumni','removed'), u.full_name`,
    [req.clubId]
  );
  res.json({ members });
});

/** PATCH /api/officer/members/:membershipId — change role, status or notes. */
router.patch('/members/:membershipId', async (req, res) => {
  const id = Number(req.params.membershipId);
  const membership = await one('SELECT * FROM memberships WHERE id = ?', [id]);
  if (!membership) return res.status(404).json({ error: 'Member not found.' });

  const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
    membership.club_id,
    req.user.id,
  ]);
  if (!manages) return res.status(403).json({ error: 'You do not manage this club.' });

  const { role, status, notes } = req.body || {};
  if (status && !['active', 'inactive', 'alumni', 'removed'].includes(status)) {
    return res.status(400).json({ error: 'Unknown membership status.' });
  }
  await run(
    `UPDATE memberships SET role = COALESCE(?, role), status = COALESCE(?, status),
            notes = COALESCE(?, notes) WHERE id = ?`,
    [role || null, status || null, notes ?? null, id]
  );
  res.json({ ok: true });
});

/** DELETE /api/officer/members/:membershipId */
router.delete('/members/:membershipId', async (req, res) => {
  const id = Number(req.params.membershipId);
  const membership = await one('SELECT * FROM memberships WHERE id = ?', [id]);
  if (!membership) return res.status(404).json({ error: 'Member not found.' });
  const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
    membership.club_id,
    req.user.id,
  ]);
  if (!manages) return res.status(403).json({ error: 'You do not manage this club.' });
  await run('DELETE FROM memberships WHERE id = ?', [id]);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------
// Events, announcements, club settings
// ---------------------------------------------------------------------

/** POST /api/officer/clubs/:clubId/events */
router.post('/clubs/:clubId/events', requireClubOfficer, async (req, res) => {
  const { title, description, event_type, starts_at, ends_at, location, visibility } = req.body || {};
  if (!title || !starts_at) {
    return res.status(400).json({ error: 'A title and start time are required.' });
  }
  const result = await run(
    `INSERT INTO events (club_id, title, description, event_type, starts_at, ends_at,
                         location, visibility, created_by)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      req.clubId,
      title,
      description || null,
      event_type || 'meeting',
      starts_at.replace('T', ' ').slice(0, 19),
      ends_at ? ends_at.replace('T', ' ').slice(0, 19) : null,
      location || null,
      visibility === 'members_only' ? 'members_only' : 'public',
      req.user.id,
    ]
  );
  const event = await one('SELECT * FROM events WHERE id = ?', [result.insertId]);
  res.status(201).json({ event });
});

/** DELETE /api/officer/events/:eventId */
router.delete('/events/:eventId', async (req, res) => {
  const id = Number(req.params.eventId);
  const event = await one('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
    event.club_id,
    req.user.id,
  ]);
  if (!manages) return res.status(403).json({ error: 'You do not manage this club.' });
  await run('DELETE FROM events WHERE id = ?', [id]);
  res.json({ ok: true });
});

/** GET /api/officer/events/:eventId/rsvps */
router.get('/events/:eventId/rsvps', async (req, res) => {
  const id = Number(req.params.eventId);
  const event = await one('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
    event.club_id,
    req.user.id,
  ]);
  if (!manages) return res.status(403).json({ error: 'You do not manage this club.' });
  const rsvps = await q(
    `SELECT r.status, u.full_name, u.email, u.class_year, u.avatar_hue
       FROM event_rsvps r JOIN users u ON u.id = r.user_id
      WHERE r.event_id = ? ORDER BY FIELD(r.status,'going','maybe','not_going'), u.full_name`,
    [id]
  );
  res.json({ rsvps });
});

/** POST /api/officer/clubs/:clubId/announcements */
router.post('/clubs/:clubId/announcements', requireClubOfficer, async (req, res) => {
  const { title, body, pinned } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'A title and body are required.' });
  const result = await run(
    'INSERT INTO announcements (club_id, title, body, pinned, posted_by) VALUES (?,?,?,?,?)',
    [req.clubId, title, body, pinned ? 1 : 0, req.user.id]
  );
  res.status(201).json({ id: result.insertId });
});

/** DELETE /api/officer/announcements/:id */
router.delete('/announcements/:id', async (req, res) => {
  const id = Number(req.params.id);
  const ann = await one('SELECT * FROM announcements WHERE id = ?', [id]);
  if (!ann) return res.status(404).json({ error: 'Announcement not found.' });
  const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
    ann.club_id,
    req.user.id,
  ]);
  if (!manages) return res.status(403).json({ error: 'You do not manage this club.' });
  await run('DELETE FROM announcements WHERE id = ?', [id]);
  res.json({ ok: true });
});

/** PATCH /api/officer/clubs/:clubId — editable club settings. */
router.patch('/clubs/:clubId', requireClubOfficer, async (req, res) => {
  const {
    tagline, description, meeting_day, meeting_time, meeting_location,
    website, instagram, applications_open, application_deadline,
    accepting_members, application_required,
  } = req.body || {};

  await run(
    `UPDATE clubs SET
        tagline = COALESCE(?, tagline),
        description = COALESCE(?, description),
        meeting_day = ?, meeting_time = ?, meeting_location = ?,
        website = ?, instagram = ?,
        application_required = COALESCE(?, application_required),
        applications_open = COALESCE(?, applications_open),
        application_deadline = ?,
        accepting_members = COALESCE(?, accepting_members)
      WHERE id = ?`,
    [
      tagline ?? null,
      description ?? null,
      meeting_day ?? null,
      meeting_time ?? null,
      meeting_location ?? null,
      website ?? null,
      instagram ?? null,
      application_required === undefined ? null : application_required ? 1 : 0,
      applications_open === undefined ? null : applications_open ? 1 : 0,
      application_deadline || null,
      accepting_members === undefined ? null : accepting_members ? 1 : 0,
      req.clubId,
    ]
  );
  const club = await one('SELECT * FROM clubs WHERE id = ?', [req.clubId]);
  res.json({ club });
});

/** GET/POST/DELETE application questions. */
router.get('/clubs/:clubId/questions', requireClubOfficer, async (req, res) => {
  const questions = await q(
    'SELECT * FROM application_questions WHERE club_id = ? ORDER BY sort_order',
    [req.clubId]
  );
  res.json({ questions });
});

router.post('/clubs/:clubId/questions', requireClubOfficer, async (req, res) => {
  const { prompt, help_text, max_words, is_required } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'A prompt is required.' });
  const next = await one(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM application_questions WHERE club_id = ?',
    [req.clubId]
  );
  const result = await run(
    `INSERT INTO application_questions (club_id, prompt, help_text, max_words, is_required, sort_order)
     VALUES (?,?,?,?,?,?)`,
    [req.clubId, prompt, help_text || null, max_words || null, is_required === false ? 0 : 1, next.n]
  );
  res.status(201).json({ id: result.insertId });
});

router.delete('/questions/:id', async (req, res) => {
  const id = Number(req.params.id);
  const question = await one('SELECT * FROM application_questions WHERE id = ?', [id]);
  if (!question) return res.status(404).json({ error: 'Question not found.' });
  const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
    question.club_id,
    req.user.id,
  ]);
  if (!manages) return res.status(403).json({ error: 'You do not manage this club.' });
  await run('DELETE FROM application_questions WHERE id = ?', [id]);
  res.json({ ok: true });
});

module.exports = router;
