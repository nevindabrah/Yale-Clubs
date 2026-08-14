#!/usr/bin/env bash
# Repeatable secrets audit for YaleClubs (see DECISIONS.md D-023).
#
# Answers one question: could a credential reach anyone but me?
#
# Design rule: this script reports FILENAMES, LINE NUMBERS and COUNTS only.
# It never prints a matched value. Auditing a leak must not itself become a
# way to spill the secret into a terminal log, a CI transcript, or a chat.
#
# Run: npm run secrets:audit

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; DIM=$'\033[2m'; OFF=$'\033[0m'
problems=0

# Live-credential shapes. Deliberately tight: these match issued keys, not
# the placeholder text a .example file is supposed to contain.
PATTERNS='sk-ant-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,}'

echo "YaleClubs secrets audit"
echo "${DIM}reports paths and counts only — never the secret itself${OFF}"
echo

# ---- 1. Where can this repo publish to? ------------------------------------
echo "[1] Remotes"
if [ -z "$(git remote)" ]; then
  echo "    ${GRN}ok${OFF}  no remote configured — nothing can be pushed anywhere"
else
  git remote -v | sed 's/^/    /'
  echo "    ${YEL}note${OFF}  a remote exists; everything below matters more"
fi
echo

# ---- 2. Is anything secrets-shaped tracked right now? ----------------------
echo "[2] Tracked files"
tracked=$(git ls-files | grep -iE '(^|/)\.env($|\.)|\.pem$|\.key$|\.p12$|\.pfx$|secrets\.json|credentials\.json|id_rsa|id_ed25519|(^|/)\.npmrc$' | grep -viE '\.example$|\.sample$|\.template$')
if [ -z "$tracked" ]; then
  echo "    ${GRN}ok${OFF}  no secrets-shaped file is tracked"
else
  echo "$tracked" | sed "s/^/    ${RED}TRACKED${OFF}  /"
  problems=$((problems + 1))
fi
echo

# ---- 3. Was anything secrets-shaped EVER committed? ------------------------
# Deleting a file does not remove it from history. This looks at every commit
# on every branch, not just the current tree.
echo "[3] Full history (all branches, all commits)"
hist=$(git log --all --pretty=format: --name-only --diff-filter=A 2>/dev/null | sort -u | grep -iE '(^|/)\.env($|\.)|\.pem$|\.key$|secrets\.json|credentials\.json|id_rsa|id_ed25519' | grep -viE '\.example$|\.sample$|\.template$')
if [ -z "$hist" ]; then
  echo "    ${GRN}ok${OFF}  no secrets-shaped file was ever committed"
else
  echo "$hist" | sed "s/^/    ${RED}IN HISTORY${OFF}  /"
  echo "    ${DIM}history rewrite required (git filter-repo) + rotate the credential${OFF}"
  problems=$((problems + 1))
fi
echo

# ---- 4. Live-credential strings inside tracked content ---------------------
echo "[4] Credential strings in tracked content"
found=$(git ls-files -z | xargs -0 grep -lIaE "$PATTERNS" 2>/dev/null | grep -viE '\.example$|\.sample$|lock')
if [ -z "$found" ]; then
  echo "    ${GRN}ok${OFF}  no tracked file contains a live-credential pattern"
else
  echo "$found" | sed "s/^/    ${RED}MATCH${OFF}  /"
  problems=$((problems + 1))
fi
echo

# ---- 5. Are the local secret files actually ignored, and locked down? ------
echo "[5] Local secret files"
shopt -s nullglob
for f in .env .env.* */.env */.env.*; do
  case "$f" in *.example|*.sample|*.template) continue ;; esac
  [ -f "$f" ] || continue
  if git check-ignore -q "$f"; then ign="${GRN}ignored${OFF}"; else ign="${RED}NOT IGNORED${OFF}"; problems=$((problems + 1)); fi
  mode=$(stat -f "%Lp" "$f" 2>/dev/null || stat -c "%a" "$f" 2>/dev/null)
  if [ "$mode" = "600" ] || [ "$mode" = "400" ]; then perm="${GRN}$mode${OFF}"; else perm="${YEL}$mode (want 600)${OFF}"; problems=$((problems + 1)); fi
  printf "    %-28s %s  perms %s\n" "$f" "$ign" "$perm"
done
echo

# ---- 6. Is the guard actually installed? -----------------------------------
echo "[6] Pre-commit guard"
if [ "$(git config core.hooksPath)" = "scripts" ] && [ -x scripts/pre-commit ]; then
  echo "    ${GRN}ok${OFF}  installed and executable"
else
  echo "    ${RED}MISSING${OFF}  run: npm run hooks:install"
  problems=$((problems + 1))
fi
echo

if [ "$problems" -eq 0 ]; then
  echo "${GRN}PASS${OFF}  no credential exposure found."
else
  echo "${RED}$problems issue(s) need attention.${OFF}"
  exit 1
fi
