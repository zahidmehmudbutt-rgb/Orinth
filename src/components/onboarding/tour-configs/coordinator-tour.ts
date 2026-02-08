import type { DriveStep } from "driver.js";

export function getCoordinatorTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;
  const steps: DriveStep[] = [
    {
      element: '[data-tour="coord-header"]',
      popover: {
        title: "Welcome!",
        description:
          "This is your coordinator dashboard. Manage classes, subjects, staff, and teacher assignments from here.",
        side: "bottom",
        align: "center",
      },
    },
    ...(isMobile
      ? [
          {
            element: '[data-tour="coord-mobile-nav"]',
            popover: {
              title: "Navigation",
              description:
                "Use these icons to switch between Classes, Subjects, Staff, Analytics, and Account.",
              side: "top" as const,
              align: "center" as const,
            },
          },
        ]
      : [
          {
            element: '[data-tour="coord-tabs"]',
            popover: {
              title: "Navigation Tabs",
              description:
                "Switch between Classes, Subjects, Assignments, Staff, Announcements, Analytics, and Account.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
        ]),
    {
      element: '[data-tour="coord-add-class"]',
      popover: {
        title: "Create Classes",
        description:
          "Create new classes with sections. Select from Nursery to Class 10 and pick which sections to create.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="coord-add-staff"]',
      popover: {
        title: "Add Teachers",
        description:
          "Add new teachers or class teachers to your school. They will receive login credentials automatically.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="coord-assign-teacher"]',
      popover: {
        title: "Assign Teachers",
        description:
          "Assign teachers to specific classes and subjects so they can post homework and results.",
        side: "bottom",
        align: "center",
      },
    },
  ];
  return steps;
}
