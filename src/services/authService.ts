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
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
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
  return supabase.auth.verifyOtp({ email, token, type: 'signup' });
}

export async function verifyMobileOtp(phone: string, token: string) {
  return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
