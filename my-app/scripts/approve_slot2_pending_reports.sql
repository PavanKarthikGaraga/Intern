-- ============================================================
-- Approve all PENDING_REVIEW report books for Slot 2 students
-- ============================================================

USE `Social_2026`;

-- Preview: See which records will be updated BEFORE applying
SELECT
    rb.username,
    r.slot,
    rb.status,
    rb.reportLink,
    rb.adminRemarks
FROM reportBooks rb
JOIN registrations r ON r.username = rb.username
WHERE r.slot = 2
  AND rb.status = 'PENDING_REVIEW';

-- ============================================================
-- UPDATE: Approve all Slot 2 PENDING_REVIEW reports
-- ============================================================
UPDATE reportBooks rb
JOIN registrations r ON r.username = rb.username
SET rb.status = 'APPROVED',
    rb.adminRemarks = NULL
WHERE r.slot = 2
  AND rb.status = 'PENDING_REVIEW';

-- Confirm: Show affected rows count and updated records
SELECT
    rb.username,
    r.slot,
    rb.status        AS updated_status,
    rb.reportLink,
    rb.updatedAt
FROM reportBooks rb
JOIN registrations r ON r.username = rb.username
WHERE r.slot = 2
  AND rb.status = 'APPROVED'
ORDER BY rb.updatedAt DESC;
