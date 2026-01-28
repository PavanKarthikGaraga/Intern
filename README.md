# my-app

A comprehensive Social Internship Platform designed to manage and track the impact of student internship programs. This application facilitates a 7-day intensive program where students can participate through Remote, In-Campus, or In-Village modes to create measurable social change.

Key features include:
- User management and authentication
- Multi-mode internship tracking (Remote, In-Campus, Village)
- Impact statistics and reporting
- Automated email notifications
- PDF report generation

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js
- npm or bun

### Installation

1. Navigate to the project directory:
   ```bash
   cd my-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

### Running the Application

To run the development server:

```bash
npm run dev
# or
bun dev
```

Open http://localhost:3000 with your browser to see the result.

## Environment Variables

This application requires the following environment variables to be set in a `.env` file in the `my-app` directory.

Create a `.env` file with the following keys:

```
# Database Configuration
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

# JWT Secrets (Random strings for signing tokens)
ACCESS_TOKEN=
REFRESH_TOKEN=

# Email Service Configuration (Office365)
USER_EMAIL=
USER_PASSWORD=

# Environment (development or production)
NODE_ENV=
```

## Technologies Used

- Next.js
- React
- MySQL2
- Tailwind CSS
- Jose (JWT)
- Nodemailer