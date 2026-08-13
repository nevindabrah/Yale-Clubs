/**
 * Seeds the YaleClubs database.
 *
 * Everything here is demo data. Club names/descriptions are real Yale
 * organizations (see clubs.data.js and DECISIONS.md D-005); people, meeting
 * times, applications and messages are invented.
 *
 * Run after `npm run db:migrate`.
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { CLUBS } = require('./clubs.data');

const DEMO_PASSWORD = 'yaleclubs123';

// Deterministic PRNG so re-seeding produces the same database.
let seedState = 20260813;
function rand() {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

// ---------------------------------------------------------------------
// Invented people
// ---------------------------------------------------------------------
const FIRST_NAMES = [
  'Avery', 'Jordan', 'Priya', 'Malik', 'Sofia', 'Chen', 'Nina', 'Omar', 'Lucia',
  'Ethan', 'Amara', 'Rohan', 'Isabel', 'Kwame', 'Yuki', 'Diego', 'Hannah', 'Tomas',
  'Leila', 'Marcus', 'Grace', 'Arjun', 'Zoe', 'Nadia', 'Felix', 'Camille', 'Ibrahim',
  'Mei', 'Oscar', 'Ruth', 'Devon', 'Anaya', 'Theo', 'Simone', 'Rafael', 'Ingrid',
  'Kai', 'Elena', 'Samir', 'Beatriz', 'Noah', 'Yara', 'Julian', 'Tess', 'Hassan',
  '清', 'Adaeze', 'Marek', 'Sanaa', 'Pedro',
];
const LAST_NAMES = [
  'Okonkwo', 'Whitfield', 'Ramirez', 'Chen', 'Adeyemi', 'Kowalski', 'Nakamura',
  'Delgado', 'Fitzgerald', 'Haddad', 'Sorensen', 'Mbeki', 'Rossi', 'Petrov',
  'Ferreira', 'Nguyen', 'Abramson', 'Castillo', 'Osei', 'Lindqvist', 'Bhatt',
  'Moreau', 'Tanaka', 'Quintero', 'Ellsworth', 'Ibrahim', 'Novak', 'Park',
  'Villanueva', 'Achebe', 'Sandoval', 'Weiss', 'Kimura', 'Bello', 'Marchetti',
];
const COLLEGES = [
  'Benjamin Franklin', 'Berkeley', 'Branford', 'Davenport', 'Ezra Stiles',
  'Grace Hopper', 'Jonathan Edwards', 'Morse', 'Pauli Murray', 'Pierson',
  'Saybrook', 'Silliman', 'Timothy Dwight', 'Trumbull',
];
const MAJORS = [
  'Computer Science', 'Economics', 'History', 'Political Science', 'Molecular Biology',
  'English', 'Ethics, Politics & Economics', 'Global Affairs', 'Statistics & Data Science',
  'Mechanical Engineering', 'Psychology', 'American Studies', 'Art', 'Mathematics',
  'African American Studies', 'Environmental Studies', 'Sociology', 'Physics',
  'Cognitive Science', 'Neuroscience', 'Theater & Performance Studies', 'Anthropology',
];
const PRONOUNS = ['she/her', 'he/him', 'they/them', null, null];
const CLASS_YEARS = [2027, 2028, 2029, 2030];

const OFFICER_TITLES = [
  'President', 'Vice President', 'Treasurer', 'Recruitment Chair',
  'Membership Director', 'Events Chair', 'Communications Chair',
];

// ---------------------------------------------------------------------
// Application questions
// ---------------------------------------------------------------------
const GENERIC_QUESTIONS = [
  { prompt: 'Why do you want to join, and what do you hope to get out of it?', max_words: 250 },
  { prompt: 'Tell us about relevant experience — formal or not. What have you done that prepared you for this?', max_words: 250 },
  { prompt: 'Roughly how many hours a week can you commit this semester? Note any conflicts.', max_words: 100, input_type: 'short_text' },
];

const CLUB_QUESTIONS = {
  'yale-daily-news': [
    { prompt: 'Which desk are you most interested in — University, City, Sci-Tech, Arts, Sports, Opinion, Magazine, Photo, Design or Podcast?', max_words: 60, input_type: 'short_text' },
    { prompt: 'Pitch one story you would report this semester. Who would you talk to and why does it matter now?', max_words: 300 },
    { prompt: 'Describe a time you had to ask someone an uncomfortable question.', max_words: 200 },
  ],
  'yale-dramatic-association': [
    { prompt: 'Are you applying primarily as a performer, designer, technician or producer?', max_words: 40, input_type: 'short_text' },
    { prompt: 'Walk us through a production you worked on. What was your role and what went wrong?', max_words: 300 },
    { prompt: 'What show would you most want the Dramat to produce, and why now?', max_words: 200 },
  ],
  'yale-undergraduate-consulting-group': [
    { prompt: 'A New Haven bakery has flat revenue but rising costs. Sketch how you would structure the problem.', max_words: 350 },
    { prompt: 'Describe a time you changed someone’s mind with evidence.', max_words: 250 },
    { prompt: 'Which semester engagement track interests you most and why?', max_words: 150 },
  ],
  whiffenpoofs: [
    { prompt: 'What voice part do you sing, and what is your range?', max_words: 40, input_type: 'short_text' },
    { prompt: 'Describe your musical background, including any arranging experience.', max_words: 250 },
    { prompt: 'The Whiffenpoofs tour internationally for a full year. How would that fit your senior year plans?', max_words: 200 },
  ],
  'walden-peer-counseling': [
    { prompt: 'A friend tells you something serious and asks you not to tell anyone. How do you think about that?', max_words: 300 },
    { prompt: 'What draws you to peer counseling specifically, rather than another kind of support work?', max_words: 250 },
    { prompt: 'Walden training is intensive and runs before you take any calls. Confirm you can commit to the full schedule.', max_words: 80, input_type: 'short_text' },
  ],
};

// ---------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------
const DAY_INDEX = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

function mysqlDateTime(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/** Next occurrence of a weekday, `weeksAhead` weeks out, at "7:00 PM". */
function nextWeekday(dayName, timeLabel, weeksAhead = 0) {
  const now = new Date();
  const target = DAY_INDEX[dayName] ?? 3;
  const d = new Date(now);
  const delta = (target - now.getDay() + 7) % 7 || 7;
  d.setDate(now.getDate() + delta + weeksAhead * 7);

  let hour = 19;
  let minute = 0;
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeLabel || '');
  if (m) {
    hour = Number(m[1]) % 12;
    if (/pm/i.test(m[3])) hour += 12;
    minute = Number(m[2]);
  }
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysFromNow(n, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------
async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'yaleclubs',
  });

  console.log('Seeding YaleClubs…');

  // Every demo account shares one password, so hash it once.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- clubs --------------------------------------------------------
  const clubIdBySlug = new Map();
  for (const c of CLUBS) {
    const [r] = await conn.execute(
      `INSERT INTO clubs
        (slug, name, acronym, category, subcategory, tagline, description, founded_year,
         website, contact_email, instagram, meeting_day, meeting_time, meeting_location,
         application_required, applications_open, application_deadline, accepting_members,
         size_estimate, commitment_hours, selectivity, rating, logo_hue)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        c.slug, c.name, c.acronym, c.category, c.subcategory, c.tagline, c.description,
        c.founded_year, c.website, c.contact_email, c.instagram, c.meeting_day,
        c.meeting_time, c.meeting_location, c.application_required, c.applications_open,
        c.application_deadline, c.accepting_members, c.size_estimate, c.commitment_hours,
        c.selectivity, c.rating, c.logo_hue,
      ]
    );
    clubIdBySlug.set(c.slug, r.insertId);
  }
  console.log(`  ${CLUBS.length} clubs`);

  // ---- application questions ----------------------------------------
  let questionCount = 0;
  for (const c of CLUBS) {
    if (!c.application_required) continue;
    const questions = CLUB_QUESTIONS[c.slug] || GENERIC_QUESTIONS;
    let order = 1;
    for (const question of questions) {
      await conn.execute(
        `INSERT INTO application_questions
           (club_id, prompt, help_text, input_type, max_words, is_required, sort_order)
         VALUES (?,?,?,?,?,1,?)`,
        [
          clubIdBySlug.get(c.slug),
          question.prompt,
          question.max_words ? `${question.max_words} words max.` : null,
          question.input_type || 'long_text',
          question.max_words || null,
          order++,
        ]
      );
      questionCount++;
    }
  }
  console.log(`  ${questionCount} application questions`);

  // ---- users --------------------------------------------------------
  const usedEmails = new Set();
  function makeEmail(first, last) {
    const base = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '');
    let email = `${base}@yale.edu`;
    let n = 2;
    while (usedEmails.has(email)) email = `${base}${n++}@yale.edu`;
    usedEmails.add(email);
    return email;
  }

  async function createUser({ accountType, fullName, email, classYear }) {
    const hue = [...email].reduce((a, ch) => (a + ch.charCodeAt(0)) % 360, 0);
    const [r] = await conn.execute(
      `INSERT INTO users
        (account_type, email, password_hash, full_name, netid, class_year,
         residential_college, major, pronouns, avatar_hue)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        accountType, email, passwordHash, fullName,
        email.slice(0, 3) + int(100, 999),
        classYear ?? pick(CLASS_YEARS),
        pick(COLLEGES), pick(MAJORS), pick(PRONOUNS), hue,
      ]
    );
    return r.insertId;
  }

  // Headline demo accounts.
  const demoStudentId = await createUser({
    accountType: 'student',
    fullName: 'Sam Rivera',
    email: 'student@yale.edu',
    classYear: 2028,
  });
  const demoOfficerId = await createUser({
    accountType: 'officer',
    fullName: 'Dana Whitfield',
    email: 'officer@yale.edu',
    classYear: 2027,
  });

  // The same person, in both portals — the point of DECISIONS.md D-002.
  const dualStudentId = await createUser({
    accountType: 'student',
    fullName: 'Avery Chen',
    email: 'avery.chen@yale.edu',
    classYear: 2027,
  });
  const dualOfficerId = await createUser({
    accountType: 'officer',
    fullName: 'Avery Chen',
    email: 'avery.chen@yale.edu',
    classYear: 2027,
  });
  usedEmails.add('avery.chen@yale.edu');

  // A population of students.
  const studentIds = [demoStudentId, dualStudentId];
  for (let i = 0; i < 160; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    studentIds.push(
      await createUser({
        accountType: 'student',
        fullName: `${first} ${last}`,
        email: makeEmail(first, last),
      })
    );
  }

  // One or two officer accounts per club.
  const officerIds = [demoOfficerId, dualOfficerId];
  let officerAssignments = 0;
  for (const c of CLUBS) {
    const clubId = clubIdBySlug.get(c.slug);
    const count = rand() < 0.55 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const id = await createUser({
        accountType: 'officer',
        fullName: `${first} ${last}`,
        email: makeEmail(first, last),
      });
      officerIds.push(id);
      await conn.execute(
        'INSERT INTO club_officers (club_id, user_id, title, is_primary) VALUES (?,?,?,?)',
        [clubId, id, i === 0 ? 'President' : pick(OFFICER_TITLES.slice(1)), i === 0 ? 1 : 0]
      );
      officerAssignments++;
    }
  }

  // Give the headline officer accounts a portfolio worth exploring.
  const DEMO_OFFICER_CLUBS = [
    ['yale-daily-news', 'Managing Editor'],
    ['yaledancers', 'President'],
    ['yale-outdoors', 'Trips Director'],
  ];
  for (const [slug, title] of DEMO_OFFICER_CLUBS) {
    await conn.execute(
      'INSERT INTO club_officers (club_id, user_id, title, is_primary) VALUES (?,?,?,1)',
      [clubIdBySlug.get(slug), demoOfficerId, title]
    );
    officerAssignments++;
  }
  for (const [slug, title] of [
    ['yale-undergraduate-consulting-group', 'Recruitment Chair'],
    ['yale-computer-society', 'President'],
  ]) {
    await conn.execute(
      'INSERT INTO club_officers (club_id, user_id, title, is_primary) VALUES (?,?,?,1)',
      [clubIdBySlug.get(slug), dualOfficerId, title]
    );
    officerAssignments++;
  }
  console.log(`  ${studentIds.length} students, ${officerIds.length} officer accounts, ${officerAssignments} officer roles`);

  // ---- memberships ---------------------------------------------------
  const MEMBER_ROLES = ['Member', 'Member', 'Member', 'Member', 'Section Lead', 'Board Member'];
  let membershipCount = 0;
  for (const c of CLUBS) {
    const clubId = clubIdBySlug.get(c.slug);
    const target = Math.max(4, Math.min(Math.round(c.size_estimate * 0.6), 60));
    const chosen = new Set();
    while (chosen.size < target) chosen.add(pick(studentIds));
    for (const uid of chosen) {
      const [r] = await conn.execute(
        `INSERT IGNORE INTO memberships (club_id, user_id, role, status, source, joined_at)
         VALUES (?,?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [
          clubId, uid, pick(MEMBER_ROLES),
          rand() < 0.92 ? 'active' : 'inactive',
          c.application_required ? 'application' : 'open_join',
          int(10, 700),
        ]
      );
      if (r.affectedRows) membershipCount++;
    }
  }

  // Put the demo student in a legible handful of clubs.
  const DEMO_STUDENT_CLUBS = [
    'yale-outdoors', 'davenport-pops-orchestra', 'yale-computer-society',
    'yhhap', 'yale-daily-news', 'danceworks',
  ];
  for (const slug of DEMO_STUDENT_CLUBS) {
    await conn.execute(
      `INSERT INTO memberships (club_id, user_id, role, status, source)
       VALUES (?,?, 'Member', 'active', 'open_join')
       ON DUPLICATE KEY UPDATE status = 'active'`,
      [clubIdBySlug.get(slug), demoStudentId]
    );
  }
  for (const slug of ['yale-symphony-orchestra', 'south-asian-society', 'yale-chess-club']) {
    await conn.execute(
      `INSERT INTO memberships (club_id, user_id, role, status, source)
       VALUES (?,?, 'Member', 'active', 'open_join')
       ON DUPLICATE KEY UPDATE status = 'active'`,
      [clubIdBySlug.get(slug), dualStudentId]
    );
  }
  console.log(`  ${membershipCount} memberships`);

  // ---- bookmarks -----------------------------------------------------
  for (const slug of ['whiffenpoofs', 'yale-dramatic-association', 'yale-undergraduate-consulting-group', 'yale-debate-association', 'purple-crayon']) {
    await conn.execute('INSERT IGNORE INTO bookmarks (club_id, user_id) VALUES (?,?)', [
      clubIdBySlug.get(slug), demoStudentId,
    ]);
  }

  // ---- applications --------------------------------------------------
  const SAMPLE_ANSWERS = [
    'I have wanted to do this since my first week on campus. I went to the fall showcase, stayed for the whole thing, and left thinking about it for days. What I want out of it is the practice of making something on a deadline with people who care whether it is good.',
    'Most of my experience is informal. I ran a small newsletter in high school that went out to about four hundred people, which taught me more about deadlines than about writing. I have also spent two summers doing work that was mostly about showing up consistently when nobody was watching.',
    'I can commit roughly six to eight hours a week. My only hard conflict is a Tuesday evening lab that runs until 6:30, and I have a problem set due Thursday mornings, so Wednesday nights are tight.',
    'I would report on how the new dining hall schedule has changed where people actually eat. I would start with dining hall managers, then talk to students in the colleges that lost late-night service, and pull the swipe data if the University will share it.',
    'Last year I argued for a change to how our group ran auditions. I did not win that conversation by being louder — I went and collected numbers on how many people dropped out after round one, and the numbers made the case for me.',
  ];

  const APPLICATION_CLUBS = CLUBS.filter((c) => c.application_required);
  let applicationCount = 0;
  for (const c of APPLICATION_CLUBS) {
    const clubId = clubIdBySlug.get(c.slug);
    const [questions] = await conn.execute(
      'SELECT id FROM application_questions WHERE club_id = ? ORDER BY sort_order',
      [clubId]
    );
    const applicants = new Set();
    const n = int(4, 14);
    while (applicants.size < n) applicants.add(pick(studentIds));

    for (const uid of applicants) {
      const roll = rand();
      const status =
        roll < 0.34 ? 'submitted' :
        roll < 0.55 ? 'under_review' :
        roll < 0.7 ? 'interview' :
        roll < 0.85 ? 'accepted' : 'rejected';
      const isFinal = status === 'accepted' || status === 'rejected';

      const [r] = await conn.execute(
        `INSERT IGNORE INTO applications
           (club_id, user_id, status, submitted_at, decided_at, decided_by, decision_note, rating)
         VALUES (?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, ?, ?, ?)`,
        [
          clubId, uid, status, int(1, 21),
          isFinal ? new Date(Date.now() - int(1, 5) * 86400000) : null,
          isFinal ? demoOfficerId : null,
          status === 'accepted'
            ? 'Welcome aboard — we loved your application. Details on the first meeting are in your calendar.'
            : status === 'rejected'
              ? 'Thank you for applying. We had far more strong applications than spots this cycle and hope you will apply again next term.'
              : null,
          isFinal ? int(3, 5) : null,
        ]
      );
      if (!r.affectedRows) continue;
      applicationCount++;

      for (const question of questions) {
        await conn.execute(
          'INSERT INTO application_answers (application_id, question_id, answer) VALUES (?,?,?)',
          [r.insertId, question.id, pick(SAMPLE_ANSWERS)]
        );
      }
      if (status === 'accepted') {
        await conn.execute(
          `INSERT INTO memberships (club_id, user_id, source) VALUES (?,?, 'application')
           ON DUPLICATE KEY UPDATE status = 'active'`,
          [clubId, uid]
        );
      }
    }
  }

  // Give the demo student a readable spread of application states.
  const DEMO_APPLICATIONS = [
    ['whiffenpoofs', 'submitted'],
    ['yale-dramatic-association', 'interview'],
    ['purple-crayon', 'rejected'],
    ['yale-mock-trial', 'under_review'],
    ['walden-peer-counseling', 'accepted'],
  ];
  for (const [slug, status] of DEMO_APPLICATIONS) {
    const clubId = clubIdBySlug.get(slug);
    const isFinal = status === 'accepted' || status === 'rejected';
    const [r] = await conn.execute(
      `INSERT INTO applications (club_id, user_id, status, submitted_at, decided_at, decided_by, decision_note)
       VALUES (?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [
        clubId, demoStudentId, status, int(3, 16),
        isFinal ? new Date(Date.now() - 2 * 86400000) : null,
        isFinal ? demoOfficerId : null,
        status === 'accepted'
          ? 'We would love to have you. Training starts the second week of the semester — watch your messages.'
          : status === 'rejected'
            ? 'Thanks for auditioning. This was a tight year and we are only taking two. Please come back in the spring.'
            : null,
      ]
    );
    const appId = r.insertId;
    if (appId) {
      const [questions] = await conn.execute(
        'SELECT id FROM application_questions WHERE club_id = ? ORDER BY sort_order',
        [clubId]
      );
      for (const question of questions) {
        await conn.execute(
          'INSERT IGNORE INTO application_answers (application_id, question_id, answer) VALUES (?,?,?)',
          [appId, question.id, pick(SAMPLE_ANSWERS)]
        );
      }
    }
  }
  console.log(`  ${applicationCount + DEMO_APPLICATIONS.length} applications`);

  // ---- events --------------------------------------------------------
  const SPECIAL_EVENTS = {
    'Music & A Cappella': [
      ['Rush Concert', 'performance', 'A joint showcase — hear every group in one night before auditions open.'],
      ['Open Auditions', 'audition', 'Sign up for a slot. Prepare one verse and chorus of anything you like; we will teach you a blend exercise on the spot.'],
    ],
    'Performing Arts': [
      ['Open Rehearsal', 'rehearsal', 'Drop in and watch how we work. No experience needed, no commitment.'],
      ['Mainstage Performance', 'performance', 'Our full production. Tickets are free for undergraduates at the door.'],
    ],
    'Publications & Media': [
      ['Pitch Meeting', 'meeting', 'Bring one idea, however rough. We assign stories at the end.'],
      ['New Writer Info Session', 'info_session', 'What the comp involves, what the time commitment really looks like, and how to pitch.'],
    ],
    'Community Service': [
      ['Volunteer Orientation', 'workshop', 'Training and placement for new volunteers. Bring your schedule.'],
      ['Service Day', 'service', 'Meet at the entrance; transportation and lunch are provided.'],
    ],
    'Club Sports & Outdoors': [
      ['Open Practice', 'meeting', 'Beginners welcome — gear is provided and someone will walk you through it.'],
      ['Weekend Trip', 'social', 'Departure from campus Saturday morning, back Sunday evening. Signup required.'],
    ],
    'STEM & Engineering': [
      ['Project Team Kickoff', 'workshop', 'Meet the subteams, pick one, start building the same night.'],
      ['Build Session', 'workshop', 'Open lab hours. Tools and materials provided.'],
    ],
    'Cultural & Identity': [
      ['First-Year Welcome Dinner', 'social', 'Food, introductions and a chance to meet the board.'],
      ['Culture Show', 'performance', 'Our biggest event of the year — performance, food and community.'],
    ],
  };

  let eventCount = 0;
  for (const c of CLUBS) {
    const clubId = clubIdBySlug.get(c.slug);

    // Recurring general meetings for the next six weeks.
    if (c.meeting_day) {
      for (let w = 0; w < 6; w++) {
        const when = nextWeekday(c.meeting_day, c.meeting_time, w);
        const end = new Date(when.getTime() + 90 * 60000);
        await conn.execute(
          `INSERT INTO events (club_id, title, description, event_type, starts_at, ends_at, location, visibility)
           VALUES (?,?,?,?,?,?,?,?)`,
          [
            clubId,
            w === 0 ? 'Weekly Meeting (first of the term)' : 'Weekly Meeting',
            `Regular ${c.name} meeting. ${c.meeting_location ? `We meet at ${c.meeting_location}.` : ''}`.trim(),
            'meeting',
            mysqlDateTime(when),
            mysqlDateTime(end),
            c.meeting_location,
            w === 0 ? 'public' : 'members_only',
          ]
        );
        eventCount++;
      }
    }

    // A couple of category-flavored public events.
    for (const [title, type, blurb] of SPECIAL_EVENTS[c.category] || []) {
      const when = daysFromNow(int(3, 40), int(15, 20));
      await conn.execute(
        `INSERT INTO events (club_id, title, description, event_type, starts_at, ends_at, location, visibility)
         VALUES (?,?,?,?,?,?,?, 'public')`,
        [
          clubId, `${c.acronym || c.name} ${title}`, blurb, type,
          mysqlDateTime(when),
          mysqlDateTime(new Date(when.getTime() + 120 * 60000)),
          c.meeting_location,
        ]
      );
      eventCount++;
    }

    // A deadline marker for clubs currently recruiting.
    if (c.application_required && c.applications_open && c.application_deadline) {
      await conn.execute(
        `INSERT INTO events (club_id, title, description, event_type, starts_at, location, visibility)
         VALUES (?,?,?, 'deadline', ?, ?, 'public')`,
        [
          clubId,
          `Application deadline — ${c.name}`,
          'Applications close at 11:59 PM. Late submissions are not read.',
          `${c.application_deadline} 23:59:00`,
          'Online',
        ]
      );
      eventCount++;
    }
  }
  console.log(`  ${eventCount} events`);

  // ---- announcements --------------------------------------------------
  const ANNOUNCEMENTS = [
    ['Welcome back — first meeting details', 'Our first meeting of the semester is on our usual day and time. If you are new, just show up; there is nothing to prepare. We will go over what the semester looks like and what roles are open.'],
    ['Room change for the next two weeks', 'Our usual room is being renovated, so we are meeting one floor up for the next two weeks. Same day, same time. Signs will be posted.'],
    ['Sign up for the retreat', 'The retreat is the weekend after next. Cost is covered for anyone on financial aid — no forms, just tell an officer. Transportation leaves from Phelps Gate at 9 AM Saturday.'],
    ['Officer elections are open', 'Nominations for next year’s board close at the end of the month. Any active member can run or nominate someone. Ask a current officer what the role actually involves before you decide.'],
  ];
  let announcementCount = 0;
  for (const c of CLUBS) {
    const clubId = clubIdBySlug.get(c.slug);
    const [officers] = await conn.execute(
      'SELECT user_id FROM club_officers WHERE club_id = ? LIMIT 1',
      [clubId]
    );
    const posterId = officers[0]?.user_id ?? demoOfficerId;
    const howMany = int(1, 3);
    for (let i = 0; i < howMany; i++) {
      const [title, body] = ANNOUNCEMENTS[(i + clubId) % ANNOUNCEMENTS.length];
      await conn.execute(
        `INSERT INTO announcements (club_id, title, body, pinned, posted_by, posted_at)
         VALUES (?,?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [clubId, title, body, i === 0 ? 1 : 0, posterId, int(1, 30)]
      );
      announcementCount++;
    }
  }
  console.log(`  ${announcementCount} announcements`);

  // ---- message threads -------------------------------------------------
  const STUDENT_OPENERS = [
    ['Auditions this fall', 'Hi! I saw you have auditions coming up. I have sung in choir but never done a cappella — is that a problem, and what should I prepare?'],
    ['Time commitment question', 'Hi, I am really interested in joining but I am taking a heavy course load this term. Realistically how many hours a week is this, and is there a lighter way to be involved?'],
    ['Can I still join?', 'Hi — I missed the bazaar and your info session. Is it too late to get involved this semester?'],
    ['Financial aid and dues', 'Hi, I saw there are dues listed. Is there a waiver or subsidy for students on financial aid? I would rather ask now than sign up and find out later.'],
    ['Beginner-friendly?', 'Hello! I have zero experience with this but it looks amazing. Do you take total beginners, and what does the first meeting look like?'],
  ];
  const OFFICER_REPLIES = [
    'Great question, and not at all a problem — plenty of our members started exactly where you are. Come to the first meeting and we will pair you with someone who has done it before.',
    'Honestly it is about four to six hours in a normal week, more the week of a performance. If that is too much right now, we have a lower-commitment track — just tell us and we will put you there.',
    'Not too late at all. We add people through the third week. Come by our next meeting and introduce yourself to whoever is at the door.',
    'Yes — dues are fully waived on request, no documentation and no questions. Just email an officer and it is handled.',
  ];

  let threadCount = 0;
  const messagingClubs = ['yale-daily-news', 'yaledancers', 'yale-outdoors', 'yale-undergraduate-consulting-group', 'yale-computer-society'];
  for (const slug of messagingClubs) {
    const clubId = clubIdBySlug.get(slug);
    const [officers] = await conn.execute(
      'SELECT user_id FROM club_officers WHERE club_id = ? ORDER BY is_primary DESC LIMIT 1',
      [clubId]
    );
    const officerId = officers[0]?.user_id ?? demoOfficerId;

    const senders = new Set([demoStudentId]);
    while (senders.size < 6) senders.add(pick(studentIds));

    for (const uid of senders) {
      const [subject, body] = pick(STUDENT_OPENERS);
      const [t] = await conn.execute(
        `INSERT IGNORE INTO message_threads (club_id, student_user_id, subject, last_message_at)
         VALUES (?,?,?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
        [clubId, uid, subject, int(1, 100)]
      );
      if (!t.affectedRows) continue;
      threadCount++;

      await conn.execute(
        `INSERT INTO messages (thread_id, sender_user_id, sender_side, body, sent_at)
         VALUES (?,?, 'student', ?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
        [t.insertId, uid, body, int(50, 120)]
      );
      // Most, but not all, threads have a reply — so the officer inbox has work in it.
      if (rand() < 0.7) {
        await conn.execute(
          `INSERT INTO messages (thread_id, sender_user_id, sender_side, body, sent_at, read_at)
           VALUES (?,?, 'officer', ?, DATE_SUB(NOW(), INTERVAL ? HOUR), NULL)`,
          [t.insertId, officerId, pick(OFFICER_REPLIES), int(1, 40)]
        );
      }
    }
  }
  console.log(`  ${threadCount} message threads`);

  await conn.end();

  console.log('\n✓ Seed complete.\n');
  console.log('  Demo accounts (password for all: ' + DEMO_PASSWORD + ')');
  console.log('   • Student portal : student@yale.edu');
  console.log('   • Officer portal : officer@yale.edu   (manages YDN, Yaledancers, Yale Outdoors)');
  console.log('   • Both portals   : avery.chen@yale.edu — same email, two separate accounts (D-002)');
}

main().catch((err) => {
  console.error('✗ seed failed:', err);
  process.exit(1);
});
