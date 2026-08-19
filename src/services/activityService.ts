import { supabase } from '../lib/supabaseClient';
import { timeAgo } from '../lib/timeAgo';
import { mockMaterials } from '../data/mockData';
import { listBookmarkedMaterialIds } from './bookmarksService';

export type ActivityType = 'uploaded' | 'saved' | 'downloaded';

export interface ActivityItem {
  readonly id: string;
  readonly type: ActivityType;
  readonly label: 'Uploaded' | 'Saved' | 'Downloaded';
  readonly target: string;
  readonly materialId?: string;
  readonly timestamp: string;
  readonly at: string;
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
    const [downloadsRes, bookmarksRes, uploadsRes] = await Promise.allSettled([
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
        .select('id, uploaded_at, title')
        .eq('uploader_id', userId)
        .order('uploaded_at', { ascending: false })
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
        addItem({
          id: `up-${row.id}`,
          type: 'uploaded',
          label: 'Uploaded',
          target: row.title,
          materialId: row.id,
          at: row.uploaded_at,
          timestamp: timeAgo(row.uploaded_at),
        });
      }
    }
  } catch (err) {
    console.warn('DB activity fetch warning:', err);
  }

  // Include saved items (materials, pastpapers, assignments/docs) from savedIdsSet
  const savedIdsSet = await listBookmarkedMaterialIds(userId);
  for (const savedId of savedIdsSet) {
    const mat = mockMaterials.find((m) => m.id === savedId);
    if (mat) {
      addItem({
        id: `bm-local-${mat.id}`,
        type: 'saved',
        label: 'Saved',
        target: mat.title,
        materialId: mat.id,
        at: mat.uploadedAt || new Date().toISOString(),
        timestamp: timeAgo(mat.uploadedAt || new Date().toISOString()),
      });
    }
  }

  // Include mock/fallback uploads for the user (materials, pastpapers, docs)
  const userMockUploads = mockMaterials.filter(
    (m) => m.uploaderId === userId || m.uploaderId === 'u1'
  );

  for (const m of userMockUploads) {
    addItem({
      id: `up-mock-${m.id}`,
      type: 'uploaded',
      label: 'Uploaded',
      target: m.title,
      materialId: m.id,
      at: m.uploadedAt,
      timestamp: timeAgo(m.uploadedAt),
    });
  }

  // If no activity exists yet, provide sample entries covering pastpaper, assignment doc, and study material
  if (items.length === 0) {
    const sample: ActivityItem[] = [
      {
        id: 'sample-up-1',
        type: 'uploaded',
        label: 'Uploaded',
        target: mockMaterials[0]?.title ?? 'Data Structures & Algorithms Complete Notes',
        materialId: mockMaterials[0]?.id ?? 'm1',
        at: new Date(Date.now() - 3600000 * 4).toISOString(),
        timestamp: timeAgo(new Date(Date.now() - 3600000 * 4).toISOString()),
      },
      {
        id: 'sample-bm-1',
        type: 'saved',
        label: 'Saved',
        target: mockMaterials[1]?.title ?? 'Calculus & Linear Algebra Mid-Term Past Paper',
        materialId: mockMaterials[1]?.id ?? 'm2',
        at: new Date(Date.now() - 3600000 * 18).toISOString(),
        timestamp: timeAgo(new Date(Date.now() - 3600000 * 18).toISOString()),
      },
      {
        id: 'sample-dl-1',
        type: 'downloaded',
        label: 'Downloaded',
        target: mockMaterials[2]?.title ?? 'Database Management Systems (DBMS) Lab Assignment',
        materialId: mockMaterials[2]?.id ?? 'm3',
        at: new Date(Date.now() - 3600000 * 36).toISOString(),
        timestamp: timeAgo(new Date(Date.now() - 3600000 * 36).toISOString()),
      },
    ];
    items.push(...sample);
  }

  // Sort descending by date
  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return items.slice(0, limit);
}
