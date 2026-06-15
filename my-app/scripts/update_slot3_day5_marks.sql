-- ============================================================
-- Slot 3 — Day 5 Marks Update Script
-- 
-- Rules:
--   Remote students:
--     day2 + day3 + day4 = 0          → day5 = 0
--     day2 + day3 + day4 <= 6         → day5 = 7
--     day2 + day3 + day4 IN (7, 8)    → day5 = 9
--     day2 + day3 + day4 >= 9         → day5 = 12
--
--   InVillage / Incampus students:
--     day5 = 15
-- ============================================================

USE `Social_2026`;

-- Preview before update (sanity check)
SELECT
    r.username,
    r.mode,
    r.slot,
    dm.day2,
    dm.day3,
    dm.day4,
    (dm.day2 + dm.day3 + dm.day4) AS total_d234,
    dm.day5 AS current_day5,
    CASE
        WHEN r.mode IN ('InVillage', 'Incampus') THEN 15
        WHEN r.mode = 'Remote' THEN
            CASE
                WHEN (dm.day2 + dm.day3 + dm.day4) = 0     THEN 0
                WHEN (dm.day2 + dm.day3 + dm.day4) <= 6    THEN 7
                WHEN (dm.day2 + dm.day3 + dm.day4) IN (7, 8) THEN 9
                WHEN (dm.day2 + dm.day3 + dm.day4) >= 9    THEN 12
            END
        END AS new_day5
FROM dailyMarks dm
JOIN registrations r ON r.username = dm.username
WHERE r.slot = 3
ORDER BY r.mode, r.username;


-- ============================================================
-- UPDATE: Apply Day 5 marks for Slot 3
-- ============================================================

-- 1. InVillage & Incampus students → day5 = 15
UPDATE dailyMarks dm
JOIN registrations r ON r.username = dm.username
SET dm.day5 = 15
WHERE r.slot = 3
  AND r.mode IN ('InVillage', 'Incampus');

-- 2. Remote students → day5 based on (day2 + day3 + day4) total
UPDATE dailyMarks dm
JOIN registrations r ON r.username = dm.username
SET dm.day5 = CASE
    WHEN (dm.day2 + dm.day3 + dm.day4) = 0          THEN 0
    WHEN (dm.day2 + dm.day3 + dm.day4) <= 6         THEN 7
    WHEN (dm.day2 + dm.day3 + dm.day4) IN (7, 8)    THEN 9
    WHEN (dm.day2 + dm.day3 + dm.day4) >= 9         THEN 12
END
WHERE r.slot = 3
  AND r.mode = 'Remote';

-- ============================================================
-- Verification: Check updated values
-- ============================================================
SELECT
    r.username,
    r.mode,
    r.slot,
    dm.day2,
    dm.day3,
    dm.day4,
    (dm.day2 + dm.day3 + dm.day4) AS total_d234,
    dm.day5 AS updated_day5
FROM dailyMarks dm
JOIN registrations r ON r.username = dm.username
WHERE r.slot = 3
ORDER BY r.mode, r.username;
