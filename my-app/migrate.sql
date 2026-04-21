-- ============================================================
-- Migration Script for Social Internship 2026 (Social_2026 DB)
-- Run this on the production server before deploying new code
-- ============================================================

USE Social_2026;

-- Add accommodation and transportation columns to registrations table
-- These are needed for the new In-Campus logistics questions in Step 4

ALTER TABLE registrations 
  ADD COLUMN accommodation VARCHAR(10) DEFAULT NULL COMMENT 'Yes / No — whether accommodation is required (Incampus only)',
  ADD COLUMN transportation VARCHAR(50) DEFAULT NULL COMMENT 'Free / Yes / Own Transport (Incampus only)';

-- Verify the columns were added
DESCRIBE registrations;

-- Add slot5 through slot9 columns to stats table
-- These are needed for the new 9-slot dashboard stats display

ALTER TABLE stats
  ADD COLUMN slot5 INT DEFAULT 0,
  ADD COLUMN slot5Remote INT DEFAULT 0,
  ADD COLUMN slot5Incamp INT DEFAULT 0,
  ADD COLUMN slot5Invillage INT DEFAULT 0,
  ADD COLUMN slot6 INT DEFAULT 0,
  ADD COLUMN slot6Remote INT DEFAULT 0,
  ADD COLUMN slot6Incamp INT DEFAULT 0,
  ADD COLUMN slot6Invillage INT DEFAULT 0,
  ADD COLUMN slot7 INT DEFAULT 0,
  ADD COLUMN slot7Remote INT DEFAULT 0,
  ADD COLUMN slot7Incamp INT DEFAULT 0,
  ADD COLUMN slot7Invillage INT DEFAULT 0,
  ADD COLUMN slot8 INT DEFAULT 0,
  ADD COLUMN slot8Remote INT DEFAULT 0,
  ADD COLUMN slot8Incamp INT DEFAULT 0,
  ADD COLUMN slot8Invillage INT DEFAULT 0,
  ADD COLUMN slot9 INT DEFAULT 0,
  ADD COLUMN slot9Remote INT DEFAULT 0,
  ADD COLUMN slot9Incamp INT DEFAULT 0,
  ADD COLUMN slot9Invillage INT DEFAULT 0;

-- Verify
DESCRIBE stats;

-- ============================================================
-- Done! Run: npm run build && pm2 restart all
-- ============================================================
