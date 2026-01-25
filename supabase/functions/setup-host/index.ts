import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-setup-token",
};

interface SetupHostRequest {
  email: string;
  password: string;
  fullName: string;
}

// Rate limiting: Track requests by IP
const requestTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestTimestamps.get(ip) || [];
  
  // Filter out old timestamps
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  recentTimestamps.push(now);
  requestTimestamps.set(ip, recentTimestamps);
  return false;
}

// Input validation
function validateInput(email: string, password: string, fullName: string): string | null {
  if (!email || typeof email !== 'string') {
    return "Email is required";
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    return "Invalid email format";
  }
  
  if (!password || typeof password !== 'string') {
    return "Password is required";
  }
  
  if (password.length < 8 || password.length > 128) {
    return "Password must be between 8 and 128 characters";
  }
  
  if (!fullName || typeof fullName !== 'string') {
    return "Full name is required";
  }
  
  if (fullName.length < 2 || fullName.length > 100) {
    return "Full name must be between 2 and 100 characters";
  }
  
  // Sanitize full name - only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!nameRegex.test(fullName)) {
    return "Full name contains invalid characters";
  }
  
  return null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    // Rate limiting check
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify setup token (optional but recommended security layer)
    const setupToken = req.headers.get("x-setup-token");
    const expectedToken = Deno.env.get("SETUP_HOST_TOKEN");
    
    // If a setup token is configured, require it
    if (expectedToken && setupToken !== expectedToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse and validate request body
    let body: SetupHostRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const { email, password, fullName } = body;

    // Validate input
    const validationError = validateInput(email, password, fullName);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if host already exists (critical security check)
    const { data: existingRoles, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'host')
      .eq('is_active', true)
      .limit(1);

    if (checkError) {
      // Don't expose internal errors
      return new Response(
        JSON.stringify({ success: false, error: "Unable to verify host status" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (existingRoles && existingRoles.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Setup already completed" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    });

    if (authError) {
      // Don't expose detailed auth errors
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create account" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = authData.user.id;

    // Update the profile (created by trigger)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        email: email.toLowerCase().trim(),
        email_verified: true,
        first_login_complete: true,
        school_id: null, // Host has no school
      })
      .eq('id', userId);

    if (profileError) {
      // Log internally but don't expose
      console.error("Profile update failed");
    }

    // Create the host role (school_id must be null for host)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'host',
        school_id: null,
        is_active: true,
      });

    if (roleError) {
      // Rollback: delete the user if role creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to complete setup" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log the activity (don't expose email in response)
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        action: 'host_created',
        entity_type: 'user',
        entity_id: userId,
        details: { created_by: 'system_setup', ip: clientIp },
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Setup completed successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    // Don't expose internal error details
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
