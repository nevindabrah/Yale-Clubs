#!/usr/bin/env bash
# Starts a project-local MySQL instance (see DECISIONS.md D-006, D-012).
# Data lives in server/mysql-data — delete that folder to start over.
# NOTE: the directory name must NOT begin with a dot. InnoDB's tablespace
# scan skips dot-directories, so a hidden datadir fails to restart. (D-012)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT/server/mysql-data"
RUN_DIR="$ROOT/server/mysql-run"
CONDA_ENV="$ROOT/server/.conda-mysql"
PORT="${DB_PORT:-3307}"
SOCKET="$RUN_DIR/mysql.sock"
PIDFILE="$RUN_DIR/mysqld.pid"
LOGFILE="$RUN_DIR/mysqld.log"

# Prefer the project-local conda MySQL if present; fall back to PATH.
if [ -x "$CONDA_ENV/bin/mysqld" ]; then
  MYSQLD="$CONDA_ENV/bin/mysqld"
  BASEDIR_ARG="--basedir=$CONDA_ENV"
elif command -v mysqld >/dev/null 2>&1; then
  MYSQLD="$(command -v mysqld)"
  BASEDIR_ARG=""
else
  echo "No mysqld found. Run:  conda create -y -p ./server/.conda-mysql -c conda-forge mysql-server" >&2
  echo "…or use docker-compose.yml, or install MySQL 8+ some other way." >&2
  exit 1
fi

ADMIN="$([ -x "$CONDA_ENV/bin/mysqladmin" ] && echo "$CONDA_ENV/bin/mysqladmin" || command -v mysqladmin)"

mkdir -p "$RUN_DIR"

if [ ! -d "$DATA_DIR/mysql" ]; then
  echo "Initializing a fresh MySQL data directory at $DATA_DIR …"
  mkdir -p "$DATA_DIR"
  "$MYSQLD" --initialize-insecure $BASEDIR_ARG --datadir="$DATA_DIR" --log-error="$LOGFILE"
fi

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "MySQL is already running on port $PORT (pid $(cat "$PIDFILE"))."
  exit 0
fi

echo "Starting MySQL on port $PORT …"
"$MYSQLD" \
  $BASEDIR_ARG \
  --datadir="$DATA_DIR" \
  --port="$PORT" \
  --socket="$SOCKET" \
  --pid-file="$PIDFILE" \
  --log-error="$LOGFILE" \
  --mysqlx=0 \
  --bind-address=127.0.0.1 \
  >/dev/null 2>&1 &

for _ in $(seq 1 60); do
  if "$ADMIN" --protocol=TCP --host=127.0.0.1 --port="$PORT" --user=root ping >/dev/null 2>&1; then
    echo "✓ MySQL ready at 127.0.0.1:$PORT (user root, no password)"
    exit 0
  fi
  sleep 0.5
done

echo "✗ MySQL did not come up. Last lines of $LOGFILE:" >&2
tail -25 "$LOGFILE" >&2 || true
exit 1
