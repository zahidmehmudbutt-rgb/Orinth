import type { DriveStep } from "driver.js";

export function getTeacherTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;

  const steps: DriveStep[] = [
    {
      element: '[data-tour="teacher-header"]',
      popover: {
        title: "Welcome, Teacher!",
        description: "This is your Teacher Dashboard. You can create homework, grade students, and manage exams from here.",
        side: "bottom",
        align: "center",
      },
    },
  ];

  if (isMobile) {
    steps.push({
      element: '[data-tour="teacher-mobile-nav"]',
      popover: {
        title: "Navigation Bar",
        description: "Use these tabs to switch between Homework, Marks, Results, and Account settings.",
        side: "top",
        align: "center",
      },
    });
  } else {
    steps.push({
      element: '[data-tour="teacher-tabs"]',
      popover: {
        title: "Navigation Tabs",
        description: "Switch between Homework, Enter Marks, Results, and Account Settings using these tabs.",
        side: "bottom",
        align: "center",
      },
    });
  }

  steps.push(
    {
      element: '[data-tour="teacher-create-hw"]',
      popover: {
        title: "Create Homework",
        description: "Fill in the class, subject, title, description, and due date to assign new homework to your students.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="teacher-post-btn"]',
      popover: {
        title: "Post Homework",
        description: "After filling in the details, click this button to post the homework. Students will be notified right away!",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="teacher-recent-hw"]',
      popover: {
        title: "Recent Homework",
        description: "See all homework you've posted recently. You can track how many students have submitted their work.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="teacher-results-tab"]',
      popover: {
        title: "Exams & Results",
        description: "Go to the Results tab to create exams (weekly, monthly, semester) and enter student marks.",
        side: "bottom",
        align: "center",
      },
    },
  );

  return steps;
}
