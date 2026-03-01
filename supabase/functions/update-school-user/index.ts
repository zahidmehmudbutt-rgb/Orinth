import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateUserRequest {
  userId: string;
  schoolId: string;
  email?: string;
  password?: string;
  fullName?: string;
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

function validateInput(body: UpdateUserRequest): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!body.userId || typeof body.userId !== 'string' || !uuidRegex.test(body.userId)) {
    return "Valid user ID is required";
  }

  if (!body.schoolId || typeof body.schoolId !== 'string' || !uuidRegex.test(body.schoolId)) {
    return "Valid school ID is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (body.email !== undefined) {
    if (typeof body.email !== 'string' || !emailRegex.test(body.email) || body.email.length > 255) {
      return "Invalid email format";
    }
  }

  if (body.password !== undefined && body.password !== '') {
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
      return "Password must be between 8 and 128 characters";
    }
  }

  if (body.fullName !== undefined) {
    if (typeof body.fullName !== 'string' || body.fullName.length < 2 || body.fullName.length > 100) {
      return "Full name must be between 2 and 100 characters";
    }
  }

  // At least one field to update
  const hasEmail = body.email !== undefined;
  const hasPassword = body.password !== undefined && body.password !== '';
  const hasName = body.fullName !== undefined;
  if (!hasEmail && !hasPassword && !hasName) {
    return "At least one field (email, password, or fullName) must be provided";
  }

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

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing environment variables");
      return jsonResponse({ success: false, error: "Server configuration error" }, 500);
    }

    // Verify caller identity
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !userData?.user) {
      return jsonResponse({ success: false, error: "Invalid or expired authentication token" }, 401);
    }

    const caller = userData.user;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get caller's roles
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role, school_id')
      .eq('user_id', caller.id)
      .in('role', ['host', 'principal', 'coordinator'])
      .eq('is_active', true);

    if (roleError) {
      return jsonResponse({ success: false, error: "Failed to verify permissions: " + roleError.message }, 500);
    }

    if (!callerRoles || callerRoles.length === 0) {
      return jsonResponse({ success: false, error: "You do not have permission to edit users" }, 403);
    }

    const rolePriority: Record<string, number> = { host: 4, principal: 3, coordinator: 2 };
    const callerRole = callerRoles.reduce((best, current) =>
      (rolePriority[current.role] || 0) > (rolePriority[best.role] || 0) ? current : best
    );

    const isHost = callerRole.role === 'host';
    const isCoordinator = callerRole.role === 'coordinator';
    const callerSchoolId = callerRole.school_id;

    // Parse request body
    let body: UpdateUserRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid request body" }, 400);
    }

    const validationError = validateInput(body);
    if (validationError) {
      return jsonResponse({ success: false, error: validationError }, 400);
    }

    const { userId, schoolId, email, password, fullName } = body;

    // Non-host users can only edit users in their own school
    if (!isHost && callerSchoolId !== schoolId) {
      return jsonResponse({ success: false, error: "You can only edit users in your own school" }, 403);
    }

    // Verify target user belongs to this school with an editable role
    const { data: targetRole, error: targetRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role, school_id')
      .eq('user_id', userId)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (targetRoleError || !targetRole) {
      return jsonResponse({ success: false, error: "Staff member not found in this school" }, 404);
    }

    // Coordinators can only edit teacher and class_teacher
    if (isCoordinator && !['teacher', 'class_teacher'].includes(targetRole.role)) {
      return jsonResponse({ success: false, error: "Coordinators can only edit teacher and class teacher accounts" }, 403);
    }

    // Build auth update payload
    const authUpdate: Record<string, unknown> = {};
    if (email) {
      authUpdate.email = email.toLowerCase().trim();
      authUpdate.email_confirm = true;
    }
    if (password) {
      authUpdate.password = password;
    }
    if (fullName) {
      authUpdate.user_metadata = { full_name: fullName.trim() };
    }

    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      authUpdate
    );

    if (updateAuthError) {
      console.error("Update user error:", updateAuthError.message);
      if (updateAuthError.message?.includes('already registered') || updateAuthError.message?.includes('already been registered')) {
        return jsonResponse({ success: false, error: "Email already in use by another account" }, 400);
      }
      return jsonResponse({ success: false, error: "Failed to update account: " + updateAuthError.message }, 500);
    }

    // Sync profiles table
    const profileUpdate: Record<string, string> = {};
    if (email) profileUpdate.email = email.toLowerCase().trim();
    if (fullName) profileUpdate.full_name = fullName.trim();

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileError) {
        console.error("Profile update error:", profileError.message);
      }
    }

    // Activity log (non-fatal)
    try {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          action: 'staff_updated',
          entity_type: 'user',
          entity_id: userId,
          school_id: schoolId,
          user_id: caller.id,
          details: {
            updated_fields: [
              ...(email ? ['email'] : []),
              ...(password ? ['password'] : []),
              ...(fullName ? ['full_name'] : []),
            ],
          },
        });
    } catch {
      // Non-fatal
    }

    return jsonResponse({
      success: true,
      message: "Staff member updated successfully",
    }, 200);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Unhandled error:", errMsg);
    return jsonResponse({ success: false, error: "Server error: " + errMsg }, 500);
  }
};

serve(handler);
