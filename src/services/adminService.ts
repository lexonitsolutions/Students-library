import { supabase } from '../lib/supabaseClient';
import type { UserRole } from '../types/database.types';

export interface AdminStats {
  readonly totalStudents: number;
  readonly totalMaterials: number;
  readonly activeDownloads: number;
  readonly pendingApprovals: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: totalStudents }, { count: totalMaterials }, { count: activeDownloads }, { count: pendingApprovals }] =
    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('downloads').select('*', { count: 'exact', head: true }).gte('downloaded_at', oneDayAgo),
      supabase.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

  return {
    totalStudents: totalStudents ?? 0,
    totalMaterials: totalMaterials ?? 0,
    activeDownloads: activeDownloads ?? 0,
    pendingApprovals: pendingApprovals ?? 0,
  };
}

export interface ModerationItem {
  readonly id: string;
  readonly title: string;
  readonly uploader: string;
  readonly date: string;
  readonly subject: string;
  readonly filePath: string;
}

export async function listModerationQueue(): Promise<ModerationItem[]> {
  const { data: pending, error } = await supabase
    .from('materials')
    .select('id, title, subject, created_at, uploader_id, file_path')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (pending.length === 0) return [];

  const uploaderIds = [...new Set(pending.map((m) => m.uploader_id))];
  const { data: uploaders, error: uploadersError } = await supabase
    .from('public_profiles')
    .select('id, name')
    .in('id', uploaderIds);
  if (uploadersError) throw uploadersError;

  const nameById = new Map(uploaders.map((u) => [u.id, u.name]));

  return pending.map((item) => ({
    id: item.id,
    title: item.title,
    subject: item.subject,
    filePath: item.file_path,
    uploader: nameById.get(item.uploader_id) ?? 'Unknown',
    date: new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
  }));
}

const ROOT_ADMIN_EMAIL = 'hr@lexonit.com';

export interface AdminAllowlistEntry {
  readonly email: string;
  readonly createdAt: string;
  readonly hasAccount: boolean;
  readonly role: UserRole | null;
  readonly isRoot: boolean;
}

export async function listAdminEmails(): Promise<AdminAllowlistEntry[]> {
  const { data: allowlist, error } = await supabase
    .from('admin_allowlist')
    .select('email, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (allowlist.length === 0) return [];

  const emails = allowlist.map((entry) => entry.email);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('email, role')
    .in('email', emails);
  if (profilesError) throw profilesError;

  const profileByEmail = new Map(profiles.map((p) => [p.email, p]));

  return allowlist.map((entry) => {
    const profile = profileByEmail.get(entry.email);
    return {
      email: entry.email,
      createdAt: entry.created_at,
      hasAccount: Boolean(profile),
      role: profile?.role ?? null,
      isRoot: entry.email === ROOT_ADMIN_EMAIL,
    };
  });
}

export async function addAdminEmail(email: string): Promise<void> {
  const { error } = await supabase.from('admin_allowlist').insert({ email: email.trim().toLowerCase() });
  if (error) throw error;
}

export async function removeAdminEmail(email: string): Promise<void> {
  const { error } = await supabase.from('admin_allowlist').delete().eq('email', email.trim().toLowerCase());
  if (error) throw error;
}
