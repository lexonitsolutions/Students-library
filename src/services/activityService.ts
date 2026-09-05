import { supabase } from '../lib/supabaseClient';
import { timeAgo } from '../lib/timeAgo';

export type ActivityType = 'uploaded' | 'saved' | 'downloaded' | 'viewed';

export interface ActivityItem {
  readonly id: string;
  readonly type: ActivityType;
  readonly label: 'Uploaded' | 'Saved' | 'Downloaded' | 'Viewed';
  readonly target: string;
  readonly materialId?: string;
  readonly timestamp: string;
  readonly at: string;
  readonly status?: string;
}

export async function listRecentActivity(userId: string, limit = 20): Promise<ActivityItem[]> {
  const items: ActivityItem[] = [];
  const addedKeys = new Set<string>();

  const addItem = (item: ActivityItem) => {
    const key = `${item.type}-${item.materialId || item.target}`;
    if (!addedKeys.has(key)) {
      addedKeys.add(key);
      items.push(item);
    }
  };

  try {
    const [downloadsRes, bookmarksRes, uploadsRes, viewsRes] = await Promise.allSettled([
      supabase
        .from('downloads')
        .select('id, downloaded_at, material_id, material:materials(id, title)')
        .eq('user_id', userId)
        .order('downloaded_at', { ascending: false })
        .limit(limit),
      supabase
        .from('bookmarks')
        .select('id, created_at, material_id, material:materials(id, title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('materials')
        .select('id, title, status, created_at')
        .eq('uploader_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('material_views')
        .select('material_id, viewed_at, material:materials(id, title)')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(limit),
    ]);

    if (downloadsRes.status === 'fulfilled' && downloadsRes.value.data) {
      for (const row of downloadsRes.value.data) {
        const mat = Array.isArray(row.material) ? row.material[0] : row.material;
        const title = mat?.title ?? 'a material';
        const matId = mat?.id ?? row.material_id;
        addItem({
          id: `dl-${row.id}`,
          type: 'downloaded',
          label: 'Downloaded',
          target: title,
          materialId: matId,
          at: row.downloaded_at,
          timestamp: timeAgo(row.downloaded_at),
        });
      }
    }

    if (bookmarksRes.status === 'fulfilled' && bookmarksRes.value.data) {
      for (const row of bookmarksRes.value.data) {
        const mat = Array.isArray(row.material) ? row.material[0] : row.material;
        const title = mat?.title ?? 'a material';
        const matId = mat?.id ?? row.material_id;
        addItem({
          id: `bm-${row.id}`,
          type: 'saved',
          label: 'Saved',
          target: title,
          materialId: matId,
          at: row.created_at,
          timestamp: timeAgo(row.created_at),
        });
      }
    }

    if (uploadsRes.status === 'fulfilled' && uploadsRes.value.data) {
      for (const row of uploadsRes.value.data) {
        const uploadedAt = row.created_at;
        addItem({
          id: `up-${row.id}`,
          type: 'uploaded',
          label: 'Uploaded',
          target: row.title,
          materialId: row.id,
          at: uploadedAt,
          timestamp: timeAgo(uploadedAt),
          status: row.status,
        });
      }
    }

    if (viewsRes.status === 'fulfilled' && viewsRes.value.data) {
      for (const row of viewsRes.value.data) {
        const mat = Array.isArray(row.material) ? row.material[0] : row.material;
        const title = mat?.title ?? 'a material';
        const matId = mat?.id ?? row.material_id;
        addItem({
          id: `view-${row.material_id}`,
          type: 'viewed',
          label: 'Viewed',
          target: title,
          materialId: matId,
          at: row.viewed_at,
          timestamp: timeAgo(row.viewed_at),
        });
      }
    }
  } catch (err) {
    console.warn('DB activity fetch warning:', err);
  }

  // Sort descending by date
  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return items.slice(0, limit);
}
