// Supabase Edge Function to send emails via Resend API
// SECURITY: Requires authentication and authorized roles only
// Deploy with: supabase functions deploy send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Rate limiting: track emails per user per hour
const userEmailCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_EMAILS_PER_HOUR = 50;

// Roles allowed to send emails
const ALLOWED_ROLES = ['host', 'principal', 'coordinator', 'class_teacher', 'teacher'];

// Allowed sender domains (restrict spoofing)
const ALLOWED_FROM_DOMAIN = "schoolsmart.pk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Sanitize and validate input
function validateEmailRequest(data: unknown): { valid: false; error: string } | { valid: true; data: EmailRequest } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: "Invalid request body" };
  }

  const { to, subject, html, from } = data as Record<string, unknown>;

  // Validate 'to' field
  if (typeof to !== 'string' || !to.trim()) {
    return { valid: false, error: "Missing or invalid 'to' field" };
  }
  if (!isValidEmail(to.trim())) {
    return { valid: false, error: "Invalid email format for 'to' field" };
  }

  // Validate 'subject' field
  if (typeof subject !== 'string' || !subject.trim()) {
    return { valid: false, error: "Missing or invalid 'subject' field" };
  }
  if (subject.length > 200) {
    return { valid: false, error: "Subject must be 200 characters or less" };
  }

  // Validate 'html' field
  if (typeof html !== 'string' || !html.trim()) {
    return { valid: false, error: "Missing or invalid 'html' field" };
  }
  if (html.length > 100000) {
    return { valid: false, error: "HTML content must be 100KB or less" };
  }

  // Validate optional 'from' field - must be from allowed domain
  let validatedFrom: string | undefined;
  if (from !== undefined) {
    if (typeof from !== 'string') {
      return { valid: false, error: "Invalid 'from' field" };
    }
    // Extract domain from email
    const fromMatch = from.match(/<([^>]+)>/) || [null, from];
    const fromEmail = fromMatch[1] || from;
    if (!fromEmail.endsWith(`@${ALLOWED_FROM_DOMAIN}`)) {
      return { valid: false, error: `'from' must be from @${ALLOWED_FROM_DOMAIN} domain` };
    }
    validatedFrom = from;
  }

  return {
    valid: true,
    data: {
      to: to.trim(),
      subject: subject.trim(),
      html: html,
      from: validatedFrom,
    },
  };
}

// Check rate limit for user
function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;

  const userLimit = userEmailCounts.get(userId);

  if (!userLimit || now >= userLimit.resetAt) {
    // Reset or initialize
    userEmailCounts.set(userId, { count: 1, resetAt: now + hourInMs });
    return { allowed: true, remaining: MAX_EMAILS_PER_HOUR - 1 };
  }

  if (userLimit.count >= MAX_EMAILS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: MAX_EMAILS_PER_HOUR - userLimit.count };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the token and get claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth claims error:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - no user ID in token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== AUTHORIZATION CHECK =====
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (rolesError) {
      console.error("Roles query error:", rolesError);
      return new Response(
        JSON.stringify({ success: false, error: "Authorization failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userRoles = roles?.map((r) => r.role) || [];
    const hasAllowedRole = userRoles.some((role) => ALLOWED_ROLES.includes(role));

    if (!hasAllowedRole) {
      console.warn(`User ${userId} attempted to send email without proper role. Roles: ${userRoles.join(", ")}`);
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden - insufficient permissions to send emails" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== RATE LIMITING =====
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      console.warn(`User ${userId} hit rate limit for email sending`);
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded - try again later" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== VALIDATE API KEY =====
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // ===== INPUT VALIDATION =====
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validateEmailRequest(requestBody);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, subject, html, from } = validation.data;

    // ===== SEND EMAIL =====
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || `School Smart Pakistan <notifications@${ALLOWED_FROM_DOMAIN}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    // ===== AUDIT LOG =====
    console.log(`Email sent by user ${userId} to ${to}, subject: ${subject.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ success: true, data, remaining: rateCheck.remaining }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send email" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
