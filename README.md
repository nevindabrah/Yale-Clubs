# YaleClubs

A two-portal club catalog for Yale — browse and join every undergraduate organization, or run
yours. Built as a sister app to [CourseTable](https://coursetable.com): same three-pane browsing,
same dense listing rows, same colored stat chips, same light/dark toggle.

**Stack:** React 18 + Vite · Express · MySQL 8 (raw SQL via `mysql2`, no ORM)

---

## The two portals

|  | **Student portal** | **Officer portal** |
|---|---|---|
| Catalog | Search and filter 128 organizations | Browse it too, as an officer |
| Membership | Join open clubs instantly, leave any time | See the full roster with class year, college, major, join date and event turnout |
| Applications | Apply with club-specific questions, track status, withdraw | Read answers, score, leave internal notes, and decide — accepting adds them to the roster automatically |
| Events | RSVP; every club meeting on one calendar | Create events, mark them members-only, see who's coming |
| Messaging | Message a club's officers | Answer from one inbox across all your clubs |
| Listing | — | Edit description, meeting time, recruiting status and application questions |

### Officers hold two separate accounts

Someone who is treasurer of one club and a member of three others has **two accounts on the same
email** — an officer account for the club they run, a student account for the clubs they join.
Uniqueness in the database is on `(email, account_type)`, not on email. The login form asks which
portal you want, the JWT carries the account type, and every endpoint re-checks it server-side.

Try it: `avery.chen@yale.edu` exists in both portals, with independent sessions.

---

## Quick start

```bash
git clone https://github.com/nevindabrah/yaleclubs.git
cd yaleclubs

npm run setup          # installs client + server dependencies
cp server/.env.example server/.env

npm run db:start       # starts a project-local MySQL on port 3307
npm run db:reset       # applies the schema and seeds 128 clubs

npm run dev:server     # terminal 1 — API on :4000
npm run dev:client     # terminal 2 — app on :5173
```

Open **http://localhost:5173**.

### Demo accounts

Password for all three: `yaleclubs123`

| Account | Portal | What you'll see |
|---|---|---|
| `student@yale.edu` | Student | 6 memberships, 5 applications across every status, a full calendar, live message threads |
| `officer@yale.edu` | Officer | Manages the Yale Daily News, Yaledancers and Yale Outdoors — a real application queue and roster |
| `avery.chen@yale.edu` | **Both** | Same email, two separate accounts — sign in to either portal |

### Don't have MySQL?

`npm run db:start` uses the MySQL binaries on your `PATH`. If there are none, either:

```bash
conda create -y -p ./server/.conda-mysql -c conda-forge mysql-server   # what this repo used
docker compose up -d                                                  # if you have Docker
```

Both land on port 3307 to match `.env.example`.

> **macOS note:** the data directory must not be a dot-directory. InnoDB's tablespace scan skips
> hidden directories, so a datadir at `.mysql-data` initializes fine and then fails to restart with
> `Can't create UNDO tablespace … already exists`. See DECISIONS.md D-012.

---

## Tests

```bash
npm test    # 35 end-to-end checks against a running API
```

Covers the dual-account model, catalog filtering, join vs. apply rules, the full
application → decision → membership pipeline, messaging, RSVPs, and the authorization boundaries
(a student token on officer routes, an officer acting on a club they don't manage, and internal
officer notes never reaching the applicant).

---

## Project layout

```
yaleclubs/
├── DECISIONS.md            every design decision, with rationale — read this first
├── client/
│   └── src/
│       ├── styles/         design tokens + component CSS (the CourseTable look)
│       ├── components/     ClubDetail, MessageCenter, TopNav, shared UI
│       └── pages/          student/ and officer/ route trees
├── server/
│   ├── db/
│   │   ├── schema.sql      13 tables, fully commented
│   │   ├── clubs.data.js   the 128-club catalog
│   │   └── seed.js         demo people, applications, events, messages
│   ├── src/routes/         auth · clubs · student · officer · messages
│   └── test/e2e.mjs
├── scripts/                project-local MySQL start/stop
└── docs/SECURITY-NOTES.md  what's hardened, what isn't, and why
```

---

## About the data

Club **names, categories, founding years and descriptions** refer to real Yale undergraduate
organizations — the Whiffenpoofs, the Dramat, YDN, YUAA, Shades of Yale, Dwight Hall, and 120-odd
more across 14 categories.

Everything else is **demo data**: meeting times, room locations, application deadlines, member
counts, ratings, selectivity, and every person, application, message and event. Real clubs change
those every year and they aren't reliably public — inventing them and presenting them as fact would
put wrong information in front of students. Contact addresses use the non-routable domain
`clubs.yale.demo` so nothing in the seed can be mistaken for a real inbox.

This is an independent student project. It is not affiliated with Yale University or with
CourseTable.

---

## Where to look first

- **[DECISIONS.md](DECISIONS.md)** — why the schema, the portals and the auth model are shaped this way
- **[server/db/schema.sql](server/db/schema.sql)** — the whole data model in one commented file
- **[client/src/pages/Catalog.jsx](client/src/pages/Catalog.jsx)** — the three-pane browser
- **[server/src/auth.js](server/src/auth.js)** — how the two portals stay separated
