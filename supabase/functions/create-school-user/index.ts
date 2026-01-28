import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: "principal" | "coordinator" | "class_teacher" | "teacher" | "student" | "parent";
  schoolId: string;
}

// Rate limiting
const requestTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestTimestamps.get(ip) || [];
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  recentTimestamps.push(now);
  requestTimestamps.set(ip, recentTimestamps);
  return false;
}

function validateInput(email: string, password: string, fullName: string, role: string, schoolId: string): string | null {
  if (!email || typeof email !== 'string') return "Email is required";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) return "Invalid email format";
  
  if (!password || typeof password !== 'string') return "Password is required";
  if (password.length < 8 || password.length > 128) return "Password must be between 8 and 128 characters";
  
  if (!fullName || typeof fullName !== 'string') return "Full name is required";
  if (fullName.length < 2 || fullName.length > 100) return "Full name must be between 2 and 100 characters";
  
  const validRoles = ["principal", "coordinator", "class_teacher", "teacher", "student", "parent"];
  if (!validRoles.includes(role)) return "Invalid role";
  
  if (!schoolId || typeof schoolId !== 'string') return "School ID is required";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(schoolId)) return "Invalid school ID format";
  
  return null;
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
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the caller is authenticated and is a host
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's token to verify they're a host
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is a host
    const { data: hostRole } = await supabaseUser
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'host')
      .eq('is_active', true)
      .single();

    if (!hostRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Only hosts can create school users" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let body: CreateUserRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, password, fullName, role, schoolId } = body;

    const validationError = validateInput(email, password, fullName, role, schoolId);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify school exists and is active
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id, name, is_active')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      return new Response(
        JSON.stringify({ success: false, error: "School not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For principal role, check if one already exists
    if (role === 'principal') {
      const { data: existingPrincipal } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('school_id', schoolId)
        .eq('role', 'principal')
        .eq('is_active', true)
        .single();

      if (existingPrincipal) {
        return new Response(
          JSON.stringify({ success: false, error: "School already has an active principal" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Create the user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    });

    if (createError) {
      if (createError.message?.includes('already registered')) {
        return new Response(
          JSON.stringify({ success: false, error: "Email already registered" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create account" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = authData.user.id;

    // Update profile with school_id
    await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        email: email.toLowerCase().trim(),
        email_verified: true,
        first_login_complete: false,
        school_id: schoolId,
      })
      .eq('id', userId);

    // Create the role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        school_id: schoolId,
        is_active: true,
      });

    if (roleError) {
      // Rollback user creation
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to assign role" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log the activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        action: `${role}_created`,
        entity_type: 'user',
        entity_id: userId,
        school_id: schoolId,
        user_id: user.id,
        details: { 
          created_role: role,
          school_name: school.name,
        },
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
