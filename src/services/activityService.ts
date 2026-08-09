import { supabase } from '../lib/supabaseClient';
import { timeAgo } from '../lib/timeAgo';

export interface ActivityItem {
  readonly id: string;
  readonly label: 'Downloaded' | 'Saved';
  readonly target: string;
  readonly timestamp: string;
}

export async function listRecentActivity(userId: string, limit = 5): Promise<ActivityItem[]> {
  const [{ data: downloads, error: downloadsError }, { data: bookmarks, error: bookmarksError }] = await Promise.all([
    supabase
      .from('downloads')
      .select('id, downloaded_at, material:materials(title)')
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false })
      .limit(limit),
    supabase
      .from('bookmarks')
      .select('id, created_at, material:materials(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);
  if (downloadsError) throw downloadsError;
  if (bookmarksError) throw bookmarksError;

  interface JoinedRow {
    id: string;
    downloaded_at?: string;
    created_at?: string;
    material: { title: string }[] | { title: string } | null;
  }

  function targetTitle(row: JoinedRow): string {
    const material = Array.isArray(row.material) ? row.material[0] : row.material;
    return material?.title ?? 'a material';
  }

  const items: (ActivityItem & { at: string })[] = [
    ...(downloads as JoinedRow[]).map((row) => ({
      id: row.id,
      label: 'Downloaded' as const,
      target: targetTitle(row),
      at: row.downloaded_at!,
      timestamp: timeAgo(row.downloaded_at!),
    })),
    ...(bookmarks as JoinedRow[]).map((row) => ({
      id: row.id,
      label: 'Saved' as const,
      target: targetTitle(row),
      at: row.created_at!,
      timestamp: timeAgo(row.created_at!),
    })),
  ];

  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}
