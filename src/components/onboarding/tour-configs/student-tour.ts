import type { DriveStep } from "driver.js";

export function getStudentTourSteps(): DriveStep[] {
  const isMobile = window.innerWidth < 768;

  const steps: DriveStep[] = [
    {
      element: '[data-tour="student-header"]',
      popover: {
        title: "Welcome to Your Dashboard!",
        description: "This is your Student Dashboard where you can see homework, attendance, marks, and more. Let's explore!",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="student-theme-toggle"]',
      popover: {
        title: "Dark / Light Mode",
        description: "Click here to switch between dark and light themes. Pick what's comfortable for your eyes!",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="student-chat"]',
      popover: {
        title: "Group Chat",
        description: "Chat with your classmates and teachers right from here.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="student-notifications"]',
      popover: {
        title: "Notifications",
        description: "Check for new announcements, homework updates, and important notices here.",
        side: "bottom",
        align: "end",
      },
    },
  ];

  if (isMobile) {
    steps.push({
      element: '[data-tour="student-mobile-nav"]',
      popover: {
        title: "Navigation Bar",
        description: "Use these tabs to switch between Homework, Attendance, Marks, Results, and Notices. You can also swipe left or right!",
        side: "top",
        align: "center",
      },
    });
  } else {
    steps.push({
      element: '[data-tour="student-tabs"]',
      popover: {
        title: "Navigation Tabs",
        description: "Switch between Homework, Attendance, Marks, Yearly Results, Notices, and Account Settings using these tabs.",
        side: "bottom",
        align: "center",
      },
    });
  }

  steps.push(
    {
      element: '[data-tour="student-view-toggle"]',
      popover: {
        title: "List or Calendar View",
        description: "View your homework as a list or on a calendar. Pick whichever is easier for you!",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="student-upload-btn"]',
      popover: {
        title: "Submit Your Homework",
        description: "Tap 'Upload Answer' to upload your completed homework. You can submit PDF, Word, or image files (up to 10MB).",
        side: "top",
        align: "center",
      },
    },
  );

  return steps;
}
