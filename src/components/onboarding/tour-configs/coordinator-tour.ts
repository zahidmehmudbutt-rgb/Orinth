import type { DriveStep } from "driver.js";

export function getCoordinatorTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;

  const steps: DriveStep[] = [
    {
      element: '[data-tour="coord-header"]',
      popover: {
        title: "Welcome, Coordinator!",
        description: "This is your Coordinator Dashboard. Manage classes, subjects, staff, and teacher assignments from here.",
        side: "bottom",
        align: "center",
      },
    },
  ];

  if (isMobile) {
    steps.push({
      element: '[data-tour="coord-mobile-nav"]',
      popover: {
        title: "Navigation Bar",
        description: "Use these tabs to switch between Classes, Subjects, Staff, Analytics, and Account.",
        side: "top",
        align: "center",
      },
    });
  } else {
    steps.push({
      element: '[data-tour="coord-tabs"]',
      popover: {
        title: "Navigation Tabs",
        description: "Switch between different sections like Classes, Subjects, Teachers, Staff, Analytics, and more.",
        side: "bottom",
        align: "center",
      },
    });
  }

  steps.push(
    {
      element: '[data-tour="coord-add-class"]',
      popover: {
        title: "Add a Class",
        description: "Click here to create a new class. You can select which sections (A, B, C...) each class should have.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="coord-add-staff"]',
      popover: {
        title: "Add Staff Members",
        description: "Add new teachers or class teachers here. They'll get their own login account automatically.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="coord-assign-teacher"]',
      popover: {
        title: "Assign Teachers",
        description: "Assign teachers to specific classes and subjects. This controls which classes a teacher can manage.",
        side: "bottom",
        align: "center",
      },
    },
  );

  return steps;
}
