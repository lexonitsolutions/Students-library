import { supabase } from '../lib/supabaseClient';

const LOCAL_LIKED_KEY_PREFIX = 'quicklearnit_liked_ids_';
const LOCAL_LIKES_COUNT_PREFIX = 'quicklearnit_likes_count_';
const LOCAL_SHARED_KEY_PREFIX = 'quicklearnit_shared_ids_';
const LOCAL_SHARES_COUNT_PREFIX = 'quicklearnit_shares_count_';
const LOCAL_DOWNLOADS_COUNT_PREFIX = 'quicklearnit_downloads_count_';
const LOCAL_DOWNLOADED_KEY_PREFIX = 'quicklearnit_downloaded_ids_';

// In-memory set cache for user's downloaded material IDs
let cachedUserDownloadedIds = new Map<string, Set<string>>();

export function getLocalStorageLikedIds(userId: string): Set<string> {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(`${LOCAL_LIKED_KEY_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set<string>(arr);
      }
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

export function saveLocalStorageLikedIds(userId: string, ids: Set<string>): void {
  if (!userId) return;
  userLikedCache.set(userId, { ids: new Set(ids), time: Date.now() });
  try {
    localStorage.setItem(`${LOCAL_LIKED_KEY_PREFIX}${userId}`, JSON.stringify([...ids]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('quicklearnit_likes_updated', {
          detail: { userId, count: ids.size, ids: [...ids] },
        })
      );
    }
  } catch {
    // Ignore storage errors
  }
}

const userLikedCache = new Map<string, { ids: Set<string>; time: number }>();
const LIKES_CACHE_TTL_MS = 30000; // 30 seconds

/** Fetch all material IDs liked by the specified user */
export async function fetchUserLikedIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();

  const cached = userLikedCache.get(userId);
  if (cached && Date.now() - cached.time < LIKES_CACHE_TTL_MS) {
    return new Set(cached.ids);
  }

  try {
    const { data, error } = await supabase
      .from('material_likes')
      .select('material_id')
      .eq('user_id', userId);

    if (!error && Array.isArray(data)) {
      const ids = new Set<string>(data.map((row: { material_id: string }) => row.material_id));
      saveLocalStorageLikedIds(userId, ids);
      userLikedCache.set(userId, { ids: new Set(ids), time: Date.now() });
      return ids;
    }
  } catch {
    // Fall back to local storage
  }
  const fallback = getLocalStorageLikedIds(userId);
  userLikedCache.set(userId, { ids: new Set(fallback), time: Date.now() });
  return fallback;
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('quicklearnit_likes_count_updated', {
          detail: { materialId, count },
        })
      );
    }
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

function getGuestDownloadId(): string {
  try {
    let guestId = localStorage.getItem('quicklearnit_guest_download_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('quicklearnit_guest_download_id', guestId);
    }
    return guestId;
  } catch {
    return 'guest_anonymous';
  }
}

export function getLocalStorageDownloadedIds(userId: string): Set<string> {
  if (cachedUserDownloadedIds.has(userId)) {
    return cachedUserDownloadedIds.get(userId)!;
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_DOWNLOADED_KEY_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const set = new Set<string>(arr);
        cachedUserDownloadedIds.set(userId, set);
        return set;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

export function saveLocalStorageDownloadedIds(userId: string, ids: Set<string>): void {
  cachedUserDownloadedIds.set(userId, ids);
  try {
    localStorage.setItem(`${LOCAL_DOWNLOADED_KEY_PREFIX}${userId}`, JSON.stringify([...ids]));
  } catch {
    // Ignore storage errors
  }
}

const userDownloadedCache = new Map<string, { ids: Set<string>; time: number }>();
const DOWNLOADS_CACHE_TTL_MS = 30000; // 30 seconds

/** Fetch all material IDs downloaded by the specified user from Supabase */
export async function fetchUserDownloadedIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();

  const cached = userDownloadedCache.get(userId);
  if (cached && Date.now() - cached.time < DOWNLOADS_CACHE_TTL_MS) {
    return new Set(cached.ids);
  }

  try {
    const { data, error } = await supabase
      .from('downloads')
      .select('material_id')
      .eq('user_id', userId);

    if (!error && data) {
      const ids = new Set<string>(data.map((row: { material_id: string }) => row.material_id));
      saveLocalStorageDownloadedIds(userId, ids);
      userDownloadedCache.set(userId, { ids: new Set(ids), time: Date.now() });
      return ids;
    }
  } catch {
    // Fall back to local storage
  }
  const fallback = getLocalStorageDownloadedIds(userId);
  userDownloadedCache.set(userId, { ids: new Set(fallback), time: Date.now() });
  return fallback;
}

export function hasUserDownloaded(userId: string, materialId: string): boolean {
  return getLocalStorageDownloadedIds(userId).has(materialId);
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
  userIdOrCurrentTotal?: string | number,
  currentTotal: number = 0
): Promise<{ newCount: number; alreadyDownloaded: boolean }> {
  let userId: string | undefined;
  let count = 0;

  if (typeof userIdOrCurrentTotal === 'string') {
    userId = userIdOrCurrentTotal;
    count = currentTotal;
  } else if (typeof userIdOrCurrentTotal === 'number') {
    count = userIdOrCurrentTotal;
  }

  const effectiveUserId = userId || getGuestDownloadId();
  const downloadedIds = getLocalStorageDownloadedIds(effectiveUserId);

  // 1. Check local cache: if this user account already downloaded it, do NOT increment
  if (downloadedIds.has(materialId)) {
    const current = getLocalDownloadsCount(materialId, count);
    return { newCount: current, alreadyDownloaded: true };
  }

  // 2. If user is authenticated, query Supabase downloads table to verify account history
  if (userId) {
    try {
      const { data: existing } = await supabase
        .from('downloads')
        .select('id')
        .eq('user_id', userId)
        .eq('material_id', materialId)
        .limit(1);

      if (existing && existing.length > 0) {
        downloadedIds.add(materialId);
        saveLocalStorageDownloadedIds(userId, downloadedIds);
        const current = getLocalDownloadsCount(materialId, count);
        return { newCount: current, alreadyDownloaded: true };
      }
    } catch (err) {
      console.warn('Error checking download history in database:', err);
    }
  }

  // 3. Register as downloaded for this user account immediately to prevent rapid double-clicks
  downloadedIds.add(materialId);
  saveLocalStorageDownloadedIds(effectiveUserId, downloadedIds);

  // 4. Record new download in database
  try {
    const { data, error } = await supabase.rpc('record_material_download', {
      p_material_id: materialId,
    });

    if (!error && typeof data === 'number') {
      try {
        localStorage.setItem(`${LOCAL_DOWNLOADS_COUNT_PREFIX}${materialId}`, data.toString());
      } catch {}
      return { newCount: data, alreadyDownloaded: false };
    }
  } catch (err) {
    console.warn('RPC record_material_download failed, using fallback:', err);
  }

  // Fallback: try raw table insert
  try {
    if (userId) {
      await supabase.from('downloads').insert({ material_id: materialId, user_id: userId });
    } else {
      await supabase.from('downloads').insert({ material_id: materialId });
    }
  } catch {}

  const fallback = incrementLocalDownloadsCount(materialId, count);
  return { newCount: fallback, alreadyDownloaded: false };
}

const inFlightLikeRequests = new Map<string, Promise<{ isLiked: boolean; likesCount: number }>>();

export async function toggleLike(
  userId: string,
  materialId: string,
  currentCount?: number
): Promise<{ isLiked: boolean; likesCount: number }> {
  if (!userId || !materialId) {
    throw new Error('User and document IDs are required to like');
  }

  // Prevent duplicate concurrent in-flight requests for the same material
  const inFlight = inFlightLikeRequests.get(materialId);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    // Determine the baseline count from passed current count, local storage, and database
    const localVal = getLocalLikesCount(materialId, 0);
    const passedVal = typeof currentCount === 'number' && !isNaN(currentCount) ? currentCount : 0;
    let baseCount = Math.max(passedVal, localVal);

    try {
      const { data: matRow } = await supabase
        .from('materials')
        .select('likes_count, saves_count')
        .eq('id', materialId)
        .maybeSingle();

      if (matRow) {
        const dbMax = Math.max(
          Number((matRow as any).likes_count ?? 0),
          Number((matRow as any).saves_count ?? 0)
        );
        baseCount = Math.max(baseCount, dbMax);
      }
    } catch {
      // Ignore database read errors
    }

    try {
      const { data, error } = await supabase.rpc('toggle_material_like', {
        p_material_id: materialId,
      });

      if (!error && data) {
        const res = typeof data === 'string' ? JSON.parse(data) : data;
        const isLiked = !!res.is_liked;
        const returnedCount = typeof res.likes_count === 'number' ? res.likes_count : 0;

        // If returnedCount was wiped out to 1 while baseCount was higher, preserve baseline
        let finalCount = returnedCount;
        if (isLiked) {
          finalCount = Math.max(returnedCount, baseCount + 1);
        } else {
          finalCount = Math.max(0, Math.min(returnedCount, Math.max(0, baseCount - 1)));
          if (finalCount === 0 && baseCount > 1) {
            finalCount = Math.max(0, baseCount - 1);
          }
        }

        const likedIds = getLocalStorageLikedIds(userId);
        if (isLiked) {
          likedIds.add(materialId);
        } else {
          likedIds.delete(materialId);
        }
        saveLocalStorageLikedIds(userId, likedIds);
        setLocalLikesCount(materialId, finalCount);

        // Keep materials table count synchronized with the preserved baseline
        if (finalCount !== returnedCount) {
          try {
            await supabase.from('materials').update({ likes_count: finalCount }).eq('id', materialId);
          } catch {
            // Ignore
          }
        }

        return { isLiked, likesCount: finalCount };
      }
      if (error) {
        console.warn('toggle_material_like RPC returned error, attempting direct table toggle:', error);
      }
    } catch (err) {
      console.warn('RPC toggle_material_like exception, attempting direct table toggle:', err);
    }

    // Fallback: direct table operations if RPC fails
    try {
      const { data: existing } = await supabase
        .from('material_likes')
        .select('material_id')
        .eq('material_id', materialId)
        .eq('user_id', userId)
        .maybeSingle();

      const likedIds = getLocalStorageLikedIds(userId);
      const isCurrentlyLiked = !!existing || likedIds.has(materialId);
      let isLikedNow = !isCurrentlyLiked;

      if (isCurrentlyLiked) {
        await supabase.from('material_likes').delete().eq('material_id', materialId).eq('user_id', userId);
        isLikedNow = false;
        likedIds.delete(materialId);
      } else {
        await supabase.from('material_likes').upsert(
          { material_id: materialId, user_id: userId },
          { onConflict: 'material_id,user_id' }
        );
        isLikedNow = true;
        likedIds.add(materialId);
      }

      // Calculate final count preserving baseline
      const finalCount = isLikedNow
        ? baseCount + 1
        : Math.max(0, baseCount - 1);

      // Keep materials table count synchronized
      await supabase.from('materials').update({ likes_count: finalCount }).eq('id', materialId);

      saveLocalStorageLikedIds(userId, likedIds);
      setLocalLikesCount(materialId, finalCount);
      return { isLiked: isLikedNow, likesCount: finalCount };
    } catch (directErr) {
      console.warn('Direct database like toggle failed, falling back to local storage:', directErr);
    }

    // Pure local storage fallback
    const likedIds = getLocalStorageLikedIds(userId);
    const isCurrentlyLiked = likedIds.has(materialId);
    let finalCount = baseCount;

    if (isCurrentlyLiked) {
      likedIds.delete(materialId);
      finalCount = Math.max(0, baseCount - 1);
    } else {
      likedIds.add(materialId);
      finalCount = baseCount + 1;
    }

    saveLocalStorageLikedIds(userId, likedIds);
    setLocalLikesCount(materialId, finalCount);

    return { isLiked: !isCurrentlyLiked, likesCount: finalCount };
  })().finally(() => {
    inFlightLikeRequests.delete(materialId);
  });

  inFlightLikeRequests.set(materialId, promise);
  return promise;
}
