require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { attachUser } = require('./auth');
const { pool } = require('./db');

const app = express();
const PROD = process.env.NODE_ENV === 'production';

// Refuse to boot into production with the development JWT secret — a deploy
// that forgets to set it would issue forgeable tokens. (docs/SECURITY-NOTES.md)
if (PROD) {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || secret.includes('change-me')) {
    console.error('✗ Refusing to start: set a strong JWT_SECRET (32+ chars) in production.');
    process.exit(1);
  }
}

// Behind a proxy/load balancer, trust it so rate limiting sees real client IPs.
if (PROD) app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '256kb' }));
app.use(attachUser);

// Limits are enforced everywhere, but relaxed off-production so local testing
// and repeated e2e runs do not lock themselves out of the auth endpoints.
const RELAX = PROD ? 1 : 25;

const limit = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max: max * RELAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

// Credential endpoints are the brute-force target; ClubWiz is the expensive one.
app.use('/api/auth/login', limit(15 * 60_000, 20, 'Too many sign-in attempts. Wait 15 minutes.'));
app.use('/api/auth/register', limit(60 * 60_000, 10, 'Too many accounts created from this address.'));
app.use('/api/clubwiz', limit(60_000, 20, 'ClubWiz is getting a lot of questions. Try again in a minute.'));
app.use('/api', limit(60_000, 600, 'Slow down a moment.'));

app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS clubs FROM clubs');
    res.json({
      ok: true,
      clubs: rows[0].clubs,
      clubwiz: process.env.ANTHROPIC_API_KEY ? 'live' : 'offline',
      cas: process.env.CAS_MODE || 'mock',
    });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.use('/api/auth/cas', require('./routes/cas'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/student', require('./routes/student'));
app.use('/api/officer', require('./routes/officer'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/clubwiz', require('./routes/clubwiz'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown endpoint.' }));

// Central error handler — route handlers can just throw.
app.use((err, _req, res, _next) => {
  console.error(err);
  const isDuplicate = err.code === 'ER_DUP_ENTRY';
  res.status(isDuplicate ? 409 : 500).json({
    error: isDuplicate ? 'That already exists.' : 'Something went wrong on our end.',
  });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`YaleClubs API listening on http://localhost:${PORT}`);
  console.log(`  ClubWiz: ${process.env.ANTHROPIC_API_KEY ? 'live (Claude API)' : 'offline (no ANTHROPIC_API_KEY)'}`);
  console.log(`  Yale CAS: ${process.env.CAS_MODE || 'mock'} mode`);
});
