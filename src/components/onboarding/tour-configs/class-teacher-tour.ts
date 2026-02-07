import type { DriveStep } from "driver.js";

export function getClassTeacherTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;

  const steps: DriveStep[] = [
    {
      element: '[data-tour="ct-header"]',
      popover: {
        title: "Welcome, Class Teacher!",
        description: "This is your Class Teacher Dashboard. Manage your class attendance, students, and announcements from here.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="ct-stats"]',
      popover: {
        title: "Quick Stats",
        description: "See your class at a glance — total students, how many are present today, and how many are absent.",
        side: "bottom",
        align: "center",
      },
    },
  ];

  if (isMobile) {
    steps.push({
      element: '[data-tour="ct-mobile-nav"]',
      popover: {
        title: "Navigation Bar",
        description: "Use these tabs to switch between Attendance, Students, Announcements, Analytics, and Account.",
        side: "top",
        align: "center",
      },
    });
  } else {
    steps.push({
      element: '[data-tour="ct-tabs"]',
      popover: {
        title: "Navigation Tabs",
        description: "Switch between Attendance, Students, Announcements, Analytics, and Account using these tabs.",
        side: "bottom",
        align: "center",
      },
    });
  }

  steps.push(
    {
      element: '[data-tour="ct-attendance"]',
      popover: {
        title: "Mark Attendance",
        description: "Click each student's row to toggle between Present and Absent. Attendance can be edited on the same day.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ct-save-attendance"]',
      popover: {
        title: "Save Attendance",
        description: "After marking everyone, click this button to save. If you already saved today, it'll update instead.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ct-add-student"]',
      popover: {
        title: "Add Students",
        description: "Go to the Students tab to add new students to your class. Each student gets an automatic login account.",
        side: "top",
        align: "center",
      },
    },
  );

  return steps;
}
