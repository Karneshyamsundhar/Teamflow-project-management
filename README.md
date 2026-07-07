<<<<<<< HEAD
# TeamFlow — Enterprise-Grade Project & Incident Management Workspace

TeamFlow is a high-performance, responsive full-stack SaaS application engineered for modern engineering departments and cross-functional task planning. Adopting premium aesthetic cues from leading modern systems (such as Linear, Vercel, and Stripe), TeamFlow unifies agile board workspaces, incident response dispatchers, real-time analytics reports, secure role-based access control, and advanced user profiles under one cohesive environment.

---

## 🚀 Key Features

### 👤 Identity & Gateways
*   **Unified Enterprise Sign In / Sign Up**: Redesigned credential gates featuring beautiful glassmorphic visual layout, keyboard access, custom form validations, and password visibility controllers.
*   **Remember Me sessioning**: Preserves remembered work email securely across sessions.
*   **Forgot / Reset Password workflow**: Complete tokenized validation flow. Sends dynamic rich HTML reset forms via Nodemailer with local sandbox short-cuts to streamline browser testing.
*   **Password Strength Meter**: Dynamic regex-based analyzer grading password entropy with interactive progress bars.

### 🛡️ Role-Based Security (RBAC)
*   **Administrator (ID: 1)**: System-wide master controller. Oversees schema registers, establishes teams, and manages all workspace configurations.
*   **Project Manager (ID: 2)**: Core workflow planner. Schedules boards, defines tasks, assigns items to engineers, and drives incident resolution.
*   **Developer (ID: 3)**: Active engineer. Manipulates personal kanban boards, advances tasks from To-Do to Completed, and files risk incident alerts.

### 📋 Agile Kanban Board & Tasks
*   **Dual View Modes**: Switch between high-fidelity visual cards on a Kanban board or modular lists with column headers.
*   **Task State Tracking**: Fast column updates covering To-Do, In Progress, Review, and Completed.
*   **Advanced Task Attributes**: Priority color-coding, due-date visual indicators, task details view, and user avatars.

### 🚨 Incident Response Mitigation
*   **Severity Categorization**: High-contrast labels indicating risk (Low, Medium, High, Critical).
*   **Chronological Activity Streams**: Live feed summarizing user mutations and task state changes.

### 📊 Real-Time Workspaces & Reports
*   **Interactive Charts**: Data visualization using custom `Recharts` graphs showing task completion breakdown, priority volume, and incident risk allocation.
*   **Custom Saved Queries**: Save and filter project lists for persistent reporting sheets.

---

## 🛠️ Technology Stack

### Frontend Architecture
*   **React (v19)**: Component-based UI rendering.
*   **TypeScript**: Type-safety throughout.
*   **Vite**: Rapid Hot-Module compilation.
*   **Tailwind CSS**: High-utility spacing, grid systems, and adaptive responsive prefixes.
*   **Framer Motion**: Fluid entry transitions, layout morphing, and interactive micro-animations.
*   **Lucide React**: Clean vector icon library.

### Backend Engine
*   **Node.js & Express**: Extensible REST API.
*   **Prisma ORM**: Modern database mapping, typed client queries, and pre-seeded schemas.
*   **JSON Web Tokens (JWT)**: Stateless authorization keys.
*   **Bcrypt**: Safe password salt hashing.
*   **Nodemailer**: Secure transactional mail dispatcher.

---

## 📂 System Directory Layout

```
├── prisma/
│   ├── schema.prisma          # Database schema models (Roles, Users, Projects, Tasks, Incidents, etc.)
│   └── seed.ts                # Default seed data containing pre-populated sandbox users
├── server/
│   ├── controllers/
│   │   ├── authController.ts   # Registrations, profile updates, forgot, reset & change password endpoints
│   │   ├── incidentController.ts
│   │   ├── notificationController.ts
│   │   ├── projectController.ts
│   │   ├── reportController.ts
│   │   └── taskController.ts
│   ├── db/
│   │   ├── localDb.ts         # Pre-seeding checks and database hooks
│   │   └── prisma.ts          # Singleton Prisma Client instance
│   ├── middleware/
│   │   └── authMiddleware.ts  # JWT verification and route-level authorization (RBAC)
│   └── routes/
│       └── api.ts             # Global API endpoints routing map
├── src/
│   ├── components/            # Reusable UI primitives (Button, Card, Input, Loader, Modal, Toast)
│   ├── context/
│   │   └── AuthContext.tsx    # Global session and identity context
│   ├── pages/
│   │   ├── Dashboard.tsx      # Main work board metrics bento and Recharts visualizers
│   │   ├── ForgotPassword.tsx # Tokenized password restoration screen
│   │   ├── Incidents.tsx      # Core hazard dispatcher board
│   │   ├── Login.tsx          # Credentials entry gate with Sandbox Quick Login pre-fills
│   │   ├── NotFound.tsx       # 404 redirection landing screen
│   │   ├── Profile.tsx        # Personal settings & interactive Change Password card
│   │   ├── Projects.tsx       # Team board, member assignments, and project configurations
│   │   ├── Register.tsx       # Account creation portal with strength meter
│   │   ├── Reports.tsx        # High-fidelity metrics reports
│   │   └── Settings.tsx       # Preference selector (theme, notifications)
│   ├── App.tsx                # Client-side router maps
│   ├── main.tsx               # DOM entrypoint
│   └── index.css              # Global Tailwind variables and Google Font imports
├── server.ts                  # Backend server entry point
├── package.json               # System manifests and compilation scripts
└── vite.config.ts             # Frontend bundler configuration
```

---

## ⚙️ Environment Variables Setup

Ensure your `.env` file at the root contains the following keys:

```env
# Database Credentials
DATABASE_URL="mysql://username:password@localhost:3306/teamflow"

# Authentication Security keys
JWT_SECRET="teamflow_super_secret_jwt_key_9911"

# Email Configuration (Optional - fallback logs reset URLs directly in sandbox consoles)
SMTP_USER="smtp_username"
SMTP_PASS="smtp_password"
```

---

## 🔌 API Route Documentation

### 👤 Authentication & Users
*   `POST /api/auth/register` — Create a new workspace profile.
*   `POST /api/auth/login` — Sign in with work credentials. Retrieves bearer JWT.
*   `GET /api/auth/profile` — Fetch details of current logged-in user. *(Requires JWT)*
*   `PUT /api/auth/profile` — Edit personal name. *(Requires JWT)*
*   `GET /api/auth/users` — Fetch all system team members. *(Requires JWT)*
*   `POST /api/auth/forgot-password` — Requests password reset credentials. Generates temporary secure token.
*   `POST /api/auth/reset-password` — Validates token and securely updates user password.
*   `POST /api/auth/change-password` — Updates password for an active session. *(Requires JWT)*

### 📁 Projects
*   `GET /api/projects` — Fetch project boards associated with the user's role. *(Requires JWT)*
*   `POST /api/projects` — Create a new project workspace. *(Admins & Managers)*
*   `GET /api/projects/:id` — Fetch details and member rosters. *(Requires JWT)*
*   `PUT /api/projects/:id` — Edit project attributes. *(Admins & Managers)*
*   `DELETE /api/projects/:id` — Archive or delete project board. *(Admins & Managers)*
*   `POST /api/projects/:id/members` — Add a team member to the project roster. *(Admins & Managers)*
*   `DELETE /api/projects/:id/members/:userId` — Revoke user membership. *(Admins & Managers)*

### 📋 Tasks
*   `GET /api/tasks?projectId=X` — Fetch all tasks assigned under a project board. *(Requires JWT)*
*   `POST /api/tasks` — Create a task item. *(Requires JWT)*
*   `PUT /api/tasks/:id` — Edit task parameters. *(Requires JWT)*
*   `PUT /api/tasks/:id/status` — Drag and drop task status update. *(Requires JWT)*
*   `DELETE /api/tasks/:id` — Delete task. *(Requires JWT)*

### 🚨 Incidents
*   `GET /api/incidents` — Fetch workspace safety reports. *(Requires JWT)*
*   `POST /api/incidents` — File a new safety incident. *(Requires JWT)*
*   `PUT /api/incidents/:id` — Advance incident resolution state. *(Requires JWT)*
*   `DELETE /api/incidents/:id` — Delete safety incident. *(Requires JWT)*

---

## 📦 Local Installation Guide

### Prerequisites
*   Node.js (v18 or higher)
*   MySQL Server running locally or in a container

### Steps
1.  **Clone the Repository** and navigate to the directory:
    ```bash
    git clone https://github.com/your-org/teamflow.git
    cd teamflow
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run Database Migrations & Seeds**:
    ```bash
    npx prisma migrate dev --name init
    npx prisma db seed
    ```
4.  **Start Development Servers**:
    ```bash
    npm run dev
    ```
    The application will launch on `http://localhost:3000`.

---

## 🐳 Production Deployment Guide

To bundle and deploy TeamFlow inside container clusters (such as Cloud Run or AWS ECS):

1.  **Compile production files**:
    ```bash
    npm run build
    ```
    This triggers a production build. Esbuild bundles the backend code into `dist/server.cjs` and Vite compiles static SPA assets into `dist/`.
2.  **Launch Server**:
    ```bash
    npm run start
    ```
    The Express wrapper serves static compiled assets and API endpoints simultaneously from port `3000`.
=======
# Teamflow-project-management
Enterprise-grade Project ManagemenSystem built with React, TypeScript, Express.js, Prisma ORM, MySQL, JWT Authentication, and Tailwind CSS
>>>>>>> 5342f209b64dd744e8ccd906a1adb93317d1d8a2
