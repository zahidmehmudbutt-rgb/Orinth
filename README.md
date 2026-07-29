# School Management System

A complete school management platform with seven role-based portals, built as a
progressive web app with offline support and bilingual English / Urdu interfaces.

## Overview

School Management System covers the full operational surface of a school — enrolment, attendance,
homework, grading, messaging, announcements, and analytics — giving each type of
user a dashboard tailored to their role rather than one shared admin panel.

## Roles

| Role | Scope |
|---|---|
| Host | Platform administrator managing multiple schools |
| Principal | Full authority over a single school |
| Coordinator | Oversees a section or grade band |
| Class Teacher | Owns a homeroom class and its records |
| Teacher | Subject-level teaching and grading |
| Student | Personal timetable, homework, and results |
| Parent | Read access to their children's records |

## Features

- **Attendance** — daily register with per-class and per-student history
- **Homework** — assignment, submission, and calendar views
- **Grading & exams** — mark entry, result compilation, PDF report export
- **Messaging & chat** — direct and group messaging between roles
- **Announcements** — school-wide and targeted notices
- **Analytics** — performance dashboards and leaderboards
- **Bulk import** — spreadsheet-based onboarding of students and staff
- **Two-factor authentication** — TOTP-based, with recovery codes
- **Internationalisation** — English and Urdu, with RTL-aware layout
- **PWA** — installable, with offline fallback via service worker

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with a token-driven design system (shadcn/ui + Radix primitives)
- **Supabase** — Postgres, authentication, storage, row-level security
- **Recharts** for analytics, **jsPDF** + **html2canvas** for report export
- **Vitest** for unit tests, **Workbox** for the service worker

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A Supabase project

### Installation

```bash
git clone https://github.com/zahidmehmudbutt-rgb/school-management-system.git
cd school-management-system
npm install
cp .env.example .env
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_RESEND_API_KEY="your-resend-api-key"
```

### Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # serve the production build locally
npm run test     # run the unit test suite
```

## Demo Accounts

| Role | Login | Password |
|------|-------|----------|
| Principal | principal@demo.com | Demo123$ |
| Coordinator | coordinator@demo.com | Demo123$ |
| Class Teacher | classteacher@demo.com | Demo123$ |
| Teacher | teacher@demo.com | Demo123$ |
| Student | DEMO001 | Demo123$ |
| Parent | parent@demo.com | Demo123$ |

> Host access is restricted to platform administrators only.

## Project Structure

```
src/
├── components/     # Feature components, grouped by domain
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── i18n/locales/   # en.json, ur.json
├── integrations/   # Supabase client and generated types
├── lib/            # Utilities, email templates, crypto helpers
└── pages/          # Route-level views, one directory per role
    ├── host/
    ├── principal/
    ├── coordinator/
    ├── class-teacher/
    ├── teacher/
    ├── student/
    └── parent/
supabase/           # Schema and migrations
```

## Database Schema

- `schools` — School information
- `profiles` — User profiles
- `user_roles` — Role assignments
- `classes` — Class/section data
- `students` — Student records
- `teacher_classes` — Teacher-class-subject assignments
- `homework` — Homework assignments
- `homework_submissions` — Student submissions with grades
- `attendance` — Daily attendance records
- `notices` — School announcements
- `parent_students` — Parent-child relationships

## Design System

Visual identity is defined entirely as HSL CSS custom properties in
`src/index.css`. Colour, radius, shadow, and gradient tokens cascade to every
component, so the whole application can be retinted from that one layer.

## License

MIT License
