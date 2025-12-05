import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { db, initDb } from './db.js';

dotenv.config();
initDb();

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
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

async function seed() {
  try {
    await run('DELETE FROM events');
    await run('DELETE FROM memberships');
    await run('DELETE FROM club_applications');
    await run('DELETE FROM clubs');
    await run('DELETE FROM users');

    const ownerPw = await bcrypt.hash('ownerpass123', 10);

    const owners = [
      { email: 'yda-owner@yale.edu', name: 'Sarah Chen', club: 'Yale Debate Association' },
      { email: 'code4good-owner@yale.edu', name: 'Michael Rodriguez', club: 'Code4Good' },
      { email: 'ydn-owner@yale.edu', name: 'Sarah Johnson', club: 'Yale Daily News' },
      { email: 'yes-owner@yale.edu', name: 'Priya Desai', club: 'Yale Entrepreneurial Society' },
      { email: 'glee-owner@yale.edu', name: 'Daniel Kim', club: 'Yale Glee Club' },
      { email: 'yucg-owner@yale.edu', name: 'Amelia Wright', club: 'Yale Undergraduate Consulting Group' },
      { email: 'film-owner@yale.edu', name: 'Sofia Martinez', club: 'Yale Film Society' },
      { email: 'robotics-owner@yale.edu', name: 'Leo Zhang', club: 'Yale Robotics Association' },
      { email: 'ypu-owner@yale.edu', name: 'Alex Carter', club: 'Yale Political Union' },
      { email: 'outdoors-owner@yale.edu', name: 'Maya Thompson', club: 'Yale Outdoors' },
      { email: 'ywib-owner@yale.edu', name: 'Grace Lee', club: 'Yale Women in Business' },
      { email: 'ballroom-owner@yale.edu', name: 'Ethan Patel', club: 'Yale Ballroom Dance Team' },
      { email: 'esports-owner@yale.edu', name: 'Nora Williams', club: 'Yale Esports Association' },
      { email: 'drama-owner@yale.edu', name: 'Julian Brooks', club: 'Yale Drama Coalition' }
    ];

    const ownerIds = [];

    for (const o of owners) {
      await run(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?,?)',
        [o.email, ownerPw, o.name, 'owner']
      );
      const row = await get('SELECT id FROM users WHERE email = ?', [o.email]);
      ownerIds.push({ ...o, id: row.id });
    }

    const clubsData = [
      {
        name: 'Yale Debate Association',
        ownerEmail: 'yda-owner@yale.edu',
        meeting_time: 'Tuesdays, 2:00 PM – 4:00 PM',
        location: 'Linsly-Chittenden Hall, Room 101',
        join_type: 'application',
        deadline: '2024-09-15',
        description: "Yale's competitive debate team, attending national and international tournaments."
      },
      {
        name: 'Code4Good',
        ownerEmail: 'code4good-owner@yale.edu',
        meeting_time: 'Wednesdays, 3:00 PM – 5:00 PM',
        location: 'Computer Science Building, Room 203',
        join_type: 'open',
        deadline: null,
        description: 'Student developers building software for social impact organizations.'
      },
      {
        name: 'Yale Daily News',
        ownerEmail: 'ydn-owner@yale.edu',
        meeting_time: 'Fridays, 3:00 PM – 5:00 PM',
        location: '202 York St',
        join_type: 'open',
        deadline: null,
        description: "The nation's oldest college daily newspaper."
      },
      {
        name: 'Yale Entrepreneurial Society',
        ownerEmail: 'yes-owner@yale.edu',
        meeting_time: 'Mondays, 6:00 PM – 7:30 PM',
        location: 'Tsai CITY Atrium',
        join_type: 'open',
        deadline: null,
        description: 'Workshops, founder roundtables, and startup launch support for student entrepreneurs.'
      },
      {
        name: 'Yale Glee Club',
        ownerEmail: 'glee-owner@yale.edu',
        meeting_time: 'Thursdays, 7:00 PM – 9:00 PM',
        location: 'Hendrie Hall, Room 201',
        join_type: 'audition',
        deadline: '2025-01-10',
        description: 'Premier choral ensemble performing classical and contemporary repertoire.'
      },
      {
        name: 'Yale Undergraduate Consulting Group',
        ownerEmail: 'yucg-owner@yale.edu',
        meeting_time: 'Sundays, 4:00 PM – 6:00 PM',
        location: 'Linsly-Chittenden Hall, Room 202',
        join_type: 'application',
        deadline: '2025-02-15',
        description: 'Student consultants partnering with real clients on strategy and operations.'
      },
      {
        name: 'Yale Film Society',
        ownerEmail: 'film-owner@yale.edu',
        meeting_time: 'Fridays, 6:30 PM – 9:00 PM',
        location: 'Whitney Humanities Center Screening Room',
        join_type: 'open',
        deadline: null,
        description: 'Weekly screenings, director talks, and student film showcases.'
      },
      {
        name: 'Yale Robotics Association',
        ownerEmail: 'robotics-owner@yale.edu',
        meeting_time: 'Saturdays, 2:00 PM – 5:00 PM',
        location: 'Center for Engineering Innovation & Design',
        join_type: 'open',
        deadline: null,
        description: 'Hands-on robotics builds, competitions prep, and hardware/software workshops.'
      },
      {
        name: 'Yale Political Union',
        ownerEmail: 'ypu-owner@yale.edu',
        meeting_time: 'Wednesdays, 7:00 PM – 9:00 PM',
        location: 'LC 101',
        join_type: 'open',
        deadline: null,
        description: 'Debate society featuring guest speakers and party caucuses.'
      },
      {
        name: 'Yale Outdoors',
        ownerEmail: 'outdoors-owner@yale.edu',
        meeting_time: 'Mondays, 7:30 PM – 8:30 PM',
        location: 'Dwight Hall Courtyard',
        join_type: 'open',
        deadline: null,
        description: 'Trips, hikes, and outdoor skills training for all experience levels.'
      },
      {
        name: 'Yale Women in Business',
        ownerEmail: 'ywib-owner@yale.edu',
        meeting_time: 'Tuesdays, 6:00 PM – 7:30 PM',
        location: 'LC 210',
        join_type: 'application',
        deadline: '2025-02-10',
        description: 'Professional development, mentorship, and panels for women in business.'
      },
      {
        name: 'Yale Ballroom Dance Team',
        ownerEmail: 'ballroom-owner@yale.edu',
        meeting_time: 'Thursdays, 7:00 PM – 9:00 PM',
        location: 'Payne Whitney Gym, Studio B',
        join_type: 'audition',
        deadline: '2025-01-15',
        description: 'Competitive ballroom team with coaching and travel competitions.'
      },
      {
        name: 'Yale Esports Association',
        ownerEmail: 'esports-owner@yale.edu',
        meeting_time: 'Fridays, 5:00 PM – 7:00 PM',
        location: 'Bass Library, Room L02',
        join_type: 'open',
        deadline: null,
        description: 'Team scrims, leagues, and community nights across major titles.'
      },
      {
        name: 'Yale Drama Coalition',
        ownerEmail: 'drama-owner@yale.edu',
        meeting_time: 'Sundays, 3:00 PM – 5:00 PM',
        location: 'University Theatre Lobby',
        join_type: 'application',
        deadline: '2025-01-25',
        description: 'Student theater producers and actors coordinating seasons and auditions.'
      }
    ];

    for (const c of clubsData) {
      const owner = ownerIds.find(o => o.email === c.ownerEmail);
      await run(
        'INSERT INTO clubs (name, owner_id, meeting_time, location, join_type, deadline, description) VALUES (?,?,?,?,?,?,?)',
        [
          c.name,
          owner.id,
          c.meeting_time,
          c.location,
          c.join_type,
          c.deadline,
          c.description
        ]
      );
    }

    const yda = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Debate Association']);
    const code4Good = await get('SELECT id FROM clubs WHERE name = ?', ['Code4Good']);
    const ydn = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Daily News']);
    const yes = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Entrepreneurial Society']);
    const glee = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Glee Club']);
    const yucg = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Undergraduate Consulting Group']);
    const film = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Film Society']);
    const robotics = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Robotics Association']);
    const ypu = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Political Union']);
    const outdoors = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Outdoors']);
    const ywib = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Women in Business']);
    const ballroom = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Ballroom Dance Team']);
    const esports = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Esports Association']);
    const drama = await get('SELECT id FROM clubs WHERE name = ?', ['Yale Drama Coalition']);

    // Yale Debate Association events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        yda.id,
        'YDA Novice Practice Round',
        '2025-12-08T18:00:00',
        '2025-12-08T20:00:00',
        'Linsly-Chittenden Hall, Room 101',
        'Run practice rounds with feedback for new debaters.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        yda.id,
        'Tournament Prep Session',
        '2025-12-12T16:00:00',
        '2025-12-12T18:00:00',
        'WLH 119',
        'Strategy briefing and case work ahead of winter tournaments.'
      ]
    );

    // Code4Good events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        code4Good.id,
        'Code4Good Kickoff Meeting',
        '2025-12-10T15:00:00',
        '2025-12-10T17:00:00',
        'Computer Science Building, Room 203',
        'Meet project leads, select teams, and review the semester roadmap.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        code4Good.id,
        'Nonprofit Hack Night',
        '2025-12-17T19:00:00',
        '2025-12-17T21:00:00',
        'Computer Science Building, Atrium',
        'Pair up to ship fixes for our partner nonprofits.'
      ]
    );

    // Yale Daily News events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        ydn.id,
        'Newsroom Open House',
        '2025-12-09T19:00:00',
        '2025-12-09T20:30:00',
        '202 York St',
        'Meet section editors and learn how to get involved with reporting and production.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        ydn.id,
        'Investigative Pitch Workshop',
        '2025-12-15T18:00:00',
        '2025-12-15T19:30:00',
        '202 York St, Conference Room',
        'Workshop story ideas and learn how to build an investigative pitch.'
      ]
    );

    // Yale Entrepreneurial Society events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        yes.id,
        'Founder Fireside',
        '2025-01-20T18:00:00',
        '2025-01-20T19:30:00',
        'Tsai CITY Atrium',
        'Hear alumni founders share lessons from their first year post-launch.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        yes.id,
        'Pitch Workshop',
        '2025-01-27T17:00:00',
        '2025-01-27T19:00:00',
        'Tsai CITY Classroom 2',
        'Refine your deck and practice investor Q&A with mentors.'
      ]
    );

    // Yale Glee Club events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        glee.id,
        'Winter Concert',
        '2025-01-18T19:00:00',
        '2025-01-18T21:00:00',
        'Woolsey Hall',
        'Featuring classical and contemporary choral works.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        glee.id,
        'Sectionals & Auditions',
        '2025-01-12T18:00:00',
        '2025-01-12T20:00:00',
        'Hendrie Hall, Room 201',
        'Voice placements and section rehearsals.'
      ]
    );

    // Yale Undergraduate Consulting Group events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        yucg.id,
        'Case Interview Prep',
        '2025-02-05T18:00:00',
        '2025-02-05T19:30:00',
        'LC 202',
        'Live casing drills with feedback from project leads.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        yucg.id,
        'Client Kickoff',
        '2025-02-12T17:00:00',
        '2025-02-12T19:00:00',
        'LC 202',
        'Meet spring clients and define project scopes.'
      ]
    );

    // Yale Film Society events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        film.id,
        'Director Talk: Indie Film',
        '2025-01-22T18:30:00',
        '2025-01-22T20:00:00',
        'Whitney Humanities Center',
        'Q&A with an indie filmmaker about festival circuits and funding.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        film.id,
        'Student Film Showcase',
        '2025-02-02T19:00:00',
        '2025-02-02T21:00:00',
        'Whitney Humanities Center Screening Room',
        'Screen and workshop student shorts.'
      ]
    );

    // Yale Robotics Association events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        robotics.id,
        'Robotics Build Night',
        '2025-01-19T14:00:00',
        '2025-01-19T17:00:00',
        'CEID Lab',
        'Work on competition bots; sensors and drive train focus.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        robotics.id,
        'Intro to ROS Workshop',
        '2025-01-26T15:00:00',
        '2025-01-26T17:30:00',
        'CEID Classroom',
        'Hands-on intro to the Robot Operating System.'
      ]
    );

    // Yale Political Union events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        ypu.id,
        'Debate Night: Free Speech on Campus',
        '2025-01-17T19:00:00',
        '2025-01-17T21:00:00',
        'LC 101',
        'Caucus debates with guest respondent.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        ypu.id,
        'Guest Speaker: Policy & Politics',
        '2025-01-24T18:30:00',
        '2025-01-24T20:00:00',
        'LC 101',
        'Visiting speaker on policy and political strategy.'
      ]
    );

    // Yale Outdoors events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        outdoors.id,
        'East Rock Sunrise Hike',
        '2025-01-21T06:30:00',
        '2025-01-21T09:00:00',
        'Meet at Phelps Gate',
        'Early morning hike with breakfast after.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        outdoors.id,
        'Backpacking 101 Workshop',
        '2025-01-28T18:00:00',
        '2025-01-28T19:30:00',
        'Dwight Hall Courtyard',
        'Gear basics, packing, and safety tips.'
      ]
    );

    // Yale Women in Business events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        ywib.id,
        'Consulting Panel',
        '2025-02-03T18:00:00',
        '2025-02-03T19:30:00',
        'LC 210',
        'Alumni consultants share recruiting tips.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        ywib.id,
        'Resume + Coffee Chats',
        '2025-02-07T16:00:00',
        '2025-02-07T18:00:00',
        'LC 210',
        'Small-group resume reviews with mentors.'
      ]
    );

    // Yale Ballroom Dance Team events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        ballroom.id,
        'Open Practice',
        '2025-01-15T19:00:00',
        '2025-01-15T21:00:00',
        'Payne Whitney Gym, Studio B',
        'All levels welcome, coaches on-site.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        ballroom.id,
        'Competition Prep',
        '2025-01-22T19:00:00',
        '2025-01-22T21:00:00',
        'Payne Whitney Gym, Studio B',
        'Routine run-throughs for upcoming comp.'
      ]
    );

    // Yale Esports Association events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        esports.id,
        'League Scrims',
        '2025-01-18T17:00:00',
        '2025-01-18T19:30:00',
        'Bass Library, Room L02',
        'Team scrims and VOD review.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        esports.id,
        'Community Game Night',
        '2025-01-25T18:00:00',
        '2025-01-25T21:00:00',
        'Bass Library, Room L02',
        'Open play across multiple titles.'
      ]
    );

    // Yale Drama Coalition events
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        drama.id,
        'Producer Roundtable',
        '2025-01-16T17:00:00',
        '2025-01-16T18:30:00',
        'University Theatre Lobby',
        'Season planning and best practices for producers.'
      ]
    );
    await run(
      'INSERT INTO events (club_id, title, start_time, end_time, location, description) VALUES (?,?,?,?,?,?)',
      [
        drama.id,
        'Audition Workshop',
        '2025-01-23T18:00:00',
        '2025-01-23T20:00:00',
        'University Theatre Lobby',
        'Audition tips and cold-read practice.'
      ]
    );

    console.log('Database seeded. Owner login password for all owners: ownerpass123');
    console.log('Example owner emails:');
    owners.forEach(o => console.log(`  ${o.email}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
