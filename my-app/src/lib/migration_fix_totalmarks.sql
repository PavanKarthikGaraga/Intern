-- Migration script to fix totalMarks column size to handle 100 marks
-- Run this script against your database to fix the "Out of range value" error

USE `Social`;

-- Update certificates table
ALTER TABLE certificates MODIFY COLUMN totalMarks DECIMAL(5,2) NOT NULL;

-- Update marks table
ALTER TABLE marks MODIFY COLUMN internalMarks DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE marks MODIFY COLUMN finalReport DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE marks MODIFY COLUMN finalPresentation DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE marks MODIFY COLUMN totalMarks DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Update dailyMarks table
ALTER TABLE dailyMarks MODIFY COLUMN day1 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE dailyMarks MODIFY COLUMN day2 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE dailyMarks MODIFY COLUMN day3 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE dailyMarks MODIFY COLUMN day4 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE dailyMarks MODIFY COLUMN day5 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE dailyMarks MODIFY COLUMN day6 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE dailyMarks MODIFY COLUMN day7 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE dailyMarks MODIFY COLUMN internalMarks DECIMAL(5,2) DEFAULT 0;

-- Update sdailyMarks table (supply students)
ALTER TABLE sdailyMarks MODIFY COLUMN day1 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sdailyMarks MODIFY COLUMN day2 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sdailyMarks MODIFY COLUMN day3 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sdailyMarks MODIFY COLUMN day4 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sdailyMarks MODIFY COLUMN day5 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sdailyMarks MODIFY COLUMN day6 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sdailyMarks MODIFY COLUMN day7 DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sdailyMarks MODIFY COLUMN internalMarks DECIMAL(5,2) DEFAULT 0;

-- Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'Social' 
AND TABLE_NAME IN ('certificates', 'marks', 'dailyMarks', 'sdailyMarks')
AND COLUMN_NAME LIKE '%marks%' OR COLUMN_NAME LIKE '%totalMarks%'
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Test with a sample value to ensure 100.00 can be stored
-- SELECT 100.00 as test_value; 