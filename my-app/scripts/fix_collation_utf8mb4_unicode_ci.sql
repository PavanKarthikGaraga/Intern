-- ============================================================
-- Fix: Collation mismatch error
-- "Illegal mix of collations (utf8mb4_0900_ai_ci,IMPLICIT)
--  and (utf8mb4_unicode_ci,IMPLICIT) for operation '='"
--
-- Run each statement SEPARATELY in the SQL Executor.
-- These convert already-created tables to utf8mb4_unicode_ci.
-- ============================================================

-- 1. dailyTasks
ALTER TABLE dailyTasks CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. unlockedDays
ALTER TABLE unlockedDays CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. reportBooks (if it exists)
ALTER TABLE reportBooks CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. slotControl (if it exists)
ALTER TABLE slotControl CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. registrationControl (if it exists)
ALTER TABLE registrationControl CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. rbookControl (if it exists)
ALTER TABLE rbookControl CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. reportDeadlines (if it exists)
ALTER TABLE reportDeadlines CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8. dailyMarks (runtime-created version in evaluate route, if it drifted)
ALTER TABLE dailyMarks CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify all tables now have the same collation:
SELECT TABLE_NAME, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_COLLATION, TABLE_NAME;
