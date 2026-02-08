import type { DriveStep } from "driver.js";

export function getStudentTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;
  const steps: DriveStep[] = [
    {
      element: '[data-tour="student-header"]',
      popover: {
        title: "Welcome!",
        description: "This is your student dashboard. Let's take a quick tour of the key features.",
        side: "bottom",
        align: "center",
      },
    },
    ...(isMobile
      ? [
          {
            element: '[data-tour="student-mobile-nav"]',
            popover: {
              title: "Navigation",
              description:
                "Use these icons to switch between sections like Homework, Attendance, Marks, Results, and Notices.",
              side: "top" as const,
              align: "center" as const,
            },
          },
        ]
      : [
          {
            element: '[data-tour="student-tabs"]',
            popover: {
              title: "Navigation Tabs",
              description:
                "Switch between Homework, Attendance, Marks, Yearly Results, Notices, and Account using these tabs.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
        ]),
    {
      element: '[data-tour="student-chat"]',
      popover: {
        title: "Chat",
        description: "Message your classmates and teachers in real-time.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="student-notifications"]',
      popover: {
        title: "Notifications",
        description:
          "Stay updated with announcements, homework reminders, and results.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="student-theme-toggle"]',
      popover: {
        title: "Dark Mode",
        description: "Toggle between light and dark mode for comfortable viewing.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="student-view-toggle"]',
      popover: {
        title: "Homework Views",
        description:
          "Switch between list and calendar views to see your homework in a way that works best for you.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="student-upload-btn"]',
      popover: {
        title: "Submit Homework",
        description:
          "Upload your completed homework here. Supported formats: PDF, images, and Word documents.",
        side: "top",
        align: "center",
      },
    },
  ];
  return steps;
}
