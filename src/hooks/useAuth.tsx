import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as authService from '../services/authService';
import * as profileService from '../services/profileService';
import type { User } from '../data/types';
import type { ProfileRow, ProfileStatsRow } from '../types/database.types';

function toUser(profile: ProfileRow, stats: ProfileStatsRow | null): User {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username ?? undefined,
    email: profile.email ?? '',
    avatar: profile.avatar_url ?? `https://i.pravatar.cc/160?u=${profile.id}`,
    university: profile.university ?? '',
    major: profile.major ?? '',
    college: profile.college ?? undefined,
    branch: profile.branch ?? undefined,
    year: profile.year ?? undefined,
    semester: profile.semester ?? undefined,
    role: profile.role,
    stats: {
      uploads: stats?.uploads_count ?? 0,
      downloads: stats?.downloads_count ?? 0,
      saved: stats?.saved_count ?? 0,
    },
  };
}

interface AuthContextValue {
  readonly user: User | null;
  readonly session: Session | null;
  readonly isAuthenticated: boolean;
  readonly hasOnboarded: boolean;
  readonly loading: boolean;
  readonly signUp: (
    params: authService.SignUpParams,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  readonly signIn: (params: authService.SignInParams) => Promise<{ error: string | null }>;
  readonly signInWithGoogle: () => Promise<{ error: string | null }>;
  readonly resendSignupOtp: (email: string) => Promise<{ error: string | null }>;
  readonly verifySignupOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  readonly sendMobileOtp: (phone: string) => Promise<{ error: string | null }>;
  readonly verifyMobileOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  readonly signOut: () => Promise<void>;
  readonly completeOnboarding: () => void;
  readonly updateUser: (fields: Partial<User>) => Promise<void>;
  readonly refreshUser: () => Promise<void>;
  readonly deleteAccount: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ONBOARDED_KEY = 'lexon.hasOnboarded';

function toUserUpdate(fields: Partial<User>) {
  return {
    ...(fields.name !== undefined && { name: fields.name }),
    ...(fields.username !== undefined && { username: fields.username }),
    ...(fields.avatar !== undefined && { avatar_url: fields.avatar }),
    ...(fields.university !== undefined && { university: fields.university }),
    ...(fields.major !== undefined && { major: fields.major }),
    ...(fields.college !== undefined && { college: fields.college }),
    ...(fields.branch !== undefined && { branch: fields.branch }),
    ...(fields.year !== undefined && { year: fields.year }),
    ...(fields.semester !== undefined && { semester: fields.semester }),
  };
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<ProfileStatsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === 'true');

  const loadProfile = useCallback(async (userId: string) => {
    const [profileRow, statsRow] = await Promise.all([
      profileService.getProfile(userId),
      profileService.getProfileStats(userId).catch(() => null),
    ]);
    setProfile(profileRow);
    setStats(statsRow);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => active && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setStats(null);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async (params: authService.SignUpParams) => {
    const { data, error } = await authService.signUpWithPassword(params);
    return { error: error?.message ?? null, needsEmailConfirmation: data.session === null && !error };
  }, []);

  const signIn = useCallback(async (params: authService.SignInParams) => {
    const { error } = await authService.signInWithPassword(params);
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await authService.signInWithGoogle();
    return { error: error?.message ?? null };
  }, []);

  const resendSignupOtp = useCallback(async (email: string) => {
    const { error } = await authService.resendSignupOtp(email);
    return { error: error?.message ?? null };
  }, []);

  const verifySignupOtp = useCallback(async (email: string, token: string) => {
    const { error } = await authService.verifySignupOtp(email, token);
    return { error: error?.message ?? null };
  }, []);

  const sendMobileOtp = useCallback(async (phone: string) => {
    const { error } = await authService.sendMobileOtp(phone);
    return { error: error?.message ?? null };
  }, []);

  const verifyMobileOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await authService.verifyMobileOtp(phone, token);
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  const updateUser = useCallback(
    async (fields: Partial<User>) => {
      if (!session) return;
      const updated = await profileService.updateProfile(session.user.id, toUserUpdate(fields));
      setProfile(updated);
    },
    [session],
  );

  const refreshUser = useCallback(async () => {
    if (!session) return;
    await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const deleteAccount = useCallback(
    async (password: string) => {
      if (!session?.user.email) return { error: 'Not signed in.' };

      const { error: verifyError } = await authService.signInWithPassword({
        email: session.user.email,
        password,
      });
      if (verifyError) return { error: 'Incorrect password.' };

      const { error: deleteError } = await supabase.from('profiles').delete().eq('id', session.user.id);
      if (deleteError) return { error: deleteError.message };

      await authService.signOut();
      return { error: null };
    },
    [session],
  );

  const user = useMemo<User | null>(() => (profile ? toUser(profile, stats) : null), [profile, stats]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: session !== null,
      hasOnboarded,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      resendSignupOtp,
      verifySignupOtp,
      sendMobileOtp,
      verifyMobileOtp,
      signOut,
      completeOnboarding,
      updateUser,
      refreshUser,
      deleteAccount,
    }),
    [
      user,
      session,
      hasOnboarded,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      resendSignupOtp,
      verifySignupOtp,
      sendMobileOtp,
      verifyMobileOtp,
      signOut,
      completeOnboarding,
      updateUser,
      refreshUser,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
