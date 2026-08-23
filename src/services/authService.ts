import { supabase } from '../lib/supabaseClient';

export interface SignUpParams {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface SignInParams {
  readonly email: string;
  readonly password: string;
}

export function formatAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const msg = typeof error === 'string' ? error : error?.message || error?.error_description || '';
  const lower = msg.toLowerCase();

  if (
    lower.includes('rate limit') ||
    lower.includes('over_email_send_rate_limit') ||
    error?.status === 429
  ) {
    return 'Email rate limit exceeded (Supabase allows a maximum of 3-4 emails/hour on default free SMTP). Please wait a few minutes before trying again, or use Google / Mobile sign-in.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  return msg || 'Authentication request failed.';
}

export async function signUpWithPassword({ name, email, password }: SignUpParams) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (result.error) {
    return {
      data: result.data,
      error: new Error(formatAuthErrorMessage(result.error)),
    };
  }

  // If user already exists, Supabase returns a user with empty identities and no error
  if (
    result.data?.user &&
    Array.isArray(result.data.user.identities) &&
    result.data.user.identities.length === 0
  ) {
    return {
      data: result.data,
      error: new Error('An account with this email already exists. Please sign in instead.'),
    };
  }

  return result;
}

export async function signInWithPassword({ email, password }: SignInParams) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error) {
    return { data: result.data, error: new Error(formatAuthErrorMessage(result.error)) };
  }
  return result;
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function resendSignupOtp(email: string) {
  const result = await supabase.auth.resend({ type: 'signup', email });
  if (result.error) {
    return { data: result.data, error: new Error(formatAuthErrorMessage(result.error)) };
  }
  return result;
}

export async function sendMobileOtp(phone: string) {
  const result = await supabase.auth.signInWithOtp({ phone });
  if (result.error) {
    return { data: result.data, error: new Error(formatAuthErrorMessage(result.error)) };
  }
  return result;
}

export async function verifySignupOtp(email: string, token: string) {
  const res = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
  if (res.error) {
    const fallbackRes = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (!fallbackRes.error) return fallbackRes;
    return { data: res.data, error: new Error(formatAuthErrorMessage(res.error)) };
  }
  return res;
}

export async function verifyMobileOtp(phone: string, token: string) {
  const res = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (res.error) {
    return { data: res.data, error: new Error(formatAuthErrorMessage(res.error)) };
  }
  return res;
}

export async function signOut() {
  return supabase.auth.signOut();
}

export interface AccountStatus {
  readonly hasAccount: boolean;
  readonly isAdmin: boolean;
}

export async function checkAccountStatus(email: string): Promise<AccountStatus> {
  const { data, error } = await supabase.rpc('check_account_status', { p_email: email });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { hasAccount: Boolean(row?.has_account), isAdmin: Boolean(row?.is_admin) };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
