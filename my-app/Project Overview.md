🔧 **Project Description: Social Internship Management System**

This is a **Next.js-based full-stack internship management platform** tailored to handle student internships with different stakeholders: Students, StudentLeads, FacultyMentors, and Admins. It supports both in-campus and remote internship modes, and manages tasks like daily reporting, mentor assignment, attendance tracking, and final submission reviews.

---

📁 **Folder Structure**
```
src/
├── app/
│   ├── (pages)/
│   │   ├── auth/                   # Login, reset password pages
│   │   ├── dashboard/
│   │   │   ├── admin/             # Admin dashboard
│   │   │   ├── student/           # Student dashboard
│   │   │   ├── studentMentor/     # FacultyMentor dashboard
│   │   │   └── studentLead/       # StudentLead dashboard
│   │   └── internship/            # Info pages for internship
│   ├── api/
│   │   ├── auth/                  # JWT-based auth routes
│   │   ├── dashboard/
│   │   │   ├── admin/             # Admin-specific endpoints
│   │   │   ├── student/           # Student actions like reports
│   │   │   ├── studentMentor/     # FacultyMentor actions
│   │   │   └── studentLead/       # StudentLead verification, review
│   └── Data/                      # Domain, location, rules
├── lib/                           # Utility files like db, jwt
├── components/                    # UI Components
├── context/                       # AuthContext for state
└── scripts/                       # DB seeders like insert.js
```

---

🧠 **Role & Workflow Logic**

### 🎓 Student Dashboard (dashboard/student)
- Submit daily internship report
- View assigned StudentLead & domain details
- Final report is submitted on Day 10
- Modes:
  - Remote: all 10 days are remote
  - In-campus: 7 days campus + 3 remote

### 🧑‍🎓 StudentLead Dashboard (dashboard/studentLead)
- Verifies daily submissions from ~30 students
- Views completed students
- After verification, reports are visible to FacultyMentor
- After 7 days, StudentLead should:
  - Automatically fetch newly assigned students
  - Distinguish between:
    - **Past week students** (internship completed)
    - **Newly assigned students** (current active batch)
  - Display both groups in separate tables

### 🧑‍🏫 FacultyMentor Dashboard (dashboard/studentMentor)
- Assigned to ~2 StudentLeads (~60 students)
- Marks attendance after StudentLead verification
- Views StudentLeads and student progress

### 🧑‍💼 Admin Dashboard (dashboard/admin)
- Full visibility: students, StudentLeads, FacultyMentors
- Only Admin can mark final approval on Day 10
- Can override or access all data if needed

---

📆 **Internship Schedule & Allocation**
- **Total Students:** 4659
  - In-campus: 1200
  - Remote: 3459
- **StudentLeads:** 40 (30 remote-only, 10 in-campus)
- **FacultyMentors:** 20 (15 remote-only, 5 in-campus)
- **Slot size:** 7 days + 3 remote days (for in-campus)
- **Weekly Capacity:** 1200 students/week
  - 900 remote
  - 300 in-campus
- **Internship Duration:** May 11 - June 7 (4 weeks)

---

✅ **Features**
- [x] Role-based dashboards
- [x] Auth with JWT (`lib/jwt.js`)
- [x] Student submissions API (`api/dashboard/student/reports`)
- [x] StudentLead verifications API (`api/dashboard/studentLead/verify`)
- [x] FacultyMentor attendance API (`api/dashboard/studentMentor/attendance`)
- [x] Admin review and final approval API
- [x] Email notification integration (`lib/email.js`)
- [x] UI polishing for each dashboard

---

🛠️ **Development Notes**
- Use `context/AuthContext.js` for role/session management
- All protected routes use JWT tokens with middleware in `middleware.js`
- DB connection via `lib/db.js` using `mysql2`
- Passwords are hashed via `bcryptjs`
- All dates and submissions tracked in MySQL tables defined in `lib/tables.sql`

