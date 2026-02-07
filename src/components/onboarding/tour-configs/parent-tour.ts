import type { DriveStep } from "driver.js";

export function getParentTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;

  const steps: DriveStep[] = [
    {
      element: '[data-tour="parent-header"]',
      popover: {
        title: "Welcome, Parent!",
        description: "This is your Parent Dashboard. Track your child's homework, attendance, results, and school notices.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-child-selector"]',
      popover: {
        title: "Select Your Child",
        description: "If you have more than one child enrolled, use these buttons to switch between them.",
        side: "bottom",
        align: "center",
      },
    },
  ];

  if (isMobile) {
    steps.push({
      element: '[data-tour="parent-mobile-nav"]',
      popover: {
        title: "Navigation Bar",
        description: "Use these tabs to switch between Academics, Yearly Results, Attendance, Notices, and Settings.",
        side: "top",
        align: "center",
      },
    });
  } else {
    steps.push({
      element: '[data-tour="parent-tabs"]',
      popover: {
        title: "Navigation Tabs",
        description: "Switch between Academics, Yearly Results, Attendance, Notices, and Settings.",
        side: "bottom",
        align: "center",
      },
    });
  }

  steps.push(
    {
      element: '[data-tour="parent-academics"]',
      popover: {
        title: "Academics",
        description: "View your child's homework and assignments here. You can see which ones are pending, submitted, or graded.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-attendance"]',
      popover: {
        title: "Attendance",
        description: "Check your child's daily attendance record. See present/absent days at a glance.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-print-btn"]',
      popover: {
        title: "Print Result Card",
        description: "Click here to print your child's result card. It's formatted for easy printing!",
        side: "top",
        align: "center",
      },
    },
  );

  return steps;
}
