-- ============================================================
-- Social Internship 2026 — Migration Script (MySQL 5.7 compatible)
-- Safe to re-run. Uses INFORMATION_SCHEMA checks instead of
-- ADD COLUMN IF NOT EXISTS (which requires MySQL 8.0.3+).
-- ============================================================

USE `Social_2026`;

-- ============================================================
-- Helper: stored procedure to add a column only if it doesn't exist
-- ============================================================
DROP PROCEDURE IF EXISTS add_col;
DELIMITER //
CREATE PROCEDURE add_col(
    tbl VARCHAR(64), col VARCHAR(64), col_def TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = tbl
          AND COLUMN_NAME  = col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ============================================================
-- 1. registrations — add 2026 columns
-- ============================================================
CALL add_col('registrations', 'season',          "VARCHAR(10) NOT NULL DEFAULT '2025'");
CALL add_col('registrations', 'batch',           "VARCHAR(10) DEFAULT NULL");
CALL add_col('registrations', 'fieldOfInterest', "VARCHAR(100) DEFAULT NULL");
CALL add_col('registrations', 'careerChoice',    "VARCHAR(100) DEFAULT NULL");
CALL add_col('registrations', 'accommodation',   "VARCHAR(10) DEFAULT NULL");
CALL add_col('registrations', 'transportation',  "VARCHAR(10) DEFAULT NULL");
CALL add_col('registrations', 'residenceType',   "VARCHAR(20) DEFAULT NULL");
CALL add_col('registrations', 'hostelName',      "VARCHAR(100) DEFAULT NULL");
CALL add_col('registrations', 'busRoute',        "VARCHAR(100) DEFAULT NULL");
CALL add_col('registrations', 'country',         "VARCHAR(50) DEFAULT 'IN'");
CALL add_col('registrations', 'state',           "VARCHAR(50) DEFAULT NULL");
CALL add_col('registrations', 'district',        "VARCHAR(50) DEFAULT NULL");
CALL add_col('registrations', 'pincode',         "VARCHAR(20) DEFAULT NULL");
CALL add_col('registrations', 'studentLeadId',   "VARCHAR(10) DEFAULT NULL");
CALL add_col('registrations', 'facultyMentorId', "VARCHAR(10) DEFAULT NULL");
CALL add_col('registrations', 'updatedAt',       "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

UPDATE registrations SET season = '2025' WHERE season IS NULL OR season = '';

-- ============================================================
-- 2. stats — add slot7-9 + invillage columns + season
-- ============================================================
CALL add_col('stats', 'slot7',          "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot8',          "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot9',          "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot5Invillage', "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot6Invillage', "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot7Remote',    "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot7Incamp',    "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot7Invillage', "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot8Remote',    "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot8Incamp',    "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot8Invillage', "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot9Remote',    "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot9Incamp',    "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'slot9Invillage', "INT NOT NULL DEFAULT 0");
CALL add_col('stats', 'season',         "VARCHAR(10) NOT NULL DEFAULT '2025'");

UPDATE stats SET season = '2025' WHERE season IS NULL OR season = '';

-- Insert 2026 stats row only if not already there
INSERT INTO stats (season)
SELECT '2026' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM stats WHERE season = '2026');

-- ============================================================
-- 3. reportOpen — add slot7/8/9
-- ============================================================
CALL add_col('reportOpen', 'slot7', "BOOLEAN DEFAULT FALSE");
CALL add_col('reportOpen', 'slot8', "BOOLEAN DEFAULT FALSE");
CALL add_col('reportOpen', 'slot9', "BOOLEAN DEFAULT FALSE");

-- ============================================================
-- 4. problemStatements — create table if not exists
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

-- Expand column if it was created with VARCHAR(50) previously
ALTER TABLE problemStatements MODIFY COLUMN problem_statement VARCHAR(255) NOT NULL;

-- ============================================================
-- 5. certificates — create if not exists
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
-- 6. Supply tables — create if not exists
-- ============================================================
CREATE TABLE IF NOT EXISTS sstudents (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    username          VARCHAR(10) NOT NULL UNIQUE,
    mode              ENUM('Remote','Incampus') NOT NULL,
    slot              INT NOT NULL,
    previousSlot      INT NOT NULL,
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
-- 7. activityLogs — create if not exists
-- ============================================================
CREATE TABLE IF NOT EXISTS activityLogs (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    action        VARCHAR(100) NOT NULL,
    actorUsername VARCHAR(10)  DEFAULT NULL,
    actorName     VARCHAR(100) DEFAULT NULL,
    actorRole     ENUM('student','studentLead','facultyMentor','admin') DEFAULT NULL,
    targetUsername VARCHAR(10) DEFAULT NULL,
    details       TEXT         DEFAULT NULL,
    ipAddress     VARCHAR(45)  DEFAULT NULL,
    createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action        (action),
    INDEX idx_actorUsername (actorUsername),
    INDEX idx_createdAt     (createdAt)
);

-- ============================================================
-- 8. Core tables — create if not exists
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
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(10) NOT NULL UNIQUE,
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
-- Cleanup helper procedure
-- ============================================================
DROP PROCEDURE IF EXISTS add_col;

-- ============================================================
-- VERIFY (run after migration):
-- SHOW TABLES;
-- DESCRIBE problemStatements;
-- SELECT season, COUNT(*) FROM registrations GROUP BY season;
-- SELECT id, season, totalStudents FROM stats;
-- ============================================================
