# School Smart Pakistan

A comprehensive school management system designed for Pakistani schools.

## Live Demo

**URL**: https://school-smart-pakistan.vercel.app/

## Features

### User Roles (7 Types)
- **Host** - Platform administrator managing multiple schools
- **Principal** - School administrator managing coordinators and staff
- **Coordinator** - Section head managing teachers
- **Class Teacher** - Manages students and attendance for their class
- **Teacher** - Creates homework and grades submissions
- **Student** - Views homework, submits assignments, checks attendance
- **Parent** - Monitors child's academic progress

### Core Features
- Multi-tenant architecture (multiple schools)
- Role-based access control with RLS policies
- Student attendance tracking
- Homework management with file uploads
- Grading system (0-10 marks)
- School notices and announcements
- Parent dashboard for monitoring children

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **Email**: Resend (configured, integration pending)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/khuzaimabutt/school-smart-pakistan.git

# Navigate to project directory
cd school-smart-pakistan

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_RESEND_API_KEY="your-resend-api-key"
```

## Demo Accounts

| Role | Login | Password |
|------|-------|----------|
| Host | ikrma434@gmail.com | Khuzaimaqwe123$ |
| Principal | principal@demo.com | Demo123$ |
| Coordinator | coordinator@demo.com | Demo123$ |
| Class Teacher | classteacher@demo.com | Demo123$ |
| Teacher | teacher@demo.com | Demo123$ |
| Student | DEMO001 | Demo123$ |
| Parent | parent@demo.com | Demo123$ |

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client and types
├── lib/            # Utility functions
└── pages/          # Page components by role
    ├── host/
    ├── principal/
    ├── coordinator/
    ├── class-teacher/
    ├── teacher/
    ├── student/
    └── parent/
```

## Database Schema

- `schools` - School information
- `profiles` - User profiles
- `user_roles` - Role assignments
- `classes` - Class/section data
- `students` - Student records
- `teacher_classes` - Teacher-class-subject assignments
- `homework` - Homework assignments
- `homework_submissions` - Student submissions with grades
- `attendance` - Daily attendance records
- `notices` - School announcements
- `parent_students` - Parent-child relationships

## License

MIT License

## Author

Khuzaima Butt - [@khuzaimabutt](https://github.com/khuzaimabutt)
