import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as authService from '../services/authService';
import * as profileService from '../services/profileService';
import type { User } from '../data/types';
import type { ProfileRow, ProfileStatsRow } from '../types/database.types';

import { generateQuickId, isIdPublic } from '../lib/idUtils';

function toUser(profile: ProfileRow, stats: ProfileStatsRow | null): User {
  return {
    id: profile.id,
    quickId: generateQuickId(profile.id),
    isIdPublic: isIdPublic(profile.id),
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
  readonly checkAccountStatus: (email: string) => Promise<authService.AccountStatus>;
  readonly completeOnboarding: () => void;
  readonly updateUser: (fields: Partial<User>) => Promise<void>;
  readonly refreshUser: () => Promise<void>;
  readonly deleteAccount: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ONBOARDED_KEY = 'quicklearnit.hasOnboarded';
export const WORKSPACE_KEY = 'lexon.workspace';

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

const DEMO_USER_KEY = 'quicklearnit.demo_user';

const MOCK_CREDENTIAL_USERS: Record<string, { password: string; user: User }> = {
  'sadhik@gmail.com': {
    password: 'sadhik',
    user: {
      id: 'user-sadhik-01',
      name: 'Sadhik',
      username: 'sadhik',
      email: 'sadhik@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      university: 'Stanford University',
      major: 'Computer Science',
      college: 'School of Engineering',
      branch: 'Artificial Intelligence',
      year: '3rd Year',
      semester: 'Semester 5',
      role: 'student',
      stats: {
        uploads: 15,
        downloads: 42,
        saved: 18,
      },
    },
  },
};

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<ProfileStatsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === 'true');
  const [demoUser, setDemoUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

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
        // A fresh sign-in re-enters the "loading" state until the profile
        // (and its role) resolves, so route guards don't have to make a
        // routing decision based on a still-null user and flash the wrong
        // screen before correcting themselves.
        setLoading(true);
        loadProfile(nextSession.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setStats(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async (params: authService.SignUpParams) => {
    const { data, error } = await authService.signUpWithPassword(params);
    if (!error) {
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
    }
    return { error: error?.message ?? null, needsEmailConfirmation: data?.session === null && !error };
  }, []);

  const signIn = useCallback(async (params: authService.SignInParams) => {
    const normalizedEmail = params.email.trim().toLowerCase();
    const matchedCredential = MOCK_CREDENTIAL_USERS[normalizedEmail];

    if (matchedCredential && matchedCredential.password === params.password) {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(matchedCredential.user));
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
      setDemoUser(matchedCredential.user);
      return { error: null };
    }

    const { error } = await authService.signInWithPassword(params);
    if (!error) {
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
    }
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await authService.signInWithGoogle();
    if (!error) {
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
    }
    return { error: error?.message ?? null };
  }, []);

  const resendSignupOtp = useCallback(async (email: string) => {
    const { error } = await authService.resendSignupOtp(email);
    return { error: error?.message ?? null };
  }, []);

  const verifySignupOtp = useCallback(async (email: string, token: string) => {
    const { error } = await authService.verifySignupOtp(email, token);
    if (!error) {
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
    }
    return { error: error?.message ?? null };
  }, []);

  const sendMobileOtp = useCallback(async (phone: string) => {
    const { error } = await authService.sendMobileOtp(phone);
    return { error: error?.message ?? null };
  }, []);

  const verifyMobileOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await authService.verifyMobileOtp(phone, token);
    if (!error) {
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
    }
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(ONBOARDED_KEY);
    setHasOnboarded(false);
    setDemoUser(null);
    sessionStorage.removeItem(WORKSPACE_KEY);
    await authService.signOut().catch(() => {});
  }, []);

  const checkAccountStatus = useCallback((email: string) => authService.checkAccountStatus(email), []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  const updateUser = useCallback(
    async (fields: Partial<User>) => {
      if (demoUser) {
        const updated = { ...demoUser, ...fields };
        setDemoUser(updated);
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
        return;
      }
      if (!session) return;
      const updated = await profileService.updateProfile(session.user.id, toUserUpdate(fields));
      setProfile(updated);
    },
    [demoUser, session],
  );

  const refreshUser = useCallback(async () => {
    if (!session) return;
    await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const deleteAccount = useCallback(
    async (password: string) => {
      if (demoUser) {
        localStorage.removeItem(DEMO_USER_KEY);
        setDemoUser(null);
        return { error: null };
      }

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
    [demoUser, session],
  );

  const user = useMemo<User | null>(
    () => {
      if (demoUser) {
        return {
          ...demoUser,
          quickId: generateQuickId(demoUser.id),
          isIdPublic: isIdPublic(demoUser.id),
        };
      }
      return profile ? toUser(profile, stats) : null;
    },
    [demoUser, profile, stats],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: session !== null || demoUser !== null,
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
      checkAccountStatus,
      completeOnboarding,
      updateUser,
      refreshUser,
      deleteAccount,
    }),
    [
      user,
      session,
      demoUser,
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
      checkAccountStatus,
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
