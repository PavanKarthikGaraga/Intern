-- ============================================================
-- Social Internship 2026 Migration
-- Run this on the live 'Social' database.
-- All old 2025 data is PRESERVED — only new columns are added.
-- ============================================================

USE `Social`;

-- ----------------------------------------------------------------
-- 1. Add 'season' column to registrations table
--    Old rows default to '2025'; new 2026 registrations insert '2026'
-- ----------------------------------------------------------------
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS season VARCHAR(10) NOT NULL DEFAULT '2025',
  ADD COLUMN IF NOT EXISTS batch VARCHAR(10) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fieldOfInterest VARCHAR(100) DEFAULT NULL;

-- Tag any existing rows explicitly as 2025
UPDATE registrations SET season = '2025' WHERE season IS NULL OR season = '';

-- ----------------------------------------------------------------
-- 2. Add slot7-slot9 columns + season column to stats table
-- ----------------------------------------------------------------
ALTER TABLE stats
  ADD COLUMN IF NOT EXISTS slot7 INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot8 INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot9 INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot7Remote INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot7Incamp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot7Invillage INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot8Remote INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot8Incamp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot8Invillage INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot9Remote INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot9Incamp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot9Invillage INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS season VARCHAR(10) NOT NULL DEFAULT '2025';

ALTER TABLE reportOpen
  ADD COLUMN IF NOT EXISTS slot7 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS slot8 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS slot9 BOOLEAN DEFAULT FALSE;

-- Tag existing stats row as 2025
UPDATE stats SET season = '2025' WHERE season IS NULL OR season = '';

-- ----------------------------------------------------------------
-- 3. Insert a fresh 2026 stats tracking row
-- ----------------------------------------------------------------
INSERT INTO stats (season) VALUES ('2026');

-- ----------------------------------------------------------------
-- Done. Verify:
-- SELECT season, COUNT(*) FROM registrations GROUP BY season;
-- SELECT id, season, totalStudents FROM stats;
-- ----------------------------------------------------------------
