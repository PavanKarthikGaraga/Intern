-- ============================================================
-- Social Internship 2026 — Complete Migration Script
-- Run on the live 'Social_2026' database.
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS everywhere.
-- Old 2025 data is fully preserved.
-- ============================================================

USE `Social_2026`;

-- ============================================================
-- 1. registrations — add all new 2026 columns
-- ============================================================
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS season          VARCHAR(10)   NOT NULL DEFAULT '2025',
  ADD COLUMN IF NOT EXISTS batch           VARCHAR(10)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fieldOfInterest VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS careerChoice    VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accommodation   VARCHAR(10)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS transportation  VARCHAR(10)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS residenceType   VARCHAR(20)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hostelName      VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS busRoute        VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS country         VARCHAR(50)   DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS state           VARCHAR(50)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS district        VARCHAR(50)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pincode         VARCHAR(20)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS studentLeadId   VARCHAR(10)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS facultyMentorId VARCHAR(10)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updatedAt       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Tag existing 2025 rows
UPDATE registrations SET season = '2025' WHERE season IS NULL OR season = '';

-- ============================================================
-- 2. stats — add slot7-9 columns, mode columns, season
-- ============================================================
ALTER TABLE stats
  ADD COLUMN IF NOT EXISTS slot7           INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot8           INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot9           INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot5Invillage  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot6Invillage  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot7Remote     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot7Incamp     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot7Invillage  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot8Remote     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot8Incamp     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot8Invillage  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot9Remote     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot9Incamp     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot9Invillage  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS season          VARCHAR(10) NOT NULL DEFAULT '2025';

-- Tag existing stats row as 2025
UPDATE stats SET season = '2025' WHERE season IS NULL OR season = '';

-- Insert a fresh 2026 stats tracking row (only if not already there)
INSERT INTO stats (season)
SELECT '2026' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM stats WHERE season = '2026');

-- ============================================================
-- 3. reportOpen — add slot7/8/9 columns
-- ============================================================
ALTER TABLE reportOpen
  ADD COLUMN IF NOT EXISTS slot7 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS slot8 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS slot9 BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 4. problemStatements table — CREATE if not exists
--    VARCHAR(255) for problem_statement (predefined values can be ~60 chars)
-- ============================================================
CREATE TABLE IF NOT EXISTS problemStatements (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    username          VARCHAR(10)  NOT NULL UNIQUE,
    domain            VARCHAR(255) NOT NULL,
    problem_statement VARCHAR(255) NOT NULL,
    location          VARCHAR(255) NOT NULL DEFAULT 'N/A',
    district          VARCHAR(100) NOT NULL DEFAULT 'N/A',
    state             VARCHAR(100) NOT NULL DEFAULT 'N/A',
    createdAt         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

-- If the table already existed with VARCHAR(50), expand it:
ALTER TABLE problemStatements
  MODIFY COLUMN IF EXISTS problem_statement VARCHAR(255) NOT NULL;

-- ============================================================
-- 5. certificates table — CREATE if not exists
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(10)   NOT NULL UNIQUE,
    uid         VARCHAR(50)   NOT NULL UNIQUE,
    pdf_data    LONGBLOB      NOT NULL,
    slot        INT           NOT NULL,
    totalMarks  DECIMAL(4,2)  NOT NULL,
    generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

-- ============================================================
-- 6. Supply / second-chance tables — CREATE IF NOT EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS sstudents (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    username         VARCHAR(10) NOT NULL UNIQUE,
    mode             ENUM('Remote', 'Incampus') NOT NULL,
    slot             INT NOT NULL,
    previousSlot     INT NOT NULL,
    previousSlotMarks INT NOT NULL,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

CREATE TABLE IF NOT EXISTS suploads (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 VARCHAR(200) DEFAULT NULL, day2 VARCHAR(200) DEFAULT NULL,
    day3 VARCHAR(200) DEFAULT NULL, day4 VARCHAR(200) DEFAULT NULL,
    day5 VARCHAR(200) DEFAULT NULL, day6 VARCHAR(200) DEFAULT NULL,
    day7 VARCHAR(200) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES sstudents(username)
);

CREATE TABLE IF NOT EXISTS sstatus (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 VARCHAR(20) DEFAULT NULL, day2 VARCHAR(20) DEFAULT NULL,
    day3 VARCHAR(20) DEFAULT NULL, day4 VARCHAR(20) DEFAULT NULL,
    day5 VARCHAR(20) DEFAULT NULL, day6 VARCHAR(20) DEFAULT NULL,
    day7 VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (username) REFERENCES sstudents(username)
);

CREATE TABLE IF NOT EXISTS sattendance (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 ENUM('P','S','A') DEFAULT NULL, day2 ENUM('P','S','A') DEFAULT NULL,
    day3 ENUM('P','S','A') DEFAULT NULL, day4 ENUM('P','S','A') DEFAULT NULL,
    day5 ENUM('P','S','A') DEFAULT NULL, day6 ENUM('P','S','A') DEFAULT NULL,
    day7 ENUM('P','A')     DEFAULT NULL,
    FOREIGN KEY (username) REFERENCES sstudents(username)
);

CREATE TABLE IF NOT EXISTS smessages (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 TEXT DEFAULT NULL, day2 TEXT DEFAULT NULL,
    day3 TEXT DEFAULT NULL, day4 TEXT DEFAULT NULL,
    day5 TEXT DEFAULT NULL, day6 TEXT DEFAULT NULL,
    day7 TEXT DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES sstudents(username)
);

CREATE TABLE IF NOT EXISTS sdailyMarks (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(10) NOT NULL UNIQUE,
    day1 DECIMAL(4,2) DEFAULT 0, day2 DECIMAL(4,2) DEFAULT 0,
    day3 DECIMAL(4,2) DEFAULT 0, day4 DECIMAL(4,2) DEFAULT 0,
    day5 DECIMAL(4,2) DEFAULT 0, day6 DECIMAL(4,2) DEFAULT 0,
    day7 DECIMAL(4,2) DEFAULT 0,
    internalMarks DECIMAL(4,2) DEFAULT 0,
    FOREIGN KEY (username) REFERENCES sstudents(username)
);

-- ============================================================
-- 7. activityLogs table — CREATE IF NOT EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS activityLogs (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    action        VARCHAR(100) NOT NULL,
    actorUsername VARCHAR(10)  DEFAULT NULL,
    actorName     VARCHAR(100) DEFAULT NULL,
    actorRole     ENUM('student', 'studentLead', 'facultyMentor', 'admin') DEFAULT NULL,
    targetUsername VARCHAR(10) DEFAULT NULL,
    details       TEXT         DEFAULT NULL,
    ipAddress     VARCHAR(45)  DEFAULT NULL,
    createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action       (action),
    INDEX idx_actorUsername(actorUsername),
    INDEX idx_createdAt    (createdAt)
);

-- ============================================================
-- 8. Core tables — CREATE IF NOT EXISTS (safe for fresh DBs)
--    Already exist on 2025 db, skipped automatically.
-- ============================================================
CREATE TABLE IF NOT EXISTS status (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 VARCHAR(20) DEFAULT NULL, day2 VARCHAR(20) DEFAULT NULL,
    day3 VARCHAR(20) DEFAULT NULL, day4 VARCHAR(20) DEFAULT NULL,
    day5 VARCHAR(20) DEFAULT NULL, day6 VARCHAR(20) DEFAULT NULL,
    day7 VARCHAR(20) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

CREATE TABLE IF NOT EXISTS messages (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 TEXT DEFAULT NULL, day2 TEXT DEFAULT NULL,
    day3 TEXT DEFAULT NULL, day4 TEXT DEFAULT NULL,
    day5 TEXT DEFAULT NULL, day6 TEXT DEFAULT NULL,
    day7 TEXT DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

CREATE TABLE IF NOT EXISTS dailyMarks (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 DECIMAL(4,2) DEFAULT 0, day2 DECIMAL(4,2) DEFAULT 0,
    day3 DECIMAL(4,2) DEFAULT 0, day4 DECIMAL(4,2) DEFAULT 0,
    day5 DECIMAL(4,2) DEFAULT 0, day6 DECIMAL(4,2) DEFAULT 0,
    day7 DECIMAL(4,2) DEFAULT 0,
    internalMarks DECIMAL(4,2) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

-- ============================================================
-- VERIFY (run these after migration to confirm everything):
-- ============================================================
-- SHOW TABLES;
-- DESCRIBE problemStatements;
-- DESCRIBE registrations;
-- DESCRIBE stats;
-- DESCRIBE reportOpen;
-- SELECT season, COUNT(*) FROM registrations GROUP BY season;
-- SELECT id, season, totalStudents FROM stats;
-- ============================================================
