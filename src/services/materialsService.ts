import { supabase } from '../lib/supabaseClient';
import { toMaterial } from '../lib/materialMapper';
import { cachedQuery, invalidateCache } from '../lib/queryCache';
import { listBookmarkedMaterialIds, listBookmarkedMaterials } from './bookmarksService';
import { getLocalLikesCount, recordDownloadWithCount } from './likesService';
import { addNotificationForUser } from './notificationsService';
import { broadcastMaterialDeleted } from './materialSyncService';
import type { Material } from '../data/types';
import type { MaterialRow, MaterialStatus, MaterialType, PublicProfileRow } from '../types/database.types';


const profileCache = new Map<string, PublicProfileRow>();
let cachedApprovedMaterials: Material[] = [];

const SESSION_MATERIALS_KEY = 'answersbro_cached_approved_materials';
let inMemorySessionMaterials: Material[] | null = null;

export function getCachedMaterialsFromSession(): Material[] | null {
  if (inMemorySessionMaterials && inMemorySessionMaterials.length > 0) {
    return inMemorySessionMaterials;
  }
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = sessionStorage.getItem(SESSION_MATERIALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((m: Material) => ({
            ...m,
            uploaderName: (m.uploaderName && /studex/i.test(m.uploaderName)) ? 'Past user' : (m.uploaderName || 'Past user'),
          }));
          inMemorySessionMaterials = cleaned;
          return cleaned;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached session materials:', e);
  }
  return null;
}

export function saveMaterialsToSession(materials: Material[]): void {
  inMemorySessionMaterials = materials;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(SESSION_MATERIALS_KEY, JSON.stringify(materials));
    }
  } catch (e) {
    console.warn('Failed to save materials to sessionStorage:', e);
  }
}

export function clearMaterialsSession(): void {
  inMemorySessionMaterials = null;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(SESSION_MATERIALS_KEY);
    }
  } catch {}
}

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

/** Pre-fetches approved materials once when user logs in and stores in session cache */
export async function prefetchMaterialsOnLogin(userId?: string): Promise<Material[]> {
  // If already in session, return it
  const existing = getCachedMaterialsFromSession();
  if (existing && existing.length > 0) {
    return existing;
  }

  try {
    let savedIds: Set<string> | undefined;
    if (userId) {
      try {
        savedIds = await listBookmarkedMaterialIds(userId);
      } catch {}
    }
    const materials = await listApprovedMaterialsForUI({}, savedIds);
    if (materials && materials.length > 0) {
      saveMaterialsToSession(materials);
    }
    return materials;
  } catch (err) {
    console.warn('Failed to prefetch materials on login:', err);
    return [];
  }
}

/** Invalidate cached materials to force an immediate reload from the database */
export function invalidateMaterialsCache(): void {
  cachedApprovedMaterials = [];
  clearMaterialsSession();
  invalidateCache('approved_materials');
  invalidateCache('material:');
  invalidateCache('leaderboard:');
  invalidateCache('admin:stats');
  invalidateCache('my_uploads:');
}

export interface MaterialFilters {
  readonly subjects?: readonly string[];
  readonly universities?: readonly string[];
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly type?: string;
}

/** Approved materials joined with uploader name/avatar, with in-memory caching and deduplication. */
export async function listApprovedMaterialsForUI(filters: MaterialFilters = {}, savedIds?: Set<string>): Promise<Material[]> {
  const cacheKey = `approved_materials:${JSON.stringify(filters)}`;
  try {
    const dbMaterials = await cachedQuery(
      cacheKey,
      async () => {
        const rows = await listApprovedMaterials(filters);
        return await toMaterialsWithUploaders(rows);
      },
      45_000 // 45 seconds TTL
    );
    cachedApprovedMaterials = dbMaterials;
    return dbMaterials.map((m) => ({
      ...m,
      isSaved: savedIds ? savedIds.has(m.id) : m.isSaved,
    }));
  } catch (err) {
    console.warn('Failed to load materials from DB:', err);
    return cachedApprovedMaterials.map((m) => ({
      ...m,
      isSaved: savedIds ? savedIds.has(m.id) : m.isSaved,
    }));
  }
}

/** A single material joined with its uploader, for the details/reader pages, cached with 60s TTL. */
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

  const baseMaterial = await cachedQuery(
    `material:${id}`,
    async () => {
      try {
        const row = await getMaterialById(id);
        const uploaders = await fetchUploaders([row]);
        return toMaterial(row, uploaders.get(row.uploader_id), false);
      } catch {
        return null;
      }
    },
    60_000 // 60 seconds TTL
  );

  if (!baseMaterial) return null;
  return {
    ...baseMaterial,
    isSaved: isItemSaved || baseMaterial.isSaved,
  };
}

const USER_UNLINKED_MATERIALS_PREFIX = 'answersbro_user_unlinked_materials_';
const LEGACY_UNLINKED_PREFIX = 'quicklearnit_user_unlinked_materials_';

export function getUserUnlinkedMaterialIds(userId: string): Set<string> {
  if (!userId) return new Set();
  try {
    const raw =
      localStorage.getItem(`${USER_UNLINKED_MATERIALS_PREFIX}${userId}`) ||
      localStorage.getItem(`${LEGACY_UNLINKED_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // ignore parse errors
  }
  return new Set();
}

export function saveUserUnlinkedMaterialIds(userId: string, ids: Set<string>): void {
  if (!userId) return;
  try {
    localStorage.setItem(`${USER_UNLINKED_MATERIALS_PREFIX}${userId}`, JSON.stringify([...ids]));
  } catch {
    // ignore storage errors
  }
}

export function removeMaterialFromUserAccount(materialId: string, userId: string): void {
  if (!userId || !materialId) return;
  const current = getUserUnlinkedMaterialIds(userId);
  current.add(materialId);
  saveUserUnlinkedMaterialIds(userId, current);
  invalidateCache(`my_uploads:${userId}`);
  invalidateCache('my_uploads:');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('answersbro_user_uploads_updated', {
        detail: { userId, materialId },
      }),
    );
  }
}

/** The signed-in user's own uploads from the database only (excluding materials removed from their account). */
export async function listMyUploadsForUI(userId: string): Promise<Material[]> {
  if (!userId) return [];
  return cachedQuery(
    `my_uploads:${userId}`,
    async () => {
      try {
        const rows = await listMyUploads(userId);
        const unlinkedIds = getUserUnlinkedMaterialIds(userId);
        const activeRows = rows.filter((r) => !unlinkedIds.has(r.id));
        return await toMaterialsWithUploaders(activeRows);
      } catch (err) {
        console.warn('listMyUploadsForUI DB error:', err);
        return [];
      }
    },
    30_000,
  );
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
      .in('id', orderedIds);
      
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
  // Always query the real database status — never mix in localStorage data.
  // The DB is the single source of truth; admin approval updates status in DB directly.
  let query = supabase.from('materials').select('*').eq('status', 'approved');

  query = query.order('created_at', { ascending: false });

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

  const effectiveUploaderId = uploaderId || 'anonymous';
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

  // Notify all admin users that a new document is waiting for review
  (async () => {
    try {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'admin');

      if (adminProfiles && adminProfiles.length > 0) {
        const uploaderTitle = metadata.title || 'a document';
        const notifId = `notif-upload-${data.id}-${Date.now()}`;
        for (const admin of adminProfiles) {
          addNotificationForUser(admin.id, {
            id: `${notifId}-${admin.id}`,
            type: 'system',
            title: 'New document pending review',
            description: `"${uploaderTitle}" (${metadata.subject || 'Unknown subject'}) was uploaded and is waiting for your approval.`,
            timestamp: 'Just now',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Notification delivery is non-critical — upload already succeeded
    }
  })();

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

  invalidateMaterialsCache();
  window.dispatchEvent(new CustomEvent('refresh_materials'));
  window.dispatchEvent(new CustomEvent('refresh_notifications'));

  return data;
}

export async function deleteMaterialPermanently(id: string, explicitFilePath?: string): Promise<void> {
  let filePath = explicitFilePath;
  if (!filePath) {
    try {
      const { data } = await supabase.from('materials').select('file_path').eq('id', id).maybeSingle();
      if (data?.file_path) {
        filePath = data.file_path;
      }
    } catch {}
  }

  // 1. Delete physical storage file from 'materials' bucket
  if (filePath) {
    try {
      await supabase.storage.from('materials').remove([filePath]);
    } catch (storageErr) {
      console.warn('Storage remove file notice:', storageErr);
    }
  }

  // 2. Try server-side RPC if available for atomic cascade delete
  let rpcSuccess = false;
  try {
    const { error: rpcErr } = await supabase.rpc('delete_material_by_id', { p_material_id: id });
    if (!rpcErr) {
      rpcSuccess = true;
    }
  } catch {}

  // 3. If RPC was not run, perform cascade cleanup to prevent FK constraint failures
  if (!rpcSuccess) {
    await Promise.allSettled([
      supabase.from('bookmarks').delete().eq('material_id', id),
      supabase.from('downloads').delete().eq('material_id', id),
      supabase.from('reports').delete().eq('material_id', id),
      supabase.from('material_likes').delete().eq('material_id', id),
      supabase.from('material_views').delete().eq('material_id', id),
    ]);

    const { error: dbErr } = await supabase.from('materials').delete().eq('id', id);
    if (dbErr) {
      console.error('Failed to delete material from database:', dbErr);
      throw dbErr;
    }
  }

  // 4. Invalidate all local caches and broadcast deletion across all clients (students & admins)
  await broadcastMaterialDeleted(id);
}

export async function deleteMaterial(
  id: string,
  filePath?: string,
  status?: string,
  userId?: string,
): Promise<void> {
  return deleteMaterialForUI(id, filePath, status, userId);
}

export async function incrementViews(id: string, userId?: string): Promise<void> {
  let rpcSuccess = false;
  try {
    const { error } = await supabase.rpc('increment_material_views', {
      p_material_id: id,
      ...(userId ? { p_user_id: userId } : {}),
    });
    if (!error) {
      rpcSuccess = true;
    }
  } catch {
    // Fallback if RPC signature or execution failed
  }

  if (!rpcSuccess) {
    try {
      if (userId) {
        await supabase.from('material_views').upsert(
          {
            material_id: id,
            user_id: userId,
            viewed_at: new Date().toISOString(),
          },
          { onConflict: 'material_id,user_id' }
        );
      }

      // Increment document views count directly
      const { data: current } = await supabase
        .from('materials')
        .select('views_count')
        .eq('id', id)
        .maybeSingle();

      if (current) {
        const newCount = (current.views_count ?? 0) + 1;
        await supabase
          .from('materials')
          .update({ views_count: newCount })
          .eq('id', id);
      }
    } catch (err) {
      console.warn('incrementViews fallback error:', err);
    }
  } else if (userId) {
    // Ensure material_views row exists even if legacy RPC didn't insert it
    try {
      await supabase.from('material_views').upsert(
        {
          material_id: id,
          user_id: userId,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: 'material_id,user_id' }
      );
    } catch {}
  }

  // Record viewed item locally for immediate UI responsiveness
  if (userId && typeof window !== 'undefined') {
    try {
      const localKey = `quicklearnit_viewed_materials_${userId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updated = [
        { materialId: id, viewedAt: new Date().toISOString() },
        ...existing.filter((item: any) => item?.materialId !== id),
      ].slice(0, 50);
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch {}
  }

  invalidateMaterialsCache();
  invalidateCache(`material:${id}`);
  invalidateCache('materials:all');
  invalidateCache('materials:approved');
  invalidateCache('materials:leaderboard');
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
    pages?: number;
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

export async function deleteMaterialForUI(
  id: string,
  filePath?: string,
  status?: string,
  userId?: string,
): Promise<void> {
  let materialStatus = status;
  let ownerId = userId;

  if (!materialStatus || !ownerId) {
    try {
      const { data } = await supabase.from('materials').select('status, uploader_id').eq('id', id).maybeSingle();
      if (data) {
        if (!materialStatus) materialStatus = data.status;
        if (!ownerId) ownerId = data.uploader_id;
      }
    } catch {}
  }

  // When user deletes an approved material: DO NOT delete from community search!
  // Just remove it from his account so it no longer appears in his uploads or library.
  if (materialStatus === 'approved') {
    if (ownerId) {
      removeMaterialFromUserAccount(id, ownerId);
    } else {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentId = sessionData?.session?.user?.id;
      if (currentId) {
        removeMaterialFromUserAccount(id, currentId);
      }
    }
    return;
  }

  // For pending or unapproved materials, remove from user's account and delete from DB
  if (ownerId) {
    removeMaterialFromUserAccount(id, ownerId);
  }
  await deleteMaterialPermanently(id, filePath);
}

export async function recordDownload(materialId: string, userId?: string, currentCount: number = 0): Promise<void> {
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
  return cachedQuery(
    `leaderboard:${currentUserId || 'all'}`,
    async () => {
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
          .select('id, uploader_id, views_count, saves_count, downloads_count, likes_count, type')
          .in('uploader_id', userIds)
          .eq('status', 'approved');

        const viewsByUser = new Map<string, number>();
        const likesByUser = new Map<string, number>();
        const downloadsByUser = new Map<string, number>();
        const typesByUser = new Map<string, string[]>();

        if (materialsData) {
          for (const row of materialsData as any[]) {
            viewsByUser.set(row.uploader_id, (viewsByUser.get(row.uploader_id) ?? 0) + (row.views_count ?? 0));
            downloadsByUser.set(row.uploader_id, (downloadsByUser.get(row.uploader_id) ?? 0) + (row.downloads_count ?? 0));
            
            const baseLikes = row.likes_count ?? row.saves_count ?? 0;
            const local = typeof window !== 'undefined' ? getLocalLikesCount(row.id, baseLikes) : baseLikes;
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

            const name = p.name || 'Student';
            const lowerName = name.toLowerCase();
            const lowerUsername = (p.username || '').toLowerCase();

            // Exclude past / studex users from the leaderboard so only active users appear
            if (
              lowerName.includes('studex') ||
              lowerName.includes('past user') ||
              lowerUsername.includes('studex') ||
              (p as any).is_deleted
            ) {
              return null;
            }

            return {
              id: s.user_id,
              name,
              username: p.username ? `@${p.username}` : `@student`,
              avatar: p.avatar_url || '',
              university: p.university || p.college || '',
              branch: p.branch || p.major || '',
              totalUploads: s.uploads_count ?? 0,
              uploadLabel: label,
              totalViews: viewsByUser.get(s.user_id) ?? 0,
              totalDownloads: Math.max(s.downloads_count ?? 0, downloadsByUser.get(s.user_id) ?? 0),
              totalLikes: likesByUser.get(s.user_id) ?? 0,
            };
          })
          .filter((e): e is LeaderboardEntry => e !== null);
      } catch (err) {
        console.warn('Failed to load leaderboard data:', err);
        return [];
      }
    },
    60_000 // 60 seconds TTL
  );
}

