CREATE DATABASE intern;
USE intern;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT NOT NULL,  
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'studentLead', 'facultyMentor', 'admin') NOT NULL DEFAULT 'student',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE studentLeads (
    id BIGINT AUTO_INCREMENT NOT NULL,  
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE registrations (
    id BIGINT AUTO_INCREMENT NOT NULL,  
    username VARCHAR(255) NOT NULL UNIQUE, 
    selectedDomain VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    mode ENUM('In campus', 'Remote') NOT NULL,
    leadId VARCHAR(255) DEFAULT NULL,

    -- Student Info
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    branch VARCHAR(50) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    year ENUM('1st', '2nd', '3rd', '4th') NOT NULL,
    phoneNumber VARCHAR(15) UNIQUE NOT NULL,

    -- Residence Info
    residenceType ENUM('Hostel', 'Day Scholar') NOT NULL,
    hostelName VARCHAR(100) DEFAULT 'N/A',
    busRoute VARCHAR(100) DEFAULT NULL,
    country VARCHAR(50) DEFAULT 'IN',
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    -- Timestamps
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- FOREIGN KEY (username) REFERENCES users(username),
    FOREIGN KEY (leadId) REFERENCES studentLeads(username)
);

CREATE TABLE uploads (
    id BIGINT AUTO_INCREMENT NOT NULL,
    username VARCHAR(255) NOT NULL,
    day1Link VARCHAR(200) DEFAULT NULL,
    day2Link VARCHAR(200) DEFAULT NULL,
    day3Link VARCHAR(200) DEFAULT NULL,
    day4Link VARCHAR(200) DEFAULT NULL,
    day5Link VARCHAR(200) DEFAULT NULL,
    day6Link VARCHAR(200) DEFAULT NULL,
    day7Link VARCHAR(200) DEFAULT NULL,
    day8Link VARCHAR(200) DEFAULT NULL,
    day9Link VARCHAR(200) DEFAULT NULL,
    day10Link VARCHAR(200) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (username) REFERENCES registrations(username)
);

CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT NOT NULL,  
    username VARCHAR(255) NOT NULL,
    day1 ENUM('P', 'A') DEFAULT NULL,
    day2 ENUM('P', 'A') DEFAULT NULL,
    day3 ENUM('P', 'A') DEFAULT NULL,
    day4 ENUM('P', 'A') DEFAULT NULL,
    day5 ENUM('P', 'A') DEFAULT NULL,
    day6 ENUM('P', 'A') DEFAULT NULL,
    day7 ENUM('P', 'A') DEFAULT NULL,
    day8 ENUM('P', 'A') DEFAULT NULL,
    day9 ENUM('P', 'A') DEFAULT NULL,
    day10 ENUM('P', 'A') DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (username) REFERENCES registrations(username)
);

CREATE TABLE completedStudents (
    id BIGINT AUTO_INCREMENT NOT NULL,  
    studentDetails JSON NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES studentLeads(id)
);

CREATE TABLE facultyMentors (
    id BIGINT AUTO_INCREMENT NOT NULL,  
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE facultyStudentLeads (
    facultyMentorId BIGINT,
    studentLeadId BIGINT,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (facultyMentorId, studentLeadId),
    FOREIGN KEY (facultyMentorId) REFERENCES facultyMentors(id),
    FOREIGN KEY (studentLeadId) REFERENCES studentLeads(id)
);

CREATE TABLE leadStudents (
    studentLeadId BIGINT,
    studentId BIGINT,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (studentLeadId, studentId),
    FOREIGN KEY (studentLeadId) REFERENCES studentLeads(id),
    FOREIGN KEY (studentId) REFERENCES registrations(id)
);
