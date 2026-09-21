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

    // 1. Process views with join if available
    let viewsCountAdded = 0;
    if (viewsRes.status === 'fulfilled' && viewsRes.value.data && viewsRes.value.data.length > 0) {
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
        viewsCountAdded++;
      }
    }

    // 2. Fallback: If joined query returned nothing or failed, query material_views without join
    if (viewsCountAdded === 0) {
      try {
        const { data: rawViews } = await supabase
          .from('material_views')
          .select('material_id, viewed_at')
          .eq('user_id', userId)
          .order('viewed_at', { ascending: false })
          .limit(limit);

        if (rawViews && rawViews.length > 0) {
          const matIds = rawViews.map((v: { material_id: string }) => v.material_id).filter(Boolean);
          const { data: mats } = await supabase
            .from('materials')
            .select('id, title')
            .in('id', matIds);
          const matTitleMap = new Map((mats || []).map((m: any) => [m.id, m.title]));

          for (const row of rawViews) {
            addItem({
              id: `view-${row.material_id}`,
              type: 'viewed',
              label: 'Viewed',
              target: matTitleMap.get(row.material_id) || 'a material',
              materialId: row.material_id,
              at: row.viewed_at,
              timestamp: timeAgo(row.viewed_at),
            });
            viewsCountAdded++;
          }
        }
      } catch (viewFallbackErr) {
        console.warn('View fallback query warning:', viewFallbackErr);
      }
    }

    // 3. Incorporate locally stored views for immediate reactivity
    if (typeof window !== 'undefined') {
      try {
        const localRaw = localStorage.getItem(`quicklearnit_viewed_materials_${userId}`);
        if (localRaw) {
          const localList: Array<{ materialId: string; viewedAt: string }> = JSON.parse(localRaw);
          const missingIds = localList
            .map((item) => item.materialId)
            .filter((matId) => Boolean(matId) && !addedKeys.has(`viewed-${matId}`));

          if (missingIds.length > 0) {
            const { data: mats } = await supabase
              .from('materials')
              .select('id, title')
              .in('id', missingIds.slice(0, limit));
            const matTitleMap = new Map((mats || []).map((m: any) => [m.id, m.title]));

            for (const item of localList) {
              if (matTitleMap.has(item.materialId) || missingIds.includes(item.materialId)) {
                addItem({
                  id: `view-local-${item.materialId}`,
                  type: 'viewed',
                  label: 'Viewed',
                  target: matTitleMap.get(item.materialId) || 'a material',
                  materialId: item.materialId,
                  at: item.viewedAt,
                  timestamp: timeAgo(item.viewedAt),
                });
              }
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('DB activity fetch warning:', err);
  }

  // Sort descending by date
  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return items.slice(0, limit);
}
