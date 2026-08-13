const jwt = require('jsonwebtoken');
const { one } = require('./db');

const SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, account_type: user.account_type },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Attaches req.user when a valid Bearer token is present.
 * Does not reject — use requireAuth / requireStudent / requireOfficer for that.
 */
async function attachUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, SECRET);
    const user = await one(
      `SELECT id, account_type, email, full_name, netid, class_year,
              residential_college, major, pronouns, bio, avatar_hue, created_at
         FROM users WHERE id = ?`,
      [payload.sub]
    );
    // account_type is baked into the token; a token must not outlive a change.
    if (user && user.account_type === payload.account_type) req.user = user;
  } catch {
    /* invalid or expired token — treated as anonymous */
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in to continue.' });
  next();
}

/** Student-portal endpoints. An officer account may NOT call these (D-002). */
function requireStudent(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in to continue.' });
  if (req.user.account_type !== 'student') {
    return res.status(403).json({
      error:
        'This is a student action. Sign in with your student account — officer accounts are separate.',
    });
  }
  next();
}

/** Officer-portal endpoints. A student account may NOT call these (D-002). */
function requireOfficer(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in to continue.' });
  if (req.user.account_type !== 'officer') {
    return res.status(403).json({
      error:
        'This is an officer action. Sign in with your officer account — student accounts are separate.',
    });
  }
  next();
}

/**
 * Confirms the signed-in officer manages :clubId (or the body's club_id).
 * Sets req.clubId and req.officerTitle.
 */
async function requireClubOfficer(req, res, next) {
  const clubId = Number(req.params.clubId ?? req.body.club_id);
  if (!Number.isInteger(clubId)) {
    return res.status(400).json({ error: 'A club id is required.' });
  }
  const row = await one(
    'SELECT title FROM club_officers WHERE club_id = ? AND user_id = ?',
    [clubId, req.user.id]
  );
  if (!row) {
    return res.status(403).json({ error: 'You do not manage this club.' });
  }
  req.clubId = clubId;
  req.officerTitle = row.title;
  next();
}

module.exports = {
  signToken,
  attachUser,
  requireAuth,
  requireStudent,
  requireOfficer,
  requireClubOfficer,
};
