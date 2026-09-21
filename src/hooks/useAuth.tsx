import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useUser, useClerk, useSignIn, useSignUp } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';
import * as profileService from '../services/profileService';
import { prefetchMaterialsOnLogin, clearMaterialsSession } from '../services/materialsService';
import type { User } from '../data/types';
import type { ProfileRow, ProfileStatsRow } from '../types/database.types';
import { generateQuickId, clerkIdToUuid, emailToUuid } from '../lib/idUtils';

export interface SignUpParams {
  readonly email: string;
  readonly password: string;
  readonly name?: string;
  readonly phone?: string;
}

export interface SignInParams {
  readonly email: string;
  readonly password: string;
}

export interface AccountStatus {
  readonly hasAccount: boolean;
  readonly isUnconfirmed: boolean;
  readonly isAdmin: boolean;
}

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

function toUser(
  profile: ProfileRow | null,
  stats: ProfileStatsRow | null,
  clerkUser?: any,
): User {
  const resolvedEmail = (profile?.email || clerkUser?.primaryEmailAddress?.emailAddress || '').trim().toLowerCase();
  const effectiveId = profile?.id || (resolvedEmail ? emailToUuid(resolvedEmail) : (clerkUser ? clerkIdToUuid(clerkUser.id) : ''));
  const localCover = typeof window !== 'undefined' ? localStorage.getItem(`quicklearnit.cover_${effectiveId}`) : null;
  let localAcademic: { course?: string; preferredSubjects?: string[] } = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`quicklearnit.academic_${effectiveId}`);
      if (raw) localAcademic = JSON.parse(raw);
    } catch {}
  }

  const resolvedAvatar = profile?.avatar_url || clerkUser?.imageUrl || '';
  const resolvedName =
    profile?.name ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'User';
  const resolvedUsername = profile?.username || clerkUser?.username || undefined;

  const cachedRole =
    typeof window !== 'undefined' && resolvedEmail
      ? localStorage.getItem(`quicklearnit.role_${resolvedEmail}`)
      : null;

  return {
    id: effectiveId,
    quickId: generateQuickId(effectiveId),
    name: resolvedName,
    username: resolvedUsername,
    email: resolvedEmail,
    avatar: resolvedAvatar,
    coverImage: profile?.cover_image || localCover || undefined,
    university: profile?.university ?? '',
    major: profile?.major ?? '',
    course: (profile as any)?.course || localAcademic.course || undefined,
    college: profile?.college ?? undefined,
    branch: profile?.branch ?? undefined,
    year: profile?.year ?? undefined,
    semester: profile?.semester ?? undefined,
    preferredSubjects: parsePreferredSubjects((profile as any)?.preferred_subjects ?? localAcademic.preferredSubjects),

    role:
      resolvedEmail.toLowerCase() === 'lexonitservices@gmail.com' ||
      resolvedEmail.toLowerCase() === 'hr@lexonit.com' ||
      clerkUser?.publicMetadata?.role === 'admin' ||
      profile?.role === 'admin' ||
      cachedRole === 'admin'
        ? 'admin'
        : (profile?.role || (clerkUser?.publicMetadata?.role as any) || (cachedRole as any) || 'student'),
    createdAt:
      profile?.created_at ||
      (clerkUser?.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString()),
    stats: {
      uploads: stats?.uploads_count ?? 0,
      downloads: stats?.downloads_count ?? 0,
      saved: stats?.saved_count ?? 0,
    },
  };
}

interface AuthContextValue {
  readonly user: User | null;
  readonly session: any;
  readonly isAuthenticated: boolean;
  readonly isExploring: boolean;
  readonly hasOnboarded: boolean;
  readonly loading: boolean;
  readonly hasPassword: boolean;
  readonly signUp: (
    params: SignUpParams,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  readonly signIn: (params: SignInParams) => Promise<{ error: string | null; needsSecondFactor?: boolean }>;
  readonly sendSignInOtp: (email: string) => Promise<{ error: string | null }>;
  readonly verifySignInOtp: (email: string, code: string) => Promise<{ error: string | null; needsSecondFactor?: boolean }>;
  readonly signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>;
  readonly signInWithLinkedIn: (redirectTo?: string) => Promise<{ error: string | null }>;
  readonly signUpWithGoogle: () => Promise<{ error: string | null }>;
  readonly signUpWithLinkedIn: () => Promise<{ error: string | null }>;
  readonly getPendingOAuthUser: () => {
    provider: 'google' | 'linkedin';
    email: string;
    name: string;
    avatarUrl?: string;
  } | null;
  readonly completeOAuthSignUp: (params: {
    password: string;
    name?: string;
  }) => Promise<{ error: string | null }>;
  readonly resetPassword: (email: string) => Promise<{ error: string | null }>;
  readonly updatePassword: (params: { currentPassword?: string; newPassword: string }) => Promise<{ error: string | null }>;

  readonly verifySignupOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  readonly sendMobileOtp: (phone: string) => Promise<{ error: string | null }>;
  readonly verifyMobileOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  readonly signOut: () => Promise<void>;
  readonly checkAccountStatus: (email: string) => Promise<AccountStatus>;
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

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { isLoaded: isUserLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const { isLoaded: isSignInLoaded, signIn: signInResource, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp: signUpResource, setActive: setSignUpActive } = useSignUp();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<ProfileStatsRow | null>(null);
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

  const [clerkTimeout, setClerkTimeout] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [profileTimeout, setProfileTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setClerkTimeout(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setIsProfileLoaded(false);
      setProfileTimeout(false);
      return;
    }
    const timer = setTimeout(() => {
      setProfileTimeout(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isSignedIn]);

  const lastLoadedClerkId = useRef<string | null>(null);

  const loadProfile = useCallback(async (pointer: string, clerkUserObj?: any) => {
    try {
      const email = clerkUserObj?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
                    (pointer.includes('@') ? pointer.trim().toLowerCase() : null);
      const effectiveId = email ? emailToUuid(email) : pointer;

      const defaultData: Partial<ProfileRow> = clerkUserObj
        ? {
            id: effectiveId,
            name:
              clerkUserObj.fullName ||
              clerkUserObj.firstName ||
              email?.split('@')[0] ||
              'User',
            email: email,
            avatar_url: clerkUserObj.imageUrl || null,
            username: clerkUserObj.username || undefined,
          }
        : {};

      let profileRow = await profileService.getProfile(email || effectiveId, defaultData).catch(() => null);

      let isAllowlisted = false;
      if (email) {
        try {
          const { data: allowEntry } = await supabase
            .from('admin_allowlist')
            .select('email')
            .ilike('email', email)
            .maybeSingle();

          if (allowEntry) {
            isAllowlisted = true;
            if (profileRow) {
              profileRow = { ...profileRow, role: 'admin' };
            }
            await supabase.from('profiles').update({ role: 'admin' }).ilike('email', email);
          }
        } catch {}
      }

      const profileId = profileRow?.id || effectiveId;
      const statsRow = await profileService.getProfileStats(profileId).catch(() => null);

      if (profileRow) {
        setProfile(profileRow);
        if (email && profileRow.role) {
          localStorage.setItem(`quicklearnit.role_${email}`, profileRow.role);
        }
      } else if (clerkUserObj) {
        const isRootAdmin =
          (email || '').toLowerCase() === 'lexonitservices@gmail.com' ||
          (email || '').toLowerCase() === 'hr@lexonit.com';
        const fallback: ProfileRow = {
          id: effectiveId,
          name: defaultData.name || 'User',
          username: defaultData.username || `user_${effectiveId.slice(0, 5)}`,
          email: email,
          phone: null,
          avatar_url: defaultData.avatar_url || null,
          university: null,
          college: null,
          branch: null,
          major: null,
          year: null,
          semester: null,
          role: isRootAdmin || isAllowlisted || clerkUserObj?.publicMetadata?.role === 'admin' ? 'admin' : 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallback);
        if (email && fallback.role) {
          localStorage.setItem(`quicklearnit.role_${email}`, fallback.role);
        }
      }
      setStats(statsRow);
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    } finally {
      setIsProfileLoaded(true);
    }
  }, []);

  const stopExploring = useCallback(() => {
    localStorage.removeItem(EXPLORING_KEY);
    localStorage.removeItem(GUEST_USER_KEY);
    setIsExploring(false);
    setGuestUser(null);
  }, []);

  useEffect(() => {
    if (!isUserLoaded) return;

    if (isSignedIn && clerkUser) {
      const userEmail = clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
                        clerkUser.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() || '';
      const dbUserId = userEmail ? emailToUuid(userEmail) : clerkIdToUuid(clerkUser.id);

      // If user is completing OAuth registration on /signup, do not auto-create profile yet
      if (sessionStorage.getItem('oauth_signup_pending')) {
        setIsProfileLoaded(true);
        return;
      }

      // Strict sign-in: check if user arrived from OAuth on /signin
      const oauthSource = sessionStorage.getItem('oauth_source');
      if (oauthSource === 'signin' && userEmail) {
        void (async () => {
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id, is_deleted')
              .ilike('email', userEmail)
              .maybeSingle();

            const hasActiveAccount = Boolean(existingProfile && !existingProfile.is_deleted);
            if (!hasActiveAccount) {
              // Block direct dashboard access! Redirect to /signup with details prefilled
              sessionStorage.removeItem('oauth_source');
              const extAccounts = (clerkUser.externalAccounts as any[]) || [];
              const isLinkedIn = extAccounts.some((acc: any) =>
                acc.verification?.strategy?.includes('linkedin') || acc.provider?.includes('linkedin')
              );
              const detectedProvider = isLinkedIn ? 'linkedin' : 'google';
              sessionStorage.setItem('oauth_signup_pending', detectedProvider);
              sessionStorage.setItem('oauth_signup_reason', 'no_account');
              window.location.replace(`/signup?oauth_return=${detectedProvider}&reason=no_account`);
              return;
            }

            // User has an existing account: proceed with normal login
            sessionStorage.removeItem('oauth_source');
            localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
            localStorage.setItem(ONBOARDED_KEY, 'true');
            setHasOnboarded(true);
            stopExploring();

            if (lastLoadedClerkId.current !== clerkUser.id) {
              lastLoadedClerkId.current = clerkUser.id;
              loadProfile(userEmail || dbUserId, clerkUser).finally(() => {
                prefetchMaterialsOnLogin(dbUserId).catch(() => {});
              });
            }
          } catch {
            sessionStorage.removeItem('oauth_source');
            localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
            localStorage.setItem(ONBOARDED_KEY, 'true');
            setHasOnboarded(true);
            stopExploring();

            if (lastLoadedClerkId.current !== clerkUser.id) {
              lastLoadedClerkId.current = clerkUser.id;
              loadProfile(userEmail || dbUserId, clerkUser).finally(() => {
                prefetchMaterialsOnLogin(dbUserId).catch(() => {});
              });
            }
          }
        })();
        return;
      }

      localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
      localStorage.setItem(ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
      stopExploring();

      if (lastLoadedClerkId.current !== clerkUser.id) {
        lastLoadedClerkId.current = clerkUser.id;
        loadProfile(userEmail || dbUserId, clerkUser).finally(() => {
          prefetchMaterialsOnLogin(dbUserId).catch(() => {});
        });
      }
    } else {
      lastLoadedClerkId.current = null;
      setProfile(null);
      setStats(null);
      setIsProfileLoaded(false);
    }
  }, [isUserLoaded, isSignedIn, clerkUser, loadProfile, stopExploring]);

  const signUp = useCallback(
    async (params: SignUpParams) => {
      if (!isSignUpLoaded || !signUpResource) {
        return { error: 'Authentication service is initializing. Please try again in a moment.', needsEmailConfirmation: false };
      }
      try {
        const nameParts = (params.name || '').trim().split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || undefined;

        const result = await signUpResource.create({
          emailAddress: params.email.trim(),
          password: params.password,
          firstName,
          lastName,
        });

        if (result.status === 'complete') {
          await setSignUpActive({ session: result.createdSessionId });
          stopExploring();
          return { error: null, needsEmailConfirmation: false };
        }

        // Send email OTP verification code
        await signUpResource.prepareEmailAddressVerification({ strategy: 'email_code' });
        stopExploring();
        return { error: null, needsEmailConfirmation: true };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to sign up';
        return { error: msg, needsEmailConfirmation: false };
      }
    },
    [isSignUpLoaded, signUpResource, setSignUpActive, stopExploring],
  );

  const signIn = useCallback(
    async (params: SignInParams) => {
      if (!isSignInLoaded || !signInResource) {
        return { error: 'Authentication service is initializing. Please try again in a moment.' };
      }
      try {
        const result = await signInResource.create({
          identifier: params.email.trim(),
          password: params.password,
        });

        if (result.status === 'complete') {
          await setSignInActive({ session: result.createdSessionId });
          localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
          localStorage.setItem(ONBOARDED_KEY, 'true');
          setHasOnboarded(true);
          stopExploring();
          return { error: null };
        }

        if (result.status === 'needs_second_factor') {
          const emailFactor = (result.supportedSecondFactors as any[])?.find(
            (f: any) => f.strategy === 'email_code',
          );
          if (emailFactor) {
            await signInResource.prepareSecondFactor({
              strategy: 'email_code',
              emailAddressId: emailFactor.emailAddressId,
            });
            return { error: null, needsSecondFactor: true };
          }
          return { error: 'Second factor verification required, but no email verification strategy was found.' };
        }

        return { error: `Sign-in status: ${result.status}` };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to sign in';
        return { error: msg };
      }
    },
    [isSignInLoaded, signInResource, setSignInActive, stopExploring],
  );

  const sendSignInOtp = useCallback(
    async (email: string) => {
      if (!isSignInLoaded || !signInResource) {
        return { error: 'Authentication service is initializing. Please try again in a moment.' };
      }
      try {
        const cleanEmail = email.trim();
        const si = await signInResource.create({ identifier: cleanEmail });

        const emailFactor = (si.supportedFirstFactors as any[])?.find(
          (f: any) => f.strategy === 'email_code',
        );

        if (emailFactor) {
          await signInResource.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
          return { error: null };
        }

        return {
          error: 'Email OTP login is not enabled for this account. Please sign in with your password, or use Google / LinkedIn.',
        };
      } catch (err: any) {
        const msg =
          err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          err?.message ||
          'Failed to send OTP code. Please try again.';
        return { error: msg };
      }
    },
    [isSignInLoaded, signInResource],
  );

  const verifySignInOtp = useCallback(
    async (_email: string, code: string) => {
      if (!isSignInLoaded || !signInResource) {
        return { error: 'Authentication service is initializing. Please try again in a moment.' };
      }
      try {
        const result = await signInResource.attemptFirstFactor({
          strategy: 'email_code',
          code: code.trim(),
        });

        if (result.status === 'complete') {
          await setSignInActive({ session: result.createdSessionId });
          localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
          localStorage.setItem(ONBOARDED_KEY, 'true');
          setHasOnboarded(true);
          stopExploring();
          return { error: null };
        }

        if (result.status === 'needs_second_factor') {
          const emailFactor = (result.supportedSecondFactors as any[])?.find(
            (f: any) => f.strategy === 'email_code',
          );
          if (emailFactor) {
            await signInResource.prepareSecondFactor({
              strategy: 'email_code',
              emailAddressId: emailFactor.emailAddressId,
            });
            return { error: null, needsSecondFactor: true };
          }
        }

        return { error: `Sign-in status: ${result.status}` };
      } catch (err: any) {
        const msg =
          err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          err?.message ||
          'Invalid verification code. Please check and try again.';
        return { error: msg };
      }
    },
    [isSignInLoaded, signInResource, setSignInActive, stopExploring],
  );

  const signInWithGoogle = useCallback(
    async (redirectTo?: string) => {
      sessionStorage.setItem('oauth_source', 'signin');
      if (!isSignInLoaded || !signInResource) {
        return { error: 'Authentication service is initializing.' };
      }
      try {
        await signInResource.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: redirectTo || '/dashboard',
          oidcPrompt: 'select_account',
          prompt: 'select_account',
        } as any);
        return { error: null };
      } catch (err: any) {
        if (isSignUpLoaded && signUpResource) {
          try {
            await signUpResource.authenticateWithRedirect({
              strategy: 'oauth_google',
              redirectUrl: `${window.location.origin}/sso-callback`,
              redirectUrlComplete: redirectTo || '/dashboard',
              oidcPrompt: 'select_account',
              prompt: 'select_account',
            } as any);
            return { error: null };
          } catch (e: any) {
            const msg = e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || 'Google sign-in failed';
            return { error: msg };
          }
        }
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Google sign-in failed';
        return { error: msg };
      }
    },
    [isSignInLoaded, signInResource, isSignUpLoaded, signUpResource],
  );

  const signInWithLinkedIn = useCallback(
    async (redirectTo?: string) => {
      sessionStorage.setItem('oauth_source', 'signin');
      if (!isSignInLoaded || !signInResource) {
        return { error: 'Authentication service is initializing.' };
      }
      try {
        await signInResource.authenticateWithRedirect({
          strategy: 'oauth_linkedin_oidc',
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: redirectTo || '/dashboard',
        });
        return { error: null };
      } catch (err: any) {
        if (isSignUpLoaded && signUpResource) {
          try {
            await signUpResource.authenticateWithRedirect({
              strategy: 'oauth_linkedin_oidc',
              redirectUrl: `${window.location.origin}/sso-callback`,
              redirectUrlComplete: redirectTo || '/dashboard',
            });
            return { error: null };
          } catch (e: any) {
            try {
              await signUpResource.authenticateWithRedirect({
                strategy: 'oauth_linkedin',
                redirectUrl: `${window.location.origin}/sso-callback`,
                redirectUrlComplete: redirectTo || '/dashboard',
              });
              return { error: null };
            } catch (err2: any) {
              const msg = err2?.errors?.[0]?.longMessage || err2?.errors?.[0]?.message || err2?.message || 'LinkedIn sign-in failed';
              return { error: msg };
            }
          }
        }
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'LinkedIn sign-in failed';
        return { error: msg };
      }
    },
    [isSignInLoaded, signInResource, isSignUpLoaded, signUpResource],
  );

  const signUpWithGoogle = useCallback(
    async () => {
      sessionStorage.setItem('oauth_signup_pending', 'google');
      if (isSignUpLoaded && signUpResource) {
        try {
          await signUpResource.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: `${window.location.origin}/sso-callback`,
            redirectUrlComplete: `${window.location.origin}/signup?oauth_return=google`,
            oidcPrompt: 'select_account',
            prompt: 'select_account',
          } as any);
          return { error: null };
        } catch (err: any) {
          if (isSignInLoaded && signInResource) {
            try {
              await signInResource.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: `${window.location.origin}/sso-callback`,
                redirectUrlComplete: `${window.location.origin}/signup?oauth_return=google`,
                oidcPrompt: 'select_account',
                prompt: 'select_account',
              } as any);
              return { error: null };
            } catch (e: any) {
              const msg = e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || 'Google sign-up failed';
              return { error: msg };
            }
          }
          const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Google sign-up failed';
          return { error: msg };
        }
      }
      return { error: 'Authentication service is initializing.' };
    },
    [isSignUpLoaded, signUpResource, isSignInLoaded, signInResource],
  );

  const signUpWithLinkedIn = useCallback(
    async () => {
      sessionStorage.setItem('oauth_signup_pending', 'linkedin');
      if (isSignUpLoaded && signUpResource) {
        try {
          await signUpResource.authenticateWithRedirect({
            strategy: 'oauth_linkedin_oidc',
            redirectUrl: `${window.location.origin}/sso-callback`,
            redirectUrlComplete: `${window.location.origin}/signup?oauth_return=linkedin`,
          });
          return { error: null };
        } catch (err: any) {
          try {
            await signUpResource.authenticateWithRedirect({
              strategy: 'oauth_linkedin',
              redirectUrl: `${window.location.origin}/sso-callback`,
              redirectUrlComplete: `${window.location.origin}/signup?oauth_return=linkedin`,
            });
            return { error: null };
          } catch (e: any) {
            if (isSignInLoaded && signInResource) {
              try {
                await signInResource.authenticateWithRedirect({
                  strategy: 'oauth_linkedin_oidc',
                  redirectUrl: `${window.location.origin}/sso-callback`,
                  redirectUrlComplete: `${window.location.origin}/signup?oauth_return=linkedin`,
                });
                return { error: null };
              } catch (err2: any) {
                const msg = err2?.errors?.[0]?.longMessage || err2?.errors?.[0]?.message || err2?.message || 'LinkedIn sign-up failed';
                return { error: msg };
              }
            }
            const msg = e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || 'LinkedIn sign-up failed';
            return { error: msg };
          }
        }
      }
      return { error: 'Authentication service is initializing.' };
    },
    [isSignUpLoaded, signUpResource, isSignInLoaded, signInResource],
  );

  const getPendingOAuthUser = useCallback(() => {
    const pendingProvider = sessionStorage.getItem('oauth_signup_pending') as 'google' | 'linkedin' | null;
    const urlParams = new URLSearchParams(window.location.search);
    const returnParam = urlParams.get('oauth_return') as 'google' | 'linkedin' | null;
    const provider = pendingProvider || returnParam || null;

    if (signUpResource && (signUpResource.status === 'missing_requirements' || signUpResource.emailAddress)) {
      const email = (signUpResource.emailAddress || '').trim().toLowerCase();
      const name = `${signUpResource.firstName || ''} ${signUpResource.lastName || ''}`.trim() || email.split('@')[0] || '';
      const extStrategy = (signUpResource.verifications as any)?.externalAccount?.strategy || '';
      const detectedProvider: 'google' | 'linkedin' =
        extStrategy.includes('linkedin') ? 'linkedin' : (extStrategy.includes('google') ? 'google' : (provider || 'google'));

      if (email && email.includes('@')) {
        return {
          provider: detectedProvider,
          email,
          name: name || email.split('@')[0],
          avatarUrl: undefined,
        };
      }
    }

    if (isSignedIn && clerkUser) {
      const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '').trim().toLowerCase();
      const name = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0] || '';
      const extAccounts = (clerkUser.externalAccounts as any[]) || [];
      const isLinkedIn = extAccounts.some((acc: any) =>
        acc.verification?.strategy?.includes('linkedin') || acc.provider?.includes('linkedin')
      );
      const detectedProvider: 'google' | 'linkedin' = isLinkedIn ? 'linkedin' : 'google';

      if (email && email.includes('@') && (provider || extAccounts.length > 0)) {
        return {
          provider: provider || detectedProvider,
          email,
          name: name || email.split('@')[0],
          avatarUrl: clerkUser.imageUrl || undefined,
        };
      }
    }

    return null;
  }, [signUpResource, isSignedIn, clerkUser]);

  const completeOAuthSignUp = useCallback(
    async (params: { password: string; name?: string }) => {
      try {
        const nameParts = (params.name || '').trim().split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || undefined;

        if (isSignUpLoaded && signUpResource && signUpResource.status === 'missing_requirements') {
          const res = await signUpResource.update({
            password: params.password,
            firstName,
            lastName,
          });
          if (res.status === 'complete') {
            await setSignUpActive({ session: res.createdSessionId });
            sessionStorage.removeItem('oauth_signup_pending');
            stopExploring();
            return { error: null };
          }
          return { error: `Sign-up status: ${res.status}` };
        }

        if (isSignedIn && clerkUser) {
          if (params.name && params.name.trim() && params.name !== clerkUser.fullName) {
            try {
              await clerkUser.update({
                firstName,
                lastName,
              });
            } catch (err) {
              console.warn('Could not update clerk name:', err);
            }
          }

          if (typeof (clerkUser as any).createPassword === 'function') {
            try {
              await (clerkUser as any).createPassword({ newPassword: params.password });
            } catch (e: any) {
              if (typeof (clerkUser as any).updatePassword === 'function') {
                await (clerkUser as any).updatePassword({ newPassword: params.password });
              } else {
                throw e;
              }
            }
          } else if (typeof (clerkUser as any).updatePassword === 'function') {
            await (clerkUser as any).updatePassword({ newPassword: params.password });
          }

          sessionStorage.removeItem('oauth_signup_pending');
          sessionStorage.removeItem('oauth_signup_reason');

          const userEmail = clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
                            clerkUser.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() || '';
          const dbUserId = userEmail ? emailToUuid(userEmail) : clerkIdToUuid(clerkUser.id);

          await profileService.getProfile(userEmail || dbUserId, {
            id: dbUserId,
            name: params.name || clerkUser.fullName || 'User',
            email: userEmail,
            avatar_url: clerkUser.imageUrl || null,
            username: clerkUser.username || undefined,
            is_deleted: false,
          }).catch(() => {});

          await loadProfile(userEmail || dbUserId, clerkUser);
          stopExploring();
          return { error: null };
        }

        const fallbackEmail = signUpResource?.emailAddress;
        if (fallbackEmail) {
          const res = await signUp({
            email: fallbackEmail,
            password: params.password,
            name: params.name || 'User',
          });
          sessionStorage.removeItem('oauth_signup_pending');
          return { error: res.error };
        }

        return { error: 'No connected account session was found. Please try connecting again.' };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to set password and complete sign-up';
        return { error: msg };
      }
    },
    [isSignUpLoaded, signUpResource, isSignedIn, clerkUser, setSignUpActive, stopExploring, signUp, loadProfile],
  );

  const resendSignupOtp = useCallback(
    async (_email: string) => {
      if (isSignInLoaded && signInResource && signInResource.status === 'needs_second_factor') {
        try {
          const emailFactor = (signInResource.supportedSecondFactors as any[])?.find(
            (f: any) => f.strategy === 'email_code',
          );
          if (emailFactor) {
            await signInResource.prepareSecondFactor({
              strategy: 'email_code',
              emailAddressId: emailFactor.emailAddressId,
            });
            return { error: null };
          }
        } catch (err: any) {
          const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to resend code';
          return { error: msg };
        }
      }

      if (!isSignUpLoaded || !signUpResource) {
        return { error: 'Authentication service is initializing.' };
      }
      try {
        await signUpResource.prepareEmailAddressVerification({ strategy: 'email_code' });
        return { error: null };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to resend code';
        return { error: msg };
      }
    },
    [isSignInLoaded, signInResource, isSignUpLoaded, signUpResource],
  );

  const verifySignupOtp = useCallback(
    async (_email: string, token: string) => {
      // 1. If currently in second-factor sign-in flow
      if (isSignInLoaded && signInResource && signInResource.status === 'needs_second_factor') {
        try {
          const result = await signInResource.attemptSecondFactor({
            strategy: 'email_code',
            code: token.trim(),
          });
          if (result.status === 'complete') {
            await setSignInActive({ session: result.createdSessionId });
            localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
            localStorage.setItem(ONBOARDED_KEY, 'true');
            setHasOnboarded(true);
            stopExploring();
            return { error: null };
          }
          return { error: `Verification status: ${result.status}` };
        } catch (err: any) {
          const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Invalid verification code';
          return { error: msg };
        }
      }

      // 2. Otherwise standard sign-up flow
      if (!isSignUpLoaded || !signUpResource) {
        return { error: 'Authentication service is initializing.' };
      }
      try {
        const result = await signUpResource.attemptEmailAddressVerification({
          code: token.trim(),
        });
        if (result.status === 'complete') {
          await setSignUpActive({ session: result.createdSessionId });
          localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
          localStorage.setItem(ONBOARDED_KEY, 'true');
          setHasOnboarded(true);
          stopExploring();
          return { error: null };
        }
        return { error: `Verification status: ${result.status}` };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Invalid verification code';
        return { error: msg };
      }
    },
    [isSignInLoaded, signInResource, isSignUpLoaded, signUpResource, setSignInActive, setSignUpActive, stopExploring],
  );

  const sendMobileOtp = useCallback(async (_phone: string) => {
    return { error: 'Phone verification is not supported. Please use email verification.' };
  }, []);

  const verifyMobileOtp = useCallback(async (_phone: string, _token: string) => {
    return { error: 'Phone verification is not supported. Please use email verification.' };
  }, []);

  const resetPassword = useCallback(
    async (email: string) => {
      if (!isSignInLoaded || !signInResource) {
        return { error: 'Authentication service is initializing.' };
      }
      try {
        await signInResource.create({
          strategy: 'reset_password_email_code',
          identifier: email.trim(),
        });
        return { error: null };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to send reset link';
        return { error: msg };
      }
    },
    [isSignInLoaded, signInResource],
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem(ONBOARDED_KEY);
    localStorage.removeItem(EXPLORING_KEY);
    localStorage.removeItem(GUEST_USER_KEY);
    setHasOnboarded(false);
    setIsExploring(false);
    setGuestUser(null);
    sessionStorage.removeItem(WORKSPACE_KEY);
    setIsProfileLoaded(false);
    clearMaterialsSession();
    try {
      await clerkSignOut();
    } catch {}
  }, [clerkSignOut]);

  const checkAccountStatus = useCallback(async (email: string): Promise<AccountStatus> => {
    const normalized = email.trim().toLowerCase();
    const isRoot = normalized === 'lexonitservices@gmail.com' || normalized === 'hr@lexonit.com';
    try {
      const [profileRes, allowlistRes] = await Promise.all([
        supabase.from('profiles').select('id, role').ilike('email', normalized).maybeSingle(),
        supabase.from('admin_allowlist').select('email').ilike('email', normalized).maybeSingle(),
      ]);
      const hasAccount = Boolean(profileRes.data);
      const isAdmin = isRoot || profileRes.data?.role === 'admin' || Boolean(allowlistRes.data);
      return {
        hasAccount: hasAccount || isAdmin,
        isUnconfirmed: false,
        isAdmin,
      };
    } catch {
      return {
        hasAccount: true,
        isUnconfirmed: false,
        isAdmin: isRoot,
      };
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  const startExploring = useCallback(() => {
    const guest: User = {
      id: '',
      name: 'Guest User',
      username: 'guest',
      email: 'guest@answersbro.app',
      avatar: '',
      university: 'Explore Mode',
      major: 'Guest Access',
      college: 'answersbro',
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
      const userEmail = profile?.email || clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || '';
      const activeId = profile?.id || (userEmail ? emailToUuid(userEmail) : (clerkUser ? clerkIdToUuid(clerkUser.id) : guestUser?.id ?? 'guest'));
      const pointer = userEmail || activeId;

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

      if (!isSignedIn) {
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

      if (clerkUser && fields.name) {
        const parts = fields.name.trim().split(' ');
        clerkUser
          .update({
            firstName: parts[0],
            lastName: parts.slice(1).join(' ') || '',
          })
          .catch(() => {});
      }

      if (pointer && pointer !== 'guest') {
        const updated = await profileService.updateProfile(pointer, toUserUpdate(fields)).catch(() => null);
        if (updated) {
          setProfile((prev) => {
            if (!prev) return updated;
            return {
              ...prev,
              ...updated,
              ...(fields.course !== undefined ? { course: fields.course } : {}),
              ...(fields.preferredSubjects !== undefined ? { preferred_subjects: fields.preferredSubjects } : {}),
            };
          });
        } else {
          setProfile((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...toUserUpdate(fields),
            } as ProfileRow;
          });
        }
      }
    },
    [profile, clerkUser, guestUser, isSignedIn],
  );

  const refreshUser = useCallback(async () => {
    if (!clerkUser) return;
    const userEmail = clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
                      clerkUser.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() || '';
    const dbUserId = userEmail ? emailToUuid(userEmail) : clerkIdToUuid(clerkUser.id);
    await loadProfile(userEmail || dbUserId, clerkUser);
  }, [clerkUser, loadProfile]);

  const updatePassword = useCallback(
    async (params: { currentPassword?: string; newPassword: string }) => {
      if (!clerkUser) return { error: 'Not signed in.' };
      try {
        if (clerkUser.passwordEnabled) {
          if (!params.currentPassword) {
            return { error: 'Current password is required.' };
          }
          await (clerkUser as any).updatePassword({
            currentPassword: params.currentPassword,
            newPassword: params.newPassword,
          });
        } else {
          if (typeof (clerkUser as any).createPassword === 'function') {
            await (clerkUser as any).createPassword({
              newPassword: params.newPassword,
            });
          } else {
            await (clerkUser as any).updatePassword({
              newPassword: params.newPassword,
            });
          }
        }
        return { error: null };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to update password';
        return { error: msg };
      }
    },
    [clerkUser],
  );

  const deleteAccount = useCallback(
    async () => {
      if (!clerkUser) return { error: 'Not signed in.' };
      try {
        const userEmail = clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || '';
        if (userEmail) {
          try {
            await supabase.from('profiles').update({ is_deleted: true }).ilike('email', userEmail);
          } catch {}
        }
        await clerkUser.delete();
        await signOut();
        return { error: null };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to delete account';
        return { error: msg };
      }
    },
    [clerkUser, signOut],
  );

  const user = useMemo<User | null>(() => {
    if (isSignedIn && clerkUser) {
      return toUser(profile, stats, clerkUser);
    }
    if (guestUser && isExploring) {
      return {
        ...guestUser,
        quickId: undefined,
      };
    }
    return null;
  }, [isSignedIn, clerkUser, profile, stats, guestUser, isExploring]);

  const session = useMemo(() => {
    if (!isSignedIn || !clerkUser) return null;
    const userEmail = clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || '';
    const effectiveId = profile?.id || (userEmail ? emailToUuid(userEmail) : clerkIdToUuid(clerkUser.id));
    return {
      user: {
        id: effectiveId,
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        user_metadata: {
          name: clerkUser.fullName,
          avatar_url: clerkUser.imageUrl,
        },
        app_metadata: {
          provider: 'clerk',
        },
      },
    };
  }, [isSignedIn, clerkUser, profile]);

  const loading =
    (!isUserLoaded && !clerkTimeout) ||
    Boolean(isSignedIn && !isProfileLoaded && !profileTimeout);
  const isAuthenticated = Boolean((isSignedIn && user !== null) || (guestUser !== null && isExploring));
  const hasPassword = Boolean(clerkUser?.passwordEnabled);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated,
      isExploring,
      hasOnboarded,
      loading,
      hasPassword,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithLinkedIn,
      signUpWithGoogle,
      signUpWithLinkedIn,
      getPendingOAuthUser,
      completeOAuthSignUp,
      resetPassword,
      updatePassword,
      resendSignupOtp,
      verifySignupOtp,
      sendMobileOtp,
      verifyMobileOtp,
      sendSignInOtp,
      verifySignInOtp,
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
      isAuthenticated,
      isExploring,
      hasOnboarded,
      loading,
      hasPassword,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithLinkedIn,
      signUpWithGoogle,
      signUpWithLinkedIn,
      getPendingOAuthUser,
      completeOAuthSignUp,
      resetPassword,
      updatePassword,
      resendSignupOtp,
      verifySignupOtp,
      sendMobileOtp,
      verifyMobileOtp,
      sendSignInOtp,
      verifySignInOtp,
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

