import { supabase } from "@/integrations/supabase/client";

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
  data: Record<string, any>;
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
  data?: Record<string, any>;
}

// Create a notification for a user
export async function createNotification(params: CreateNotificationParams): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        school_id: params.schoolId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Get notifications for the current user
export async function getNotifications(limit: number = 20): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []) as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Get unread notification count
export async function getUnreadCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

// Mark a notification as read
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

// Helper functions to create specific notification types

export async function notifyHomeworkAssigned(
  studentUserId: string,
  parentUserId: string | null,
  schoolId: string,
  homeworkTitle: string,
  subject: string,
  dueDate: string
) {
  const message = `New homework "${homeworkTitle}" has been assigned in ${subject}. Due: ${dueDate}`;

  // Notify student
  await createNotification({
    userId: studentUserId,
    schoolId,
    type: 'homework_assigned',
    title: 'New Homework Assigned',
    message,
    data: { homeworkTitle, subject, dueDate },
  });

  // Notify parent if linked
  if (parentUserId) {
    await createNotification({
      userId: parentUserId,
      schoolId,
      type: 'homework_assigned',
      title: 'New Homework for Your Child',
      message,
      data: { homeworkTitle, subject, dueDate },
    });
  }
}

export async function notifyAttendanceAbsent(
  studentUserId: string,
  parentUserId: string | null,
  schoolId: string,
  studentName: string,
  date: string,
  className: string
) {
  const message = `${studentName} was marked absent on ${date} in ${className}`;

  // Notify student
  await createNotification({
    userId: studentUserId,
    schoolId,
    type: 'attendance_alert',
    title: 'Attendance Alert',
    message,
    data: { studentName, date, className },
  });

  // Notify parent if linked
  if (parentUserId) {
    await createNotification({
      userId: parentUserId,
      schoolId,
      type: 'attendance_alert',
      title: 'Your Child Was Absent',
      message,
      data: { studentName, date, className },
    });
  }
}

export async function notifyGradesPublished(
  studentUserId: string,
  parentUserId: string | null,
  schoolId: string,
  homeworkTitle: string,
  subject: string,
  marks: number,
  maxMarks: number,
  remarks: string | null
) {
  const message = `Grades published for "${homeworkTitle}" in ${subject}: ${marks}/${maxMarks}`;

  // Notify student
  await createNotification({
    userId: studentUserId,
    schoolId,
    type: 'grades_published',
    title: 'Grades Published',
    message,
    data: { homeworkTitle, subject, marks, maxMarks, remarks },
  });

  // Notify parent if linked
  if (parentUserId) {
    await createNotification({
      userId: parentUserId,
      schoolId,
      type: 'grades_published',
      title: 'Your Child\'s Grades Published',
      message,
      data: { homeworkTitle, subject, marks, maxMarks, remarks },
    });
  }
}
