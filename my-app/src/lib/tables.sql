CREATE TABLE registrations (
    idNumber BIGINT PRIMARY KEY,
    selectedDomain VARCHAR(255) NOT NULL,
    agreedToRules BOOLEAN NOT NULL DEFAULT FALSE,
    studentMentorId BIGINT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Student Info
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    branch VARCHAR(50) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    year ENUM('1st', '2nd', '3rd', '4th') NOT NULL,
    phoneNumber VARCHAR(15) UNIQUE NOT NULL,

    -- Residence Info
    residenceType ENUM('Hostel', 'Day Scholar') NOT NULL,
    hostelType VARCHAR(100) DEFAULT 'N/A',
    busRoute VARCHAR(100) DEFAULT NULL,
    country VARCHAR(50) DEFAULT 'IN',
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    -- Timestamps
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
    idNumber BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role ENUM('student', 'studentMentor', 'admin') NOT NULL DEFAULT 'student',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE studentMentors (
    mentorId BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    student1Id BIGINT,
    student2Id BIGINT,
    student3Id BIGINT,
    student4Id BIGINT,
    student5Id BIGINT,
    student6Id BIGINT,
    student7Id BIGINT,
    student8Id BIGINT,
    student9Id BIGINT,
    student10Id BIGINT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mentorId) REFERENCES users(idNumber),
    FOREIGN KEY (student1Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student2Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student3Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student4Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student5Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student6Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student7Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student8Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student9Id) REFERENCES registrations(idNumber),
    FOREIGN KEY (student10Id) REFERENCES registrations(idNumber)
);

CREATE TABLE uploads (
    idNumber BIGINT PRIMARY KEY,
    day1Link VARCHAR(200) DEFAULT NULL,
    day2Link VARCHAR(200) DEFAULT NULL,
    day3Link VARCHAR(200) DEFAULT NULL,
    day4Link VARCHAR(200) DEFAULT NULL,
    day5Link VARCHAR(200) DEFAULT NULL,
    day6Link VARCHAR(200) DEFAULT NULL,
    day7Link VARCHAR(200) DEFAULT NULL,
    day8Link VARCHAR(200) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idNumber) REFERENCES registrations(idNumber)
);

CREATE TABLE attendance (
    idNumber BIGINT PRIMARY KEY,
    day1 ENUM('P', 'A') DEFAULT NULL,
    day2 ENUM('P', 'A') DEFAULT NULL,
    day3 ENUM('P', 'A') DEFAULT NULL,
    day4 ENUM('P', 'A') DEFAULT NULL,
    day5 ENUM('P', 'A') DEFAULT NULL,
    day6 ENUM('P', 'A') DEFAULT NULL,
    day7 ENUM('P', 'A') DEFAULT NULL,
    day8 ENUM('P', 'A') DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idNumber) REFERENCES registrations(idNumber)
);

CREATE TABLE completedStudents (
    mentorId BIGINT PRIMARY KEY,
    studentDetails JSON NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mentorId) REFERENCES studentMentors(mentorId)
);