/**
 * Messaging — one thread per (club, student). See DECISIONS.md D-009.
 * Students address the club; any officer of that club can reply, and each
 * reply is attributed to the officer who wrote it.
 */
const express = require('express');
const { q, one, run } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

/** Confirms the signed-in user may see this thread; returns the thread. */
async function loadThread(user, threadId) {
  const thread = await one(
    `SELECT t.*, c.name AS club_name, c.slug AS club_slug, c.logo_hue,
            u.full_name AS student_name, u.class_year AS student_class_year,
            u.email AS student_email, u.avatar_hue AS student_hue
       FROM message_threads t
       JOIN clubs c ON c.id = t.club_id
       JOIN users u ON u.id = t.student_user_id
      WHERE t.id = ?`,
    [threadId]
  );
  if (!thread) return { error: 404 };
  if (user.account_type === 'student') {
    if (thread.student_user_id !== user.id) return { error: 403 };
  } else {
    const manages = await one('SELECT id FROM club_officers WHERE club_id = ? AND user_id = ?', [
      thread.club_id,
      user.id,
    ]);
    if (!manages) return { error: 403 };
  }
  return { thread };
}

/** GET /api/messages/threads — inbox for either portal. */
router.get('/threads', async (req, res) => {
  const isStudent = req.user.account_type === 'student';
  const threads = await q(
    isStudent
      ? `SELECT t.id, t.subject, t.last_message_at, t.club_id,
                c.name AS club_name, c.slug AS club_slug, c.logo_hue,
                (SELECT msg.body FROM messages msg WHERE msg.thread_id = t.id
                  ORDER BY msg.sent_at DESC LIMIT 1) AS preview,
                (SELECT COUNT(*) FROM messages msg WHERE msg.thread_id = t.id
                   AND msg.sender_side = 'officer' AND msg.read_at IS NULL) AS unread
           FROM message_threads t JOIN clubs c ON c.id = t.club_id
          WHERE t.student_user_id = ?
          ORDER BY t.last_message_at DESC`
      : `SELECT t.id, t.subject, t.last_message_at, t.club_id,
                c.name AS club_name, c.slug AS club_slug, c.logo_hue,
                u.full_name AS student_name, u.class_year AS student_class_year,
                u.avatar_hue AS student_hue,
                (SELECT msg.body FROM messages msg WHERE msg.thread_id = t.id
                  ORDER BY msg.sent_at DESC LIMIT 1) AS preview,
                (SELECT COUNT(*) FROM messages msg WHERE msg.thread_id = t.id
                   AND msg.sender_side = 'student' AND msg.read_at IS NULL) AS unread
           FROM message_threads t
           JOIN clubs c ON c.id = t.club_id
           JOIN users u ON u.id = t.student_user_id
           JOIN club_officers co ON co.club_id = t.club_id AND co.user_id = ?
          ORDER BY t.last_message_at DESC`,
    [req.user.id]
  );
  res.json({ threads });
});

/** GET /api/messages/threads/:id — messages, and mark the other side read. */
router.get('/threads/:id', async (req, res) => {
  const { thread, error } = await loadThread(req.user, Number(req.params.id));
  if (error === 404) return res.status(404).json({ error: 'Conversation not found.' });
  if (error === 403) return res.status(403).json({ error: 'You cannot view this conversation.' });

  const otherSide = req.user.account_type === 'student' ? 'officer' : 'student';
  await run(
    'UPDATE messages SET read_at = NOW() WHERE thread_id = ? AND sender_side = ? AND read_at IS NULL',
    [thread.id, otherSide]
  );

  const messages = await q(
    `SELECT msg.id, msg.body, msg.sent_at, msg.sender_side, msg.read_at,
            u.full_name AS sender_name, u.avatar_hue AS sender_hue
       FROM messages msg JOIN users u ON u.id = msg.sender_user_id
      WHERE msg.thread_id = ? ORDER BY msg.sent_at`,
    [thread.id]
  );
  res.json({ thread, messages });
});

/**
 * POST /api/messages/threads — student starts (or reuses) a thread with a club.
 * body: { club_id, subject, body }
 */
router.post('/threads', async (req, res) => {
  if (req.user.account_type !== 'student') {
    return res.status(403).json({ error: 'Officers reply to existing conversations.' });
  }
  const { club_id, subject, body } = req.body || {};
  const club = await one('SELECT id, name FROM clubs WHERE id = ?', [Number(club_id)]);
  if (!club) return res.status(404).json({ error: 'Club not found.' });
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Write a message first.' });

  let thread = await one(
    'SELECT * FROM message_threads WHERE club_id = ? AND student_user_id = ?',
    [club.id, req.user.id]
  );
  if (!thread) {
    const result = await run(
      'INSERT INTO message_threads (club_id, student_user_id, subject) VALUES (?,?,?)',
      [club.id, req.user.id, String(subject || 'General question').slice(0, 200)]
    );
    thread = { id: result.insertId };
  }

  await run(
    "INSERT INTO messages (thread_id, sender_user_id, sender_side, body) VALUES (?,?, 'student', ?)",
    [thread.id, req.user.id, String(body).trim()]
  );
  await run('UPDATE message_threads SET last_message_at = NOW() WHERE id = ?', [thread.id]);
  res.status(201).json({ thread_id: thread.id });
});

/** POST /api/messages/threads/:id/reply — either side. */
router.post('/threads/:id/reply', async (req, res) => {
  const { thread, error } = await loadThread(req.user, Number(req.params.id));
  if (error === 404) return res.status(404).json({ error: 'Conversation not found.' });
  if (error === 403) return res.status(403).json({ error: 'You cannot reply to this conversation.' });

  const body = String(req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Write a message first.' });

  await run(
    'INSERT INTO messages (thread_id, sender_user_id, sender_side, body) VALUES (?,?,?,?)',
    [thread.id, req.user.id, req.user.account_type, body]
  );
  await run('UPDATE message_threads SET last_message_at = NOW() WHERE id = ?', [thread.id]);
  res.status(201).json({ ok: true });
});

/** GET /api/messages/unread — badge count for the nav bar. */
router.get('/unread', async (req, res) => {
  const isStudent = req.user.account_type === 'student';
  const row = await one(
    isStudent
      ? `SELECT COUNT(*) AS n FROM messages msg
           JOIN message_threads t ON t.id = msg.thread_id
          WHERE t.student_user_id = ? AND msg.sender_side = 'officer' AND msg.read_at IS NULL`
      : `SELECT COUNT(*) AS n FROM messages msg
           JOIN message_threads t ON t.id = msg.thread_id
           JOIN club_officers co ON co.club_id = t.club_id AND co.user_id = ?
          WHERE msg.sender_side = 'student' AND msg.read_at IS NULL`,
    [req.user.id]
  );
  res.json({ unread: row.n });
});

module.exports = router;
