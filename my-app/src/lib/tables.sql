-- Create the database
CREATE DATABASE IF NOT EXISTS `Social`;

USE `Social`;

-- Create users table first
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role ENUM('student', 'studentLead', 'facultyMentor', 'admin') NOT NULL DEFAULT 'student',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create studentLeads table after users
CREATE TABLE studentLeads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    facultyMentorId VARCHAR(10),
    phoneNumber VARCHAR(10) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    slot INT NOT NULL,
    branch VARCHAR(50) NOT NULL,
    student1Username VARCHAR(10),
    student2Username VARCHAR(10),
    student3Username VARCHAR(10),
    student4Username VARCHAR(10),
    student5Username VARCHAR(10),
    student6Username VARCHAR(10),
    student7Username VARCHAR(10),
    student8Username VARCHAR(10),
    student9Username VARCHAR(10),
    student10Username VARCHAR(10),
    student11Username VARCHAR(10),
    student12Username VARCHAR(10),
    student13Username VARCHAR(10),
    student14Username VARCHAR(10),
    student15Username VARCHAR(10),
    student16Username VARCHAR(10),
    student17Username VARCHAR(10),
    student18Username VARCHAR(10),
    student19Username VARCHAR(10),
    student20Username VARCHAR(10),
    student21Username VARCHAR(10),
    student22Username VARCHAR(10),
    student23Username VARCHAR(10),
    student24Username VARCHAR(10),
    student25Username VARCHAR(10),
    student26Username VARCHAR(10),
    student27Username VARCHAR(10),
    student28Username VARCHAR(10),
    student29Username VARCHAR(10),
    student30Username VARCHAR(10),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
);

-- Create facultyMentors table after studentLeads is created
CREATE TABLE facultyMentors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phoneNumber VARCHAR(10) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    branch VARCHAR(50) NOT NULL,
    lead1Id VARCHAR(10),
    lead2Id VARCHAR(10),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username),
    FOREIGN KEY (lead1Id) REFERENCES studentLeads(username),
    FOREIGN KEY (lead2Id) REFERENCES studentLeads(username)
);

-- Create registrations table after user and studentLeads
CREATE TABLE registrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    selectedDomain VARCHAR(255) NOT NULL,
    mode ENUM('Remote', 'Incampus', 'InVillage') NOT NULL,
    slot INT NOT NULL,
    studentLeadId VARCHAR(10),
    facultyMentorId VARCHAR(10),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    branch VARCHAR(50) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    year ENUM('1st', '2nd', '3rd', '4th') NOT NULL,
    phoneNumber VARCHAR(15) UNIQUE NOT NULL,
    residenceType ENUM('Hostel', 'Day Scholar') NOT NULL,
    hostelName VARCHAR(100) DEFAULT 'N/A',
    busRoute VARCHAR(100) DEFAULT NULL,
    country VARCHAR(50) DEFAULT 'IN',
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,   
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentLeadId) REFERENCES studentLeads(username),
    FOREIGN KEY (facultyMentorId) REFERENCES facultyMentors(username)
);

-- Create uploads table
CREATE TABLE uploads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 VARCHAR(200) DEFAULT NULL,
    day2 VARCHAR(200) DEFAULT NULL,
    day3 VARCHAR(200) DEFAULT NULL,
    day4 VARCHAR(200) DEFAULT NULL,
    day5 VARCHAR(200) DEFAULT NULL,
    day6 VARCHAR(200) DEFAULT NULL,
    day7 VARCHAR(200) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

CREATE TABLE status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 VARCHAR(20) DEFAULT NULL,
    day2 VARCHAR(20) DEFAULT NULL,
    day3 VARCHAR(20) DEFAULT NULL,
    day4 VARCHAR(20) DEFAULT NULL,
    day5 VARCHAR(20) DEFAULT NULL,
    day6 VARCHAR(20) DEFAULT NULL,
    day7 VARCHAR(20) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

CREATE TABLE verify (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 BOOLEAN DEFAULT FALSE,
    day2 BOOLEAN DEFAULT FALSE,
    day3 BOOLEAN DEFAULT FALSE,
    day4 BOOLEAN DEFAULT FALSE,
    day5 BOOLEAN DEFAULT FALSE,
    day6 BOOLEAN DEFAULT FALSE,
    day7 BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

-- Create attendance table
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 ENUM('P','S','A') DEFAULT NULL,
    day2 ENUM('P','S','A') DEFAULT NULL,
    day3 ENUM('P','S','A') DEFAULT NULL,
    day4 ENUM('P','S','A') DEFAULT NULL,
    day5 ENUM('P','S','A') DEFAULT NULL,
    day6 ENUM('P','S','A') DEFAULT NULL,
    day7 ENUM('P', 'A') DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

    CREATE TABLE messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(10) NOT NULL UNIQUE,
        day1 TEXT DEFAULT NULL,
        day2 TEXT DEFAULT NULL,
        day3 TEXT DEFAULT NULL,
        day4 TEXT DEFAULT NULL,
        day5 TEXT DEFAULT NULL,
        day6 TEXT DEFAULT NULL,
        day7 TEXT DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES registrations(username)
    );

-- Create Final Report table
CREATE TABLE final (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    facultyMentorId VARCHAR(10) NOT NULL,
    finalReport VARCHAR(200) DEFAULT NULL,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (facultyMentorId) REFERENCES facultyMentors(username),
    FOREIGN KEY (username) REFERENCES registrations(username)
);

-- Create daily marks table
CREATE TABLE dailyMarks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    day1 DECIMAL(4,2) DEFAULT 0,
    day2 DECIMAL(4,2) DEFAULT 0,
    day3 DECIMAL(4,2) DEFAULT 0,
    day4 DECIMAL(4,2) DEFAULT 0,
    day5 DECIMAL(4,2) DEFAULT 0,
    day6 DECIMAL(4,2) DEFAULT 0,
    day7 DECIMAL(4,2) DEFAULT 0,
    internalMarks INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username)
);

-- Modify marks table for final report evaluation
CREATE TABLE marks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL UNIQUE,
    facultyMentorId VARCHAR(10) NOT NULL,
    internalMarks INT NOT NULL DEFAULT 0, -- 60 marks from daily submissions
    caseStudyReportMarks INT NOT NULL DEFAULT 0,    -- 30 marks
    conductParticipationMarks INT NOT NULL DEFAULT 0, -- 10 marks
    totalMarks INT NOT NULL DEFAULT 0,
    grade VARCHAR(50) NOT NULL DEFAULT 'Not Qualified',
    feedback TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES registrations(username),
    FOREIGN KEY (facultyMentorId) REFERENCES facultyMentors(username)
);

-- Create stats table
CREATE TABLE stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    totalStudents INT NOT NULL DEFAULT 0,
    totalCompleted INT NOT NULL DEFAULT 0,
    totalActive INT NOT NULL DEFAULT 0,
    slot1 INT NOT NULL DEFAULT 0,
    slot2 INT NOT NULL DEFAULT 0,
    slot3 INT NOT NULL DEFAULT 0,
    slot4 INT NOT NULL DEFAULT 0,
    remote INT NOT NULL DEFAULT 0,
    incampus INT NOT NULL DEFAULT 0,
    invillage INT NOT NULL DEFAULT 0,
    slot1Remote INT NOT NULL DEFAULT 0,
    slot1Incamp INT NOT NULL DEFAULT 0,
    slot1Invillage INT NOT NULL DEFAULT 0,
    slot2Remote INT NOT NULL DEFAULT 0,
    slot2Incamp INT NOT NULL DEFAULT 0,
    slot2Invillage INT NOT NULL DEFAULT 0,
    slot3Remote INT NOT NULL DEFAULT 0,
    slot3Incamp INT NOT NULL DEFAULT 0,
    slot3Invillage INT NOT NULL DEFAULT 0,
    slot4Remote INT NOT NULL DEFAULT 0,
    slot4Incamp INT NOT NULL DEFAULT 0,
    slot4Invillage INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create reportOpen table for controlling final report submission periods
CREATE TABLE reportOpen (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slot1 BOOLEAN DEFAULT FALSE,
    slot2 BOOLEAN DEFAULT FALSE,
    slot3 BOOLEAN DEFAULT FALSE,
    slot4 BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert initial record for reportOpen
INSERT INTO reportOpen (slot1, slot2, slot3, slot4) VALUES (FALSE, FALSE, FALSE, FALSE);

-- Insert users (admin)
-- INSERT INTO users (name, username, password, role)
-- VALUES 
-- ('Karthik', '2300032048', '$2a$10$LOYUMO84WPbDnjFn20XEHeVPSMmvBtq2NsmnSbcbj493Y/GsMX./S', 'admin'),
-- ('Sai Vijay', '5387', '$2a$10$LOYUMO84WPbDnjFn20XEHeVPSMmvBtq2NsmnSbcbj493Y/GsMX./S', 'admin');

-- Insert stats record
-- INSERT INTO stats() VALUES ();

