import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = 'principal' | 'coordinator' | 'class_teacher' | 'teacher' | 'student' | 'parent';

export interface UserRole {
  id: string;
  user_id: string;
  school_id: string | null;
  role: AppRole;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  school_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  email_verified: boolean;
  first_login_complete: boolean;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) {
    // Only log in development to prevent information leakage
    if (import.meta.env.DEV) {
      console.error('Error fetching user roles:', error);
    }
    return [];
  }
  
  return (data || []) as unknown as UserRole[];
}

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some(r => r.role === role);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    // Only log in development to prevent information leakage
    if (import.meta.env.DEV) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  }
  
  return data as unknown as UserProfile;
}

// Helper to detect device info for login logging
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = "desktop";
  let browser = "Unknown";
  let os = "Unknown";

  // Detect device type
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
  }

  // Detect browser
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera")) browser = "Opera";

  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { deviceType, browser, os };
}

async function logLoginAttempt(
  userId: string | null,
  status: "success" | "failed" | "blocked",
  failureReason?: string
) {
  try {
    const { deviceType, browser, os } = getDeviceInfo();

    await supabase.from("login_history").insert({
      user_id: userId,
      login_status: status,
      failure_reason: failureReason || null,
      device_type: deviceType,
      browser,
      os,
      // IP address would need to be captured server-side for accuracy
    });
  } catch (e) {
    // Don't let logging errors affect the login flow
    if (import.meta.env.DEV) {
      console.error("Failed to log login attempt:", e);
    }
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Log the login attempt
  if (error) {
    // For failed logins, we don't have a user ID, so log with null
    await logLoginAttempt(null, "failed", error.message);
  } else if (data.user) {
    await logLoginAttempt(data.user.id, "success");
  }

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
