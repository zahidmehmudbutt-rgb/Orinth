import type { DriveStep } from "driver.js";

export function getTeacherTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;
  const steps: DriveStep[] = [
    {
      element: '[data-tour="teacher-header"]',
      popover: {
        title: "Welcome!",
        description:
          "This is your teacher dashboard. Let's walk through the key features available to you.",
        side: "bottom",
        align: "center",
      },
    },
    ...(isMobile
      ? [
          {
            element: '[data-tour="teacher-mobile-nav"]',
            popover: {
              title: "Navigation",
              description:
                "Use these icons to switch between Homework, Marks, Results, and Account sections.",
              side: "top" as const,
              align: "center" as const,
            },
          },
        ]
      : [
          {
            element: '[data-tour="teacher-tabs"]',
            popover: {
              title: "Navigation Tabs",
              description:
                "Switch between Homework, Enter Marks, Results, and Account using these tabs.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
        ]),
    {
      element: '[data-tour="teacher-create-hw"]',
      popover: {
        title: "Create Homework",
        description:
          "Use this form to assign homework to your classes. Select a class, subject, add details, and set a due date.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="teacher-recent-hw"]',
      popover: {
        title: "Recent Homework",
        description:
          "View all your recently posted homework here. Track how many students have submitted their work.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="teacher-results-tab"]',
      popover: {
        title: "Post Results",
        description:
          "Create exams and enter student marks in the Results tab. Supports weekly, monthly, and semester exams.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="teacher-post-btn"]',
      popover: {
        title: "Post Homework",
        description:
          "Once you've filled in the details, click here to post the homework to your students.",
        side: "top",
        align: "center",
      },
    },
  ];
  return steps;
}
