import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserRoles, getUserProfile, type UserRole, type UserProfile, type AppRole } from '@/lib/auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  profile: UserProfile | null;
  loading: boolean;
  isPrincipal: boolean;
  isCoordinator: boolean;
  isClassTeacher: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    profile: null,
    loading: true,
    isPrincipal: false,
    isCoordinator: false,
    isClassTeacher: false,
    isTeacher: false,
    isStudent: false,
    isParent: false,
  });

  const loadUserData = useCallback(async (user: User | null) => {
    if (!user) {
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        roles: [],
        profile: null,
        loading: false,
        isPrincipal: false,
        isCoordinator: false,
        isClassTeacher: false,
        isTeacher: false,
        isStudent: false,
        isParent: false,
      }));
      return;
    }

    try {
      const [roles, profile] = await Promise.all([
        getUserRoles(user.id),
        getUserProfile(user.id),
      ]);

      const hasRole = (role: AppRole) => roles.some(r => r.role === role);

      setState(prev => ({
        ...prev,
        user,
        roles,
        profile,
        loading: false,
        isPrincipal: hasRole('principal'),
        isCoordinator: hasRole('coordinator'),
        isClassTeacher: hasRole('class_teacher'),
        isTeacher: hasRole('teacher'),
        isStudent: hasRole('student'),
        isParent: hasRole('parent'),
      }));
    } catch (error) {
      // Only log in development to prevent information leakage
      if (import.meta.env.DEV) {
        console.error('Error loading user data:', error);
      }
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({ ...prev, session }));
        
        // Use setTimeout to avoid blocking the auth state change
        setTimeout(() => {
          loadUserData(session?.user ?? null);
        }, 0);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session }));
      loadUserData(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const refreshUserData = useCallback(() => {
    if (state.user) {
      loadUserData(state.user);
    }
  }, [state.user, loadUserData]);

  return {
    ...state,
    refreshUserData,
  };
}
