import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(clientIp)) {
      return jsonResponse({ success: false, error: "Too many requests" }, 429);
    }

    // Verify the caller is authenticated
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing environment variables:", { url: !!supabaseUrl, serviceKey: !!serviceRoleKey, anonKey: !!anonKey });
      return jsonResponse({ success: false, error: "Server configuration error" }, 500);
    }

    // Create client with user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !userData?.user) {
      console.error("Auth error:", authError?.message);
      return jsonResponse({ success: false, error: "Invalid or expired authentication token" }, 401);
    }

    const user = userData.user;

    // Use service role to check user roles (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch ALL matching roles to pick the highest-privilege role
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .in('role', ['host', 'principal', 'coordinator', 'class_teacher'])
      .eq('is_active', true);

    if (roleError) {
      console.error("Role query error:", roleError.message);
      return jsonResponse({ success: false, error: "Failed to verify permissions: " + roleError.message }, 500);
    }

    if (!callerRoles || callerRoles.length === 0) {
      return jsonResponse({ success: false, error: "You do not have permission to create users. Required role: principal, coordinator, or class_teacher." }, 403);
    }

    // Pick the highest-privilege role (host > principal > coordinator > class_teacher)
    const rolePriority: Record<string, number> = { host: 4, principal: 3, coordinator: 2, class_teacher: 1 };
    const callerRole = callerRoles.reduce((best, current) =>
      (rolePriority[current.role] || 0) > (rolePriority[best.role] || 0) ? current : best
    );

    const isHost = callerRole.role === 'host';
    const isPrincipal = callerRole.role === 'principal';
    const isCoordinator = callerRole.role === 'coordinator';
    const isClassTeacher = callerRole.role === 'class_teacher';
    const callerSchoolId = callerRole.school_id;

    let body: CreateUserRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid request body" }, 400);
    }

    const { email, password, fullName, role, schoolId } = body;

    const validationError = validateInput(email, password, fullName, role, schoolId);
    if (validationError) {
      return jsonResponse({ success: false, error: validationError }, 400);
    }

    // Verify school exists
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id, name')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      return jsonResponse({ success: false, error: "School not found" }, 404);
    }

    // Non-host users can only create users in their own school
    if (!isHost && callerSchoolId !== schoolId) {
      return jsonResponse({ success: false, error: "You can only create users in your own school" }, 403);
    }

    // Principals can only create certain roles (not host or principal)
    if (isPrincipal && role === 'principal') {
      return jsonResponse({ success: false, error: "Principals cannot create principal accounts" }, 403);
    }

    // Coordinators can only create teacher and class_teacher roles
    if (isCoordinator && !['teacher', 'class_teacher'].includes(role)) {
      return jsonResponse({ success: false, error: "Coordinators can only create teacher and class teacher accounts" }, 403);
    }

    // Class teachers can only create student accounts
    if (isClassTeacher && role !== 'student') {
      return jsonResponse({ success: false, error: "Class teachers can only create student accounts" }, 403);
    }

    // For principal role, check if one already exists (only hosts can create principals)
    if (role === 'principal') {
      const { data: existingPrincipal } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('school_id', schoolId)
        .eq('role', 'principal')
        .eq('is_active', true)
        .single();

      if (existingPrincipal) {
        return jsonResponse({ success: false, error: "School already has an active principal" }, 400);
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
      console.error("Create user error:", createError.message);
      if (createError.message?.includes('already registered') || createError.message?.includes('already been registered')) {
        return jsonResponse({ success: false, error: "Email already registered" }, 400);
      }
      return jsonResponse({ success: false, error: "Failed to create account: " + createError.message }, 500);
    }

    if (!authData?.user?.id) {
      return jsonResponse({ success: false, error: "User created but no ID returned" }, 500);
    }

    const userId = authData.user.id;

    // Update profile with school_id (profile is auto-created by handle_new_user trigger)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        email: email.toLowerCase().trim(),
        school_id: schoolId,
      })
      .eq('id', userId);

    if (profileError) {
      console.error("Profile update error:", profileError.message);
      // Non-fatal: continue even if profile update fails
    }

    // Create the role
    const { error: insertRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        school_id: schoolId,
        is_active: true,
      });

    if (insertRoleError) {
      console.error("Role insert error:", insertRoleError.message);
      // Rollback user creation
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return jsonResponse({ success: false, error: "Failed to assign role: " + insertRoleError.message }, 500);
    }

    // Log the activity (non-fatal)
    try {
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
    } catch {
      // Activity logging is non-fatal
    }

    return jsonResponse({
      success: true,
      userId,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`
    }, 200);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error("Unhandled error:", errMsg, errStack);
    return jsonResponse({ success: false, error: "Server error: " + errMsg }, 500);
  }
};

serve(handler);
