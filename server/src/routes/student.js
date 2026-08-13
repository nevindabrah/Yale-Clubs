const express = require('express');
const { q, one, run, transaction } = require('../db');
const { requireStudent } = require('../auth');

const router = express.Router();
router.use(requireStudent);

/** GET /api/student/dashboard — everything the student home page needs. */
router.get('/dashboard', async (req, res) => {
  const uid = req.user.id;

  const memberships = await q(
    `SELECT m.id, m.role, m.status, m.joined_at,
            c.id AS club_id, c.slug, c.name, c.acronym, c.category,
            c.logo_hue, c.meeting_day, c.meeting_time, c.meeting_location,
            c.commitment_hours
       FROM memberships m JOIN clubs c ON c.id = m.club_id
      WHERE m.user_id = ? AND m.status = 'active'
      ORDER BY c.name`,
    [uid]
  );

  const applications = await q(
    `SELECT a.id, a.status, a.submitted_at, a.decided_at, a.decision_note,
            c.slug, c.name, c.acronym, c.logo_hue, c.category
       FROM applications a JOIN clubs c ON c.id = a.club_id
      WHERE a.user_id = ?
      ORDER BY FIELD(a.status,'interview','under_review','submitted','accepted','rejected','withdrawn'),
               a.submitted_at DESC`,
    [uid]
  );

  const upcoming = await q(
    `SELECT e.id, e.title, e.event_type, e.starts_at, e.ends_at, e.location, e.visibility,
            c.slug, c.name AS club_name, c.logo_hue,
            (SELECT r.status FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = ?) AS my_rsvp
       FROM events e
       JOIN clubs c ON c.id = e.club_id
       JOIN memberships m ON m.club_id = c.id AND m.user_id = ? AND m.status = 'active'
      WHERE e.starts_at >= NOW()
      ORDER BY e.starts_at
      LIMIT 20`,
    [uid, uid]
  );

  const bookmarks = await q(
    `SELECT c.id, c.slug, c.name, c.acronym, c.category, c.logo_hue, c.rating,
            c.application_required, c.applications_open, c.application_deadline
       FROM bookmarks b JOIN clubs c ON c.id = b.club_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC`,
    [uid]
  );

  const announcements = await q(
    `SELECT a.id, a.title, a.body, a.posted_at, c.name AS club_name, c.slug, c.logo_hue
       FROM announcements a
       JOIN clubs c ON c.id = a.club_id
       JOIN memberships m ON m.club_id = c.id AND m.user_id = ? AND m.status = 'active'
      ORDER BY a.posted_at DESC
      LIMIT 10`,
    [uid]
  );

  const unread = await one(
    `SELECT COUNT(*) AS n
       FROM messages msg
       JOIN message_threads t ON t.id = msg.thread_id
      WHERE t.student_user_id = ? AND msg.sender_side = 'officer' AND msg.read_at IS NULL`,
    [uid]
  );

  // Application deadlines worth acting on: clubs they saved or already applied
  // to, plus anything still open in a category they have shown interest in.
  const deadlines = await q(
    `SELECT DISTINCT c.id, c.slug, c.name, c.acronym, c.logo_hue, c.category,
            c.application_deadline, c.selectivity,
            (b.id IS NOT NULL) AS is_saved,
            (a.id IS NOT NULL) AS has_applied
       FROM clubs c
       LEFT JOIN bookmarks b ON b.club_id = c.id AND b.user_id = ?
       LEFT JOIN applications a ON a.club_id = c.id AND a.user_id = ?
      WHERE c.applications_open = 1
        AND c.application_deadline IS NOT NULL
        AND c.application_deadline >= CURDATE()
        AND a.id IS NULL
        AND (b.id IS NOT NULL
             OR c.category IN (SELECT c2.category FROM memberships m2
                                 JOIN clubs c2 ON c2.id = m2.club_id
                                WHERE m2.user_id = ? AND m2.status = 'active'))
      ORDER BY c.application_deadline
      LIMIT 8`,
    [uid, uid, uid]
  );

  // Clubs in categories they already engage with, that they have not joined.
  const recommended = await q(
    `SELECT c.id, c.slug, c.name, c.acronym, c.category, c.tagline, c.logo_hue,
            c.rating, c.commitment_hours, c.application_required, c.applications_open,
            (SELECT COUNT(*) FROM memberships m2
              WHERE m2.club_id = c.id AND m2.status = 'active') AS member_count
       FROM clubs c
      WHERE c.is_active = 1
        AND c.accepting_members = 1
        AND c.category IN (SELECT c2.category FROM memberships m2
                             JOIN clubs c2 ON c2.id = m2.club_id
                            WHERE m2.user_id = ? AND m2.status = 'active')
        AND c.id NOT IN (SELECT club_id FROM memberships WHERE user_id = ?)
        AND c.id NOT IN (SELECT club_id FROM bookmarks WHERE user_id = ?)
      ORDER BY c.rating DESC, c.name
      LIMIT 6`,
    [uid, uid, uid]
  );

  res.json({
    memberships, applications, upcoming, bookmarks, announcements,
    deadlines, recommended, unread: unread.n,
  });
});

/** GET /api/student/calendar?days=30 — meetings and events across my clubs. */
router.get('/calendar', async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
  const rows = await q(
    `SELECT e.id, e.title, e.description, e.event_type, e.starts_at, e.ends_at,
            e.location, e.visibility, c.slug, c.name AS club_name, c.logo_hue,
            (SELECT r.status FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = ?) AS my_rsvp
       FROM events e
       JOIN clubs c ON c.id = e.club_id
       JOIN memberships m ON m.club_id = c.id AND m.user_id = ? AND m.status = 'active'
      WHERE e.starts_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ${days} DAY)
      ORDER BY e.starts_at`,
    [req.user.id, req.user.id]
  );
  res.json({ events: rows, days });
});

/** POST /api/student/clubs/:clubId/join — open clubs only (D-010). */
router.post('/clubs/:clubId/join', async (req, res) => {
  const clubId = Number(req.params.clubId);
  const club = await one('SELECT * FROM clubs WHERE id = ?', [clubId]);
  if (!club) return res.status(404).json({ error: 'Club not found.' });
  if (!club.accepting_members) {
    return res.status(409).json({ error: `${club.name} is not accepting new members right now.` });
  }
  if (club.application_required) {
    return res.status(409).json({
      error: `${club.name} requires an application — use Apply instead of Join.`,
    });
  }
  await run(
    `INSERT INTO memberships (club_id, user_id, source) VALUES (?,?, 'open_join')
     ON DUPLICATE KEY UPDATE status = 'active'`,
    [clubId, req.user.id]
  );
  res.status(201).json({ ok: true, joined: club.name });
});

/** DELETE /api/student/clubs/:clubId/join — leave a club. */
router.delete('/clubs/:clubId/join', async (req, res) => {
  await run('DELETE FROM memberships WHERE club_id = ? AND user_id = ?', [
    Number(req.params.clubId),
    req.user.id,
  ]);
  res.json({ ok: true });
});

/** POST /api/student/clubs/:clubId/bookmark — toggle. */
router.post('/clubs/:clubId/bookmark', async (req, res) => {
  const clubId = Number(req.params.clubId);
  const existing = await one('SELECT id FROM bookmarks WHERE club_id = ? AND user_id = ?', [
    clubId,
    req.user.id,
  ]);
  if (existing) {
    await run('DELETE FROM bookmarks WHERE id = ?', [existing.id]);
    return res.json({ bookmarked: false });
  }
  await run('INSERT INTO bookmarks (club_id, user_id) VALUES (?,?)', [clubId, req.user.id]);
  res.json({ bookmarked: true });
});

/**
 * POST /api/student/clubs/:clubId/apply
 * body: { answers: { [question_id]: "text" } }
 */
router.post('/clubs/:clubId/apply', async (req, res) => {
  const clubId = Number(req.params.clubId);
  const answers = req.body?.answers || {};

  const club = await one('SELECT * FROM clubs WHERE id = ?', [clubId]);
  if (!club) return res.status(404).json({ error: 'Club not found.' });
  if (!club.application_required) {
    return res.status(409).json({ error: `${club.name} does not use applications — just join.` });
  }
  if (!club.applications_open) {
    return res.status(409).json({ error: `Applications for ${club.name} are closed.` });
  }

  const existing = await one('SELECT id, status FROM applications WHERE club_id = ? AND user_id = ?', [
    clubId,
    req.user.id,
  ]);
  if (existing && existing.status !== 'withdrawn') {
    return res.status(409).json({ error: 'You already have an application with this club.' });
  }

  const questions = await q(
    'SELECT id, prompt, is_required, max_words FROM application_questions WHERE club_id = ?',
    [clubId]
  );
  for (const question of questions) {
    const text = String(answers[question.id] ?? '').trim();
    if (question.is_required && !text) {
      return res.status(400).json({ error: `Please answer: "${question.prompt}"` });
    }
    if (question.max_words && text.split(/\s+/).filter(Boolean).length > question.max_words) {
      return res.status(400).json({
        error: `"${question.prompt}" is limited to ${question.max_words} words.`,
      });
    }
  }

  const applicationId = await transaction(async (conn) => {
    let id;
    if (existing) {
      id = existing.id;
      await conn.execute(
        `UPDATE applications
            SET status = 'submitted', submitted_at = NOW(), decided_at = NULL,
                decided_by = NULL, decision_note = NULL
          WHERE id = ?`,
        [id]
      );
      await conn.execute('DELETE FROM application_answers WHERE application_id = ?', [id]);
    } else {
      const [ins] = await conn.execute(
        'INSERT INTO applications (club_id, user_id) VALUES (?,?)',
        [clubId, req.user.id]
      );
      id = ins.insertId;
    }
    for (const question of questions) {
      const text = String(answers[question.id] ?? '').trim();
      if (!text) continue;
      await conn.execute(
        'INSERT INTO application_answers (application_id, question_id, answer) VALUES (?,?,?)',
        [id, question.id, text]
      );
    }
    return id;
  });

  res.status(201).json({ ok: true, application_id: applicationId });
});

/** GET /api/student/applications/:id — my application with answers. */
router.get('/applications/:id', async (req, res) => {
  const app = await one(
    `SELECT a.id, a.status, a.submitted_at, a.decided_at, a.decision_note,
            c.name AS club_name, c.slug, c.logo_hue
       FROM applications a JOIN clubs c ON c.id = a.club_id
      WHERE a.id = ? AND a.user_id = ?`,
    [Number(req.params.id), req.user.id]
  );
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  // internal_note is deliberately never selected here — officers only (D-008).
  const answers = await q(
    `SELECT qq.prompt, aa.answer
       FROM application_answers aa
       JOIN application_questions qq ON qq.id = aa.question_id
      WHERE aa.application_id = ?
      ORDER BY qq.sort_order`,
    [app.id]
  );
  res.json({ application: app, answers });
});

/** POST /api/student/applications/:id/withdraw */
router.post('/applications/:id/withdraw', async (req, res) => {
  const result = await run(
    `UPDATE applications SET status = 'withdrawn'
      WHERE id = ? AND user_id = ? AND status IN ('submitted','under_review','interview')`,
    [Number(req.params.id), req.user.id]
  );
  if (!result.affectedRows) {
    return res.status(409).json({ error: 'That application can no longer be withdrawn.' });
  }
  res.json({ ok: true });
});

/** POST /api/student/events/:eventId/rsvp — body { status } */
router.post('/events/:eventId/rsvp', async (req, res) => {
  const status = ['going', 'maybe', 'not_going'].includes(req.body?.status)
    ? req.body.status
    : 'going';
  await run(
    `INSERT INTO event_rsvps (event_id, user_id, status) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [Number(req.params.eventId), req.user.id, status]
  );
  res.json({ ok: true, status });
});

module.exports = router;
