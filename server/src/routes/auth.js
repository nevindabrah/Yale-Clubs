const express = require('express');
const bcrypt = require('bcryptjs');
const { q, one, run } = require('../db');
const { signToken, requireAuth } = require('../auth');

const router = express.Router();

const ACCOUNT_TYPES = ['student', 'officer'];
const YALE_EMAIL = /@(yale\.edu|clubs\.yale\.demo)$/i;

function publicUser(u) {
  return {
    id: u.id,
    account_type: u.account_type,
    email: u.email,
    full_name: u.full_name,
    netid: u.netid,
    class_year: u.class_year,
    residential_college: u.residential_college,
    major: u.major,
    pronouns: u.pronouns,
    bio: u.bio,
    avatar_hue: u.avatar_hue,
  };
}

/**
 * POST /api/auth/register
 * Creating a student account and an officer account with the SAME email is
 * allowed and expected — they are separate logins. See DECISIONS.md D-002.
 */
router.post('/register', async (req, res) => {
  const {
    account_type,
    email,
    password,
    full_name,
    netid,
    class_year,
    residential_college,
    major,
    pronouns,
  } = req.body || {};

  if (!ACCOUNT_TYPES.includes(account_type)) {
    return res.status(400).json({ error: 'Choose a portal: student or officer.' });
  }
  if (!email || !YALE_EMAIL.test(email)) {
    return res.status(400).json({ error: 'Use your @yale.edu email address.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (!full_name || full_name.trim().length < 2) {
    return res.status(400).json({ error: 'Enter your full name.' });
  }

  const existing = await one(
    'SELECT id FROM users WHERE email = ? AND account_type = ?',
    [email.toLowerCase(), account_type]
  );
  if (existing) {
    return res.status(409).json({
      error: `An ${account_type} account already exists for that email. Try signing in.`,
    });
  }

  const hash = await bcrypt.hash(password, 10);
  // Deterministic avatar color from the email so a person looks consistent.
  const hue = [...email.toLowerCase()].reduce((a, c) => (a + c.charCodeAt(0)) % 360, 0);

  const result = await run(
    `INSERT INTO users
       (account_type, email, password_hash, full_name, netid, class_year,
        residential_college, major, pronouns, avatar_hue)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      account_type,
      email.toLowerCase(),
      hash,
      full_name.trim(),
      netid || null,
      class_year || null,
      residential_college || null,
      major || null,
      pronouns || null,
      hue,
    ]
  );

  const user = await one('SELECT * FROM users WHERE id = ?', [result.insertId]);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

/** POST /api/auth/login — portal is part of the credential. */
router.post('/login', async (req, res) => {
  const { account_type, email, password } = req.body || {};
  if (!ACCOUNT_TYPES.includes(account_type)) {
    return res.status(400).json({ error: 'Choose a portal: student or officer.' });
  }
  const user = await one(
    'SELECT * FROM users WHERE email = ? AND account_type = ?',
    [String(email || '').toLowerCase(), account_type]
  );
  // Same message either way so the response does not confirm which emails exist.
  const bad = () => res.status(401).json({ error: 'Incorrect email or password for this portal.' });
  if (!user) return bad();

  const ok = await bcrypt.compare(String(password || ''), user.password_hash);
  if (!ok) return bad();

  await run('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
  res.json({ token: signToken(user), user: publicUser(user) });
});

/** GET /api/auth/me — current session, plus officer's managed clubs. */
router.get('/me', requireAuth, async (req, res) => {
  const payload = { user: publicUser(req.user) };
  if (req.user.account_type === 'officer') {
    payload.managed_clubs = await q(
      `SELECT c.id, c.slug, c.name, c.acronym, c.logo_hue, c.logo_url, co.title, co.is_primary
         FROM club_officers co
         JOIN clubs c ON c.id = co.club_id
        WHERE co.user_id = ?
        ORDER BY co.is_primary DESC, c.name`,
      [req.user.id]
    );
  }
  res.json(payload);
});

/** PATCH /api/auth/me — edit profile. */
router.patch('/me', requireAuth, async (req, res) => {
  const { full_name, class_year, residential_college, major, pronouns, bio } = req.body || {};
  await run(
    `UPDATE users
        SET full_name = COALESCE(?, full_name),
            class_year = ?,
            residential_college = ?,
            major = ?,
            pronouns = ?,
            bio = ?
      WHERE id = ?`,
    [
      full_name?.trim() || null,
      class_year || null,
      residential_college || null,
      major || null,
      pronouns || null,
      bio || null,
      req.user.id,
    ]
  );
  const user = await one('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: publicUser(user) });
});

/**
 * GET /api/auth/counterpart
 * Tells the UI whether this person also holds an account in the other portal,
 * so it can offer "switch portals" instead of "register".
 */
router.get('/counterpart', requireAuth, async (req, res) => {
  const other = req.user.account_type === 'student' ? 'officer' : 'student';
  const row = await one(
    'SELECT id FROM users WHERE email = ? AND account_type = ?',
    [req.user.email, other]
  );
  res.json({ other_portal: other, exists: Boolean(row) });
});

module.exports = router;
