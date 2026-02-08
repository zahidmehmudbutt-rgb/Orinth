import type { DriveStep } from "driver.js";

export function getPrincipalTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;
  const steps: DriveStep[] = [
    {
      element: '[data-tour="principal-header"]',
      popover: {
        title: "Welcome!",
        description:
          "This is your principal dashboard. Oversee your school's operations, staff, and analytics.",
        side: "bottom",
        align: "center",
      },
    },
    ...(isMobile
      ? [
          {
            element: '[data-tour="principal-mobile-nav"]',
            popover: {
              title: "Navigation",
              description:
                "Use these icons to switch between Staff, Classes, Analytics, Public Page, and Account.",
              side: "top" as const,
              align: "center" as const,
            },
          },
        ]
      : [
          {
            element: '[data-tour="principal-tabs"]',
            popover: {
              title: "Navigation Tabs",
              description:
                "Switch between Staff, Classes, Announcements, Analytics, Public Page, and Account.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
        ]),
    {
      element: '[data-tour="principal-add-coordinator"]',
      popover: {
        title: "Add Section Heads",
        description:
          "Add coordinators (section heads) who will manage classes, teachers, and academic operations for your school.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="principal-analytics"]',
      popover: {
        title: "School Analytics",
        description:
          "View school-wide performance data including attendance trends, exam results, and more.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="principal-school-settings"]',
      popover: {
        title: "School Public Page",
        description:
          "Customize your school's public profile page with contact info, description, and branding.",
        side: "bottom",
        align: "center",
      },
    },
  ];
  return steps;
}
