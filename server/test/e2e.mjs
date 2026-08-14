import { readFile } from 'node:fs/promises';
const BASE = 'http://localhost:4000/api';
let failures = 0;

async function call(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function check(name, cond, extra = '') {
  if (cond) console.log(`  ✓ ${name}`);
  else { failures++; console.log(`  ✗ ${name} ${extra}`); }
}

const stamp = Date.now();
const EMAIL = `test.person.${stamp}@yale.edu`;

console.log('\n1. Dual accounts on one email (D-002)');
const s = await call('/auth/register', { method: 'POST', body: { account_type: 'student', email: EMAIL, password: 'password123', full_name: 'Test Person', class_year: 2029 } });
check('student account created', s.status === 201, JSON.stringify(s.data));
const o = await call('/auth/register', { method: 'POST', body: { account_type: 'officer', email: EMAIL, password: 'differentpw99', full_name: 'Test Person' } });
check('officer account created on SAME email', o.status === 201, JSON.stringify(o.data));
const dup = await call('/auth/register', { method: 'POST', body: { account_type: 'student', email: EMAIL, password: 'password123', full_name: 'Test Person' } });
check('duplicate within same portal rejected', dup.status === 409);
const wrongPw = await call('/auth/login', { method: 'POST', body: { account_type: 'officer', email: EMAIL, password: 'password123' } });
check('officer login rejects the student password', wrongPw.status === 401);

const stu = s.data.token;

console.log('\n2. Catalog');
const list = await call('/clubs?q=cappella&sort=rating');
check('search returns a cappella groups', list.data.clubs.length > 5, `got ${list.data.clubs.length}`);
const detail = await call('/clubs/yale-daily-news', { token: stu });
check('club detail loads', detail.data.club.name === 'Yale Daily News');
check('detail includes officers', detail.data.officers.length > 0);
check('detail includes questions', detail.data.questions.length === 3);
const filtered = await call('/clubs?application=open&max_hours=4');
check('filters compose', filtered.data.clubs.every((c) => !c.application_required && Number(c.commitment_hours) <= 4));

console.log('\n3. Student join / bookmark');
const outdoors = (await call('/clubs/yale-outdoors')).data.club;
check('join open club', (await call(`/student/clubs/${outdoors.id}/join`, { token: stu, method: 'POST' })).status === 201);
const ydn = detail.data.club;
const badJoin = await call(`/student/clubs/${ydn.id}/join`, { token: stu, method: 'POST' });
check('cannot instant-join an application-required club', badJoin.status === 409, JSON.stringify(badJoin.data));
check('bookmark toggles on', (await call(`/student/clubs/${ydn.id}/bookmark`, { token: stu, method: 'POST' })).data.bookmarked === true);
check('bookmark toggles off', (await call(`/student/clubs/${ydn.id}/bookmark`, { token: stu, method: 'POST' })).data.bookmarked === false);

console.log('\n4. Application -> officer decision -> membership');
const answers = Object.fromEntries(detail.data.questions.map((q) => [q.id, 'A thoughtful answer for the test suite.']));
const applied = await call(`/student/clubs/${ydn.id}/apply`, { token: stu, method: 'POST', body: { answers } });
check('application submitted', applied.status === 201, JSON.stringify(applied.data));
const missing = await call(`/student/clubs/${ydn.id}/apply`, { token: stu, method: 'POST', body: { answers: {} } });
check('duplicate application blocked', missing.status === 409);

const off = (await call('/auth/login', { method: 'POST', body: { account_type: 'officer', email: 'officer@yale.edu', password: 'clubtable123' } })).data.token;
const queue = await call(`/officer/clubs/${ydn.id}/applications?status=submitted`, { token: off });
const mine = queue.data.applications.find((a) => a.email === EMAIL);
check('application appears in the officer queue', Boolean(mine));

const full = await call(`/officer/applications/${mine.id}`, { token: off });
check('officer sees the answers', full.data.answers.length === 3);
const accepted = await call(`/officer/applications/${mine.id}`, { token: off, method: 'PATCH', body: { status: 'accepted', decision_note: 'Welcome aboard.', internal_note: 'strong pitch', rating: 5 } });
check('decision recorded', accepted.data.application.status === 'accepted');

const dash = await call('/student/dashboard', { token: stu });
check('acceptance created a membership', dash.data.memberships.some((m) => m.slug === 'yale-daily-news'));
const studentView = await call(`/student/applications/${mine.id}`, { token: stu });
check('student sees the decision note', studentView.data.application.decision_note === 'Welcome aboard.');
check('internal note is NOT exposed to the student', !JSON.stringify(studentView.data).includes('strong pitch'));

console.log('\n5. Cross-portal authorization');
check('student token blocked from officer routes', (await call('/officer/clubs', { token: stu })).status === 403);
check('officer token blocked from student routes', (await call('/student/dashboard', { token: off })).status === 403);
const otherOfficer = (await call('/auth/login', { method: 'POST', body: { account_type: 'officer', email: 'avery.chen@yale.edu', password: 'clubtable123' } })).data.token;
check('officer cannot read another club\'s applications', (await call(`/officer/clubs/${ydn.id}/applications`, { token: otherOfficer })).status === 403);
check('officer cannot decide on another club\'s application', (await call(`/officer/applications/${mine.id}`, { token: otherOfficer, method: 'PATCH', body: { status: 'rejected' } })).status === 403);

console.log('\n6. Messaging');
const thread = await call('/messages/threads', { token: stu, method: 'POST', body: { club_id: ydn.id, subject: 'Test question', body: 'Is there a beginner track?' } });
check('thread created', thread.status === 201);
check('officer sees unread', (await call('/messages/unread', { token: off })).data.unread > 0);
const reply = await call(`/messages/threads/${thread.data.thread_id}/reply`, { token: off, method: 'POST', body: { body: 'Yes — come to the Sunday meeting.' } });
check('officer replied', reply.status === 201);
const convo = await call(`/messages/threads/${thread.data.thread_id}`, { token: stu });
check('both messages present, attributed', convo.data.messages.length === 2 && convo.data.messages[1].sender_side === 'officer');
check('student cannot read a stranger\'s thread', (await call('/messages/threads/1', { token: stu })).status === 403);

console.log('\n7. Events');
const created = await call(`/officer/clubs/${ydn.id}/events`, { token: off, method: 'POST', body: { title: 'E2E test event', starts_at: '2026-10-01T19:00', location: 'WLH 208', event_type: 'meeting' } });
check('officer created an event', created.status === 201);
check('student RSVP works', (await call(`/student/events/${created.data.event.id}/rsvp`, { token: stu, method: 'POST', body: { status: 'going' } })).status === 200);
const rsvps = await call(`/officer/events/${created.data.event.id}/rsvps`, { token: off });
check('officer sees the RSVP', rsvps.data.rsvps.length === 1);
const cal = await call('/student/calendar?days=90', { token: stu });
check('calendar includes club events', cal.data.events.length > 0);
await call(`/officer/events/${created.data.event.id}`, { token: off, method: 'DELETE' });

console.log('\n8. Student dashboard');
const dash2 = await call('/student/dashboard', { token: stu });
check('dashboard lists the accepted application', dash2.data.applications.length >= 1);
check('dashboard returns deadlines', Array.isArray(dash2.data.deadlines));
check('dashboard returns recommendations', Array.isArray(dash2.data.recommended));
check('recommendations exclude clubs already joined',
  dash2.data.recommended.every((c) => !dash2.data.memberships.some((m) => m.slug === c.slug)));
check('memberships carry commitment hours for the load estimate',
  dash2.data.memberships.every((m) => m.commitment_hours != null));

console.log('\n9. ClubWiz');
const status = await call('/clubwiz/status', { token: stu });
check('status reports a mode', ['live', 'offline'].includes(status.data.mode));
const ask = (text, token) => call('/clubwiz', { token, method: 'POST', body: { messages: [{ role: 'user', content: text }] } });

const wiz1 = await ask('What deadlines are coming up?', stu);
check('answers a deadline question', wiz1.status === 200 && wiz1.data.reply.length > 20, JSON.stringify(wiz1.data).slice(0, 200));
check('reports which tools it used', Array.isArray(wiz1.data.tools_used) && wiz1.data.tools_used.length > 0);

const wiz2 = await ask('Tell me about the Whiffenpoofs', stu);
check('answers a named-club question from the catalog', /Whiffenpoof/i.test(wiz2.data.reply));

const wiz3 = await ask('What should I join if I like a cappella?', stu);
check('recommends from the real catalog', wiz3.data.reply.length > 30);

const wiz4 = await ask("What's on my calendar this week?", stu);
check('reads the student schedule', wiz4.status === 200);

const wizOff = await ask('How many applications am I sitting on?', off);
check('officer gets an officer-scoped answer', wizOff.status === 200 && wizOff.data.reply.length > 10);

check('rejects an empty conversation',
  (await call('/clubwiz', { token: stu, method: 'POST', body: { messages: [] } })).status === 400);
check('requires authentication', (await call('/clubwiz', { method: 'POST', body: { messages: [{ role: 'user', content: 'hi' }] } })).status === 401);

console.log('\n10. Yale CAS');
const casStatus = await call('/auth/cas/status');
check('CAS status advertises a mode', ['mock', 'yale'].includes(casStatus.data.mode));

// Follow the mock handshake the way a browser would, without following redirects.
const casLogin = await fetch(`${BASE}/auth/cas/login?portal=student`, { redirect: 'manual' });
check('login endpoint redirects', casLogin.status === 302 || casLogin.status === 301);

const netid = `zzt${stamp % 1000}`;
const cb = await fetch(
  `${BASE}/auth/cas/callback?portal=student&ticket=ST-mock&mock_netid=${netid}`,
  { redirect: 'manual' }
);
const loc = cb.headers.get('location') || '';
check('callback redirects back to the client with a token', /\/auth\/cas\?/.test(loc) && /token=/.test(loc));
const casToken = new URL(loc).searchParams.get('token');
const casMe = await call('/auth/me', { token: casToken });
check('the CAS token authenticates', casMe.status === 200 && casMe.data.user.netid === netid);
check('CAS account is a student account', casMe.data.user.account_type === 'student');
check('CAS account cannot be password-signed-in',
  (await call('/auth/login', { method: 'POST', body: { account_type: 'student', email: `${netid}@yale.edu`, password: 'cas-sso-no-password' } })).status === 401);
const casBad = await fetch(`${BASE}/auth/cas/callback?portal=student&ticket=ST-mock&mock_netid=not-a-netid`, { redirect: 'manual' });
check('callback rejects a malformed NetID', /error=/.test(casBad.headers.get('location') || ''));

/* ---------------------------------------------------------------------------
   11. The demo credentials the UI advertises must actually work.

   The login page hardcodes a password and also fills it into the form for the
   one-click demo buttons. During the D-024 rename that constant was missed
   while the seed, the tests and the README all moved — so the page handed out
   a password the database had stopped accepting, and nothing failed.

   Reading the constant back out of the client source is deliberately crude,
   but it is the only thing that couples the two files: any check that restates
   the password here would drift in exactly the same way.                    */
console.log('\n11. Demo credentials advertised by the UI');
const loginSrc = await readFile(new URL('../../client/src/pages/Login.jsx', import.meta.url), 'utf8');
const advertised = loginSrc.match(/export const DEMO_PASSWORD = '([^']+)'/)?.[1];
check('login page exports a demo password', Boolean(advertised), '(constant not found — did it get renamed?)');

for (const [portal, email] of [['student', 'student@yale.edu'], ['officer', 'officer@yale.edu']]) {
  const r = await call('/auth/login', { method: 'POST', body: { account_type: portal, email, password: advertised } });
  check(`${email} signs in with the advertised password`, r.status === 200, JSON.stringify(r.data));
}

console.log(failures === 0 ? '\n✓ all checks passed\n' : `\n✗ ${failures} check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
