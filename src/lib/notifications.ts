import { supabase } from "@/integrations/supabase/client";

// =============================================
// NOTIFICATION TYPES
// =============================================

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

// =============================================
// SMS/WHATSAPP NOTIFICATION TYPES
// =============================================

interface NotificationData {
  studentName?: string;
  className?: string;
  date?: string;
  subject?: string;
  examTitle?: string;
  marks?: number;
  maxMarks?: number;
  percentage?: number;
  customMessage?: string;
}

interface SendNotificationParams {
  type: "absence" | "low_marks" | "homework" | "notice" | "custom";
  schoolId: string;
  studentId?: string;
  parentId?: string;
  data: NotificationData;
}

interface NotificationResult {
  success: boolean;
  message?: string;
  error?: string;
  results?: Array<{
    parentId: string;
    channel: string;
    status: string;
    messageId?: string;
    error?: string;
  }>;
}

// =============================================
// SMS/WHATSAPP NOTIFICATION FUNCTIONS
// =============================================

/**
 * Send notification to parent(s) via SMS/WhatsApp
 */
export async function sendParentNotification(
  params: SendNotificationParams
): Promise<NotificationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: params,
    });

    if (error) {
      console.error("Notification error:", error);
      return { success: false, error: error.message || "Failed to send notification" };
    }

    return data as NotificationResult;
  } catch (err) {
    console.error("Notification error:", err);
    return { success: false, error: "Failed to send notification" };
  }
}

/**
 * Send absence notification for a student
 */
export async function sendAbsenceNotification(
  schoolId: string,
  studentId: string,
  studentName: string,
  className: string,
  date?: string
): Promise<NotificationResult> {
  return sendParentNotification({
    type: "absence",
    schoolId,
    studentId,
    data: {
      studentName,
      className,
      date: date || new Date().toLocaleDateString("en-PK"),
    },
  });
}

/**
 * Send low marks notification for a student
 */
export async function sendLowMarksNotification(
  schoolId: string,
  studentId: string,
  studentName: string,
  className: string,
  subject: string,
  examTitle: string,
  marks: number,
  maxMarks: number
): Promise<NotificationResult> {
  const percentage = Math.round((marks / maxMarks) * 100);

  return sendParentNotification({
    type: "low_marks",
    schoolId,
    studentId,
    data: {
      studentName,
      className,
      subject,
      examTitle,
      marks,
      maxMarks,
      percentage,
    },
  });
}

/**
 * Check if notifications are enabled for a school
 */
export async function getSchoolNotificationStatus(schoolId: string): Promise<{
  enabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from("school_notification_settings")
      .select("sms_enabled, whatsapp_enabled")
      .eq("school_id", schoolId)
      .single();

    if (error || !data) {
      return { enabled: false, smsEnabled: false, whatsappEnabled: false };
    }

    return {
      enabled: data.sms_enabled || data.whatsapp_enabled,
      smsEnabled: data.sms_enabled,
      whatsappEnabled: data.whatsapp_enabled,
    };
  } catch {
    return { enabled: false, smsEnabled: false, whatsappEnabled: false };
  }
}

/**
 * Send bulk absence notifications for all absent students
 */
export async function sendBulkAbsenceNotifications(
  schoolId: string,
  absentStudents: Array<{
    studentId: string;
    studentName: string;
    className: string;
  }>,
  date?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const student of absentStudents) {
    const result = await sendAbsenceNotification(
      schoolId,
      student.studentId,
      student.studentName,
      student.className,
      date
    );

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      if (result.error) {
        results.errors.push(`${student.studentName}: ${result.error}`);
      }
    }
  }

  return results;
}

// =============================================
// IN-APP NOTIFICATION FUNCTIONS
// =============================================

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        school_id: params.schoolId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
      })
      .select("id")
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error creating notification:", error);
      }
      return null;
    }

    return data.id;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in createNotification:", error);
    }
    return null;
  }
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(limit: number = 20): Promise<Notification[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching notifications:", error);
      }
      return [];
    }

    return (data || []) as Notification[];
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in getNotifications:", error);
    }
    return [];
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching unread count:", error);
      }
      return 0;
    }

    return count || 0;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in getUnreadCount:", error);
    }
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error marking as read:", error);
      }
      return false;
    }

    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in markAsRead:", error);
    }
    return false;
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error marking all as read:", error);
      }
      return false;
    }

    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in markAllAsRead:", error);
    }
    return false;
  }
}

// =============================================
// HELPER FUNCTIONS FOR SPECIFIC NOTIFICATIONS
// =============================================

/**
 * Notify about homework assignment
 */
export async function notifyHomeworkAssigned(
  studentUserId: string,
  parentUserId: string | null,
  schoolId: string,
  homeworkTitle: string,
  subject: string,
  dueDate: string
) {
  // Notify student
  await createNotification({
    userId: studentUserId,
    schoolId,
    type: "homework_assigned",
    title: "New Homework Assigned",
    message: `${subject}: ${homeworkTitle} - Due: ${dueDate}`,
    data: { homeworkTitle, subject, dueDate },
  });

  // Notify parent if linked
  if (parentUserId) {
    await createNotification({
      userId: parentUserId,
      schoolId,
      type: "homework_assigned",
      title: "New Homework for Your Child",
      message: `${subject}: ${homeworkTitle} - Due: ${dueDate}`,
      data: { homeworkTitle, subject, dueDate },
    });
  }
}

/**
 * Notify about attendance absence
 */
export async function notifyAttendanceAbsent(
  studentUserId: string,
  parentUserId: string | null,
  schoolId: string,
  studentName: string,
  date: string,
  className: string
) {
  // Notify student
  await createNotification({
    userId: studentUserId,
    schoolId,
    type: "attendance_alert",
    title: "Absence Recorded",
    message: `You were marked absent on ${date}`,
    data: { date, className },
  });

  // Notify parent if linked
  if (parentUserId) {
    await createNotification({
      userId: parentUserId,
      schoolId,
      type: "attendance_alert",
      title: "Child Absent from School",
      message: `${studentName} was marked absent on ${date}`,
      data: { studentName, date, className },
    });
  }
}

/**
 * Notify about grades published
 */
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
  const percentage = Math.round((marks / maxMarks) * 100);

  // Notify student
  await createNotification({
    userId: studentUserId,
    schoolId,
    type: "grades_published",
    title: "Grades Published",
    message: `${subject}: ${homeworkTitle} - Score: ${marks}/${maxMarks} (${percentage}%)`,
    data: { homeworkTitle, subject, marks, maxMarks, percentage, remarks },
  });

  // Notify parent if linked
  if (parentUserId) {
    await createNotification({
      userId: parentUserId,
      schoolId,
      type: "grades_published",
      title: "Your Child's Grades",
      message: `${subject}: ${homeworkTitle} - Score: ${marks}/${maxMarks} (${percentage}%)`,
      data: { homeworkTitle, subject, marks, maxMarks, percentage, remarks },
    });
  }
}

/**
 * Notify about a notice
 */
export async function notifyNotice(
  userIds: string[],
  schoolId: string,
  noticeTitle: string,
  noticeContent: string
) {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    school_id: schoolId,
    type: "notice" as NotificationType,
    title: noticeTitle,
    message: noticeContent.substring(0, 200) + (noticeContent.length > 200 ? "..." : ""),
    data: { noticeTitle, fullContent: noticeContent },
    is_read: false,
    email_sent: false,
  }));

  try {
    const { error } = await supabase
      .from("notifications")
      .insert(notifications);

    if (error && import.meta.env.DEV) {
      console.error("Error creating notice notifications:", error);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in notifyNotice:", error);
    }
  }
}
