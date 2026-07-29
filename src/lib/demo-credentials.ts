/**
 * Demo accounts surfaced on each portal's login screen.
 *
 * These are seeded demonstration logins for the public demo deployment — they
 * are already published in the README and carry no real data. Keep this file as
 * the single source of truth so the login hints and the README cannot drift.
 */

export interface DemoCredential {
  /** Portal name, shown as the dropdown heading */
  label: string;
  /** Email address, or roll number for the student portal */
  identifier: string;
  /** What the identifier actually is, since the student portal differs */
  identifierLabel: string;
  password: string;
}

export const DEMO_CREDENTIALS = {
  principal: {
    label: "Principal",
    identifier: "principal@demo.com",
    identifierLabel: "Email",
    password: "Demo123$",
  },
  coordinator: {
    label: "Coordinator",
    identifier: "coordinator@demo.com",
    identifierLabel: "Email",
    password: "Demo123$",
  },
  classTeacher: {
    label: "Class Teacher",
    identifier: "classteacher@demo.com",
    identifierLabel: "Email",
    password: "Demo123$",
  },
  teacher: {
    label: "Teacher",
    identifier: "teacher@demo.com",
    identifierLabel: "Email",
    password: "Demo123$",
  },
  student: {
    label: "Student",
    identifier: "DEMO001",
    identifierLabel: "Roll number",
    password: "Demo123$",
  },
  parent: {
    label: "Parent",
    identifier: "parent@demo.com",
    identifierLabel: "Email",
    password: "Demo123$",
  },
} satisfies Record<string, DemoCredential>;

export type DemoPortal = keyof typeof DEMO_CREDENTIALS;
