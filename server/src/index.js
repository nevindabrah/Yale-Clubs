require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { attachUser } = require('./auth');
const { pool } = require('./db');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '256kb' }));
app.use(attachUser);

app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS clubs FROM clubs');
    res.json({ ok: true, clubs: rows[0].clubs });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/student', require('./routes/student'));
app.use('/api/officer', require('./routes/officer'));
app.use('/api/messages', require('./routes/messages'));

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
});
