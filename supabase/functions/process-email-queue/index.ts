// Supabase Edge Function to process email queue
// Deploy with: supabase functions deploy process-email-queue
// Set up a cron job to call this function every 5 minutes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates
const templates: Record<string, (data: any) => { subject: string; html: string }> = {
  homework_assigned: (data) => ({
    subject: `New Homework Assigned: ${data.homework_title}`,
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
              <h1 style="margin: 0;">School Smart Pakistan</h1>
              <p style="margin: 5px 0 0 0;">New Homework Notification</p>
            </div>
            <div class="content">
              <p>Dear ${data.parent_name},</p>
              <p>A new homework assignment has been given to <strong>${data.student_name}</strong>.</p>
              <div class="highlight">
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Assignment:</strong> ${data.homework_title}</p>
                <p><strong>Due Date:</strong> ${data.due_date}</p>
                <p><strong>Assigned By:</strong> ${data.teacher_name}</p>
              </div>
              <p>Please ensure your child completes and submits this assignment before the due date.</p>
              <p>Best regards,<br>School Smart Pakistan</p>
            </div>
            <div class="footer">
              <p>This is an automated message from School Smart Pakistan.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  attendance_alert: (data) => ({
    subject: `Attendance Alert: ${data.student_name} was absent`,
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
              <h1 style="margin: 0;">School Smart Pakistan</h1>
              <p style="margin: 5px 0 0 0;">Attendance Alert</p>
            </div>
            <div class="content">
              <p>Dear ${data.parent_name},</p>
              <div class="alert">
                <p><strong>${data.student_name}</strong> was marked <strong>ABSENT</strong> today.</p>
                <p><strong>Date:</strong> ${data.date}</p>
                <p><strong>Class:</strong> ${data.class_name}</p>
              </div>
              <p>If you believe this is an error, please contact the class teacher.</p>
              <p>Best regards,<br>School Smart Pakistan</p>
            </div>
            <div class="footer">
              <p>This is an automated message from School Smart Pakistan.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  grades_published: (data) => {
    const percentage = Math.round((data.marks / data.max_marks) * 100);
    const performanceColor = percentage >= 70 ? '#16A34A' : percentage >= 50 ? '#F59E0B' : '#DC2626';
    return {
      subject: `Grades Published: ${data.homework_title}`,
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
                <h1 style="margin: 0;">School Smart Pakistan</h1>
                <p style="margin: 5px 0 0 0;">Grades Published</p>
              </div>
              <div class="content">
                <p>Dear ${data.parent_name},</p>
                <p>Grades have been published for <strong>${data.student_name}</strong>'s homework.</p>
                <div class="grade-box">
                  <p style="margin: 0; color: #666;">Subject: ${data.subject}</p>
                  <p style="margin: 5px 0; font-weight: bold;">${data.homework_title}</p>
                  <p class="grade">${data.marks}/${data.max_marks}</p>
                  <p style="margin: 0; color: ${performanceColor};">${percentage}%</p>
                </div>
                ${data.remarks ? `
                <div class="remarks">
                  <p style="margin: 0;"><strong>Teacher's Remarks:</strong></p>
                  <p style="margin: 5px 0 0 0;">${data.remarks}</p>
                </div>
                ` : ''}
                <p>Keep encouraging your child's academic progress!</p>
                <p>Best regards,<br>School Smart Pakistan</p>
              </div>
              <div class="footer">
                <p>This is an automated message from School Smart Pakistan.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },
};

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "School Smart Pakistan <notifications@schoolsmart.pk>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lt("retry_count", 3)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch emails: ${fetchError.message}`);
    }

    const results = { processed: 0, sent: 0, failed: 0 };

    for (const email of pendingEmails || []) {
      results.processed++;

      // Generate email content from template
      const template = templates[email.template_type];
      if (!template) {
        console.error(`Unknown template type: ${email.template_type}`);
        continue;
      }

      const { subject, html } = template(email.template_data);
      const success = await sendEmailViaResend(email.to_email, subject, html);

      if (success) {
        await supabase
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);
        results.sent++;
      } else {
        const newRetryCount = email.retry_count + 1;
        await supabase
          .from("email_queue")
          .update({
            retry_count: newRetryCount,
            status: newRetryCount >= 3 ? "failed" : "pending",
            error_message: "Failed to send via Resend API",
          })
          .eq("id", email.id);
        results.failed++;
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email queue processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
