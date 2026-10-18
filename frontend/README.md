# Student Companion AI — Frontend Architecture & Guide

> **Brand Concept**: Campus Companion  
> **Primary Tagline**: *"Your campus day, made simpler."*  
> **Architecture**: React + Vite + React Router + Supabase Auth + FastAPI Gateway + Google Drive + Google Gemini  

Student Companion AI is a production-quality centralized academic platform integrating syllabus-grounded Gemini AI study assistance, institutional Google Drive document management, and college workflow management across three distinct user roles:

1. **Student Portal** (`/student/*`): Syllabus Q&A with Gemini grounded in uploaded Drive notes, document management, complaint filing, leave applications, certificate requests, and live announcement tracking.
2. **Faculty & Department Staff Portal** (`/staff/*`): Department triage inbox, student request review, status transitions, confidential internal notes, and department notice broadcasts.
3. **College Administrator Portal** (`/admin/*`): Institutional executive oversight, department registration, user directory and controlled role provisioning, college-wide request governance, campus bulletin broadcasts, and immutable security audit logs.

---

## 1. Technology Stack

- **Framework**: React 19 + Vite 8
- **Language**: JavaScript (ESM)
- **Routing**: React Router DOM (Declarative nested layouts, `ProtectedRoute`, and `RoleGuard`)
- **Authentication**: Supabase Auth JavaScript Client (`@supabase/supabase-js`)
- **Backend API Gateway**: Python FastAPI running on `http://localhost:8000`
- **File Storage**: College-controlled Central Google Drive vault (brokered exclusively via FastAPI; zero Drive secrets exposed to frontend)
- **AI Integration**: Google Gemini 2.5 Flash with PostgreSQL full-text and vector chunk grounding
- **Iconography**: Lucide React
- **Test Framework**: Vitest + `@testing-library/react` + `@testing-library/jest-dom`

---

## 2. Environment Configuration

Frontend environment variables are configured in `.env.local` (which is strictly ignored by Git via `*.local` in `.gitignore`).

Template provided in `.env.example`:
```env
# Supabase Configuration (Public credentials only)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_key_placeholder

# FastAPI Gateway Base URL
VITE_API_BASE_URL=http://localhost:8000
```

> **Security Mandate**: Never place service-role keys, Google Service Account JSON files, or Gemini API keys in the frontend repository or `VITE_` variables.

---

## 3. Getting Started

### Install Dependencies
```bash
cd frontend
npm install
```

### Run Local Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5174/` (or `http://localhost:5173/`).

### Run Test Suite
```bash
npm test
```
Executes Vitest covering status badge design tokens, public routing, auth guards, and multi-step request wizards.

### Run Linter
```bash
npm run lint
```

### Production Build
```bash
npm run build
```
Creates an optimized static bundle in the `dist/` directory ready for deployment.

---

## 4. Role-Based Route Architecture

| Route Group | Route Path | Component | Purpose |
| :--- | :--- | :--- | :--- |
| **Public** | `/` | `LandingPage` | Campus value proposition, feature preview, and CTA |
| **Public** | `/login` | `LoginPage` | College email sign-in, Google OAuth, & QA role switcher |
| **Public** | `/signup` | `SignupPage` | Student onboarding registration |
| **Public** | `/forgot-password` | `ForgotPasswordPage` | Institutional password recovery dispatch |
| **Public** | `/reset-password` | `ResetPasswordPage` | Password update entrypoint |
| **Public** | `/auth/callback` | `AuthCallbackPage` | OAuth and email link session resolution |
| **Public** | `/complete-profile` | `CompleteProfilePage` | Mandatory student semester and roll number setup |
| **Public** | `/unauthorized` | `UnauthorizedPage` | Informative 403 access barrier |
| **Student** | `/student/dashboard` | `StudentDashboard` | Personalized stats, shortcuts, recent activity |
| **Student** | `/student/study` | `StudyAssistantPage` | Gemini AI chat grounded in selected Drive notes |
| **Student** | `/student/study/documents`| `StudyDocumentsPage` | Google Drive vault listing, 25MB drag-and-drop upload |
| **Student** | `/student/study/documents/:id` | `DocumentDetailPage` | Page count, chunk status, delete & retry actions |
| **Student** | `/student/study/history` | `StudyHistoryPage` | Archived Gemini conversation dialogues |
| **Student** | `/student/requests` | `StudentRequestsPage` | Filterable list of complaints, leaves, certificates |
| **Student** | `/student/requests/new` | `NewRequestPage` | 4-step wizard generating real tracking references |
| **Student** | `/student/requests/:id` | `RequestDetailPage` | Audit timeline, student comments (staff notes hidden) |
| **Student** | `/student/announcements`| `AnnouncementsPage` | Official campus bulletins and category filters |
| **Student** | `/student/announcements/:id`| `AnnouncementDetailPage`| Full circular text with verification seal |
| **Student** | `/student/profile` | `StudentProfilePage` | Academic records and contact preferences |
| **Student** | `/student/settings` | `StudentSettingsPage` | Notifications, session management, and portal switcher |
| **Staff** | `/staff/dashboard` | `StaffDashboard` | Triage queue counts, review queues, department scope |
| **Staff** | `/staff/requests` | `StaffRequestsPage` | Department inbox, status badges, search |
| **Staff** | `/staff/requests/:id` | `StaffRequestDetailPage`| Status transitions, public replies & confidential notes |
| **Staff** | `/staff/announcements` | `StaffAnnouncementsPage`| Department notices draft and publishing |
| **Staff** | `/staff/profile` | `StaffProfilePage` | Faculty advisor profile, office hours |
| **Admin** | `/admin/dashboard` | `AdminDashboard` | Campus-wide enrollment metrics and audit rollup |
| **Admin** | `/admin/departments` | `AdminDepartmentsPage` | Department registration, active toggles, code index |
| **Admin** | `/admin/users` | `AdminUsersPage` | User directory, controlled role provisioning |
| **Admin** | `/admin/requests` | `AdminRequestsPage` | College-wide request governance and triage |
| **Admin** | `/admin/announcements`| `AdminAnnouncementsPage`| Broadcast campus bulletins to all students and staff |
| **Admin** | `/admin/audit` | `AdminAuditPage` | Immutable audit trail for security and governance |
| **Admin** | `/admin/settings` | `AdminSettingsPage` | Infrastructure status, health probes, zero-trust policy |
| **Global** | `*` | `NotFoundPage` | Friendly 404 navigation recovery |

---

## 5. Security & Accessibility Highlights

- **Zero-Trust Token Forwarding**: Every authenticated API call automatically attaches the user's Supabase session Bearer token via `src/lib/apiClient.js`.
- **Confidential Staff Notes**: Internal advisor remarks are strictly separated from student views both in the UI and in backend endpoints.
- **Trusted Profile Roles**: Route authorization evaluates the database profile role resolved from Supabase/FastAPI, never editable query parameters.
- **Accessible Form Elements**: All inputs feature linked `<label htmlFor="...">` associations, visible focus indicators, screen-reader status alerts, and keyboard navigation.
