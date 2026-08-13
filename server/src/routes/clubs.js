const express = require('express');
const { q, one } = require('../db');

const router = express.Router();

const SORTS = {
  name: 'c.name ASC',
  rating: 'c.rating DESC, c.name ASC',
  size: 'member_count DESC, c.size_estimate DESC',
  commitment: 'c.commitment_hours ASC, c.name ASC',
  selectivity: 'c.selectivity DESC, c.name ASC',
  newest: 'c.founded_year DESC, c.name ASC',
};

/** GET /api/clubs/facets — category list + counts for the filter sidebar. */
router.get('/facets', async (_req, res) => {
  const categories = await q(
    `SELECT category, COUNT(*) AS count
       FROM clubs WHERE is_active = 1
      GROUP BY category ORDER BY category`
  );
  const subcategories = await q(
    `SELECT category, subcategory, COUNT(*) AS count
       FROM clubs WHERE is_active = 1 AND subcategory IS NOT NULL
      GROUP BY category, subcategory ORDER BY subcategory`
  );
  const totals = await one(
    `SELECT COUNT(*) AS total,
            SUM(application_required = 1) AS application_required,
            SUM(application_required = 0) AS open_join
       FROM clubs WHERE is_active = 1`
  );
  res.json({ categories, subcategories, totals });
});

/**
 * GET /api/clubs
 * Catalog search. Filters: q, category (repeatable), subcategory,
 * application (open|required|any), accepting, max_hours, min_rating, sort.
 */
router.get('/', async (req, res) => {
  const {
    q: search,
    category,
    subcategory,
    application,
    accepting,
    max_hours,
    min_rating,
    sort = 'name',
    limit = '200',
    offset = '0',
  } = req.query;

  const where = ['c.is_active = 1'];
  const params = [];

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    where.push('(c.name LIKE ? OR c.acronym LIKE ? OR c.tagline LIKE ? OR c.description LIKE ? OR c.category LIKE ?)');
    params.push(term, term, term, term, term);
  }

  const cats = [].concat(category || []).filter(Boolean);
  if (cats.length) {
    where.push(`c.category IN (${cats.map(() => '?').join(',')})`);
    params.push(...cats);
  }

  const subs = [].concat(subcategory || []).filter(Boolean);
  if (subs.length) {
    where.push(`c.subcategory IN (${subs.map(() => '?').join(',')})`);
    params.push(...subs);
  }

  if (application === 'required') where.push('c.application_required = 1');
  if (application === 'open') where.push('c.application_required = 0');
  if (accepting === 'true') where.push('c.accepting_members = 1');
  if (max_hours) {
    where.push('c.commitment_hours <= ?');
    params.push(Number(max_hours));
  }
  if (min_rating) {
    where.push('c.rating >= ?');
    params.push(Number(min_rating));
  }

  // LIMIT/OFFSET are interpolated after integer coercion — MySQL prepared
  // statements will not accept them as bound parameters.
  const lim = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
  const off = Math.max(parseInt(offset, 10) || 0, 0);
  const orderBy = SORTS[sort] || SORTS.name;

  const rows = await q(
    `SELECT c.*,
            (SELECT COUNT(*) FROM memberships m
              WHERE m.club_id = c.id AND m.status = 'active') AS member_count,
            (SELECT COUNT(*) FROM events e
              WHERE e.club_id = c.id AND e.starts_at >= NOW()) AS upcoming_events
       FROM clubs c
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ${lim} OFFSET ${off}`,
    params
  );

  const [{ total }] = await q(
    `SELECT COUNT(*) AS total FROM clubs c WHERE ${where.join(' AND ')}`,
    params
  );

  res.json({ clubs: rows, total, limit: lim, offset: off });
});

/** GET /api/clubs/:slug — full detail, personalized when signed in. */
router.get('/:slug', async (req, res) => {
  const club = await one(
    `SELECT c.*,
            (SELECT COUNT(*) FROM memberships m
              WHERE m.club_id = c.id AND m.status = 'active') AS member_count
       FROM clubs c WHERE c.slug = ?`,
    [req.params.slug]
  );
  if (!club) return res.status(404).json({ error: 'Club not found.' });

  const officers = await q(
    `SELECT u.full_name, u.pronouns, u.class_year, u.avatar_hue, co.title, co.is_primary
       FROM club_officers co JOIN users u ON u.id = co.user_id
      WHERE co.club_id = ?
      ORDER BY co.is_primary DESC, co.title`,
    [club.id]
  );

  const isMember = req.user
    ? Boolean(
        await one(
          "SELECT id FROM memberships WHERE club_id = ? AND user_id = ? AND status = 'active'",
          [club.id, req.user.id]
        )
      )
    : false;

  // members_only events are hidden from non-members.
  const events = await q(
    `SELECT e.*,
            (SELECT COUNT(*) FROM event_rsvps r WHERE r.event_id = e.id AND r.status = 'going')
              AS going_count
       FROM events e
      WHERE e.club_id = ?
        AND e.starts_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        AND (e.visibility = 'public' OR ? = 1)
      ORDER BY e.starts_at
      LIMIT 25`,
    [club.id, isMember ? 1 : 0]
  );

  const announcements = await q(
    `SELECT a.id, a.title, a.body, a.pinned, a.posted_at, u.full_name AS posted_by_name
       FROM announcements a LEFT JOIN users u ON u.id = a.posted_by
      WHERE a.club_id = ?
      ORDER BY a.pinned DESC, a.posted_at DESC
      LIMIT 10`,
    [club.id]
  );

  const questions = await q(
    `SELECT id, prompt, help_text, input_type, options, max_words, is_required, sort_order
       FROM application_questions WHERE club_id = ? ORDER BY sort_order`,
    [club.id]
  );

  const viewer = { is_member: isMember, is_bookmarked: false, application: null, thread_id: null };
  if (req.user && req.user.account_type === 'student') {
    viewer.is_bookmarked = Boolean(
      await one('SELECT id FROM bookmarks WHERE club_id = ? AND user_id = ?', [club.id, req.user.id])
    );
    viewer.application = await one(
      `SELECT id, status, submitted_at, decided_at, decision_note
         FROM applications WHERE club_id = ? AND user_id = ?`,
      [club.id, req.user.id]
    );
    const thread = await one(
      'SELECT id FROM message_threads WHERE club_id = ? AND student_user_id = ?',
      [club.id, req.user.id]
    );
    viewer.thread_id = thread?.id ?? null;
  }

  const similar = await q(
    `SELECT slug, name, acronym, category, tagline, logo_hue, rating
       FROM clubs
      WHERE category = ? AND id <> ? AND is_active = 1
      ORDER BY rating DESC LIMIT 6`,
    [club.category, club.id]
  );

  res.json({ club, officers, events, announcements, questions, viewer, similar });
});

module.exports = router;
