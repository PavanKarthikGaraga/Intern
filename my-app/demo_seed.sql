-- ============================================================
-- DEMO STUDENT SEED SCRIPT
-- Login: username=2500099999  password=25000999990001
-- Run ALL statements top to bottom, in order.
-- ============================================================

-- 1. Demo User account
INSERT INTO users (name, username, password, role)
VALUES ('Demo Student', '2500099999', '$2b$10$n7ROZQOBqeRdw8PRWpN4Uege3V026mFd/7GGQVs88vzqQkbhCGF2q', 'student')
ON DUPLICATE KEY UPDATE name='Demo Student', password='$2b$10$n7ROZQOBqeRdw8PRWpN4Uege3V026mFd/7GGQVs88vzqQkbhCGF2q';

-- 2. Dummy Faculty Mentor user (needed before registrations FK)
INSERT INTO users (name, username, password, role)
VALUES ('Demo Mentor', 'DEMO_M', 'password123', 'facultyMentor')
ON DUPLICATE KEY UPDATE name='Demo Mentor';

-- 3. Dummy Faculty Mentor profile
INSERT INTO facultyMentors (username, name, phoneNumber, email, branch)
VALUES ('DEMO_M', 'Demo Mentor', '9999000002', 'mentor@kluniversity.in', 'Computer Science & Engineering')
ON DUPLICATE KEY UPDATE name='Demo Mentor';

-- 4. Registration (fixed columns — no accommodation/transportation)
INSERT INTO registrations
  (username, name, email, branch, gender, year, phoneNumber,
   selectedDomain, fieldOfInterest, careerChoice, batch, mode, slot,
   residenceType, hostelName, busRoute, country, state, district, pincode,
   season, facultyMentorId, studentLeadId)
VALUES
  ('2500099999', 'Demo Student', 'demo@kluniversity.in',
   'Computer Science & Engineering', 'Male', '3rd', '9999000001',
   'Machine Learning & AI', 'Data Science', 'Software Engineer',
   '2022-2026', 'Incampus', 1,
   'Hostel', 'KL Boys Hostel A', NULL,
   'IN', 'Andhra Pradesh', 'Guntur', '522502',
   '2026', 'DEMO_M', NULL)
ON DUPLICATE KEY UPDATE
  name='Demo Student', email='demo@kluniversity.in',
  selectedDomain='Machine Learning & AI', mode='Incampus', slot=1,
  facultyMentorId='DEMO_M';

-- 5. Problem Statement
INSERT INTO problemStatements (username, domain, problem_statement, location, district, state)
VALUES ('2500099999', 'Machine Learning & AI',
  'Analysing the impact of AI-driven crop disease detection tools on smallholder farmers in rural Andhra Pradesh using ML models trained on local field imagery.',
  'KL University Campus', 'Guntur', 'Andhra Pradesh')
ON DUPLICATE KEY UPDATE problem_statement=VALUES(problem_statement);

-- 6. Marks
INSERT INTO marks (username, facultyMentorId, internalMarks, finalReport, finalPresentation, grade, completed)
VALUES ('2500099999', 'DEMO_M', 92, 19, 18, 'A', 'P')
ON DUPLICATE KEY UPDATE facultyMentorId='DEMO_M', internalMarks=92, finalReport=19, finalPresentation=18, grade='A', completed='P';

-- 7. Final report submission
INSERT INTO final (username, facultyMentorId, completed) VALUES ('2500099999', 'DEMO_M', 1)
ON DUPLICATE KEY UPDATE facultyMentorId='DEMO_M', completed=1;

-- 8. Day verifications (all 7 days approved)
INSERT INTO verify (username, day1, day2, day3, day4, day5, day6, day7)
VALUES ('2500099999', true, true, true, true, true, true, true)
ON DUPLICATE KEY UPDATE day1=true, day2=true, day3=true, day4=true, day5=true, day6=true, day7=true;

-- 9. Perfect Attendance
INSERT INTO attendance (username, day1, day2, day3, day4, day5, day6, day7)
VALUES ('2500099999', 'P', 'P', 'P', 'P', 'P', 'P', 'P')
ON DUPLICATE KEY UPDATE day1='P', day2='P', day3='P', day4='P', day5='P', day6='P', day7='P';

-- 10. Enable Slot 1
INSERT INTO slotControl (slot, enabled) VALUES (1, 1)
ON DUPLICATE KEY UPDATE enabled=1;

-- 11. Create dailyTasks table if not exists
CREATE TABLE IF NOT EXISTS dailyTasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  day TINYINT NOT NULL,
  data JSON NOT NULL,
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_day (username, day)
);

-- 12. Daily Task Data (Days 1-7)
INSERT INTO dailyTasks (username, day, data) VALUES
('2500099999', 1, '{"location":"KL University Campus, Guntur","problemUnderstanding":"Smallholder farmers in Andhra Pradesh lack access to timely, accurate crop disease diagnosis.","rootCause":"Limited agricultural extension services and absence of affordable AI tools.","inference":"An AI-based mobile application could reduce crop loss by up to 40% if adopted at scale."}'),
('2500099999', 2, '{"surveyTarget":"Farmers, Agricultural Officers","totalSurveyed":30,"responses":[{"question":"Do you use any digital tool for crop disease detection?","yes":3,"no":27},{"question":"Are you willing to learn a smartphone app if it helps?","yes":22,"no":8}]}'),
('2500099999', 3, '{"surveyTarget":"Students, Agri-Tech Professionals","totalSurveyed":25,"responses":[{"question":"Are you aware of ML-based crop disease detection tools?","yes":18,"no":7},{"question":"Would you recommend such tools to rural farmers?","yes":23,"no":2}]}'),
('2500099999', 4, '{"surveyTarget":"Village Panchayat Members","totalSurveyed":20,"responses":[{"question":"Is internet connectivity adequate in your village?","yes":6,"no":14},{"question":"Would offline AI tools be useful?","yes":19,"no":1}]}'),
('2500099999', 5, '{"yesPercentages":{"Q1":10,"Q2":73,"Q3":87,"Q4":24,"Q5":95},"noPercentages":{"Q1":90,"Q2":27,"Q3":13,"Q4":76,"Q5":5},"analysis":"Over 87% of farmers have experienced crop loss yet only 10% use any digital solution."}'),
('2500099999', 6, '{"activityTitle":"AI Crop Disease Awareness Camp","activityDate":"2026-05-16","location":"Nadendla Village, Guntur District","participants":45,"description":"Conducted a hands-on demonstration of the prototype ML app. Farmers photographed diseased leaves and received instant diagnosis.","driveLink":"https://drive.google.com/drive/folders/demo_folder"}'),
('2500099999', 7, '{"reportTitle":"AI-Powered Crop Disease Detection for Rural Andhra Pradesh","abstract":"This case study documents a 7-day field internship in rural Guntur district.","methodology":"Mixed-methods: structured surveys, stakeholder interviews, and prototype demonstration.","findings":"Local farmers overwhelmingly prefer offline, Telugu-language tools.","youtubeLink":"https://youtube.com/watch?v=demo","driveLink":"https://drive.google.com/drive/folders/demo_final"}')
ON DUPLICATE KEY UPDATE data=VALUES(data), updatedAt=CURRENT_TIMESTAMP;
