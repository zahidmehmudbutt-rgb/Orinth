import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "absence" | "low_marks" | "homework" | "notice" | "custom";
  schoolId: string;
  studentId?: string;
  parentId?: string;
  data: {
    studentName?: string;
    className?: string;
    date?: string;
    subject?: string;
    examTitle?: string;
    marks?: number;
    maxMarks?: number;
    percentage?: number;
    customMessage?: string;
  };
}

interface TwilioResponse {
  sid?: string;
  status?: string;
  error_code?: number;
  error_message?: string;
}

async function sendTwilioSMS(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<TwilioResponse> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: body,
    }),
  });

  return await response.json();
}

async function sendTwilioWhatsApp(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<TwilioResponse> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // WhatsApp numbers need "whatsapp:" prefix
  const whatsappFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: whatsappFrom,
      To: whatsappTo,
      Body: body,
    }),
  });

  return await response.json();
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // Handle Pakistani numbers
  if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.substring(1);
  } else if (!cleaned.startsWith("92") && cleaned.length === 10) {
    cleaned = "92" + cleaned;
  }

  return "+" + cleaned;
}

function formatMessage(template: string, data: Record<string, string | number | undefined>): string {
  let message = template;
  for (const [key, value] of Object.entries(data)) {
    message = message.replace(new RegExp(`{${key}}`, "g"), String(value || ""));
  }
  return message;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: NotificationRequest = await req.json();
    const { type, schoolId, studentId, parentId, data } = body;

    // Get school notification settings
    const { data: settings, error: settingsError } = await supabase
      .from("school_notification_settings")
      .select("*")
      .eq("school_id", schoolId)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ success: false, error: "School notification settings not configured" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!settings.sms_enabled && !settings.whatsapp_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: "Notifications are disabled for this school" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check daily limit
    if (settings.sms_sent_today >= settings.daily_sms_limit) {
      return new Response(
        JSON.stringify({ success: false, error: "Daily SMS limit reached" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get school name
    const { data: school } = await supabase
      .from("schools")
      .select("name")
      .eq("id", schoolId)
      .single();

    const schoolName = school?.name || "School";

    // Get parent contacts
    let parentContacts: Array<{
      parent_id: string;
      parent_name: string;
      phone: string | null;
      whatsapp: string | null;
      sms_enabled: boolean;
      whatsapp_enabled: boolean;
      absence_alerts: boolean;
      low_marks_alerts: boolean;
      low_marks_threshold: number;
    }> = [];

    if (studentId) {
      const { data: contacts } = await supabase.rpc("get_student_parent_contacts", {
        p_student_id: studentId,
      });
      parentContacts = contacts || [];
    } else if (parentId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, phone, whatsapp")
        .eq("id", parentId)
        .single();

      if (profile && (profile.phone || profile.whatsapp)) {
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", parentId)
          .single();

        parentContacts = [{
          parent_id: profile.id,
          parent_name: profile.full_name,
          phone: profile.phone,
          whatsapp: profile.whatsapp || profile.phone,
          sms_enabled: prefs?.sms_enabled ?? true,
          whatsapp_enabled: prefs?.whatsapp_enabled ?? true,
          absence_alerts: prefs?.absence_alerts ?? true,
          low_marks_alerts: prefs?.low_marks_alerts ?? true,
          low_marks_threshold: prefs?.low_marks_threshold ?? 40,
        }];
      }
    }

    if (parentContacts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No parent contacts found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: Array<{ parentId: string; channel: string; status: string; messageId?: string; error?: string }> = [];

    for (const contact of parentContacts) {
      // Check if parent wants this type of notification
      if (type === "absence" && !contact.absence_alerts) continue;
      if (type === "low_marks" && !contact.low_marks_alerts) continue;

      // For low marks, check threshold
      if (type === "low_marks" && data.percentage && data.percentage >= contact.low_marks_threshold) {
        continue;
      }

      // Build message
      let message = "";
      const messageData = {
        student_name: data.studentName || "",
        class_name: data.className || "",
        date: data.date || new Date().toLocaleDateString("en-PK"),
        subject: data.subject || "",
        exam_title: data.examTitle || "",
        marks: data.marks,
        max_marks: data.maxMarks,
        percentage: data.percentage,
        school_name: schoolName,
      };

      if (type === "absence") {
        message = formatMessage(settings.absence_message_template, messageData);
      } else if (type === "low_marks") {
        message = formatMessage(settings.low_marks_message_template, messageData);
      } else if (type === "custom" && data.customMessage) {
        message = data.customMessage;
      } else {
        continue;
      }

      // Send via preferred channels
      const channels: Array<"sms" | "whatsapp"> = [];
      if (settings.whatsapp_enabled && contact.whatsapp_enabled && contact.whatsapp) {
        channels.push("whatsapp");
      }
      if (settings.sms_enabled && contact.sms_enabled && contact.phone && channels.length === 0) {
        // Only send SMS if WhatsApp not sent (to avoid duplicate)
        channels.push("sms");
      }

      for (const channel of channels) {
        const phone = channel === "whatsapp" ? contact.whatsapp : contact.phone;
        if (!phone) continue;

        const formattedPhone = formatPhoneNumber(phone);
        let result: TwilioResponse;
        let status = "pending";
        let errorMessage: string | undefined;

        try {
          if (channel === "sms") {
            result = await sendTwilioSMS(
              settings.twilio_account_sid,
              settings.twilio_auth_token,
              settings.twilio_phone_number,
              formattedPhone,
              message
            );
          } else {
            result = await sendTwilioWhatsApp(
              settings.twilio_account_sid,
              settings.twilio_auth_token,
              settings.twilio_whatsapp_number || settings.twilio_phone_number,
              formattedPhone,
              message
            );
          }

          if (result.sid) {
            status = "sent";
          } else {
            status = "failed";
            errorMessage = result.error_message || "Unknown error";
          }

          // Log the notification
          await supabase.from("notification_logs").insert({
            school_id: schoolId,
            parent_id: contact.parent_id,
            student_id: studentId,
            notification_type: type,
            channel: channel,
            recipient_phone: formattedPhone,
            message: message,
            status: status,
            external_id: result.sid,
            error_message: errorMessage,
            metadata: { twilio_response: result },
            sent_at: status === "sent" ? new Date().toISOString() : null,
          });

          // Update SMS counter
          if (status === "sent") {
            await supabase
              .from("school_notification_settings")
              .update({ sms_sent_today: settings.sms_sent_today + 1 })
              .eq("school_id", schoolId);
          }

          results.push({
            parentId: contact.parent_id,
            channel,
            status,
            messageId: result.sid,
            error: errorMessage,
          });
        } catch (err) {
          const error = err instanceof Error ? err.message : "Send failed";

          await supabase.from("notification_logs").insert({
            school_id: schoolId,
            parent_id: contact.parent_id,
            student_id: studentId,
            notification_type: type,
            channel: channel,
            recipient_phone: formattedPhone,
            message: message,
            status: "failed",
            error_message: error,
          });

          results.push({
            parentId: contact.parent_id,
            channel,
            status: "failed",
            error,
          });
        }
      }
    }

    const successCount = results.filter(r => r.status === "sent").length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Sent ${successCount} of ${results.length} notifications`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
