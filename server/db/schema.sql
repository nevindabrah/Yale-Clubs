-- =====================================================================
-- ClubTable — MySQL 8 schema
-- Decisions: D-002 (separate accounts), D-008 (application questions),
--            D-009 (thread-per-club), D-010 (open vs. application clubs)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS event_rsvps;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS message_threads;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS application_answers;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS application_questions;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS club_officers;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- users
-- One human may hold TWO rows here: one student account and one officer
-- account sharing the same email. Uniqueness is on (email, account_type),
-- never on email alone. See DECISIONS.md D-002.
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_type   ENUM('student','officer') NOT NULL,
  email          VARCHAR(190) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(120) NOT NULL,
  netid          VARCHAR(16)  DEFAULT NULL,
  class_year     SMALLINT     DEFAULT NULL,
  residential_college VARCHAR(40) DEFAULT NULL,
  major          VARCHAR(120) DEFAULT NULL,
  pronouns       VARCHAR(40)  DEFAULT NULL,
  bio            TEXT         DEFAULT NULL,
  avatar_hue     SMALLINT     NOT NULL DEFAULT 210,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_email_per_portal (email, account_type),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- clubs
-- ---------------------------------------------------------------------
CREATE TABLE clubs (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug                 VARCHAR(140) NOT NULL,
  name                 VARCHAR(160) NOT NULL,
  acronym              VARCHAR(24)  DEFAULT NULL,
  category             VARCHAR(60)  NOT NULL,
  subcategory          VARCHAR(60)  DEFAULT NULL,
  tagline              VARCHAR(240) DEFAULT NULL,
  description          TEXT         NOT NULL,
  founded_year         SMALLINT     DEFAULT NULL,
  website              VARCHAR(255) DEFAULT NULL,
  -- Demo-only contact address on a non-routable domain. See D-005.
  contact_email        VARCHAR(190) DEFAULT NULL,
  instagram            VARCHAR(120) DEFAULT NULL,

  meeting_day          VARCHAR(24)  DEFAULT NULL,
  meeting_time         VARCHAR(40)  DEFAULT NULL,
  meeting_location     VARCHAR(120) DEFAULT NULL,

  application_required TINYINT(1)   NOT NULL DEFAULT 0,
  applications_open    TINYINT(1)   NOT NULL DEFAULT 0,
  application_deadline DATE         DEFAULT NULL,
  accepting_members    TINYINT(1)   NOT NULL DEFAULT 1,

  -- Illustrative planning figures shown in the catalog.
  size_estimate        SMALLINT     NOT NULL DEFAULT 25,
  commitment_hours     DECIMAL(4,1) NOT NULL DEFAULT 3.0,
  selectivity          DECIMAL(3,1) DEFAULT NULL,  -- 1.0 (open) .. 5.0 (very selective)
  rating               DECIMAL(3,1) DEFAULT NULL,  -- 1.0 .. 5.0 member satisfaction
  logo_hue             SMALLINT     NOT NULL DEFAULT 210,
  is_active            TINYINT(1)   NOT NULL DEFAULT 1,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_club_slug (slug),
  KEY idx_clubs_category (category),
  KEY idx_clubs_name (name),
  FULLTEXT KEY ft_clubs_search (name, acronym, tagline, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- club_officers — which officer ACCOUNTS may manage which clubs
-- ---------------------------------------------------------------------
CREATE TABLE club_officers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  club_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  title       VARCHAR(80)  NOT NULL DEFAULT 'Officer',
  is_primary  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_club_officer (club_id, user_id),
  CONSTRAINT fk_officer_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_officer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- memberships — student accounts that belong to a club
-- ---------------------------------------------------------------------
CREATE TABLE memberships (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  club_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  role        VARCHAR(60)  NOT NULL DEFAULT 'Member',
  status      ENUM('active','inactive','alumni','removed') NOT NULL DEFAULT 'active',
  source      ENUM('open_join','application','manual') NOT NULL DEFAULT 'open_join',
  joined_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes       TEXT         DEFAULT NULL,
  UNIQUE KEY uq_membership (club_id, user_id),
  KEY idx_membership_user (user_id),
  CONSTRAINT fk_membership_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- bookmarks — a student's saved/"worth a look" list
-- ---------------------------------------------------------------------
CREATE TABLE bookmarks (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  club_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bookmark (club_id, user_id),
  CONSTRAINT fk_bookmark_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmark_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- application_questions / applications / application_answers  (D-008)
-- ---------------------------------------------------------------------
CREATE TABLE application_questions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  club_id     INT UNSIGNED NOT NULL,
  prompt      VARCHAR(500) NOT NULL,
  help_text   VARCHAR(255) DEFAULT NULL,
  input_type  ENUM('short_text','long_text','select') NOT NULL DEFAULT 'long_text',
  options     JSON DEFAULT NULL,      -- for input_type = 'select'
  max_words   SMALLINT DEFAULT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 1,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_question_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  KEY idx_question_club (club_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applications (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  club_id       INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  status        ENUM('submitted','under_review','interview','accepted','rejected','withdrawn')
                NOT NULL DEFAULT 'submitted',
  submitted_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  decided_at    TIMESTAMP NULL DEFAULT NULL,
  decided_by    INT UNSIGNED DEFAULT NULL,   -- officer user id
  decision_note TEXT DEFAULT NULL,           -- shown to the student
  internal_note TEXT DEFAULT NULL,           -- officer-only, never returned to students
  rating        TINYINT DEFAULT NULL,        -- officer 1-5 score
  UNIQUE KEY uq_application (club_id, user_id),
  KEY idx_app_status (club_id, status),
  CONSTRAINT fk_app_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_decider FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_answers (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  question_id    INT UNSIGNED NOT NULL,
  answer         TEXT NOT NULL,
  UNIQUE KEY uq_answer (application_id, question_id),
  CONSTRAINT fk_answer_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES application_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- events + RSVPs
-- ---------------------------------------------------------------------
CREATE TABLE events (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  club_id     INT UNSIGNED NOT NULL,
  title       VARCHAR(180) NOT NULL,
  description TEXT DEFAULT NULL,
  event_type  ENUM('meeting','rehearsal','performance','info_session','audition',
                   'social','service','game','workshop','deadline') NOT NULL DEFAULT 'meeting',
  starts_at   DATETIME NOT NULL,
  ends_at     DATETIME DEFAULT NULL,
  location    VARCHAR(160) DEFAULT NULL,
  visibility  ENUM('public','members_only') NOT NULL DEFAULT 'public',
  created_by  INT UNSIGNED DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_event_club_time (club_id, starts_at),
  CONSTRAINT fk_event_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_rsvps (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id   INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  status     ENUM('going','maybe','not_going') NOT NULL DEFAULT 'going',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rsvp (event_id, user_id),
  CONSTRAINT fk_rsvp_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_rsvp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- announcements — officer broadcasts to a club's members
-- ---------------------------------------------------------------------
CREATE TABLE announcements (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  club_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(180) NOT NULL,
  body       TEXT NOT NULL,
  pinned     TINYINT(1) NOT NULL DEFAULT 0,
  posted_by  INT UNSIGNED DEFAULT NULL,
  posted_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_announcement_club (club_id, posted_at),
  CONSTRAINT fk_ann_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_ann_user FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- messaging — one thread per (club, student). See D-009.
-- ---------------------------------------------------------------------
CREATE TABLE message_threads (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  club_id         INT UNSIGNED NOT NULL,
  student_user_id INT UNSIGNED NOT NULL,
  subject         VARCHAR(200) NOT NULL DEFAULT 'General question',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_thread (club_id, student_user_id),
  KEY idx_thread_recent (club_id, last_message_at),
  CONSTRAINT fk_thread_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_thread_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  thread_id      INT UNSIGNED NOT NULL,
  sender_user_id INT UNSIGNED NOT NULL,
  sender_side    ENUM('student','officer') NOT NULL,
  body           TEXT NOT NULL,
  sent_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at        TIMESTAMP NULL DEFAULT NULL,
  KEY idx_message_thread (thread_id, sent_at),
  CONSTRAINT fk_message_thread FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
