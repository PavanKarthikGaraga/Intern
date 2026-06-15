-- ============================================================
-- Slot 2: ADD 7 marks to day6 and ADD 4 marks to day7
-- for specific students (adds on top of existing marks)
-- ============================================================

USE `Social_2026`;

-- Preview: Current day6 and day7 values BEFORE update
SELECT
    dm.username,
    r.name,
    r.slot,
    dm.day6 AS current_day6,
    dm.day7 AS current_day7,
    dm.day6 + 7 AS day6_after,
    dm.day7 + 4 AS day7_after
FROM dailyMarks dm
JOIN registrations r ON r.username = dm.username
WHERE dm.username IN (
    '2500090254','2500030446','2500031315','2500031526','2500031546',
    '2500032116','2500032364','2500032497','2500032619','2500040012',
    '2500040089','2500040271','2500031213','2500032578','2500030426',
    '2500031982','2500032300','2500032435','2500040023','2500040133',
    '2500032059','2500040031','2500030913','2500032232','2500090008'
)
ORDER BY dm.username;

-- ============================================================
-- UPDATE: ADD 7 to day6 and ADD 4 to day7 (not overwrite)
-- ============================================================
UPDATE dailyMarks dm
JOIN registrations r ON r.username = dm.username
SET dm.day6 = COALESCE(dm.day6, 0) + 7,
    dm.day7 = COALESCE(dm.day7, 0) + 4
WHERE dm.username IN (
    '2500090254','2500030446','2500031315','2500031526','2500031546',
    '2500032116','2500032364','2500032497','2500032619','2500040012',
    '2500040089','2500040271','2500031213','2500032578','2500030426',
    '2500031982','2500032300','2500032435','2500040023','2500040133',
    '2500032059','2500040031','2500030913','2500032232','2500090008'
)
  AND r.slot = 2;

-- ============================================================
-- Verify: Confirm updated values
-- ============================================================
SELECT
    dm.username,
    r.name,
    r.slot,
    dm.day6 AS updated_day6,
    dm.day7 AS updated_day7,
    (COALESCE(dm.day1,0) + COALESCE(dm.day2,0) + COALESCE(dm.day3,0) +
     COALESCE(dm.day4,0) + COALESCE(dm.day5,0) + COALESCE(dm.day6,0) +
     COALESCE(dm.day7,0)) AS total_marks
FROM dailyMarks dm
JOIN registrations r ON r.username = dm.username
WHERE dm.username IN (
    '2500090254','2500030446','2500031315','2500031526','2500031546',
    '2500032116','2500032364','2500032497','2500032619','2500040012',
    '2500040089','2500040271','2500031213','2500032578','2500030426',
    '2500031982','2500032300','2500032435','2500040023','2500040133',
    '2500032059','2500040031','2500030913','2500032232','2500090008'
)
ORDER BY dm.username;
