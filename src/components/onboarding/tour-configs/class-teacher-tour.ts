import type { DriveStep } from "driver.js";

export function getClassTeacherTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;
  const steps: DriveStep[] = [
    {
      element: '[data-tour="ct-header"]',
      popover: {
        title: "Welcome!",
        description:
          "This is your class teacher dashboard. Manage your class, take attendance, and track students.",
        side: "bottom",
        align: "center",
      },
    },
    ...(isMobile
      ? [
          {
            element: '[data-tour="ct-mobile-nav"]',
            popover: {
              title: "Navigation",
              description:
                "Use these icons to switch between Attendance, Students, Announcements, Analytics, and Account.",
              side: "top" as const,
              align: "center" as const,
            },
          },
        ]
      : [
          {
            element: '[data-tour="ct-tabs"]',
            popover: {
              title: "Navigation Tabs",
              description:
                "Switch between Attendance, Students, Announcements, Analytics, and Account using these tabs.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
        ]),
    {
      element: '[data-tour="ct-stats"]',
      popover: {
        title: "Attendance Stats",
        description:
          "See today's attendance summary at a glance -- total students, present, and absent counts.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="ct-attendance"]',
      popover: {
        title: "Mark Attendance",
        description:
          "Check or uncheck each student to mark them present or absent for today.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ct-save-attendance"]',
      popover: {
        title: "Save Attendance",
        description:
          "Click here to save today's attendance. You can update it later if needed.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ct-add-student"]',
      popover: {
        title: "Add Students",
        description:
          "Add new students to your class here. Each student gets a login account automatically.",
        side: "right",
        align: "start",
      },
    },
  ];
  return steps;
}
