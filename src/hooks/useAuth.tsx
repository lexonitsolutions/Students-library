import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as authService from '../services/authService';
import * as profileService from '../services/profileService';
import type { User } from '../data/types';
import type { ProfileRow, ProfileStatsRow } from '../types/database.types';

import { generateQuickId } from '../lib/idUtils';

function parsePreferredSubjects(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s)).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s)).filter(Boolean);
      } catch {}
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.replace(/^"|"$/g, '').trim())
        .filter(Boolean);
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function toUser(profile: ProfileRow, stats: ProfileStatsRow | null, session?: Session | null): User {
  const localCover = typeof window !== 'undefined' ? localStorage.getItem(`quicklearnit.cover_${profile.id}`) : null;
  let localAcademic: { course?: string; preferredSubjects?: string[] } = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`quicklearnit.academic_${profile.id}`);
      if (raw) localAcademic = JSON.parse(raw);
    } catch {}
  }
  const googleAvatar =
    (session?.user?.user_metadata?.avatar_url as string) ||
    (session?.user?.user_metadata?.picture as string) ||
    null;
  const resolvedAvatar = profile.avatar_url || googleAvatar || `https://i.pravatar.cc/160?u=${profile.id}`;

  return {
    id: profile.id,
    quickId: generateQuickId(profile.id),
    name: profile.name,
    username: profile.username ?? undefined,
    email: profile.email ?? '',
    avatar: resolvedAvatar,
    coverImage: profile.cover_image || localCover || undefined,
    university: profile.university ?? '',
    major: profile.major ?? '',
    course: (profile as any).course || localAcademic.course || undefined,
    college: profile.college ?? undefined,
    branch: profile.branch ?? undefined,
    year: profile.year ?? undefined,
    semester: profile.semester ?? undefined,
    preferredSubjects: parsePreferredSubjects((profile as any).preferred_subjects ?? localAcademic.preferredSubjects),
    role: profile.role,
    createdAt: profile.created_at,
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
  readonly isExploring: boolean;
  readonly hasOnboarded: boolean;
  readonly loading: boolean;
  readonly signUp: (
    params: authService.SignUpParams,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  readonly signIn: (params: authService.SignInParams) => Promise<{ error: string | null }>;
  readonly signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>;
  readonly resetPassword: (email: string) => Promise<{ error: string | null }>;

  readonly verifySignupOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  readonly sendMobileOtp: (phone: string) => Promise<{ error: string | null }>;
  readonly verifyMobileOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  readonly signOut: () => Promise<void>;
  readonly checkAccountStatus: (email: string) => Promise<authService.AccountStatus>;
  readonly resendSignupOtp: (email: string) => Promise<{ error: string | null }>;
  readonly completeOnboarding: () => void;
  readonly startExploring: () => void;
  readonly stopExploring: () => void;
  readonly updateUser: (fields: Partial<User>) => Promise<void>;
  readonly refreshUser: () => Promise<void>;
  readonly deleteAccount: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const HAS_ACCOUNT_KEY = 'quicklearnit.has_account';
export const ONBOARDED_KEY = 'quicklearnit.hasOnboarded';
export const WORKSPACE_KEY = 'lexon.workspace';
const EXPLORING_KEY = 'quicklearnit.isExploring';
const GUEST_USER_KEY = 'quicklearnit.guest_user';

function toUserUpdate(fields: Partial<User>) {
  return {
    ...(fields.name !== undefined && { name: fields.name.trim() }),
    ...(fields.username !== undefined && { username: fields.username.trim() || null }),
    ...(fields.avatar !== undefined && { avatar_url: fields.avatar }),
    ...(fields.coverImage !== undefined && { cover_image: fields.coverImage || null }),
    ...(fields.university !== undefined && { university: fields.university }),
    ...(fields.major !== undefined && { major: fields.major }),
    ...(fields.course !== undefined && { course: fields.course }),
    ...(fields.college !== undefined && { college: fields.college }),
    ...(fields.branch !== undefined && { branch: fields.branch }),
    ...(fields.year !== undefined && { year: fields.year }),
    ...(fields.semester !== undefined && { semester: fields.semester }),
    ...(fields.preferredSubjects !== undefined && { preferred_subjects: fields.preferredSubjects }),
  };
}

function isSessionVerified(session: Session | null): boolean {
  if (!session) return false;
  if (session.user.app_metadata?.provider && session.user.app_metadata.provider !== 'email') {
    return true;
  }
  return Boolean(session.user.email_confirmed_at);
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<ProfileStatsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === 'true');

  const [isExploring, setIsExploring] = useState(() => localStorage.getItem(EXPLORING_KEY) === 'true');
  const [guestUser, setGuestUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(GUEST_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const [profileRow, statsRow] = await Promise.all([
        profileService.getProfile(userId),
        profileService.getProfileStats(userId).catch(() => null),
      ]);
      setProfile(profileRow);
      setStats(statsRow);
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    }
  }, []);

  const stopExploring = useCallback(() => {
    localStorage.removeItem(EXPLORING_KEY);
    localStorage.removeItem(GUEST_USER_KEY);
    setIsExploring(false);
    setGuestUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        if (code) {
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError && exchangeData?.session && active) {
            const sess = exchangeData.session;
            setSession(sess);
            localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
            localStorage.setItem(ONBOARDED_KEY, 'true');
            setHasOnboarded(true);
            stopExploring();
            await loadProfile(sess.user.id);
            const fromGoogle = searchParams.get('from_google');
            const cleanUrl = window.location.origin + window.location.pathname + (fromGoogle ? '?from_google=true' : '');
            window.history.replaceState({}, document.title, cleanUrl);
            if (active) setLoading(false);
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!active) return;
        const currentSession = data.session;
        if (currentSession && isSessionVerified(currentSession)) {
          setSession(currentSession);
          localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
          localStorage.setItem(ONBOARDED_KEY, 'true');
          await loadProfile(currentSession.user.id);
          if (active) setLoading(false);
        } else {
          if (currentSession && !isSessionVerified(currentSession)) {
            supabase.auth.signOut().catch(() => {});
          }
          setSession(null);
          setProfile(null);
          if (active) setLoading(false);
        }
      } catch (err) {
        console.warn('Session init error:', err);
        if (active) setLoading(false);
      }
    }

    initSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession && isSessionVerified(nextSession)) {
        setSession(nextSession);
        localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
        localStorage.setItem(ONBOARDED_KEY, 'true');
        stopExploring();
        setLoading(true);
        loadProfile(nextSession.user.id).finally(() => setLoading(false));
      } else {
        if (nextSession && !isSessionVerified(nextSession)) {
          supabase.auth.signOut().catch(() => {});
        }
        setSession(null);
        setProfile(null);
        setStats(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile, stopExploring]);

  const signUp = useCallback(async (params: authService.SignUpParams) => {
    const { error } = await authService.signUpWithPassword(params);
    if (!error) {
      stopExploring();
    }
    return { error: error?.message ?? null, needsEmailConfirmation: true };
  }, [stopExploring]);

  const signIn = useCallback(async (params: authService.SignInParams) => {
    const { data, error } = await authService.signInWithPassword(params);
    if (!error) {
      localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
      stopExploring();
      if (data?.session && isSessionVerified(data.session)) {
        setSession(data.session);
        setLoading(true);
        await loadProfile(data.session.user.id);
        setLoading(false);
      }
    }
    return { error: error?.message ?? null };
  }, [stopExploring, loadProfile]);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    const { error } = await authService.signInWithGoogle(redirectTo);
    if (!error) {
      localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
      stopExploring();
    }
    return { error: error?.message ?? null };
  }, [stopExploring]);

  const resendSignupOtp = useCallback(async (email: string) => {
    const { error } = await authService.resendSignupOtp(email);
    return { error: error?.message ?? null };
  }, []);

  const verifySignupOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await authService.verifySignupOtp(email, token);
    if (!error) {
      localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
      stopExploring();
      if (data?.session && isSessionVerified(data.session)) {
        setSession(data.session);
        setLoading(true);
        await loadProfile(data.session.user.id);
        setLoading(false);
      }
    }
    return { error: error?.message ?? null };
  }, [stopExploring, loadProfile]);

  const sendMobileOtp = useCallback(async (phone: string) => {
    const { error } = await authService.sendMobileOtp(phone);
    return { error: error?.message ?? null };
  }, []);

  const verifyMobileOtp = useCallback(async (phone: string, token: string) => {
    const { data, error } = await authService.verifyMobileOtp(phone, token);
    if (!error) {
      localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
      stopExploring();
      if (data?.session && isSessionVerified(data.session)) {
        setSession(data.session);
        setLoading(true);
        await loadProfile(data.session.user.id);
        setLoading(false);
      }
    }
    return { error: error?.message ?? null };
  }, [stopExploring, loadProfile]);

  const signOut = useCallback(async () => {
    localStorage.removeItem(ONBOARDED_KEY);
    localStorage.removeItem(EXPLORING_KEY);
    localStorage.removeItem(GUEST_USER_KEY);
    setHasOnboarded(false);
    setIsExploring(false);
    setGuestUser(null);
    sessionStorage.removeItem(WORKSPACE_KEY);
    await authService.signOut().catch(() => {});
  }, []);

  const checkAccountStatus = useCallback((email: string) => authService.checkAccountStatus(email), []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  const startExploring = useCallback(() => {
    const guest: User = {
      id: '',
      name: 'Guest User',
      username: 'guest',
      email: 'guest@studexa.app',
      avatar: '',
      university: 'Explore Mode',
      major: 'Guest Access',
      college: 'Studexa',
      role: 'student',
      stats: {
        uploads: 0,
        downloads: 0,
        saved: 0,
      },
    };
    localStorage.setItem(EXPLORING_KEY, 'true');
    localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guest));
    setIsExploring(true);
    setGuestUser(guest);
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  const updateUser = useCallback(
    async (fields: Partial<User>) => {
      const activeId = session?.user?.id ?? guestUser?.id ?? 'guest';
      if (fields.coverImage !== undefined && typeof window !== 'undefined') {
        if (fields.coverImage) {
          localStorage.setItem(`quicklearnit.cover_${activeId}`, fields.coverImage);
        } else {
          localStorage.removeItem(`quicklearnit.cover_${activeId}`);
        }
      }

      if (typeof window !== 'undefined' && (fields.course !== undefined || fields.preferredSubjects !== undefined)) {
        try {
          const currentRaw = localStorage.getItem(`quicklearnit.academic_${activeId}`);
          const parsed = currentRaw ? JSON.parse(currentRaw) : {};
          if (fields.course !== undefined) parsed.course = fields.course;
          if (fields.preferredSubjects !== undefined) parsed.preferredSubjects = fields.preferredSubjects;
          localStorage.setItem(`quicklearnit.academic_${activeId}`, JSON.stringify(parsed));
        } catch {}
      }

      if (!session) {
        if (guestUser) {
          const updatedGuest: User = {
            ...guestUser,
            ...fields,
            coverImage: fields.coverImage !== undefined ? fields.coverImage : guestUser.coverImage,
          };
          setGuestUser(updatedGuest);
          localStorage.setItem(GUEST_USER_KEY, JSON.stringify(updatedGuest));
        }
        return;
      }

      const updated = await profileService.updateProfile(session.user.id, toUserUpdate(fields));
      setProfile((prev) => {
        if (!prev) return updated;
        return {
          ...prev,
          ...updated,
          ...(fields.course !== undefined ? { course: fields.course } : {}),
          ...(fields.preferredSubjects !== undefined ? { preferred_subjects: fields.preferredSubjects } : {}),
        };
      });
    },
    [session, guestUser],
  );

  const refreshUser = useCallback(async () => {
    if (!session) return;
    await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const deleteAccount = useCallback(
    async (password: string) => {
      if (!session?.user.email) return { error: 'Not signed in.' };

      if (password) {
        const { error: verifyError } = await authService.signInWithPassword({
          email: session.user.email,
          password,
        });
        if (verifyError) return { error: 'Incorrect password.' };
      }

      const { error: deleteError } = await authService.deleteOwnAccount();
      if (deleteError) return { error: deleteError.message };

      await authService.signOut();
      return { error: null };
    },
    [session],
  );

  const user = useMemo<User | null>(
    () => {
      if (profile) {
        return toUser(profile, stats, session);
      }
      if (guestUser && isExploring) {
        return {
          ...guestUser,
          quickId: undefined,
        };
      }
      return null;
    },
    [guestUser, isExploring, profile, stats, session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: (isSessionVerified(session) && profile !== null) || (guestUser !== null && isExploring),
      isExploring,
      hasOnboarded,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      resetPassword: authService.resetPassword,
      resendSignupOtp,
      verifySignupOtp,
      sendMobileOtp,
      verifyMobileOtp,
      signOut,
      checkAccountStatus,
      completeOnboarding,
      startExploring,
      stopExploring,
      updateUser,
      refreshUser,
      deleteAccount,
    }),
    [
      user,
      session,
      guestUser,
      isExploring,
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
      startExploring,
      stopExploring,
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
