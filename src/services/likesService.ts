import { supabase } from '../lib/supabaseClient';

const LOCAL_LIKED_KEY_PREFIX = 'quicklearnit_liked_ids_';
const LOCAL_LIKES_COUNT_PREFIX = 'quicklearnit_likes_count_';
const LOCAL_SHARED_KEY_PREFIX = 'quicklearnit_shared_ids_';
const LOCAL_SHARES_COUNT_PREFIX = 'quicklearnit_shares_count_';
const LOCAL_DOWNLOADS_COUNT_PREFIX = 'quicklearnit_downloads_count_';

// In-memory set cache for current user's liked material IDs
let cachedUserLikedIds = new Map<string, Set<string>>();

export function getLocalStorageLikedIds(userId: string): Set<string> {
  if (cachedUserLikedIds.has(userId)) {
    return cachedUserLikedIds.get(userId)!;
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_LIKED_KEY_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const set = new Set<string>(arr);
        cachedUserLikedIds.set(userId, set);
        return set;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveLocalStorageLikedIds(userId: string, ids: Set<string>): void {
  cachedUserLikedIds.set(userId, ids);
  try {
    localStorage.setItem(`${LOCAL_LIKED_KEY_PREFIX}${userId}`, JSON.stringify([...ids]));
  } catch {
    // Ignore storage errors
  }
}

/** Fetch all material IDs liked by the specified user from Supabase */
export async function fetchUserLikedIds(userId: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('material_likes')
      .select('material_id')
      .eq('user_id', userId);

    if (!error && data) {
      const ids = new Set<string>(data.map((row: { material_id: string }) => row.material_id));
      saveLocalStorageLikedIds(userId, ids);
      return ids;
    }
  } catch {
    // Fall back to local storage
  }
  return getLocalStorageLikedIds(userId);
}

export function getLocalLikesCount(materialId: string, initialDbValue: number = 0): number {
  try {
    const raw = localStorage.getItem(`${LOCAL_LIKES_COUNT_PREFIX}${materialId}`);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) return Math.max(parsed, initialDbValue);
    }
  } catch {
    // Ignore
  }
  return initialDbValue;
}

export function setLocalLikesCount(materialId: string, count: number): void {
  try {
    localStorage.setItem(`${LOCAL_LIKES_COUNT_PREFIX}${materialId}`, count.toString());
  } catch {
    // Ignore
  }
}

export function getLocalStorageSharedIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${LOCAL_SHARED_KEY_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveLocalStorageSharedIds(userId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(`${LOCAL_SHARED_KEY_PREFIX}${userId}`, JSON.stringify([...ids]));
  } catch {
    // Ignore storage errors
  }
}

export function getLocalSharesCount(materialId: string, initialDbValue: number = 0): number {
  try {
    const raw = localStorage.getItem(`${LOCAL_SHARES_COUNT_PREFIX}${materialId}`);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) return Math.max(parsed, initialDbValue);
    }
  } catch {
    // Ignore
  }
  return initialDbValue;
}

export async function incrementShare(
  materialId: string,
  userId?: string,
  currentCount: number = 0
): Promise<{ newCount: number }> {
  try {
    const { data, error } = await supabase.rpc('increment_material_shares', {
      p_material_id: materialId,
    });

    if (!error && typeof data === 'number') {
      try {
        localStorage.setItem(`${LOCAL_SHARES_COUNT_PREFIX}${materialId}`, data.toString());
      } catch {}
      return { newCount: data };
    }
  } catch (err) {
    console.warn('RPC increment_material_shares failed, using fallback:', err);
  }

  // Fallback
  const fallback = incrementLocalSharesCount(materialId, userId, currentCount);
  return { newCount: fallback.newCount };
}

export function incrementLocalSharesCount(
  materialId: string,
  userId?: string,
  currentCount?: number
): { newCount: number; alreadyShared: boolean } {
  const effectiveUserId = userId || 'anonymous_guest';
  const sharedIds = getLocalStorageSharedIds(effectiveUserId);

  if (sharedIds.has(materialId)) {
    return { newCount: getLocalSharesCount(materialId, currentCount ?? 0), alreadyShared: true };
  }

  sharedIds.add(materialId);
  saveLocalStorageSharedIds(effectiveUserId, sharedIds);

  const newCount = getLocalSharesCount(materialId, currentCount ?? 0) + 1;
  try {
    localStorage.setItem(`${LOCAL_SHARES_COUNT_PREFIX}${materialId}`, newCount.toString());
  } catch {
    // Ignore
  }
  return { newCount, alreadyShared: false };
}

export function getLocalDownloadsCount(materialId: string, initialDbValue: number = 0): number {
  try {
    const raw = localStorage.getItem(`${LOCAL_DOWNLOADS_COUNT_PREFIX}${materialId}`);
    if (raw) {
      const localCount = parseInt(raw, 10);
      if (!isNaN(localCount)) return Math.max(localCount, initialDbValue);
    }
  } catch {
    // Ignore
  }
  return initialDbValue;
}

export function incrementLocalDownloadsCount(materialId: string, currentTotal: number): number {
  const newCount = currentTotal + 1;
  try {
    localStorage.setItem(`${LOCAL_DOWNLOADS_COUNT_PREFIX}${materialId}`, newCount.toString());
  } catch {
    // Ignore
  }
  return newCount;
}

export async function recordDownloadWithCount(
  materialId: string,
  currentTotal: number = 0
): Promise<{ newCount: number }> {
  try {
    const { data, error } = await supabase.rpc('record_material_download', {
      p_material_id: materialId,
    });

    if (!error && typeof data === 'number') {
      try {
        localStorage.setItem(`${LOCAL_DOWNLOADS_COUNT_PREFIX}${materialId}`, data.toString());
      } catch {}
      return { newCount: data };
    }
  } catch (err) {
    console.warn('RPC record_material_download failed, using fallback:', err);
  }

  // Fallback: try raw table insert
  try {
    await supabase.from('downloads').insert({ material_id: materialId });
  } catch {}

  const fallback = incrementLocalDownloadsCount(materialId, currentTotal);
  return { newCount: fallback };
}

export async function toggleLike(
  userId: string,
  materialId: string,
  currentCount?: number
): Promise<{ isLiked: boolean; likesCount: number }> {
  try {
    const { data, error } = await supabase.rpc('toggle_material_like', {
      p_material_id: materialId,
    });

    if (!error && data) {
      const isLiked = !!data.is_liked;
      const likesCount = typeof data.likes_count === 'number' ? data.likes_count : 0;

      const likedIds = getLocalStorageLikedIds(userId);
      if (isLiked) {
        likedIds.add(materialId);
      } else {
        likedIds.delete(materialId);
      }
      saveLocalStorageLikedIds(userId, likedIds);
      setLocalLikesCount(materialId, likesCount);

      return { isLiked, likesCount };
    }
  } catch (err) {
    console.warn('RPC toggle_material_like failed, using fallback:', err);
  }

  // Fallback to local storage if RPC unavailable
  const likedIds = getLocalStorageLikedIds(userId);
  let likesCount = currentCount !== undefined ? currentCount : getLocalLikesCount(materialId);
  const isCurrentlyLiked = likedIds.has(materialId);

  if (isCurrentlyLiked) {
    likedIds.delete(materialId);
    likesCount = Math.max(0, likesCount - 1);
  } else {
    likedIds.add(materialId);
    likesCount += 1;
  }

  saveLocalStorageLikedIds(userId, likedIds);
  setLocalLikesCount(materialId, likesCount);

  return { isLiked: !isCurrentlyLiked, likesCount };
}
