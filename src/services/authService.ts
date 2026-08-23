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

export async function signUpWithPassword({ name, email, password }: SignUpParams) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (result.error) return result;

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
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function resendSignupOtp(email: string) {
  return supabase.auth.resend({ type: 'signup', email });
}

export async function sendMobileOtp(phone: string) {
  return supabase.auth.signInWithOtp({ phone });
}

export async function verifySignupOtp(email: string, token: string) {
  const res = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
  if (res.error) {
    const fallbackRes = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (!fallbackRes.error) return fallbackRes;
  }
  return res;
}

export async function verifyMobileOtp(phone: string, token: string) {
  return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
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
