-- ============================================================
-- Fix: Student 2500031184 re-registered in Slot 6 after being
-- deleted from Slot 3. Clear all stale task data so she starts
-- fresh in Slot 6.
-- Run this script ONCE on the production database.
-- Date: 2026-06-15
-- ============================================================

SET @username = '2500031184';

-- 1. Wipe old daily task submissions (slot 3 carry-over)
DELETE FROM dailyTasks WHERE username = @username;

-- 2. Wipe unlocked days from slot 3
DELETE FROM unlockedDays WHERE username = @username;

-- 3. Wipe old attendance records (slot 3)
DELETE FROM attendance WHERE username = @username;

-- 4. Wipe old upload records (slot 3)
DELETE FROM uploads WHERE username = @username;

-- 5. Wipe old daily marks evaluated by admin (slot 3)
DELETE FROM dailyMarks WHERE username = @username;

-- 6. Wipe old marks (slot 3)
DELETE FROM marks WHERE username = @username;

-- 7. Wipe old problem statement (slot 3) — she can re-submit for slot 6
-- NOTE: Comment this out if she already has a slot 6 problem statement submitted
DELETE FROM problemStatements WHERE username = @username;

-- 8. Verify: confirm the student is now registered in slot 6
SELECT username, name, slot, selectedDomain, mode
FROM registrations
WHERE username = @username;

-- 9. Confirm daily tasks are now empty for this student
SELECT COUNT(*) AS remaining_tasks FROM dailyTasks WHERE username = @username;
SELECT COUNT(*) AS remaining_unlocked FROM unlockedDays WHERE username = @username;
