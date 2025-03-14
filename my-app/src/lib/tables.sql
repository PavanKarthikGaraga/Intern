CREATE TABLE registrations (
    idNumber BIGINT PRIMARY KEY,
    selectedDomain VARCHAR(255) NOT NULL,
    agreedToRules BOOLEAN NOT NULL DEFAULT FALSE,
    
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
    role ENUM('student', 'studentMentor','faculty','admin') NOT NULL DEFAULT 'student',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE uploads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    studentId BIGINT NOT NULL,
    dayNumber INT NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    fileContent LONGBLOB NOT NULL,
    uploadStatus ENUM('success', 'failed') NOT NULL DEFAULT 'success',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES registrations(idNumber),
    UNIQUE KEY unique_student_day (studentId, dayNumber)
);
