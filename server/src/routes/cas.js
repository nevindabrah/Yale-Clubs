/**
 * Yale CAS single sign-on (CAS protocol 2.0).
 *
 * Flow:
 *   1. Browser hits  GET /api/auth/cas/login?portal=student
 *   2. We redirect to  <CAS_BASE>/login?service=<our callback>
 *   3. Yale authenticates the user and redirects back with ?ticket=ST-...
 *   4. We validate that ticket server-side at <CAS_BASE>/serviceValidate
 *   5. On success we find-or-create the account for that NetID, mint a JWT,
 *      and bounce the browser to the client with the token.
 *
 * The ticket is validated on the server, never trusted from the browser — a
 * ticket is single-use and only the service that requested it can redeem it.
 *
 * IMPORTANT (see DECISIONS.md D-017): Yale ITS must register this app's
 * service URL before real CAS will accept it. Until then run CAS_MODE=mock,
 * which exercises the identical code path against a local stand-in so the
 * flow can be developed and tested end to end.
 */
const express = require('express');
const { one, run } = require('../db');
const { signToken } = require('../auth');

const router = express.Router();

const CAS_BASE = process.env.CAS_BASE_URL || 'https://secure.its.yale.edu/cas';
const CAS_MODE = process.env.CAS_MODE || 'mock'; // 'mock' | 'yale'
const SERVER_URL = process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
const CLIENT_URL = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const PORTALS = ['student', 'officer'];
const normalizePortal = (p) => (PORTALS.includes(p) ? p : 'student');

/** The service URL CAS redirects back to. Must match byte-for-byte on validate. */
function serviceUrl(portal) {
  return `${SERVER_URL}/api/auth/cas/callback?portal=${portal}`;
}

function backToClient(res, params) {
  const qs = new URLSearchParams(params).toString();
  res.redirect(`${CLIENT_URL}/auth/cas?${qs}`);
}

/**
 * Minimal CAS 2.0 XML reader. The success payload is a fixed, tiny shape:
 *   <cas:serviceResponse><cas:authenticationSuccess><cas:user>NETID</cas:user>
 * so two targeted matches beat pulling in an XML parser. Anything that does
 * not contain an authenticationSuccess element is treated as a failure.
 */
function parseCasResponse(xml) {
  if (!/<cas:authenticationSuccess>/.test(xml)) {
    const code = /<cas:authenticationFailure[^>]*code=["']([^"']+)["']/.exec(xml);
    return { ok: false, code: code?.[1] || 'INVALID_TICKET' };
  }
  const user = /<cas:user>\s*([^<\s]+)\s*<\/cas:user>/.exec(xml);
  if (!user) return { ok: false, code: 'NO_USER_IN_RESPONSE' };

  // Yale returns additional attributes when the service is authorized for them.
  const attr = (name) => {
    const m = new RegExp(`<cas:${name}>([^<]*)</cas:${name}>`).exec(xml);
    return m ? m[1].trim() : null;
  };
  return {
    ok: true,
    netid: user[1].toLowerCase(),
    displayName: attr('displayName') || attr('cn'),
    email: attr('mail') || attr('email'),
  };
}

/** GET /api/auth/cas/login?portal=student — start the handshake. */
router.get('/login', (req, res) => {
  const portal = normalizePortal(req.query.portal);
  const service = encodeURIComponent(serviceUrl(portal));

  if (CAS_MODE === 'mock') {
    return res.redirect(`${SERVER_URL}/api/auth/cas/mock?portal=${portal}`);
  }
  res.redirect(`${CAS_BASE}/login?service=${service}`);
});

/**
 * GET /api/auth/cas/mock — local stand-in for the Yale login page.
 * Only mounted when CAS_MODE=mock. It asks for a NetID, then redirects back
 * to the real callback with a mock ticket, so the callback code path that
 * runs in production is the same one exercised in development.
 */
router.get('/mock', (req, res) => {
  if (CAS_MODE !== 'mock') return res.status(404).json({ error: 'Not found.' });
  const portal = normalizePortal(req.query.portal);
  res.type('html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Yale CAS (development stand-in)</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f5f7fa;
       display:grid;place-items:center;min-height:100vh;margin:0;color:#14202c}
  .box{background:#fff;border:1px solid #dde3ea;border-radius:12px;padding:34px;width:400px;
       box-shadow:0 2px 12px rgba(16,30,46,.1)}
  h1{font-size:20px;margin:0 0 6px}
  .warn{background:#fdf1da;color:#8a6414;border:1px solid #e6cd93;border-radius:8px;
        padding:11px 13px;font-size:13.5px;margin:16px 0}
  label{display:block;font-size:14px;font-weight:600;color:#5d6f82;margin-bottom:6px}
  input{width:100%;padding:11px 13px;border:1px solid #c6d0db;border-radius:8px;font-size:16px;
        box-sizing:border-box}
  button{width:100%;margin-top:16px;padding:12px;border:0;border-radius:8px;background:#00356b;
         color:#fff;font-size:16px;font-weight:600;cursor:pointer}
  p.small{font-size:13px;color:#5d6f82}
</style></head>
<body><form class="box" method="GET" action="/api/auth/cas/callback">
  <h1>Yale Central Authentication Service</h1>
  <p class="small">Signing in to <strong>ClubTable</strong> — ${portal} portal</p>
  <div class="warn"><strong>Development stand-in.</strong> This is not Yale CAS. It exists so the
  CAS handshake can be tested before Yale ITS registers this service. Set
  <code>CAS_MODE=yale</code> to use the real one.</div>
  <label for="netid">NetID</label>
  <input id="netid" name="mock_netid" placeholder="abc123" required autofocus>
  <input type="hidden" name="portal" value="${portal}">
  <input type="hidden" name="ticket" value="ST-mock">
  <button type="submit">Log In</button>
</form></body></html>`);
});

/** GET /api/auth/cas/callback?ticket=...&portal=... — redeem the ticket. */
router.get('/callback', async (req, res) => {
  const portal = normalizePortal(req.query.portal);
  const ticket = String(req.query.ticket || '');
  if (!ticket) return backToClient(res, { error: 'CAS did not return a ticket.', portal });

  let result;
  if (CAS_MODE === 'mock') {
    const netid = String(req.query.mock_netid || '').trim().toLowerCase();
    if (!/^[a-z]{2,4}\d{1,4}$/.test(netid)) {
      return backToClient(res, { error: 'Enter a NetID like abc123.', portal });
    }
    result = { ok: true, netid, displayName: null, email: null };
  } else {
    try {
      const url =
        `${CAS_BASE}/serviceValidate?service=${encodeURIComponent(serviceUrl(portal))}` +
        `&ticket=${encodeURIComponent(ticket)}`;
      const casRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
      result = parseCasResponse(await casRes.text());
    } catch (err) {
      console.error('CAS validation failed:', err.message);
      return backToClient(res, { error: 'Could not reach Yale CAS. Try again.', portal });
    }
  }

  if (!result.ok) {
    return backToClient(res, { error: `Yale CAS rejected the login (${result.code}).`, portal });
  }

  const email = (result.email || `${result.netid}@yale.edu`).toLowerCase();

  // Find the account for this NetID in this portal, or create it. CAS accounts
  // have no password — the `password_hash` sentinel below cannot match any
  // bcrypt comparison, so a CAS-only account can never be password-signed-in.
  let user = await one('SELECT * FROM users WHERE email = ? AND account_type = ?', [email, portal]);
  let created = false;

  if (!user) {
    const hue = [...email].reduce((a, ch) => (a + ch.charCodeAt(0)) % 360, 0);
    const result2 = await run(
      `INSERT INTO users (account_type, email, password_hash, full_name, netid, avatar_hue)
       VALUES (?,?,?,?,?,?)`,
      [portal, email, 'cas-sso-no-password', result.displayName || result.netid, result.netid, hue]
    );
    user = await one('SELECT * FROM users WHERE id = ?', [result2.insertId]);
    created = true;
  } else if (!user.netid) {
    await run('UPDATE users SET netid = ? WHERE id = ?', [result.netid, user.id]);
  }

  await run('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
  backToClient(res, { token: signToken(user), portal, new: created ? '1' : '0' });
});

/** GET /api/auth/cas/status — lets the client decide whether to show the button. */
router.get('/status', (_req, res) => {
  res.json({ enabled: true, mode: CAS_MODE, cas_base: CAS_MODE === 'yale' ? CAS_BASE : null });
});

module.exports = router;
