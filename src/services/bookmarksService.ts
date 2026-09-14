import { supabase } from '../lib/supabaseClient';
import type { MaterialRow } from '../types/database.types';

const LOCAL_SAVED_KEY_PREFIX = 'quicklearnit_saved_ids_';

function getLocalStorageSavedIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${LOCAL_SAVED_KEY_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveLocalStorageSavedIds(userId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(`${LOCAL_SAVED_KEY_PREFIX}${userId}`, JSON.stringify([...ids]));
  } catch {
    // Ignore storage errors
  }
}

let inMemorySavedSet: Set<string> | null = null;
let inMemoryUserId: string | null = null;
let lastBookmarkFetchTime = 0;
const BOOKMARK_CACHE_TTL_MS = 30000; // 30 seconds

export async function listBookmarkedMaterialIds(userId: string): Promise<Set<string>> {
  const localSet = getLocalStorageSavedIds(userId);
  const now = Date.now();

  if (inMemorySavedSet && inMemoryUserId === userId && now - lastBookmarkFetchTime < BOOKMARK_CACHE_TTL_MS) {
    return new Set(inMemorySavedSet);
  }

  if (!inMemorySavedSet || inMemoryUserId !== userId) {
    inMemorySavedSet = new Set(localSet);
    inMemoryUserId = userId;
  } else {
    for (const id of localSet) {
      inMemorySavedSet.add(id);
    }
  }

  try {
    const { data, error } = await supabase.from('bookmarks').select('material_id').eq('user_id', userId);
    if (!error && data) {
      for (const row of data) {
        localSet.add(row.material_id);
        inMemorySavedSet.add(row.material_id);
      }
      saveLocalStorageSavedIds(userId, inMemorySavedSet);
      lastBookmarkFetchTime = Date.now();
    }
  } catch (err) {
    console.warn('DB listBookmarkedMaterialIds notice:', err);
  }

  return new Set(inMemorySavedSet);
}

export async function listBookmarkedMaterials(userId: string): Promise<MaterialRow[]> {
  const savedIdsSet = await listBookmarkedMaterialIds(userId);
  if (savedIdsSet.size === 0) return [];

  const orderedIds = [...savedIdsSet];
  try {
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .in('id', orderedIds);
    if (!materialsError && materials) {
      const byId = new Map(materials.map((material) => [material.id, material]));
      return orderedIds.map((id) => byId.get(id)).filter((m): m is MaterialRow => m !== undefined);
    }
  } catch (err) {
    console.warn('DB listBookmarkedMaterials notice:', err);
  }
  return [];
}

export async function addBookmark(materialId: string, userId?: string): Promise<void> {
  if (userId) {
    const set = getLocalStorageSavedIds(userId);
    set.add(materialId);
    saveLocalStorageSavedIds(userId, set);
  }
  if (inMemorySavedSet) {
    inMemorySavedSet.add(materialId);
  }

  try {
    const payload: { material_id: string; user_id?: string } = { material_id: materialId };
    if (userId) payload.user_id = userId;
    const { error } = await supabase.from('bookmarks').insert(payload);
    if (error) {
      console.warn('Supabase bookmark insert notice:', error);
    }
  } catch (err) {
    console.warn('Supabase bookmark insert exception:', err);
  }
}

export async function removeBookmark(materialId: string, userId?: string): Promise<void> {
  if (userId) {
    const set = getLocalStorageSavedIds(userId);
    set.delete(materialId);
    saveLocalStorageSavedIds(userId, set);
  }
  if (inMemorySavedSet) {
    inMemorySavedSet.delete(materialId);
  }

  try {
    let query = supabase.from('bookmarks').delete().eq('material_id', materialId);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    if (error) {
      console.warn('Supabase bookmark remove notice:', error);
    }
  } catch (err) {
    console.warn('Supabase bookmark remove exception:', err);
  }
}
