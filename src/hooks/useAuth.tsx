import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as profileService from '../services/profileService';
import * as authService from '../services/authService';
import type { User } from '../data/types';
import type { ProfileRow, ProfileStatsRow } from '../types/database.types';
import { generateQuickId } from '../lib/idUtils';

function toUser(profile: ProfileRow, stats: ProfileStatsRow | null): User {
  const localCover =
    typeof window !== 'undefined'
      ? localStorage.getItem(`quicklearnit.cover_${profile.id}`)
      : null;
  const resolvedAvatar =
    profile.avatar_url || `https://i.pravatar.cc/160?u=${profile.id}`;

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
    college: profile.college ?? undefined,
    branch: profile.branch ?? undefined,
    year: profile.year ?? undefined,
    semester: profile.semester ?? undefined,
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
  readonly isAuthenticated: boolean;
  readonly isExploring: boolean;
  readonly hasOnboarded: boolean;
  readonly loading: boolean;
  readonly signOut: () => Promise<void>;
  readonly checkAccountStatus: (email: string) => Promise<authService.AccountStatus>;
  readonly completeOnboarding: () => void;
  readonly startExploring: () => void;
  readonly stopExploring: () => void;
  readonly updateUser: (fields: Partial<User>) => Promise<void>;
  readonly refreshUser: () => Promise<void>;
  readonly deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ONBOARDED_KEY = 'quicklearnit.hasOnboarded';
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
    ...(fields.college !== undefined && { college: fields.college }),
    ...(fields.branch !== undefined && { branch: fields.branch }),
    ...(fields.year !== undefined && { year: fields.year }),
    ...(fields.semester !== undefined && { semester: fields.semester }),
  };
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Clerk auth state
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();

  const isClerkSignedIn = !!(isSignedIn || clerk.session || clerk.user);
  const activeUserId = userId || clerk.session?.user?.id || clerk.user?.id || null;
  const activeClerkUser = clerkUser || clerk.user || (clerk.session?.user as any) || null;

  // Supabase profile state
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<ProfileStatsRow | null>(null);

  // Guest / explore mode state
  const [hasOnboarded, setHasOnboarded] = useState(
    () => localStorage.getItem(ONBOARDED_KEY) === 'true',
  );
  const [isExploring, setIsExploring] = useState(
    () => localStorage.getItem(EXPLORING_KEY) === 'true',
  );
  const [guestUser, setGuestUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(GUEST_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const stopExploring = useCallback(() => {
    localStorage.removeItem(EXPLORING_KEY);
    localStorage.removeItem(GUEST_USER_KEY);
    setIsExploring(false);
    setGuestUser(null);
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const activeUser = clerkUser || clerk.user || (clerk.session?.user as any);
      const userEmail =
        activeUser?.primaryEmailAddress?.emailAddress ||
        activeUser?.emailAddresses?.[0]?.emailAddress ||
        null;

      const fallback = {
        name:
          activeUser?.fullName ||
          activeUser?.firstName ||
          userEmail?.split('@')[0] ||
          'User',
        email: userEmail,
        phone: activeUser?.primaryPhoneNumber?.phoneNumber ?? null,
        avatar_url: activeUser?.imageUrl || null,
      };
      const profileRow = await profileService.getProfile(uid, fallback);
      const statsRow = await profileService.getProfileStats(profileRow.id).catch(() => null);
      setProfile(profileRow);
      setStats(statsRow);
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    }
  }, [clerkUser, clerk]);

  // Load/clear profile when Clerk auth state changes
  useEffect(() => {
    if (!isLoaded) return;

    if (isClerkSignedIn && activeUserId) {
      stopExploring();
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
      loadProfile(activeUserId);
    } else if (!isClerkSignedIn) {
      setProfile(null);
      setStats(null);
    }
  }, [isLoaded, isClerkSignedIn, activeUserId, activeClerkUser, loadProfile, stopExploring]);

  // Overall loading state: only wait for Clerk SDK initialization
  const loading = !isLoaded;

  const signOut = useCallback(async () => {
    localStorage.removeItem(ONBOARDED_KEY);
    localStorage.removeItem(EXPLORING_KEY);
    localStorage.removeItem(GUEST_USER_KEY);
    setHasOnboarded(false);
    setIsExploring(false);
    setGuestUser(null);
    sessionStorage.removeItem(WORKSPACE_KEY);
    setProfile(null);
    setStats(null);
    await clerk.signOut();
    window.location.href = '/signin';
  }, [clerk]);

  const checkAccountStatus = useCallback(
    (email: string) => authService.checkAccountStatus(email),
    [],
  );

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
      stats: { uploads: 0, downloads: 0, saved: 0 },
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
      const activeId = profile?.id ?? guestUser?.id ?? 'guest';

      if (fields.coverImage !== undefined && typeof window !== 'undefined') {
        if (fields.coverImage) {
          localStorage.setItem(`quicklearnit.cover_${activeId}`, fields.coverImage);
        } else {
          localStorage.removeItem(`quicklearnit.cover_${activeId}`);
        }
      }

      if (!profile) {
        if (guestUser) {
          const updatedGuest: User = {
            ...guestUser,
            ...fields,
            coverImage:
              fields.coverImage !== undefined ? fields.coverImage : guestUser.coverImage,
          };
          setGuestUser(updatedGuest);
          localStorage.setItem(GUEST_USER_KEY, JSON.stringify(updatedGuest));
        }
        return;
      }

      const updated = await profileService.updateProfile(profile.id, toUserUpdate(fields));
      setProfile(updated);
    },
    [profile, guestUser],
  );

  const refreshUser = useCallback(async () => {
    if (!userId) return;
    await loadProfile(userId);
  }, [userId, loadProfile]);

  const deleteAccount = useCallback(async () => {
    if (!clerkUser) return { error: 'Not signed in.' };
    try {
      if (profile) {
        await authService.deleteOwnAccount(profile.id);
      }
      await clerkUser.delete();
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to delete account.' };
    }
  }, [clerkUser, profile]);

  const user = useMemo<User | null>(() => {
    if (profile) {
      return toUser(profile, stats);
    }
    if (activeClerkUser) {
      const fallbackId = activeUserId || 'user';
      const userEmail =
        activeClerkUser.primaryEmailAddress?.emailAddress ??
        activeClerkUser.emailAddresses?.[0]?.emailAddress ??
        '';
      const isAdmin =
        userEmail === 'hr@lexonit.com' ||
        userEmail === 'shaikjafarsadhik2521@gmail.com';
      return {
        id: fallbackId,
        quickId: generateQuickId(fallbackId),
        name:
          activeClerkUser.fullName ||
          activeClerkUser.firstName ||
          userEmail.split('@')[0] ||
          'User',
        username: activeClerkUser.username ?? undefined,
        email: userEmail,
        avatar:
          activeClerkUser.imageUrl || `https://i.pravatar.cc/160?u=${fallbackId}`,
        university: '',
        major: '',
        role: isAdmin ? 'admin' : 'student',
        stats: { uploads: 0, downloads: 0, saved: 0 },
      };
    }
    if (guestUser && isExploring) {
      return { ...guestUser, quickId: undefined };
    }
    return null;
  }, [profile, stats, activeClerkUser, activeUserId, guestUser, isExploring]);

  const isAuthenticated =
    isClerkSignedIn || (guestUser !== null && isExploring);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isExploring,
      hasOnboarded,
      loading,
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
      isAuthenticated,
      isExploring,
      hasOnboarded,
      loading,
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
