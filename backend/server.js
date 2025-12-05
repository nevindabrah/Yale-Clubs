import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db, initDb } from './db.js';
import { authRequired, ownerOnly } from './authMiddleware.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

initDb();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Helper to run queries with Promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// AUTH ROUTES

// Student registration
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    await run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?,?)',
      [email, password_hash, name, 'student']
    );
    const user = await get('SELECT id, email, name, role FROM users WHERE email = ?', [email]);
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login for both owners and students
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: payload, token });
});

// CURRENT USER
app.get('/api/me', authRequired, async (req, res) => {
  const user = await get('SELECT id, email, name, role FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

// CLUBS (student & owner views)

app.get('/api/clubs', authRequired, async (req, res) => {
  try {
    const clubs = await all(`
      SELECT c.*,
        u.name as owner_name,
        (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.id) as member_count,
        COALESCE((
          SELECT status FROM club_applications a 
          WHERE a.club_id = c.id AND a.user_id = ?
        ), '') as application_status,
        EXISTS(
          SELECT 1 FROM memberships m2 
          WHERE m2.club_id = c.id AND m2.user_id = ?
        ) as is_member
      FROM clubs c
      JOIN users u ON c.owner_id = u.id
      ORDER BY c.name
    `, [req.user.id, req.user.id]);
    res.json(clubs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load clubs' });
  }
});

// View single club details
app.get('/api/clubs/:id', authRequired, async (req, res) => {
  const clubId = req.params.id;
  try {
    const club = await get(`
      SELECT c.*, u.name as owner_name, u.email as owner_email
      FROM clubs c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
    `, [clubId]);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const events = await all(
      'SELECT * FROM events WHERE club_id = ? ORDER BY start_time',
      [clubId]
    );

    res.json({ club, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load club' });
  }
});

// Join/apply/audition
app.post('/api/clubs/:id/join', authRequired, async (req, res) => {
  const clubId = req.params.id;
  try {
    const club = await get('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    if (club.join_type === 'open') {
      await run(
        'INSERT OR IGNORE INTO memberships (club_id, user_id) VALUES (?,?)',
        [clubId, req.user.id]
      );
      // Remove any existing application
      await run('DELETE FROM club_applications WHERE club_id = ? AND user_id = ?', [clubId, req.user.id]);
      return res.json({ message: 'Joined club successfully', type: 'member' });
    } else {
      await run(
        "INSERT OR IGNORE INTO club_applications (club_id, user_id, status) VALUES (?,?,'pending')",
        [clubId, req.user.id]
      );
      return res.json({ message: 'Application submitted', type: club.join_type });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process join' });
  }
});


// Withdraw application (student)
app.post('/api/clubs/:id/withdraw', authRequired, async (req, res) => {
  const clubId = req.params.id;
  try {
    const appRow = await get(
      'SELECT * FROM club_applications WHERE club_id = ? AND user_id = ?',
      [clubId, req.user.id]
    );
    if (!appRow) {
      return res.status(404).json({ error: 'No application found for this club' });
    }
    if (appRow.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending applications can be withdrawn' });
    }
    await run(
      'DELETE FROM club_applications WHERE id = ?',
      [appRow.id]
    );
    res.json({ message: 'Application withdrawn' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
});

// Leave club
app.post('/api/clubs/:id/leave', authRequired, async (req, res) => {
  const clubId = req.params.id;
  try {
    await run('DELETE FROM memberships WHERE club_id = ? AND user_id = ?', [clubId, req.user.id]);
    res.json({ message: 'Left club' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to leave club' });
  }
});

// Applications for current student
app.get('/api/my/applications', authRequired, async (req, res) => {
  try {
    const rows = await all(`
      SELECT a.*, c.name as club_name
      FROM club_applications a
      JOIN clubs c ON a.club_id = c.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

// Schedule for current student (meetings + events)
app.get('/api/my/schedule', authRequired, async (req, res) => {
  try {
    const meetings = await all(`
      SELECT c.id as club_id, c.name as club_name, c.meeting_time, c.location
      FROM memberships m
      JOIN clubs c ON m.club_id = c.id
      WHERE m.user_id = ?
    `, [req.user.id]);

    const events = await all(`
      SELECT e.*, c.name as club_name,
        EXISTS(SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = ?) as rsvped
      FROM events e
      JOIN memberships m ON e.club_id = m.club_id
      JOIN clubs c ON e.club_id = c.id
      WHERE m.user_id = ?
      ORDER BY e.start_time
    `, [req.user.id, req.user.id]);

    res.json({ meetings, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load schedule' });
  }
});

// OWNER ROUTES

// Get clubs for current owner
app.get('/api/owner/clubs', authRequired, ownerOnly, async (req, res) => {
  try {
    const clubs = await all('SELECT * FROM clubs WHERE owner_id = ?', [req.user.id]);
    res.json(clubs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load owner clubs' });
  }
});

// Get applications for a club (owner)
app.get('/api/owner/clubs/:id/applications', authRequired, ownerOnly, async (req, res) => {
  const clubId = req.params.id;
  try {
    const club = await get('SELECT * FROM clubs WHERE id = ? AND owner_id = ?', [clubId, req.user.id]);
    if (!club) return res.status(404).json({ error: 'Club not found or not owned by you' });

    const apps = await all(`
      SELECT a.*, u.name as student_name, u.email as student_email
      FROM club_applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.club_id = ?
      ORDER BY a.created_at DESC
    `, [clubId]);

    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

// Update application status (owner)
app.patch('/api/owner/applications/:id', authRequired, ownerOnly, async (req, res) => {
  const appId = req.params.id;
  const { status } = req.body;
  if (!['pending', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const appRow = await get(`
      SELECT a.*, c.owner_id 
      FROM club_applications a
      JOIN clubs c ON a.club_id = c.id
      WHERE a.id = ?
    `, [appId]);
    if (!appRow || appRow.owner_id !== req.user.id) {
      return res.status(404).json({ error: 'Application not found or unauthorized' });
    }

    await run('UPDATE club_applications SET status = ? WHERE id = ?', [status, appId]);

    if (status === 'accepted') {
      await run(
        'INSERT OR IGNORE INTO memberships (club_id, user_id) VALUES (?,?)',
        [appRow.club_id, appRow.user_id]
      );
    } else if (status === 'rejected') {
      await run(
        'DELETE FROM memberships WHERE club_id = ? AND user_id = ?',
        [appRow.club_id, appRow.user_id]
      );
    } else if (status === 'pending') {
      await run(
        'DELETE FROM memberships WHERE club_id = ? AND user_id = ?',
        [appRow.club_id, appRow.user_id]
      );
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Update club details (owner)
app.put('/api/owner/clubs/:id', authRequired, ownerOnly, async (req, res) => {
  const clubId = req.params.id;
  const {
    name,
    meeting_time,
    location,
    join_type,
    deadline,
    description,
    owner_name,
    owner_email
  } = req.body;
  if (!name || !join_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const club = await get('SELECT * FROM clubs WHERE id = ? AND owner_id = ?', [clubId, req.user.id]);
    if (!club) return res.status(404).json({ error: 'Club not found or unauthorized' });

    await run(
      `UPDATE clubs
       SET name = ?,
           meeting_time = ?,
           location = ?,
           join_type = ?,
           deadline = ?,
           description = ?,
           owner_name = ?,
           owner_email = ?
       WHERE id = ?`,
      [
        name || club.name,
        meeting_time || club.meeting_time,
        location || club.location,
        join_type || club.join_type,
        deadline || club.deadline,
        description || club.description,
        owner_name || club.owner_name,
        owner_email || club.owner_email,
        clubId
      ]
    );

    const updated = await get('SELECT * FROM clubs WHERE id = ?', [clubId]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update club' });
  }
});


// Owner manage events
app.get('/api/owner/clubs/:id/events', authRequired, ownerOnly, async (req, res) => {
  const clubId = req.params.id;
  try {
    const club = await get('SELECT * FROM clubs WHERE id = ? AND owner_id = ?', [clubId, req.user.id]);
    if (!club) return res.status(404).json({ error: 'Club not found or unauthorized' });

    const events = await all(
      `SELECT e.*, 
        EXISTS(SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = ?) as rsvped,
        (SELECT COUNT(*) FROM event_rsvps r WHERE r.event_id = e.id) as rsvp_count
       FROM events e 
       WHERE club_id = ? 
       ORDER BY start_time`,
      [req.user.id, clubId]
    );
    res.json({ club, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

app.post('/api/owner/clubs/:id/events', authRequired, ownerOnly, async (req, res) => {
  const clubId = req.params.id;
  const { title, start_time, end_time, location, description } = req.body;

  if (!title || !start_time || !end_time) {
    return res.status(400).json({ error: 'Title, start_time and end_time are required' });
  }

  try {
    const club = await get('SELECT * FROM clubs WHERE id = ? AND owner_id = ?', [clubId, req.user.id]);
    if (!club) return res.status(404).json({ error: 'Club not found or unauthorized' });

    const result = await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [clubId, title, start_time, end_time, location || '', description || '']
    );
    const ev = await get('SELECT * FROM events WHERE id = ?', [result.lastID]);
    res.status(201).json(ev);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Student RSVP toggle
app.post('/api/events/:id/rsvp', authRequired, async (req, res) => {
  const eventId = req.params.id;
  const { rsvp } = req.body ?? {};
  try {
    const ev = await get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const isMember = await get(
      'SELECT 1 FROM memberships WHERE club_id = ? AND user_id = ?',
      [ev.club_id, req.user.id]
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this club' });
    }

    const existing = await get(
      'SELECT id FROM event_rsvps WHERE event_id = ? AND user_id = ?',
      [eventId, req.user.id]
    );

    const shouldRsvp = rsvp === false ? false : rsvp === true ? true : !existing;
    if (shouldRsvp) {
      if (!existing) {
        await run('INSERT INTO event_rsvps (event_id, user_id) VALUES (?,?)', [eventId, req.user.id]);
      }
    } else if (existing) {
      await run('DELETE FROM event_rsvps WHERE id = ?', [existing.id]);
    }

    res.json({ rsvped: shouldRsvp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
});

// Owner: view RSVPs for an event
app.get('/api/owner/events/:id/rsvps', authRequired, ownerOnly, async (req, res) => {
  const eventId = req.params.id;
  try {
    const ev = await get(
      `SELECT e.*, c.owner_id 
       FROM events e 
       JOIN clubs c ON e.club_id = c.id 
       WHERE e.id = ?`,
      [eventId]
    );
    if (!ev || ev.owner_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    const rows = await all(
      `SELECT r.user_id, r.created_at, u.name, u.email
       FROM event_rsvps r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = ?
       ORDER BY r.created_at DESC`,
      [eventId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load RSVPs' });
  }
});

app.put('/api/owner/events/:id', authRequired, ownerOnly, async (req, res) => {
  const eventId = req.params.id;
  const { title, start_time, end_time, location, description } = req.body;

  try {
    const ev = await get(
      'SELECT e.*, c.owner_id FROM events e JOIN clubs c ON e.club_id = c.id WHERE e.id = ?',
      [eventId]
    );
    if (!ev || ev.owner_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    await run(
      'UPDATE events SET title = ?, start_time = ?, end_time = ?, location = ?, description = ? WHERE id = ?',
      [
        title || ev.title,
        start_time || ev.start_time,
        end_time || ev.end_time,
        location || ev.location,
        description ?? ev.description ?? '',
        eventId
      ]
    );
    const updated = await get('SELECT * FROM events WHERE id = ?', [eventId]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/owner/events/:id', authRequired, ownerOnly, async (req, res) => {
  const eventId = req.params.id;

  try {
    const ev = await get(
      'SELECT e.*, c.owner_id FROM events e JOIN clubs c ON e.club_id = c.id WHERE e.id = ?',
      [eventId]
    );
    if (!ev || ev.owner_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    await run('DELETE FROM events WHERE id = ?', [eventId]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Owner: club members
app.get('/api/owner/clubs/:id/members', authRequired, ownerOnly, async (req, res) => {
  const clubId = req.params.id;
  try {
    const club = await get('SELECT * FROM clubs WHERE id = ? AND owner_id = ?', [clubId, req.user.id]);
    if (!club) return res.status(404).json({ error: 'Club not found or unauthorized' });

    const members = await all(
      `SELECT u.id, u.name, u.email, m.role, m.joined_at
       FROM memberships m
       JOIN users u ON m.user_id = u.id
       WHERE m.club_id = ?
       ORDER BY u.name`,
      [clubId]
    );
    res.json({ club, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load members' });
  }
});

app.delete('/api/owner/clubs/:clubId/members/:memberId', authRequired, ownerOnly, async (req, res) => {
  const { clubId, memberId } = req.params;
  try {
    const club = await get('SELECT * FROM clubs WHERE id = ? AND owner_id = ?', [clubId, req.user.id]);
    if (!club) return res.status(404).json({ error: 'Club not found or unauthorized' });

    await run('DELETE FROM memberships WHERE club_id = ? AND user_id = ?', [clubId, memberId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

app.listen(PORT, () => {
  console.log(`Yale Clubs backend running on http://localhost:${PORT}`);
});
