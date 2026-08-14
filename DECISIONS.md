# DECISIONS.md — ClubTable

A running log of every decision and action taken while building ClubTable.
Newest entries at the bottom. Each entry: **what**, **why**, and **files touched**.

Format:

```
### [D-###] Short title
- **Date:** YYYY-MM-DD
- **Type:** architecture | data | ui | infra | security | process
- **Decision:** what was decided
- **Rationale:** why
- **Alternatives considered:** what was rejected and why
- **Files:** paths touched
```

---

### [D-001] Project scope and portal model
- **Date:** 2026-08-13
- **Type:** architecture
- **Decision:** Build a two-portal web app — a **Student portal** (browse/search clubs, bookmark, join, apply, RSVP to events, message officers) and an **Officer portal** (review applications and render decisions, view roster + member details, post events and announcements, reply to student messages). Both are served by one React SPA and one Express/MySQL API.
- **Rationale:** The user asked for two portals with distinct capabilities. A single SPA with role-scoped routes keeps the codebase and design system unified while the experiences stay separate.
- **Alternatives considered:** Two separate React apps (rejected — duplicated design system, build config, and auth code for no user-facing benefit).
- **Files:** repository root

### [D-002] Separate accounts for the same human
- **Date:** 2026-08-13
- **Type:** architecture / security
- **Decision:** `users` has an `account_type ENUM('student','officer')`, and uniqueness is enforced on the **composite** key `(email, account_type)` rather than on `email` alone. One person may register `jane.doe@yale.edu` twice — once as a student account, once as an officer account — with independent passwords and independent sessions. The login form requires choosing a portal, and the issued JWT carries `account_type`; officer-only endpoints reject student tokens and vice versa.
- **Rationale:** The user explicitly required that a club officer have a separate account for managing their club versus joining other clubs as a normal student. Separating at the account level (not just a role flag) means an officer browsing other clubs cannot accidentally act with officer privilege, and the two contexts have separate audit trails.
- **Alternatives considered:**
  - A single account with a role-switcher toggle (rejected — the user asked for *separate accounts*; also blurs the audit trail).
  - Two physical tables `students` / `officers` (rejected — duplicates auth logic, password reset, and every foreign key).
- **Files:** `server/db/schema.sql`, `server/src/routes/auth.js`, `server/src/auth.js`

### [D-003] Stack: React (Vite) + Express + MySQL
- **Date:** 2026-08-13
- **Type:** architecture
- **Decision:** Frontend is React 18 via Vite. Backend is Node/Express with `mysql2/promise` talking directly to MySQL 8. No ORM.
- **Rationale:** The user specified React and MySQL. Vite gives fast HMR and a trivial dev proxy. Raw SQL via `mysql2` keeps the schema explicit and readable in `schema.sql`, which matters for a teaching/portfolio project — you can see exactly what every query does.
- **Alternatives considered:** Prisma or Sequelize (rejected — hides the SQL, adds a codegen step, and the user asked for "MySQL for backend database handling," which reads as wanting real SQL); Next.js (rejected — adds SSR complexity this app does not need).
- **Files:** `client/`, `server/`

### [D-004] Aesthetic modeled on CourseTable
- **Date:** 2026-08-13
- **Type:** ui
- **Decision:** Build a design system that reads as a sibling of CourseTable: a dark navy top navigation bar, a light neutral page background, a **three-pane catalog** (filter sidebar → results list → detail pane), dense compact result rows, pill-shaped category tags, colored numeric rating/stat badges on a green→yellow→red scale, and a light/dark theme toggle. Typography uses a system sans stack at CourseTable-like sizes (13–14px in dense areas).
- **Rationale:** The user asked for aesthetics "very similar to CourseTable as they are sister apps." The three-pane browse layout and the colored stat chips are CourseTable's most recognizable signatures.
- **Alternatives considered:** Copying CourseTable's actual CSS/assets (rejected — that is someone else's code and branding; this is an independent implementation in the same visual language). No CSS framework was used so the tokens stay legible and self-contained.
- **Files:** `client/src/styles/theme.css`, `client/src/styles/app.css`

### [D-005] Real Yale organizations as seed data, synthetic contact details
- **Date:** 2026-08-13
- **Type:** data
- **Decision:** Seed the catalog with **real, publicly known Yale undergraduate organizations** (names, categories, founding years where well documented, and paraphrased descriptions of what the group does). **Meeting times, room locations, contact email addresses, application deadlines, and member counts are synthetic demo values** and are marked as such. Contact emails use the non-routable demo domain `@clubs.yale.demo` so nothing in the seed can be mistaken for a real inbox.
- **Rationale:** The user asked for the app to be "based off of real Yale clubs" with "the necessary details." Real names and real descriptions make the catalog authentic. But officer contact emails, meeting rooms, and deadlines rotate every year and are not reliably public — inventing them and presenting them as fact would put wrong information in front of students. Synthetic-but-clearly-labeled values keep the demo fully functional without asserting false specifics.
- **Alternatives considered:** Scraping Yale Connect / the Yale student org directory (rejected — no authorization to scrape, and the data would go stale immediately); fabricating plausible real-looking emails (rejected — actively misleading).
- **Files:** `server/db/clubs.data.js`, `server/db/seed.js`

### [D-006] Local MySQL instance is project-scoped
- **Date:** 2026-08-13
- **Type:** infra
- **Decision:** MySQL 8.4 binaries were found on this machine (shipped with Anaconda) but no server was initialized. Rather than touch a system-wide MySQL, the project initializes its **own data directory** at `server/.mysql-data`, listening on **port 3307** with a project-local socket. `npm run db:start` / `npm run db:stop` manage it.
- **Rationale:** A project-scoped instance cannot collide with any existing MySQL the user installs later, needs no `sudo`, and can be deleted by removing one folder. Port 3307 avoids the default 3306.
- **Alternatives considered:** Docker Compose (rejected — Docker is not installed here); Homebrew `mysql` service (rejected — Homebrew has no MySQL formula installed and a global service is heavier than this project needs). A `docker-compose.yml` is still provided as an alternative path for other machines.
- **Files:** `scripts/db-start.sh`, `scripts/db-stop.sh`, `docker-compose.yml`

### [D-007] Password hashing and session handling
- **Date:** 2026-08-13
- **Type:** security
- **Decision:** Passwords are hashed with `bcryptjs` at cost factor 10. Sessions are stateless JWTs (7-day expiry) signed with `JWT_SECRET` from `.env`, sent by the client in an `Authorization: Bearer` header and held in `localStorage`.
- **Rationale:** Standard, dependency-light, and adequate for a project of this scope. `bcryptjs` is pure JS so there is no native build step.
- **Alternatives considered:** httpOnly cookie sessions (more secure against XSS, but requires CSRF handling and complicates the Vite dev proxy — noted in `docs/SECURITY-NOTES.md` as the production upgrade path). Yale CAS SSO (rejected — requires an institutional service registration the project cannot obtain; email/password registration restricted to `@yale.edu` addresses stands in for it).
- **Files:** `server/src/routes/auth.js`, `server/src/auth.js`, `docs/SECURITY-NOTES.md`

### [D-008] Applications are club-configurable question sets
- **Date:** 2026-08-13
- **Type:** data / architecture
- **Decision:** Each club owns a list of `application_questions`. A student's application stores one `application_answers` row per question. Application status is a state machine: `submitted → under_review → interview → accepted | rejected`, plus `withdrawn` (student-initiated).
- **Rationale:** Yale clubs' applications differ wildly — the Dramat wants a portfolio, YUCG wants a case-style prompt, an a cappella group wants an audition slot. Free-form per-club questions model reality; a fixed application form would not. The `interview` state exists because most competitive Yale groups have a second round.
- **Alternatives considered:** A single free-text "why do you want to join" field (rejected — too thin for the officer decision workflow the user asked for).
- **Files:** `server/db/schema.sql`, `server/src/routes/officer.js`, `server/src/routes/student.js`

### [D-009] Messaging is thread-per-(student, club)
- **Date:** 2026-08-13
- **Type:** architecture
- **Decision:** A `message_threads` row is unique per `(club_id, student_user_id)`. Any officer of that club can read and reply; replies are attributed to the individual officer who sent them. Unread counts are computed from `read_at` on each message.
- **Rationale:** Students message *the club*, not one specific person, and officer rosters turn over. Threading by club means a conversation survives an officer graduating. Attribution on each message preserves who actually answered.
- **Alternatives considered:** Direct user-to-user DMs (rejected — breaks when the officer graduates, and exposes officers' personal inboxes).
- **Files:** `server/db/schema.sql`, `server/src/routes/messages.js`

### [D-010] Join model: open clubs vs. application-required clubs
- **Date:** 2026-08-13
- **Type:** data
- **Decision:** Every club carries an `application_required` boolean. Open clubs (most cultural, service, and club-sport organizations) accept an instant "Join" that writes a `memberships` row directly. Application-required clubs (a cappella, the Dramat, YUCG, publications, YDN) hide the Join button and surface an "Apply" flow instead.
- **Rationale:** This mirrors how Yale actually works — some groups you simply show up to, others "rush" or audition. It also gives the officer portal a meaningful decision queue.
- **Files:** `server/db/clubs.data.js`, `client/src/pages/ClubDetail.jsx`

### [D-011] Repository layout and version control hygiene
- **Date:** 2026-08-13
- **Type:** process
- **Decision:** Single repository, three top-level app folders (`client/`, `server/`, `scripts/`) plus `docs/`. `.gitignore` excludes `node_modules`, `.env`, `server/.mysql-data`, and build output. `.env.example` is committed so a fresh clone knows what to set. This DECISIONS.md is updated in the same commit as the change it describes.
- **Rationale:** The user asked for a decision log specifically to make version control easier — the log is only useful if a decision entry and its code land together, so a reviewer reading `git log` can jump to the reasoning.
- **Files:** `.gitignore`, `server/.env.example`, `DECISIONS.md`

### [D-012] MySQL data directory must not be hidden
- **Date:** 2026-08-13
- **Type:** infra
- **Decision:** The project-local MySQL data directory is `server/mysql-data`, **not** `.mysql-data`.
- **Rationale:** Discovered the hard way. With a dot-prefixed datadir, `mysqld --initialize-insecure` succeeds, but every subsequent start dies with `[InnoDB] Can't create UNDO tablespace innodb_undo_001 since './undo_001' already exists` → `Failed to initialize DD Storage Engine`. InnoDB's tablespace discovery scan skips hidden directories, so it never finds the undo tablespaces it just created, concludes it must bootstrap them, and then fails because the files are right there. Two independent MySQL builds (Anaconda 8.4.0 and conda-forge 9.7.2) failed identically, which is what ruled out a bad build and pointed at the path. Renaming the directory fixed it immediately.
- **Alternatives considered:** Passing `--innodb-undo-directory` explicitly (tried — does not help; the scan, not the path resolution, is the problem). Deleting the stale `undo_*_trunc.log` (tried — not the cause).
- **Files:** `scripts/db-start.sh`, `scripts/db-stop.sh`, `.gitignore`, `README.md`

### [D-013] End-to-end tests over unit tests
- **Date:** 2026-08-13
- **Type:** process
- **Decision:** The test suite is a single script (`server/test/e2e.mjs`) that drives the running HTTP API through complete user journeys — register both account types on one email, search, join, apply, decide, message, RSVP — plus explicit negative checks on every authorization boundary. No unit tests, no mocking framework, no test runner dependency.
- **Rationale:** The interesting risks in this app are all at the seams: does accepting an application actually create a membership row, does an officer token get rejected on student routes, does `internal_note` ever escape to a student. Unit tests with a mocked database would pass while any of those broke. Running against real MySQL with real HTTP catches what matters, and 35 checks run in under two seconds.
- **Trade-off:** Requires a seeded database to be running. Accepted — the same command that starts the app starts the database.
- **Files:** `server/test/e2e.mjs`, `package.json`

### [D-014] Catalog filter state lives in the URL
- **Date:** 2026-08-13
- **Type:** ui
- **Decision:** Every catalog filter — search text, categories, join type, max hours, min rating, sort, and the currently open club — is mirrored into the query string, replacing history rather than pushing.
- **Rationale:** CourseTable users share links to filtered views constantly ("here are all the 2-hour open clubs"). Keeping state in the URL makes that free, survives a refresh, and lets the landing page's category tiles link directly into a pre-filtered catalog. `replace` rather than `push` keeps the back button from walking through every keystroke.
- **Files:** `client/src/pages/Catalog.jsx`, `client/src/pages/Landing.jsx`

### [D-015] Interface scale: readable over dense
- **Date:** 2026-08-13
- **Type:** ui
- **Decision:** Raised the whole interface roughly one step in scale — 16px base type (was 14px), taller list rows, larger cards and controls, a 66px nav bar, and wider catalog panes.
- **Rationale:** The first build copied CourseTable's spreadsheet density literally. CourseTable earns that density because a course search is a scanning task over hundreds of near-identical rows; picking a club is a *reading* task — you read a description, weigh a time commitment, look at who runs it. Compressing that made the app feel cramped rather than efficient. The three-pane structure and colored stat chips — the parts that actually make it read as CourseTable's sibling — are unchanged.
- **Files:** `client/src/styles/theme.css`, `client/src/styles/app.css`

### [D-016] Numbers format by what they are, not by type
- **Date:** 2026-08-13
- **Type:** ui
- **Decision:** The `Chip` component takes an explicit `decimals` prop; when it is omitted, whole numbers render with no decimal places and fractional ones with one.
- **Rationale:** The original always called `toFixed(1)`, so a club with 59 members displayed **59.0**. Member counts are integers and must never show a decimal; ratings and hours-per-week are genuinely fractional and must keep one. Deciding per call site is right because the formatting depends on what the number *means*, not on its JavaScript type.
- **Files:** `client/src/components/ui.jsx`, `client/src/pages/Catalog.jsx`, `client/src/components/ClubDetail.jsx`

### [D-017] Yale CAS single sign-on, with a development stand-in
- **Date:** 2026-08-13
- **Type:** security / architecture
- **Decision:** Implemented the CAS 2.0 protocol properly: redirect to `<CAS_BASE>/login?service=…`, then validate the returned ticket **server-side** at `/serviceValidate` before trusting anything. On success we find-or-create the account for that NetID in the requested portal and mint the same JWT the password flow issues. `CAS_MODE=yale` uses `https://secure.its.yale.edu/cas`; `CAS_MODE=mock` (the default) swaps in a local stand-in login page that drives the identical callback code path. CAS accounts are stored with a non-bcrypt sentinel in `password_hash`, so they can never be signed into with a password.
- **Rationale:** CAS is the right answer for a Yale app — it removes password storage entirely and guarantees the person actually holds the NetID. But **Yale ITS must register this app's service URL before real CAS will accept it**, and that registration cannot be obtained from inside this project. Shipping only the real path would mean shipping a button that always fails; shipping only a fake would mean the real integration never gets written. Doing both means the protocol code is real and exercised today, and going live is a two-line environment change.
- **Alternatives considered:** A third-party CAS library (rejected — the protocol is one redirect and one validated GET; a dependency for that is not worth it). Parsing the CAS XML with an XML library (rejected — the success payload is a fixed, tiny shape; two targeted matches are clearer and dependency-free, and anything not matching is treated as failure).
- **Files:** `server/src/routes/cas.js`, `client/src/pages/CasCallback.jsx`, `client/src/pages/Login.jsx`, `server/.env.example`

### [D-018] ClubWiz: Claude with tools, and a working offline mode
- **Date:** 2026-08-13
- **Type:** architecture
- **Decision:** ClubWiz is a server-side assistant with **one tool layer and two front ends**. Seven tools (`search_clubs`, `get_club`, `list_categories`, `my_memberships`, `my_schedule`, `open_deadlines`, `my_officer_summary`) run parameterized SQL against the same database the rest of the app uses. When `ANTHROPIC_API_KEY` is set, Claude (`claude-opus-5`, adaptive thinking, `effort: low`) drives those tools in a bounded loop and writes the answer. When it is not, a deterministic keyword router calls the *same* tools and formats the result.
- **Rationale:** Three things drove this. (1) **The assistant must not invent clubs.** Giving it tools instead of relying on model knowledge means every club it names is one that exists in the catalog; the system prompt says so explicitly. (2) **It must not become a data leak.** The model never sees SQL and never supplies a user id — the authenticated user is injected server-side into every tool call, so `my_memberships` can only ever return the caller's own data and `my_officer_summary` only clubs they actually manage. (3) **It must work in this repository as cloned.** There is no API key in this environment, so a key-only implementation would have shipped as a dead button. The offline path is genuinely useful — it answers deadline, schedule, roster and catalog questions correctly — and the UI labels which mode is running rather than pretending.
- **Alternatives considered:**
  - The SDK's beta tool runner (rejected — a manual loop keeps this on the stable `messages.create` surface with no beta dependency, and makes the identity injection explicit at the one place it matters).
  - Letting the model write SQL (rejected outright — arbitrary SQL from a model against a database with every student's applications in it is the whole vulnerability in one step).
  - Failing loudly with no key (rejected — see (3)).
- **Trade-off:** The offline router is pattern-matching, so unusual phrasings fall back to a keyword search. That is a floor, not a ceiling: with a key the same questions get real conversational answers.
- **Files:** `server/src/clubwiz-tools.js`, `server/src/routes/clubwiz.js`, `client/src/components/ClubWiz.jsx`

### [D-019] Pastel-blue visual system, motion on interaction
- **Date:** 2026-08-13
- **Type:** ui
- **Decision:** Replaced the flat grey-on-white palette with a soft pastel-blue system: a tinted, subtly gradient page background, blue-cast shadows instead of grey, an accent family (sky / mint / lilac / peach / lemon) for tags and washes, a gradient nav bar, pill-shaped buttons, and radii raised across the board (cards 22px, modals 30px, buttons fully rounded). Interaction is now visible — cards and tiles lift on hover, catalog rows slide and tint, the send button scales, panels and bubbles animate in.
- **Rationale:** The original read as a competent but anonymous admin panel. A club directory is something students browse for fun, and the interface should invite that. Yale blue is kept where identity matters (brand mark, nav, primary actions) so it still reads as a Yale app rather than a generic pastel template.
- **Guardrails:** Every animation is short (150–500ms) and tied to an interaction rather than looping in the periphery; the whole system is disabled under `prefers-reduced-motion`. Contrast for body and muted text was kept at readable ratios rather than washing out with the pastels.
- **Files:** `client/src/styles/theme.css`, `client/src/styles/app.css`

### [D-020] Landing page: one idea per screen
- **Date:** 2026-08-13
- **Type:** ui
- **Decision:** Rebuilt the landing page around three sections with large gaps between them — an animated hero (one headline, one sentence, two buttons), the two portal cards, and a light pill cloud of categories. Removed the 14-card category grid that previously sat under the fold.
- **Rationale:** The old page put a hero, two dense feature lists, a fourteen-item card grid and three paragraphs of caveats on one screen, so nothing led. A first-time visitor needs to know what this is, which portal they are, and how to start looking — everything else belongs in the catalog, which is one click away. Categories survive as pills because they are a genuinely useful entry point, but as a light row rather than a wall of cards.
- **Files:** `client/src/pages/Landing.jsx`

### [D-021] Seed a student body large enough for realistic rosters
- **Date:** 2026-08-13
- **Type:** data
- **Decision:** Grew the seeded student population from 162 to 900, and excluded the two headline demo accounts from the random roster fill so their club lists stay curated.
- **Rationale:** Caught by ClubWiz, not by a test. Filling ~128 clubs to ~30 members each from a pool of 162 students put the average student in **28 clubs**, so the assistant correctly reported that the demo student was committed to "140 hours a week." The rosters had looked fine because nothing had ever summed them per student. With 900 students the average is 4.8 clubs — a believable load — and every per-student view (dashboard hours, ClubWiz advice, officer rosters) becomes meaningful.
- **Lesson recorded:** Seed data can be individually plausible and collectively absurd. Any figure the app *aggregates* needs checking at the aggregate level, not just per row.
- **Files:** `server/db/seed.js`

### [D-022] Rate limiting, relaxed outside production
- **Date:** 2026-08-13
- **Type:** security
- **Decision:** Added `express-rate-limit` with per-endpoint budgets — sign-in 20 per 15 minutes, registration 10 per hour, ClubWiz 20 per minute, everything else 600 per minute. Off production the limits are multiplied by 25. The server also refuses to boot with `NODE_ENV=production` unless `JWT_SECRET` is long and no longer the default.
- **Rationale:** Login brute-forcing and an unbounded LLM endpoint were the two open holes flagged in `docs/SECURITY-NOTES.md`. The dev multiplier exists because the strict registration budget would otherwise lock the end-to-end suite out after three runs — limits nobody can develop against get deleted, so they are scaled rather than skipped.
- **Files:** `server/src/index.js`, `docs/SECURITY-NOTES.md`

### [D-023] Secrets are guarded at the commit boundary, not by convention
- **Date:** 2026-08-14
- **Type:** security / process
- **Decision:** Four layers, in order of how much they can be trusted: (1) `.gitignore` widened from the single `.env` line to cover `.env.*` at any depth, `*.pem`/`*.key`/`*.p12`/`*.pfx`, `id_rsa*`, `secrets.json`, `credentials.json`, `service-account*.json`, and the tool-local credential caches `.npmrc`/`.netrc`/`.aws`/`.ssh` — with an explicit `!.env.example` negation so the committed template survives. (2) `server/.env` permissions tightened from `644` to `600`. (3) `scripts/pre-commit`, installed via `core.hooksPath`, refuses any commit that stages a secrets-shaped path or that contains a live-credential string. (4) `npm run secrets:audit` re-checks the whole picture — remotes, tracked files, **full history across all branches**, tracked content, local file permissions, and whether the guard is installed.
- **Rationale:** `.gitignore` is a convenience, not a control — `git add -f` walks straight through it, and the file that leaks is usually the one someone force-added "just this once." The hook is the actual barrier because it sits at the only moment that matters: the transition from working tree to permanent history. The audit exists separately because `.gitignore` and the hook both only protect the *future*; only a history scan answers "did this already happen." Checking history across all branches rather than just `HEAD` matters because deleting a file does not remove it from the commits that contained it.
- **Reporting rule:** Every one of these tools prints **paths, line numbers and match counts — never the matched value**. An audit that echoes the key it found has re-leaked it into terminal scrollback, CI logs, or a chat transcript. This constraint is the reason the scripts use `grep -l` and `-c` rather than plain `grep` throughout.
- **Alternatives considered:** `git-secrets` or `gitleaks` (rejected — both are external installs, and the pattern set that actually matters here is six regexes; a dependency whose job is to be present on every machine is worse than a 60-line shell script that is committed with the repo). A `pre-push` hook instead of `pre-commit` (rejected — by push time the secret is already in local history, so the cleanup is a rewrite instead of an unstage).
- **Trade-off:** `core.hooksPath` is local git config and is *not* carried by a clone, so the hook is inert until someone runs `npm run setup` or `npm run hooks:install`. Wiring it into `setup` covers the normal path; the audit's check [6] catches the case where it was skipped.
- **Verified:** Force-adding `server/.env` is blocked; a planted `sk-ant-…` string in a source file is blocked at file:line; ordinary commits pass; the audit exits 0 with no remote configured and nothing secrets-shaped in any commit.
- **Files:** `.gitignore`, `scripts/pre-commit`, `scripts/secrets-audit.sh`, `package.json`, `server/.env` (permissions only)

### [D-024] The product is ClubTable; the plumbing keeps its old name
- **Date:** 2026-08-14
- **Type:** process
- **Decision:** The product is renamed **YaleClubs → ClubTable**. The rename covers everything a person sees or types: page titles, the wordmark, copy, README, npm package names (`clubtable`, `clubtable-server`, `clubtable-client`), the `ct-` prefix on `localStorage` keys, and the demo password (`clubtable123`). It deliberately does **not** cover three physical identifiers, which stay `yaleclubs`: the **MySQL database name**, the **local repository directory**, and the **Docker container/volume names**.
- **Rationale:** "ClubTable" names the product's relationship to CourseTable far better than "YaleClubs" — the two apps are siblings, and the shared `-Table` suffix says so in one word. But the database name is not product identity, it is a connection string. Renaming it would require editing `server/.env`, which a standing rule forbids me from opening (see D-023 and the reporting rule there), and would force a full re-seed of 128 clubs and ~900 students to change a value no user ever sees. The line is: **rename what is read, not what is wired.**
- **Note on `.env.example`:** The committed template was checked for the brand token via `sed` without the file ever being opened or displayed. It turned out to contain only the lowercase `yaleclubs` database name, so it correctly needed no change.
- **Trade-off:** A developer will see `DB_NAME=yaleclubs` in a ClubTable repo. Accepted, and documented in the README, because the alternative is a rename that can silently break a working database.
- **Files:** 21 source and doc files; `package.json` ×3, `server/db/seed.js`, `server/test/e2e.mjs`, `README.md`
- **Verified:** Full re-seed and 55/55 e2e checks pass against the unchanged database name.

### [D-025] Light navigation bar and a two-tone serif wordmark
- **Date:** 2026-08-14
- **Type:** ui
- **Decision:** Replaced the dark navy gradient nav (D-004, D-019) with a **light, translucent, blurred bar** carrying dark text — and replaced the placeholder `Y` tile with a real lockup: a badge showing **three people seated around a round table**, beside the wordmark **"Club" in a serif, "Table" in blue**.
- **Rationale:** Reference screenshots of CourseTable's current interface show the nav is white with dark text, and its wordmark is exactly this two-tone serif/blue split. That split is the single most recognisable thing about the brand, and reproducing the *pattern* — not the assets — is the clearest way to say "sister app." The navy slab was also fighting the pastel page background it sat on: the brand colour now lives in the wordmark and the active link, which is where it carries meaning. The mark draws the product name literally, and is rotationally symmetric so it survives being rendered at 16px in a browser tab.
- **Consequences handled:** Three rules assumed a dark nav and would have rendered white-on-white — `.nav-link:hover`, `.usermenu-btn`, and the ClubWiz panel header, which was borrowing `--nav-bg`. The first two moved to a new `--nav-hover-bg` token; ClubWiz got its own gradient, since a floating assistant panel still wants a solid branded header.
- **Alternatives considered:** Keeping the navy bar and only swapping the mark (rejected — the wordmark's dark serif is illegible on navy, which is the whole point of the light bar). Using a webfont for the serif (rejected — a network font request for six characters; the system serif stack renders this well and costs nothing).
- **Files:** `client/src/components/Logo.jsx`, `client/public/favicon.svg`, `client/src/components/TopNav.jsx`, `client/src/styles/theme.css`, `client/src/styles/app.css`

### [D-026] The catalog is a dense sortable table
- **Date:** 2026-08-14
- **Type:** ui
- **Decision:** The catalog's middle pane is now a **table** — sticky sortable headers, one club per row, and **numeric cells tinted directly** on the green→yellow→red scale (rating, hours/week, members) rather than floating chips. Column headers drive the existing server-side `sort` keys, so no new API surface was needed. The landing page was rebuilt to CourseTable's shape: headline left, emoji-led feature list, three buttons (CAS / About / Guest), illustration right.
- **Rationale:** D-004 described CourseTable's catalog as a three-pane browse with card-ish rows, and D-015 then deliberately loosened the density because "picking a club is a reading task." The screenshots correct both: CourseTable's catalog is a genuine spreadsheet, and the colour lives *in the cells*, which is what lets you read a whole column as a shape before reading any single number. A table also scales better here — 128 clubs across seven attributes is exactly the comparison a table is for. The three-pane frame and the detail pane are unchanged, so the reading task D-015 protected still happens on the right-hand side.
- **On the testimonial wall:** CourseTable's landing carries a grid of real user quotes. **Not reproduced** — inventing praise for an app nobody has used yet would be fabricating evidence, which is the same line D-005 drew about seed data. The space went to the feature list instead.
- **Files:** `client/src/pages/Catalog.jsx`, `client/src/pages/Landing.jsx`, `client/src/styles/app.css`

### [D-027] Adopting an 8-month-old repository that was leaking credentials
- **Date:** 2026-08-14
- **Type:** security / process
- **Decision:** The existing public repository `nevindabrah/Yale-Clubs` is the publish target. Its history and this project's history share **no common ancestor**, so rather than force-push over it: the old `main` is preserved as a branch **`legacy-2025`**, and `main` becomes the ClubTable build. Before anything was pushed, `legacy-2025` was **rewritten** to purge `owner_credentials.txt`, `backend/yale_clubs.db`, and 4,785 committed `node_modules` files from **all six commits**.
- **What was found:** The repository was public — verified by fetching it with authentication explicitly disabled. At the HEAD of `main` sat `owner_credentials.txt` (618 bytes, 16 lines, matching `password` and 14 `@` symbols), added 2025-12-05 by a commit titled "add owner credentials." Also committed: a 48 KB SQLite database containing **15 bcrypt hashes and 28 `@yale.edu` addresses**, and no `.gitignore` whatsoever — 4,785 of 4,819 tracked files were dependencies.
- **Rationale:** Purging is necessary but **not sufficient** — anything public for eight months must be assumed scraped, forked and indexed, so the credentials themselves must be rotated regardless of what the history now says. The archive branch exists because destroying eight months of someone's work to fix a leak is a worse trade than keeping a cleaned copy of it. `git filter-branch` was used rather than `git filter-repo` because the latter is not installed and there is no Homebrew on this machine; for six commits the deprecated built-in is entirely adequate.
- **Result:** `legacy-2025` went from **4,819 tracked files to 32**, with all six commits preserved and zero occurrences of any purged path in any commit.
- **Files:** repository history; no working-tree files

### [D-028] Club imagery: generated crests now, real logos by permission
- **Date:** 2026-08-14
- **Type:** ui / data
- **Decision:** Clubs gain `logo_url`, `banner_url` and `logo_attribution` columns, all nullable and all **empty in the seed**. When a club has supplied its own artwork the app renders it; otherwise it draws a **generated crest** — a gradient derived from the club's hue, one of six geometric devices chosen by a stable hash of the slug, and the monogram on top — plus a matching generated banner across the top of the club's overview page. The app was **not** populated with the clubs' real logos.
- **Rationale:** Real logos would be better, and the request for them is reasonable — but they are the organisations' own trademarked artwork. Obtaining them means scraping Yale Connect or the clubs' sites, which D-005 already declined for the catalog data, and republishing them in a public repository is redistributing someone else's IP without a licence. Hotlinking instead would leak referrer traffic to 128 third parties, break silently as sites move, and still be redistribution. The columns exist so that a club that *wants* its logo shown can have it in one `UPDATE`, with `logo_attribution` recording who granted it — that is the honest path from here to real logos, and it is one row of SQL per club rather than a scraper.
- **Why generated crests rather than plain initials:** the old mark was a flat hue square with two letters, so 128 clubs produced 128 near-identical tiles and the logo carried no recognition value in a dense table. A hue gradient plus a per-club geometric device makes them tellable apart peripherally, before the monogram is read. The device is chosen by hash, so a club's crest never changes between renders or machines.
- **Alternatives considered:** Fetching favicons from club websites (rejected — same redistribution problem, plus most Yale clubs have no site). AI-generated per-club logos (rejected — they would look like real logos while being invented, which is exactly the confusion D-005 exists to prevent).
- **Files:** `server/db/schema.sql`, `server/src/routes/{clubs,student,messages,auth,officer}.js`, `client/src/components/ui.jsx`, `client/src/components/ClubDetail.jsx`, `client/src/styles/app.css`

### [D-029] The demo password is asserted, not restated
- **Date:** 2026-08-14
- **Type:** process
- **Decision:** `client/src/pages/Login.jsx` exports `DEMO_PASSWORD`, and the e2e suite **reads that constant back out of the client source** and asserts it actually signs both demo accounts in.
- **Rationale:** The D-024 rename updated the demo password in the seed, the tests and the README — and missed the login page, which then confidently advertised and auto-filled a password the database had stopped accepting. Every existing test passed, because the tests carried their own copy of the password. A check that restated the password here would drift in exactly the same way; reading the client's own constant is the only version that couples the two files. The bug was found by a user trying to log in, which is the worst place to find it.
- **Lesson recorded:** A value duplicated across a seed, a UI and a test is not covered by tests that hardcode it — the test and the code drift together only if one of them reads the other.
- **Files:** `client/src/pages/Login.jsx`, `server/test/e2e.mjs`

---

## Action log

Chronological record of build actions (as opposed to design decisions).

| # | Date | Action |
|---|------|--------|
| A-001 | 2026-08-13 | Probed the machine: Node v22.18.0, npm 10.9.3, git 2.50.1, MySQL 8.4.0 binaries present via Anaconda but **no server initialized and no data directory**; `gh` CLI **not installed**; Docker not present. |
| A-002 | 2026-08-13 | Created directory skeleton `yaleclubs/{client,server,scripts,docs}`. |
| A-003 | 2026-08-13 | Authored this DECISIONS.md with entries D-001 … D-011. |
| A-004 | 2026-08-13 | Wrote `server/db/schema.sql` — 13 tables covering users, clubs, officers, memberships, bookmarks, applications (+ questions and answers), events, RSVPs, announcements, and message threads. |
| A-005 | 2026-08-13 | Built `server/db/clubs.data.js` — **128 real Yale organizations** across 14 categories: publications (YDN, Record, Lit, New Journal, Scientific), 20 music groups (Whiffenpoofs, Spizzwinks(?), SOBs, Shades, YSO, YPMB, DPops…), theater and improv (the Dramat, Purple Crayon, Exit Players), 5 YPU-related political orgs, pre-professional (YUCG, YUDI, SWS, YES), STEM (YUAA, YCS, iGEM, SWE, NSBE, SHPE), 16 cultural and identity organizations, 5 religious, 10 service (Dwight Hall, YHHAP, Kesem, YSFP), 12 club sports, and health/wellness (Walden, CCEs). |
| A-006 | 2026-08-13 | Built the Express API: `auth`, `clubs`, `student`, `officer`, `messages` route modules with JWT middleware and per-club officer authorization. |
| A-007 | 2026-08-13 | **MySQL debugging.** Anaconda's `mysqld` 8.4.0 initialized a datadir but refused to restart against it. Installed conda-forge `mysql-server` 9.7.2 into `server/.conda-mysql` — identical failure, which ruled out the build. Root cause was the dot-prefixed datadir (see D-012). Fixed by renaming to `server/mysql-data`. |
| A-008 | 2026-08-13 | Migrated and seeded: 128 clubs, 153 application questions, 162 students, 187 officer accounts, 190 officer roles, 4,578 memberships, 457 applications, 1,015 events, 258 announcements, 30 message threads. |
| A-009 | 2026-08-13 | Built the React client: design tokens, three-pane catalog, shared `ClubDetail` and `MessageCenter`, four student pages, three officer pages (dashboard, five-tab club manager, inbox). `vite build` clean at 250 KB / 74 KB gzipped. |
| A-010 | 2026-08-13 | Wrote and ran `server/test/e2e.mjs` — **35/35 checks pass**, including all four authorization-boundary negatives. |
| A-011 | 2026-08-13 | Added README, `docs/SECURITY-NOTES.md`, `.gitignore`, `docker-compose.yml`, root `package.json` scripts. |
| A-012 | 2026-08-13 | Verified the Vite dev server serves the SPA and proxies `/api` to the Express server. **Not verified: visual rendering in a real browser** — no browser automation was available in this environment. |
| A-013 | 2026-08-13 | Initialized the git repository and made the first commit. |
| A-014 | 2026-08-13 | **Round two.** Fixed member counts rendering as `59.0`; rescaled the whole interface up one step (D-015, D-016). |
| A-015 | 2026-08-13 | Added the student dashboard: a seven-day calendar strip, four counters, next-up list, application states, deadline countdowns, club announcements and category-based recommendations. Extended `/api/student/dashboard` with `deadlines` and `recommended`. |
| A-016 | 2026-08-13 | Rebuilt the message composer as a shared `Composer` — Enter sends, Shift+Enter newlines, auto-growing textarea, circular arrow send button. Reused verbatim in ClubWiz. |
| A-017 | 2026-08-13 | Implemented Yale CAS (D-017) with a development stand-in, plus the client callback route and sign-in buttons. |
| A-018 | 2026-08-13 | Built ClubWiz (D-018): seven scoped SQL tools, a Claude tool-use loop, a deterministic offline router, and a floating chat panel. |
| A-019 | 2026-08-13 | Hardened for real use: per-endpoint rate limits, production `JWT_SECRET` validation, `trust proxy`, health endpoint reporting ClubWiz and CAS modes (D-022). |
| A-020 | 2026-08-13 | Redesigned the visual system to pastel blue with large radii and interaction motion (D-019); rebuilt the landing page with far more breathing room (D-020). |
| A-021 | 2026-08-13 | ClubWiz surfaced that the demo student was "committed to 140 hrs/week" — grew the seeded student body 162 → 900 so rosters aggregate sensibly (D-021). Average is now 4.8 clubs per student. |
| A-022 | 2026-08-13 | Extended the e2e suite from 35 to **55 checks** — dashboard payload, ClubWiz across six question types and both portals, and the full CAS handshake including NetID validation and the no-password-login guarantee. All passing. |
| A-023 | 2026-08-14 | **Secrets audit and hardening (D-023).** Audited exposure without opening any secrets file — filename, count and permission checks only. Result: **no remote is configured**, so nothing has ever been published anywhere; `server/.env.example` is the only env-shaped file ever committed and it contains no real-credential pattern; `server/.env` has never been in any commit on any branch. Then hardened: widened `.gitignore`, `chmod 600 server/.env`, added the `pre-commit` guard and `npm run secrets:audit`. Audit passes 6/6. |
| A-024 | 2026-08-14 | Renamed the product to **ClubTable** across 21 files (D-024); re-seeded and re-ran the suite to confirm the untouched database name still resolves. |
| A-025 | 2026-08-14 | Finished the brand: three-people-around-a-table mark, two-tone serif wordmark, light nav bar, and the three white-on-white regressions that change caused (D-025). Closed the logo work left unwired from A-020. |
| A-026 | 2026-08-14 | Rebuilt the catalog as a dense sortable table with tinted numeric cells, and the landing page to CourseTable's two-column shape (D-026). |
| A-027 | 2026-08-14 | Audited the 8-month-old public `Yale-Clubs` repo, found a live credentials file plus a user database at HEAD, and purged both from all six commits into a clean `legacy-2025` archive branch — 4,819 files → 32 (D-027). |
| A-028 | 2026-08-14 | Fixed the demo sign-in: the login page still advertised and auto-filled the pre-rename password, so both demo accounts failed for a user while every test passed. Added a check that reads the client's own constant and asserts it signs in (D-029). Suite is now **58 checks**. |
| A-029 | 2026-08-14 | Added club imagery (D-028): `logo_url`/`banner_url`/`logo_attribution` columns, generated per-club crests replacing flat initial tiles, and a generated banner on the club overview. Real logos deliberately not scraped. |
</content>
