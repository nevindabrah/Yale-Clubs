# Security notes

What this build does, and what it would need before it handled real student data.

## What is in place

- **Passwords** are hashed with bcrypt (cost 10). Plaintext is never stored or logged.
- **Login responses are uniform.** A wrong password and an unknown email return the same 401 with
  the same message, so the endpoint does not confirm which addresses have accounts.
- **Portal separation is enforced server-side.** `account_type` is baked into the JWT and checked
  again against the database on every request. A student token calling an officer endpoint gets a
  403 regardless of what the client does. (DECISIONS.md D-002.)
- **Club-level authorization** is checked per request: an officer can only read applications,
  rosters, events and messages for clubs listed in `club_officers` for *their* user id. Verified in
  `server/test/e2e.mjs`.
- **Officer-only fields never reach students.** `applications.internal_note` is excluded from every
  student-facing query rather than filtered in the client.
- **All SQL uses bound parameters.** The only values interpolated into SQL are `LIMIT`/`OFFSET`
  (coerced with `parseInt` and clamped) and an `ORDER BY` clause chosen from a fixed allow-list —
  MySQL prepared statements cannot bind those positions.
- **Request bodies are capped** at 256 KB.
- **CORS** is restricted to the configured client origin.

- **Rate limiting** is enforced per endpoint: 20 sign-in attempts per 15 minutes, 10 registrations
  per hour, 20 ClubWiz questions per minute, 600 other API calls per minute. Budgets are multiplied
  by 25 outside production so development and repeated test runs are not locked out.
- **`JWT_SECRET` is validated at boot.** With `NODE_ENV=production` the server exits rather than
  start with a short or default secret.
- **Yale CAS tickets are validated server-side.** The browser never carries anything the server
  trusts — a ticket is redeemed against `/serviceValidate` before any session is issued, and CAS
  accounts store a non-bcrypt sentinel so they cannot be password-signed-in.
- **ClubWiz cannot widen its own scope.** The model never writes SQL and never supplies a user id;
  the authenticated user is injected into every tool call server-side, so personal tools only ever
  return the caller's own data and officer tools only clubs in their `club_officers` rows.

## What would have to change for production

| Gap | Why it matters | Fix |
|---|---|---|
| JWT in `localStorage` | Readable by any XSS on the page | Move to an httpOnly, `SameSite=Lax`, Secure cookie plus CSRF tokens |
| Password registration is unverified | Anyone can register as anyone `@yale.edu` | Make Yale CAS the only path (`CAS_MODE=yale` plus ITS registration) and retire password registration — the CAS code is already in place |
| No password reset | — | Signed, single-use, short-lived reset tokens by email |
| ClubWiz conversations are not logged or reviewable | An assistant that reads student data should be auditable | Persist prompt, tools called and outcome per turn, with retention limits |
| Rate limits are in-memory | They reset on restart and are per-process | Back `express-rate-limit` with Redis when running more than one instance |
| No audit log | Decisions on applications are consequential | Append-only table recording actor, action, target and timestamp |
| MySQL root with no password | Fine for a local demo, not for a server | Dedicated least-privilege DB user; TLS to the database |
| No output escaping concerns yet | React escapes by default, but there is no `dangerouslySetInnerHTML` audit rule | Keep it that way; add a lint rule forbidding it |

## Privacy note

Officers can see applicants' names, emails, class years, majors, residential colleges and written
answers — the information those applicants chose to submit to that club. Officers cannot see any
data for clubs they do not manage, and students never see officers' internal notes or scores. A
production version handling real student records would need to be reviewed against FERPA and Yale's
own data-handling policy before launch.
