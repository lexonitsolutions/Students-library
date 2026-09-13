import { supabase } from '../lib/supabaseClient';
import { toMaterial } from '../lib/materialMapper';
import { listBookmarkedMaterialIds, listBookmarkedMaterials } from './bookmarksService';
import { getLocalLikesCount } from './likesService';
import type { Material } from '../data/types';
import type { MaterialRow, MaterialStatus, MaterialType, PublicProfileRow } from '../types/database.types';

const profileCache = new Map<string, PublicProfileRow>();
let cachedApprovedMaterials: Material[] = [];

async function fetchUploaders(rows: readonly MaterialRow[]): Promise<Map<string, PublicProfileRow>> {
  const missingIds = [...new Set(rows.map((row) => row.uploader_id))].filter((id) => !profileCache.has(id));
  if (missingIds.length > 0) {
    try {
      const { data, error } = await supabase.from('public_profiles').select('*').in('id', missingIds);
      if (!error && data) {
        for (const profile of data) {
          profileCache.set(profile.id, profile);
        }
      }
    } catch {
      // Ignore network errors, fall back to cached profiles
    }
  }
  return profileCache;
}

async function toMaterialsWithUploaders(rows: MaterialRow[], savedIds?: Set<string>): Promise<Material[]> {
  const uploaders = await fetchUploaders(rows);
  return rows.map((row) => toMaterial(row, uploaders.get(row.uploader_id), savedIds?.has(row.id)));
}

/** Invalidate cached materials to force an immediate reload from the database */
export function invalidateMaterialsCache(): void {
  cachedApprovedMaterials = [];
}

export interface MaterialFilters {
  readonly subjects?: readonly string[];
  readonly universities?: readonly string[];
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly type?: string;
}

/** Approved materials joined with uploader name/avatar, fetched directly from database only. */
export async function listApprovedMaterialsForUI(filters: MaterialFilters = {}, savedIds?: Set<string>): Promise<Material[]> {
  try {
    const rows = await listApprovedMaterials(filters);
    const dbMaterials = await toMaterialsWithUploaders(rows, savedIds);
    cachedApprovedMaterials = dbMaterials;
    return dbMaterials.map((m) => ({
      ...m,
      isSaved: savedIds ? savedIds.has(m.id) : m.isSaved,
    }));
  } catch (err) {
    console.warn('Failed to load materials from DB:', err);
    // Return cached if available, else empty
    return cachedApprovedMaterials.map((m) => ({
      ...m,
      isSaved: savedIds ? savedIds.has(m.id) : m.isSaved,
    }));
  }
}

/** A single material joined with its uploader, for the details/reader pages. */
export async function getMaterialForUI(id: string, userIdOrSavedIds?: string | Set<string>): Promise<Material | null> {
  let savedIds: Set<string> | undefined;
  if (userIdOrSavedIds instanceof Set) {
    savedIds = userIdOrSavedIds;
  } else if (typeof userIdOrSavedIds === 'string') {
    try {
      savedIds = await listBookmarkedMaterialIds(userIdOrSavedIds);
    } catch {
      savedIds = undefined;
    }
  }

  const isItemSaved = savedIds ? savedIds.has(id) : false;

  try {
    const row = await getMaterialById(id);
    const uploaders = await fetchUploaders([row]);
    return toMaterial(row, uploaders.get(row.uploader_id), isItemSaved);
  } catch {
    return null;
  }
}

/** The signed-in user's own uploads from the database only. */
export async function listMyUploadsForUI(userId: string): Promise<Material[]> {
  try {
    const rows = await listMyUploads(userId);
    return await toMaterialsWithUploaders(rows);
  } catch (err) {
    console.warn('listMyUploadsForUI DB error:', err);
    return [];
  }
}

/** The user's saved (bookmarked) materials from the database only. */
export async function listSavedMaterialsForUI(userId: string): Promise<Material[]> {
  try {
    const rows = await listBookmarkedMaterials(userId);
    const uploaders = await fetchUploaders(rows);
    return rows.map((row) => toMaterial(row, uploaders.get(row.uploader_id), true));
  } catch (err) {
    console.warn('listSavedMaterialsForUI DB error:', err);
    return [];
  }
}

/** Materials the user has downloaded before, most recent first, joined with uploader info. */
export async function listDownloadedMaterialsForUI(userId: string): Promise<Material[]> {
  try {
    const { data: history, error } = await supabase
      .from('downloads')
      .select('material_id, downloaded_at')
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false });

    if (error || !history || history.length === 0) return [];

    const orderedIds: string[] = [];
    for (const entry of history) {
      if (!orderedIds.includes(entry.material_id)) orderedIds.push(entry.material_id);
    }
    const { data: rows } = await supabase.from('materials').select('*').in('id', orderedIds);
    if (!rows) return [];

    const byId = new Map(rows.map((row: MaterialRow) => [row.id, row]));
    const ordered = orderedIds.map((id) => byId.get(id)).filter((row): row is MaterialRow => row !== undefined);
    return await toMaterialsWithUploaders(ordered);
  } catch (err) {
    console.warn('listDownloadedMaterialsForUI DB error:', err);
    return [];
  }
}

/** Materials the user has recently viewed (excluding their own), most recent first, joined with uploader info. */
export async function listRecentlyViewedMaterialsForUI(userId: string): Promise<Material[]> {
  try {
    const { data: history, error } = await supabase
      .from('material_views')
      .select('material_id, viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false });
  
    if (error || !history || history.length === 0) return [];
  
    const orderedIds: string[] = [];
    for (const entry of history) {
      if (!orderedIds.includes(entry.material_id)) orderedIds.push(entry.material_id);
    }
    
    const { data: rows } = await supabase
      .from('materials')
      .select('*')
      .in('id', orderedIds)
      .neq('uploader_id', userId);
      
    if (!rows || rows.length === 0) return [];
  
    const byId = new Map(rows.map((row: MaterialRow) => [row.id, row]));
    const ordered = orderedIds.map((id) => byId.get(id)).filter((row): row is MaterialRow => row !== undefined);
    return await toMaterialsWithUploaders(ordered);
  } catch (err) {
    console.warn('listRecentlyViewedMaterialsForUI DB error:', err);
    return [];
  }
}

export async function listApprovedMaterials(filters: MaterialFilters = {}): Promise<MaterialRow[]> {
  let query = supabase.from('materials').select('*').eq('status', 'approved').order('created_at', { ascending: false });

  if (filters.subjects?.length) query = query.in('subject', filters.subjects as string[]);
  if (filters.universities?.length) query = query.in('university', filters.universities as string[]);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.limit) query = query.range(filters.offset ?? 0, (filters.offset ?? 0) + filters.limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getMaterialById(id: string): Promise<MaterialRow> {
  const { data, error } = await supabase.from('materials').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function listMyUploads(userId: string): Promise<MaterialRow[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('uploader_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listPendingModeration(): Promise<MaterialRow[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export interface UploadMaterialParams {
  readonly file: File;
  readonly uploaderId: string;
  readonly title: string;
  readonly description?: string;
  readonly subject: string;
  readonly semester?: string;
  readonly university?: string;
  readonly college?: string;
  readonly branch?: string;
  readonly year?: string;
  readonly type: MaterialType;
  readonly pages?: number;
}

export async function uploadMaterial(params: UploadMaterialParams): Promise<MaterialRow> {
  const { file, uploaderId, ...metadata } = params;

  // Use the passed uploaderId directly (auth is handled by Clerk, not Supabase)
  const effectiveUploaderId = uploaderId;
  const path = `${effectiveUploaderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  // Attempt file upload to storage
  const { error: uploadError } = await supabase.storage.from('materials').upload(path, file, { upsert: true });
  if (uploadError) {
    console.warn('Storage upload notice:', uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from('materials').getPublicUrl(path);
  const fileUrl = publicUrlData?.publicUrl || '';

  const insertPayload = {
    title: metadata.title,
    description: metadata.description ?? null,
    subject: metadata.subject,
    semester: metadata.semester ?? null,
    college: metadata.college ?? null,
    branch: metadata.branch ?? null,
    year: metadata.year ?? null,
    type: metadata.type,
    uploader_id: effectiveUploaderId,
    status: 'pending' as const,
    file_path: path,
    file_url: fileUrl,
    file_size_mb: Math.round((file.size / (1024 * 1024)) * 100) / 100,
    pages: metadata.pages ?? null,
  };

  const { data, error } = await supabase
    .from('materials')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;

  invalidateMaterialsCache();
  window.dispatchEvent(new CustomEvent('refresh_notifications'));
  return data;
}

export async function updateMaterialStatus(
  id: string,
  status: MaterialStatus,
  rejectionReason?: string,
): Promise<MaterialRow> {
  const { data, error } = await supabase
    .from('materials')
    .update({ status, rejection_reason: rejectionReason ?? null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMaterial(id: string, filePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from('materials').remove([filePath]);
  if (storageError) throw storageError;

  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementViews(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_material_views', { p_material_id: id });
  if (error) throw error;
}

export async function resetMaterialViews(id: string): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update({ views_count: 0 })
    .eq('id', id);
  if (error) console.warn('Failed to reset views:', error);
}

export async function resetAllViewsForUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update({ views_count: 0 })
    .eq('uploader_id', userId);
  if (error) console.warn('Failed to reset all user views:', error);
}


export async function updateMaterialDetails(
  id: string,
  updates: {
    title?: string;
    description?: string;
    subject?: string;
    branch?: string;
    year?: string;
    status?: MaterialStatus;
    rejection_reason?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id);
  if (error) {
    console.warn('DB update warning:', error);
  } else {
    invalidateMaterialsCache();
  }
}

export async function deleteMaterialForUI(id: string, filePath?: string): Promise<void> {
  if (filePath) {
    await supabase.storage.from('materials').remove([filePath]).catch(() => {});
  }
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) {
    console.warn('DB delete warning:', error);
  }
}

export async function recordDownload(materialId: string, userId?: string, currentCount: number = 0): Promise<void> {
  const { recordDownloadWithCount } = await import('./likesService');
  await recordDownloadWithCount(materialId, userId, currentCount);
}

/** Fetch real leaderboard data from the database — users ranked by uploads/views. */
export interface LeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatar: string;
  university: string;
  branch: string;
  totalUploads: number;
  uploadLabel?: string;
  totalViews: number;
  totalDownloads: number;
  totalLikes: number;
}

export async function listLeaderboardForUI(currentUserId?: string): Promise<LeaderboardEntry[]> {
  try {
    // Fetch profile stats
    const { data: statsData, error: statsError } = await supabase
      .from('profile_stats')
      .select('user_id, uploads_count, downloads_count')
      .order('uploads_count', { ascending: false })
      .limit(50);

    if (statsError || !statsData || statsData.length === 0) return [];

    let userIds = statsData.map((s: { user_id: string }) => s.user_id);
    
    if (currentUserId && !userIds.includes(currentUserId)) {
      userIds.push(currentUserId);
      const { data: currentUserStats } = await supabase
        .from('profile_stats')
        .select('user_id, uploads_count, downloads_count')
        .eq('user_id', currentUserId)
        .single();
      
      if (currentUserStats && currentUserStats.uploads_count > 0) {
        statsData.push(currentUserStats);
      }
    }

    // Fetch public profiles for those users
    const { data: profilesData, error: profilesError } = await supabase
      .from('public_profiles')
      .select('id, name, username, avatar_url, university, branch, college, major')
      .in('id', userIds);

    if (profilesError || !profilesData) return [];

    const profileMap = new Map(profilesData.map((p: { id: string; name: string; username: string | null; avatar_url: string | null; university: string | null; branch: string | null; college: string | null; major: string | null }) => [p.id, p]));

    // Fetch views, likes, and types by counting materials
    const { data: materialsData } = await supabase
      .from('materials')
      .select('id, uploader_id, views_count, saves_count, type')
      .in('uploader_id', userIds)
      .eq('status', 'approved');

    const viewsByUser = new Map<string, number>();
    const likesByUser = new Map<string, number>();
    const typesByUser = new Map<string, string[]>();

    if (materialsData) {
      for (const row of materialsData) {
        viewsByUser.set(row.uploader_id, (viewsByUser.get(row.uploader_id) ?? 0) + (row.views_count ?? 0));
        
        const local = typeof window !== 'undefined' ? getLocalLikesCount(row.id, row.saves_count ?? 0) : (row.saves_count ?? 0);
        likesByUser.set(row.uploader_id, (likesByUser.get(row.uploader_id) ?? 0) + local);

        const types = typesByUser.get(row.uploader_id) ?? [];
        types.push(row.type);
        typesByUser.set(row.uploader_id, types);
      }
    }

    return statsData
      .filter((s: { user_id: string; uploads_count: number; downloads_count: number }) => s.uploads_count > 0)
      .map((s: { user_id: string; uploads_count: number; downloads_count: number }): LeaderboardEntry | null => {
        const p = profileMap.get(s.user_id);
        if (!p) return null;

        const types = typesByUser.get(s.user_id) ?? [];
        let papers = 0;
        let assignments = 0;
        let materials = 0;
        for (const t of types) {
          if (t === 'past-paper') papers++;
          else if (t === 'doc') assignments++;
          else materials++; // 'notes', 'pdf', 'slides', 'lab-manual'
        }

        const max = Math.max(papers, assignments, materials);
        let label = s.uploads_count === 1 ? 'Upload' : 'Uploads';
        if (max > 0) {
          if (max === papers && papers >= assignments && papers >= materials) {
            label = s.uploads_count === 1 ? 'Paper' : 'Papers';
          } else if (max === assignments && assignments >= papers && assignments >= materials) {
            label = s.uploads_count === 1 ? 'Assignment' : 'Assignments';
          } else {
            label = s.uploads_count === 1 ? 'Material' : 'Materials';
          }
        }

        return {
          id: s.user_id,
          name: p.name || 'Student',
          username: p.username ? `@${p.username}` : `@student`,
          avatar: p.avatar_url || `https://i.pravatar.cc/80?u=${s.user_id}`,
          university: p.university || p.college || '',
          branch: p.branch || p.major || '',
          totalUploads: s.uploads_count ?? 0,
          uploadLabel: label,
          totalViews: viewsByUser.get(s.user_id) ?? 0,
          totalDownloads: s.downloads_count ?? 0,
          totalLikes: likesByUser.get(s.user_id) ?? 0,
        };
      })
      .filter((e): e is LeaderboardEntry => e !== null);
  } catch (err) {
    console.warn('Failed to load leaderboard data:', err);
    return [];
  }
}

