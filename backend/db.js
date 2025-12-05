import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = process.env.DB_FILE || path.join(__dirname, 'yale_clubs.db');

sqlite3.verbose();
export const db = new sqlite3.Database(dbFile);

export function initDb() {
  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON`);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK(role IN ('student','owner')) NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS clubs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner_id INTEGER NOT NULL,
        meeting_time TEXT,
        location TEXT,
        join_type TEXT CHECK(join_type IN ('open','application','audition')) NOT NULL,
        deadline TEXT,
        description TEXT,
        owner_name TEXT,
        owner_email TEXT,
        FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS club_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        club_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending','accepted','rejected')) NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(club_id) REFERENCES clubs(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(club_id, user_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        club_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(club_id) REFERENCES clubs(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(club_id, user_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(event_id, user_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        club_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY(club_id) REFERENCES clubs(id) ON DELETE CASCADE
      )
    `);

    addColumnIfMissing('events', 'description', 'description TEXT');
    addColumnIfMissing('clubs', 'owner_name', 'owner_name TEXT');
    addColumnIfMissing('clubs', 'owner_email', 'owner_email TEXT');
  });
}

function addColumnIfMissing(table, column, definition) {
  db.all(`PRAGMA table_info(${table})`, (err, rows) => {
    if (err) {
      console.error(`Failed to inspect table ${table}:`, err);
      return;
    }
    const exists = rows.some(r => r.name === column);
    if (!exists) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${definition}`, alterErr => {
        if (alterErr) {
          console.error(`Failed to add column ${column} to ${table}:`, alterErr);
        }
      });
    }
  });
}
