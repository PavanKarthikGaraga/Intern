# 🌱 Social Internship Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![MySQL](https://img.shields.io/badge/MySQL-2-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A comprehensive platform to manage, track, and report on student social internship programs — from registration to certification.**

</div>

---

## 📋 Overview

The **Social Internship Platform** is a full-stack web application built to facilitate a **7-day intensive social internship program**. It supports three participation modes — **Remote**, **In-Campus**, and **In-Village** — enabling students to create measurable, documented social change while administrators and mentors maintain full visibility over every stage of the program.

The platform handles the complete internship lifecycle: user onboarding, day-by-day task tracking, report book submission, payment verification, and automated certificate generation and distribution.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication & Authorization** | Secure role-based access with JWT (access + refresh tokens) |
| 👥 **Multi-Role Dashboards** | Dedicated interfaces for Students, Admins, Faculty Mentors, and Student Leads |
| 🗓️ **Multi-Mode Internship Tracking** | Supports Remote, In-Campus, and In-Village participation modes |
| 📊 **Impact Statistics & Reporting** | Visual dashboards with charts powered by Recharts |
| 📧 **Automated Email Notifications** | Nodemailer integration with Office365 for transactional emails |
| 📄 **PDF & Certificate Generation** | Automated certificate creation using pdf-lib and Canvas |
| 📘 **Report Book Workflow** | End-to-end submission, review, approval, and printing pipeline |
| 📁 **Excel Export** | Program data export via ExcelJS for administrative reporting |

---

## 🧩 Architecture & Roles

```
Social Internship Platform
├── Student Dashboard       — Tasks, report submission, surveys, certificates
├── Admin Dashboard         — Student management, approvals, payment verification
├── Faculty Mentor Dashboard — Student oversight and evaluation
└── Student Lead Dashboard  — Team coordination and group reporting
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/)
- A running **MySQL** database instance

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PavanKarthikGaraga/Intern.git
   cd Intern
   ```

2. **Navigate to the application directory:**
   ```bash
   cd my-app
   ```

3. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

4. **Configure environment variables** (see [Environment Variables](#-environment-variables) below).

5. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env` file inside the `my-app/` directory with the following configuration:

```env
# ─── Database Configuration ───────────────────────────────────
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

# ─── JWT Secrets (use strong random strings) ──────────────────
ACCESS_TOKEN=
REFRESH_TOKEN=

# ─── Email Service (Office365 / Nodemailer) ───────────────────
USER_EMAIL=
USER_PASSWORD=

# ─── Environment ──────────────────────────────────────────────
NODE_ENV=development
```

> **⚠️ Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 🛠️ Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 15 | React framework with App Router & Turbopack |
| [React](https://react.dev/) | 19 | UI rendering |
| [Ant Design](https://ant.design/) | 5 | UI component library |
| [Lucide React](https://lucide.dev/) | latest | Icon library |
| [React Icons](https://react-icons.github.io/) | 5 | Extended icon set |
| [Recharts](https://recharts.org/) | 2 | Data visualization & charts |
| [React Hot Toast](https://react-hot-toast.com/) | 2 | Toast notifications |
| [html2canvas](https://html2canvas.hertzen.com/) | 1 | HTML to image rendering |
| [jsPDF](https://artskydj.github.io/jsPDF/) | 3 | Client-side PDF generation |

### Backend & Data
| Package | Version | Purpose |
|---|---|---|
| [MySQL2](https://github.com/sidorares/node-mysql2) | 3 | MySQL database driver |
| [Jose](https://github.com/panva/jose) | 6 | JWT signing and verification |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3 | Password hashing |
| [Nodemailer](https://nodemailer.com/) | 6 | Email delivery |
| [Axios](https://axios-http.com/) | 1 | HTTP client |
| [Bull](https://github.com/OptimalBits/bull) | 4 | Job queue for background tasks |

### Document & Export
| Package | Version | Purpose |
|---|---|---|
| [pdf-lib](https://pdf-lib.js.org/) | 1 | Programmatic PDF generation |
| [ExcelJS](https://github.com/exceljs/exceljs) | 4 | Excel spreadsheet creation |
| [JSZip](https://stuk.github.io/jszip/) | 3 | ZIP archive generation |
| [pdfjs-dist](https://mozilla.github.io/pdf.js/) | 4 | PDF rendering and preview |

---

## 📑 Report Book Workflow

The report book submission follows a structured multi-step process:

```
Student                   Admin                    Student (post-approval)
  │                         │                              │
  ├─ Submits Adobe Express   │                              │
  │  report link ──────────► │                              │
  │                         ├─ Reviews submission           │
  │                         ├─ Approves / Rejects ─────────►│
  │                         │                              │
  │                         │                   ┌──────────┴──────────┐
  │                         │                   │  Printing Options   │
  │                         │                   ├─────────────────────┤
  │                         │                   │ Self-print          │
  │                         │                   │ (PDF via email)     │
  │                         │                   ├─────────────────────┤
  │                         │                   │ College-assisted    │
  │                         │                   │ (₹500 via UPI,      │
  │                         │                   │  collect at SAC)    │
  │                         │◄──── Payment ─────┘
  │                         ├─ Verifies payment
  │                         └─ Processes printing
```

---

## 📜 Available Scripts

Run the following commands from within the `my-app/` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with Turbopack |
| `npm run build` | Create an optimized production build |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint to check for code issues |

---

## 📂 Project Structure

```
Intern/
├── my-app/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (pages)/
│   │   │   │   ├── auth/           # Login & authentication pages
│   │   │   │   ├── register/       # Student registration
│   │   │   │   └── dashboard/
│   │   │   │       ├── admin/      # Admin dashboard
│   │   │   │       ├── student/    # Student dashboard
│   │   │   │       ├── facultyMentor/  # Faculty mentor dashboard
│   │   │   │       └── studentLead/    # Student lead dashboard
│   │   │   ├── api/                # Next.js API routes
│   │   │   └── layout.js           # Root layout
│   │   ├── components/             # Shared UI components
│   │   ├── context/                # React context providers
│   │   ├── email-templates/        # HTML email templates
│   │   ├── lib/                    # Utility functions & DB helpers
│   │   └── middleware.js           # Auth & route protection middleware
│   ├── public/                     # Static assets
│   └── package.json
├── LICENSE
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright © 2025 Pavan Karthik

---

<div align="center">
  <sub>Last updated: May 2026</sub>
</div>