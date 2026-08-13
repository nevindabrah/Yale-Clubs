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

## What would have to change for production

| Gap | Why it matters | Fix |
|---|---|---|
| JWT in `localStorage` | Readable by any XSS on the page | Move to an httpOnly, `SameSite=Lax`, Secure cookie plus CSRF tokens |
| No rate limiting | Login and registration can be brute-forced | `express-rate-limit` on `/api/auth/*`, with lockout after repeated failures |
| Email addresses are unverified | Anyone can register as anyone `@yale.edu` | Replace registration with Yale CAS / Shibboleth SSO; that is the correct answer here, and it also removes password storage entirely |
| No password reset | — | Signed, single-use, short-lived reset tokens by email |
| `JWT_SECRET` defaults to a dev string | A deploy that forgets to set it is trivially forgeable | Refuse to boot when `NODE_ENV=production` and the secret is missing or default |
| No audit log | Decisions on applications are consequential | Append-only table recording actor, action, target and timestamp |
| MySQL root with no password | Fine for a local demo, not for a server | Dedicated least-privilege DB user; TLS to the database |
| No output escaping concerns yet | React escapes by default, but there is no `dangerouslySetInnerHTML` audit rule | Keep it that way; add a lint rule forbidding it |

## Privacy note

Officers can see applicants' names, emails, class years, majors, residential colleges and written
answers — the information those applicants chose to submit to that club. Officers cannot see any
data for clubs they do not manage, and students never see officers' internal notes or scores. A
production version handling real student records would need to be reviewed against FERPA and Yale's
own data-handling policy before launch.
