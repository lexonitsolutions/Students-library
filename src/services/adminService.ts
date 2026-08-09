import { supabase } from '../lib/supabaseClient';

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
