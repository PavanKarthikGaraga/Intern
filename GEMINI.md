# GEMINI.md - Internship Management System

This document provides context and instructions for AI agents working on the **Internship Management System**, a Next.js-based social internship platform.

## Project Overview
A comprehensive full-stack application designed to manage student internships, facilitate faculty-student-mentor interactions, and track program impact.

- **Primary Framework:** Next.js 15.1.x (App Router)
- **Language:** JavaScript (ESM)
- **Frontend:** React 19, Ant Design, Tailwind CSS (implied), Recharts, Lucide Icons.
- **Backend:** Next.js API Routes (located in `my-app/src/app/api`).
- **Database:** MySQL via `mysql2/promise` with connection pooling.
- **Authentication:** JWT-based role-based access control (RBAC) using `jose` and middleware-level route protection.
- **Key Features:** Analytics dashboards, PDF report generation, Excel data processing, Email notifications (Nodemailer), and Task queues (Bull).

## Architecture & Directory Structure
The main application is located in the `my-app/` subdirectory.

```text
my-app/
├── src/
│   ├── app/                # App Router: Pages and API routes
│   │   ├── (pages)/        # Authenticated route groups (dashboard/auth)
│   │   ├── api/            # Backend API endpoints
│   │   ├── components/     # UI components
│   │   ├── Data/           # Static data/constants
│   │   └── layout.js       # Root layout
│   ├── components/         # Shared React components (Navbar, Footer, etc.)
│   ├── context/            # AuthContext for global state
│   ├── email-templates/    # HTML templates for emails
│   ├── lib/                # Core utilities (db.js, jwt.js, email.js)
│   └── middleware.js       # Auth and RBAC logic
├── public/                 # Static assets (fonts, images)
└── package.json            # Dependencies and scripts
```

## Development Workflow

### Prerequisites
- Node.js (v18+)
- MySQL Instance
- Bun or NPM

### Setup & Run
```bash
cd my-app
npm install
# Configure .env (see README.md for keys)
npm run dev
```

### Key Commands
- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint for code quality checks.

## Coding Conventions & Guidelines

### 1. State Management
- Use **React Context API** (`src/context/AuthContext.js`) for global authentication state.
- Prefer local component state (`useState`, `useReducer`) for dashboard-specific UI logic.

### 2. API & Data Fetching
- API routes are located in `src/app/api`.
- Use the `mysql2/promise` pool from `src/lib/db.js` for database queries.
- **Always** use parameterized queries to prevent SQL injection.
- Standard response format: `{ message: "...", data: [...] }`.

### 3. Authentication & Security
- Routes are protected via `src/middleware.js`.
- JWT tokens are stored in cookies (`accessToken`).
- Role-based redirection is enforced in the middleware (Admin, Faculty, Student, StudentLead).
- Use `bcryptjs` for any password hashing operations.

### 4. UI & Components
- Use **Ant Design (antd)** for complex UI elements like tables, modals, and forms.
- Use **Lucide React** for consistent iconography.
- Data visualizations should use **Recharts**.
- PDF generation logic resides in `src/app/(pages)/reportGenerator` and utilizes `jspdf`/`pdf-lib`.

### 5. Utility Logic
- **Database:** `src/lib/db.js`
- **Email:** `src/lib/email.js` using Nodemailer.
- **JWT:** `src/lib/jwt.js` using `jose` for edge-compatible token verification.

## Testing & Validation
- Ensure new API routes are tested for both success and failure (4xx/5xx) states.
- Validate RBAC by attempting to access restricted dashboard paths with different user roles.
- Run `npm run lint` before committing to ensure style consistency.
