// Notifications service
// NOTE: notifications table is not yet created - functions are stubbed
// These functions provide the interface for future implementation

export type NotificationType =
  | 'homework_assigned'
  | 'attendance_alert'
  | 'grades_published'
  | 'notice'
  | 'welcome'
  | 'general';

export interface Notification {
  id: string;
  user_id: string;
  school_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  schoolId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// Create a notification for a user (stubbed - notifications table not created)
export async function createNotification(_params: CreateNotificationParams): Promise<string | null> {
  console.warn("Notification creation not available - notifications table not created");
  return null;
}

// Get notifications for the current user (stubbed)
export async function getNotifications(_limit: number = 20): Promise<Notification[]> {
  console.warn("Notifications not available - notifications table not created");
  return [];
}

// Get unread notification count (stubbed)
export async function getUnreadCount(): Promise<number> {
  console.warn("Notification count not available - notifications table not created");
  return 0;
}

// Mark a notification as read (stubbed)
export async function markAsRead(_notificationId: string): Promise<boolean> {
  console.warn("Mark as read not available - notifications table not created");
  return false;
}

// Mark all notifications as read (stubbed)
export async function markAllAsRead(): Promise<boolean> {
  console.warn("Mark all as read not available - notifications table not created");
  return false;
}

// Helper functions to create specific notification types

export async function notifyHomeworkAssigned(
  _studentUserId: string,
  _parentUserId: string | null,
  _schoolId: string,
  _homeworkTitle: string,
  _subject: string,
  _dueDate: string
) {
  console.warn("Homework notification not available - notifications table not created");
}

export async function notifyAttendanceAbsent(
  _studentUserId: string,
  _parentUserId: string | null,
  _schoolId: string,
  _studentName: string,
  _date: string,
  _className: string
) {
  console.warn("Attendance notification not available - notifications table not created");
}

export async function notifyGradesPublished(
  _studentUserId: string,
  _parentUserId: string | null,
  _schoolId: string,
  _homeworkTitle: string,
  _subject: string,
  _marks: number,
  _maxMarks: number,
  _remarks: string | null
) {
  console.warn("Grades notification not available - notifications table not created");
}
