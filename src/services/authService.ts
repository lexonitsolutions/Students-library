import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Auth error formatting (kept for any remaining error displays)
// ---------------------------------------------------------------------------
export function formatAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const msg = typeof error === 'string' ? error : error?.message || error?.error_description || '';
  return msg || 'Authentication request failed.';
}

// ---------------------------------------------------------------------------
// Account status (Supabase DB check — used for admin detection on sign-in)
// ---------------------------------------------------------------------------
export interface AccountStatus {
  readonly hasAccount: boolean;
  readonly isAdmin: boolean;
  readonly isUnconfirmed: boolean;
}

export async function checkAccountStatus(email: string): Promise<AccountStatus> {
  const { data, error } = await supabase.rpc('check_account_status', { p_email: email });
  if (error) {
    const { data: userProfile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    return { hasAccount: Boolean(userProfile), isAdmin: false, isUnconfirmed: false };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    hasAccount: Boolean(row?.has_account),
    isAdmin: Boolean(row?.is_admin),
    isUnconfirmed: Boolean(row?.is_unconfirmed),
  };
}

// ---------------------------------------------------------------------------
// Account deletion (removes Supabase profile row; Clerk handles auth deletion)
// ---------------------------------------------------------------------------
export async function deleteOwnAccount(userId: string): Promise<{ error: Error | null }> {
  // Try the RPC first (handles cascading deletes via database triggers)
  const { error: rpcError } = await supabase.rpc('delete_user_account');
  if (!rpcError) return { error: null };

  // Fallback: delete profile row directly
  const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
  if (profileError) {
    return { error: new Error(formatAuthErrorMessage(profileError)) };
  }

  return { error: null };
}
