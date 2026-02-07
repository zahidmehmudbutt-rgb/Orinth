import type { DriveStep } from "driver.js";

export function getPrincipalTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;

  const steps: DriveStep[] = [
    {
      element: '[data-tour="principal-header"]',
      popover: {
        title: "Welcome, Principal!",
        description: "This is your Principal Dashboard. Oversee your entire school — staff, classes, analytics, and settings.",
        side: "bottom",
        align: "center",
      },
    },
  ];

  if (isMobile) {
    steps.push({
      element: '[data-tour="principal-mobile-nav"]',
      popover: {
        title: "Navigation Bar",
        description: "Use these tabs to switch between Staff, Classes, Analytics, Public Page, and Account.",
        side: "top",
        align: "center",
      },
    });
  } else {
    steps.push({
      element: '[data-tour="principal-tabs"]',
      popover: {
        title: "Navigation Tabs",
        description: "Switch between Staff, Classes, Announcements, Analytics, Public Page, and Account.",
        side: "bottom",
        align: "center",
      },
    });
  }

  steps.push(
    {
      element: '[data-tour="principal-add-coordinator"]',
      popover: {
        title: "Add Section Heads",
        description: "Add coordinators (section heads) here. They can manage teachers, classes, and subjects for their section.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="principal-analytics"]',
      popover: {
        title: "School Analytics",
        description: "View detailed analytics about attendance, performance, and trends across your school.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="principal-school-settings"]',
      popover: {
        title: "Public School Page",
        description: "Customize your school's public page — update name, logo, description, and contact information.",
        side: "bottom",
        align: "center",
      },
    },
  );

  return steps;
}
