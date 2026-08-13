#!/usr/bin/env bash
# Stops the project-local MySQL instance started by db-start.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDFILE="$ROOT/server/mysql-run/mysqld.pid"
PORT="${DB_PORT:-3307}"

if [ ! -f "$PIDFILE" ]; then
  echo "No pid file — MySQL does not appear to be running."
  exit 0
fi

PID="$(cat "$PIDFILE")"
if kill -0 "$PID" 2>/dev/null; then
  mysqladmin --protocol=TCP --host=127.0.0.1 --port="$PORT" --user=root shutdown 2>/dev/null || kill "$PID"
  echo "✓ MySQL stopped (pid $PID)."
else
  echo "Stale pid file; removing."
fi
rm -f "$PIDFILE"
