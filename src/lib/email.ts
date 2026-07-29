// Email service using Resend API via Supabase Edge Functions
// NOTE: email_queue table is not yet created - queue functions are stubbed

import { supabase } from "@/integrations/supabase/client";

/** Escape HTML to prevent XSS in email templates */
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

// Send email via Supabase Edge Function
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: template.to,
        subject: template.subject,
        html: template.html,
      },
    });

    if (error) {
      if (import.meta.env.DEV) console.error("Error sending email:", error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    if (import.meta.env.DEV) console.error("Failed to send email:", error);
    return false;
  }
}

// Process pending emails from queue (stubbed - email_queue table not created)
export async function processPendingEmails(): Promise<{ sent: number; failed: number }> {
  if (import.meta.env.DEV) console.warn("Email queue processing not available - email_queue table not created");
  return { sent: 0, failed: 0 };
}

// Email template for homework assigned
export function homeworkAssignedEmail(
  parentEmail: string,
  parentName: string,
  studentName: string,
  homeworkTitle: string,
  subject: string,
  dueDate: string,
  teacherName: string
): EmailTemplate {
  return {
    to: parentEmail,
    subject: `New Homework Assigned: ${homeworkTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0066FF, #0052CC); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .highlight { background: #e8f4ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Orinth</h1>
              <p style="margin: 5px 0 0 0;">New Homework Notification</p>
            </div>
            <div class="content">
              <p>Dear ${esc(parentName)},</p>
              <p>A new homework assignment has been given to <strong>${esc(studentName)}</strong>.</p>

              <div class="highlight">
                <p><strong>Subject:</strong> ${esc(subject)}</p>
                <p><strong>Assignment:</strong> ${esc(homeworkTitle)}</p>
                <p><strong>Due Date:</strong> ${esc(dueDate)}</p>
                <p><strong>Assigned By:</strong> ${esc(teacherName)}</p>
              </div>

              <p>Please ensure your child completes and submits this assignment before the due date.</p>

              <p>Best regards,<br>Orinth</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Orinth.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Email template for attendance alert (absence)
export function attendanceAlertEmail(
  parentEmail: string,
  parentName: string,
  studentName: string,
  date: string,
  className: string
): EmailTemplate {
  return {
    to: parentEmail,
    subject: `Attendance Alert: ${esc(studentName)} was absent`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .alert { background: #fef2f2; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Orinth</h1>
              <p style="margin: 5px 0 0 0;">Attendance Alert</p>
            </div>
            <div class="content">
              <p>Dear ${esc(parentName)},</p>

              <div class="alert">
                <p><strong>${esc(studentName)}</strong> was marked <strong>ABSENT</strong> today.</p>
                <p><strong>Date:</strong> ${esc(date)}</p>
                <p><strong>Class:</strong> ${esc(className)}</p>
              </div>

              <p>If you believe this is an error, please contact the class teacher.</p>

              <p>Best regards,<br>Orinth</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Orinth.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Email template for grades published
export function gradesPublishedEmail(
  parentEmail: string,
  parentName: string,
  studentName: string,
  homeworkTitle: string,
  subject: string,
  marks: number,
  maxMarks: number,
  teacherRemarks: string | null
): EmailTemplate {
  const percentage = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
  const performanceColor = percentage >= 70 ? '#16A34A' : percentage >= 50 ? '#F59E0B' : '#DC2626';

  return {
    to: parentEmail,
    subject: `Grades Published: ${esc(homeworkTitle)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16A34A, #15803D); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .grade-box { background: white; border: 2px solid ${performanceColor}; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
            .grade { font-size: 36px; font-weight: bold; color: ${performanceColor}; }
            .remarks { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Orinth</h1>
              <p style="margin: 5px 0 0 0;">Grades Published</p>
            </div>
            <div class="content">
              <p>Dear ${esc(parentName)},</p>
              <p>Grades have been published for <strong>${esc(studentName)}</strong>'s homework.</p>

              <div class="grade-box">
                <p style="margin: 0; color: #666;">Subject: ${esc(subject)}</p>
                <p style="margin: 5px 0; font-weight: bold;">${esc(homeworkTitle)}</p>
                <p class="grade">${marks}/${maxMarks}</p>
                <p style="margin: 0; color: ${performanceColor};">${percentage}%</p>
              </div>

              ${teacherRemarks ? `
              <div class="remarks">
                <p style="margin: 0;"><strong>Teacher's Remarks:</strong></p>
                <p style="margin: 5px 0 0 0;">${esc(teacherRemarks)}</p>
              </div>
              ` : ''}

              <p>Keep encouraging your child's academic progress!</p>

              <p>Best regards,<br>Orinth</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Orinth.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Email template for new notice
export function newNoticeEmail(
  email: string,
  recipientName: string,
  noticeTitle: string,
  noticeContent: string,
  schoolName: string
): EmailTemplate {
  return {
    to: email,
    subject: `School Notice: ${esc(noticeTitle)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7C3AED, #6D28D9); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .notice { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${esc(schoolName)}</h1>
              <p style="margin: 5px 0 0 0;">School Notice</p>
            </div>
            <div class="content">
              <p>Dear ${esc(recipientName)},</p>
              <p>A new notice has been posted:</p>

              <div class="notice">
                <h2 style="margin: 0 0 10px 0; color: #7C3AED;">${esc(noticeTitle)}</h2>
                <p style="margin: 0; white-space: pre-wrap;">${esc(noticeContent)}</p>
              </div>

              <p>Please log in to the portal for more details.</p>

              <p>Best regards,<br>${esc(schoolName)}</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Orinth.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Email template for welcome/account created
export function welcomeEmail(
  email: string,
  name: string,
  role: string,
  schoolName: string,
  loginUrl: string,
  tempPassword?: string
): EmailTemplate {
  return {
    to: email,
    subject: `Welcome to ${esc(schoolName)} - Your Account is Ready`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0066FF, #0052CC); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .credentials { background: #e8f4ff; padding: 20px; border-radius: 8px; margin: 15px 0; }
            .button { display: inline-block; background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to Orinth</h1>
              <p style="margin: 5px 0 0 0;">Your account has been created</p>
            </div>
            <div class="content">
              <p>Dear ${esc(name)},</p>
              <p>Your account has been created for <strong>${esc(schoolName)}</strong> as a <strong>${esc(role)}</strong>.</p>

              <div class="credentials">
                <p><strong>Email:</strong> ${esc(email)}</p>
                ${tempPassword ? `<p><strong>Temporary Password:</strong> ${esc(tempPassword)}</p>` : ''}
                <p style="color: #666; font-size: 12px;">Please change your password after first login.</p>
              </div>

              <p>
                <a href="${esc(loginUrl)}" class="button" style="color: white;">Login to Your Account</a>
              </p>

              <p>If you have any questions, please contact your school administrator.</p>

              <p>Best regards,<br>Orinth Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Orinth.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
