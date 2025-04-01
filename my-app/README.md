I'll help analyze the codebase to create a comprehensive description that would help an AI model understand the project. Let me gather information about the key components.

First, let me look at the main structure and key files.


Ran tool
Let me check the package.json to understand the project dependencies and structure.


Read file: package.json
Let me check the main application structure in the src directory.


Ran tool
Let me check the app directory structure to understand the main application components.



Ran tool
Let me check the pages directory to understand the main application routes.


Ran tool
Let me check the API routes to understand the backend functionality.



Ran tool
Let me check the dashboard API routes to understand the core functionality.



Ran tool
Let me check the admin dashboard API to understand the admin functionality.



Ran tool
Let me check the admin dashboard page to understand the frontend implementation.


Read file: src/app/(pages)/dashboard/admin/page.js
Based on my analysis of the codebase, I can provide a comprehensive description that would help an AI model understand the project:

# Project Overview: Internship Management System

This is a full-stack web application built using Next.js for managing student internships, with a focus on faculty-student-mentor interactions. The system implements a role-based access control system with three main user types: Admin, Faculty, and Students.

## Technical Stack
- **Frontend**: Next.js 15.2.3 with React 19
- **Backend**: Next.js API Routes
- **Database**: MySQL (using mysql2)
- **Authentication**: JWT-based authentication (jsonwebtoken)
- **UI Components**: Custom components with Recharts for data visualization
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Security**: bcryptjs for password hashing

## Core Features

### 1. Authentication System
- JWT-based authentication with role-based access control
- Secure password hashing using bcryptjs
- Protected routes using middleware
- Login/logout functionality for all user types

### 2. Admin Dashboard
- Comprehensive analytics dashboard with:
  - Total students and completion statistics
  - Domain-wise student distribution (pie chart)
  - Branch-wise student distribution (bar chart)
- Faculty management system
  - Add new faculty members
  - View faculty list
- Student management
  - View student details in modal
  - Track student progress
- Mentor management
  - View mentor details in modal
  - Track mentor assignments

### 3. Faculty Dashboard
- Student progress monitoring
- Report management
- Upload management for student documents
- Faculty-specific analytics

### 4. Student Dashboard
- Internship progress tracking
- Report submission
- Document uploads
- Mentor interaction

### 5. Data Management
- Structured database schema for:
  - Users (admin, faculty, students, mentors)
  - Internships
  - Reports
  - Uploads
  - Statistics

## Key Components

### API Structure
```
/api
├── auth/         # Authentication endpoints
├── dashboard/    # Dashboard-specific endpoints
│   ├── admin/    # Admin operations
│   ├── faculty/  # Faculty operations
│   └── student/  # Student operations
└── register/     # Registration endpoints
```

### Frontend Structure
```
src/
├── app/          # Next.js app directory
│   ├── (pages)/  # Application pages
│   │   ├── dashboard/  # Dashboard pages
│   │   ├── auth/      # Authentication pages
│   │   └── internship/ # Internship pages
│   └── api/      # API routes
├── context/      # React context providers
└── lib/          # Utility functions
```

## Security Features
- JWT-based authentication
- Password hashing
- Role-based access control
- Protected API routes
- Secure file uploads

## Data Visualization
- Interactive charts using Recharts
- Real-time statistics updates
- Responsive design for all screen sizes

## State Management
- Centralized authentication state
- Dashboard-specific state management
- Modal state management for details view

This system is designed to streamline the internship management process by providing a centralized platform for all stakeholders (admin, faculty, students, and mentors) to interact and manage the internship workflow efficiently.

The codebase follows modern React practices with Next.js, implementing server-side rendering where appropriate and client-side interactivity where needed. The architecture is modular and scalable, with clear separation of concerns between frontend and backend components.
