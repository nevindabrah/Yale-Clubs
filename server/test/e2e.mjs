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

const off = (await call('/auth/login', { method: 'POST', body: { account_type: 'officer', email: 'officer@yale.edu', password: 'yaleclubs123' } })).data.token;
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
const otherOfficer = (await call('/auth/login', { method: 'POST', body: { account_type: 'officer', email: 'avery.chen@yale.edu', password: 'yaleclubs123' } })).data.token;
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

console.log('\n8. Withdraw');
const outdoorsApp = await call('/student/dashboard', { token: stu });
check('dashboard lists the accepted application', outdoorsApp.data.applications.length >= 1);

console.log(failures === 0 ? '\n✓ all checks passed\n' : `\n✗ ${failures} check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
