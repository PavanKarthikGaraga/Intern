-- ============================================================
-- Slot 2 Report Books: Set reportBookMarks = 20 and status = 'APPROVED'
-- for all students who are already APPROVED but have no marks set
-- ============================================================

USE `Social_2026`;

-- Preview: See all Slot 2 APPROVED report books and their current marks
SELECT
    rb.username,
    r.name,
    rb.status,
    rb.reportBookMarks,
    rb.adminRemarks,
    rb.updatedAt
FROM reportBooks rb
JOIN registrations r ON r.username = rb.username
WHERE r.slot = 2
  AND rb.status = 'APPROVED'
ORDER BY rb.reportBookMarks ASC, rb.updatedAt DESC;

-- ============================================================
-- UPDATE: Set reportBookMarks = 20, status = 'APPROVED'
-- for ALL Slot 2 approved report books (including those already approved
-- but missing marks)
-- ============================================================
UPDATE reportBooks rb
JOIN registrations r ON r.username = rb.username
SET rb.reportBookMarks = 20,
    rb.status          = 'APPROVED',
    rb.adminRemarks    = NULL
WHERE r.slot = 2
  AND rb.status = 'APPROVED';

-- ============================================================
-- Verify: Confirm all updated
-- ============================================================
SELECT
    COUNT(*)                              AS total_slot2_approved,
    SUM(rb.reportBookMarks = 20)          AS marked_20,
    SUM(rb.reportBookMarks IS NULL)       AS still_null
FROM reportBooks rb
JOIN registrations r ON r.username = rb.username
WHERE r.slot = 2
  AND rb.status = 'APPROVED';
