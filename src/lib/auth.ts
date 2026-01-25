import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = 'host' | 'principal' | 'coordinator' | 'class_teacher' | 'teacher' | 'student' | 'parent';

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

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: window.location.origin,
    },
  });
  
  return { data, error };
}
