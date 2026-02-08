import type { DriveStep } from "driver.js";

export function getParentTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;
  const steps: DriveStep[] = [
    {
      element: '[data-tour="parent-header"]',
      popover: {
        title: "Welcome!",
        description:
          "This is your parent dashboard. Monitor your child's academics, attendance, and school notices.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-child-selector"]',
      popover: {
        title: "Select Child",
        description:
          "If you have multiple children, use these buttons to switch between them and view their individual data.",
        side: "bottom",
        align: "center",
      },
    },
    ...(isMobile
      ? [
          {
            element: '[data-tour="parent-mobile-nav"]',
            popover: {
              title: "Navigation",
              description:
                "Use these icons to switch between Academics, Yearly Results, Attendance, Notices, and Settings.",
              side: "top" as const,
              align: "center" as const,
            },
          },
        ]
      : [
          {
            element: '[data-tour="parent-tabs"]',
            popover: {
              title: "Navigation Tabs",
              description:
                "Switch between Academics, Yearly Results, Attendance, Notices, and Settings.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
        ]),
    {
      element: '[data-tour="parent-academics"]',
      popover: {
        title: "Academics",
        description:
          "View your child's homework status, exam results, and performance trends in the Academics tab.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-attendance"]',
      popover: {
        title: "Attendance",
        description:
          "Check your child's attendance record, including present/absent days and overall percentage.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-print-btn"]',
      popover: {
        title: "Print Result Card",
        description:
          "Print or download your child's official result card as a PDF from the Yearly Results tab.",
        side: "bottom",
        align: "center",
      },
    },
  ];
  return steps;
}
