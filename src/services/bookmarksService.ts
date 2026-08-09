import { supabase } from '../lib/supabaseClient';
import type { MaterialRow } from '../types/database.types';

export async function listBookmarkedMaterials(userId: string): Promise<MaterialRow[]> {
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('material_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (bookmarksError) throw bookmarksError;
  if (bookmarks.length === 0) return [];

  const orderedIds = bookmarks.map((row) => row.material_id);
  const { data: materials, error: materialsError } = await supabase
    .from('materials')
    .select('*')
    .in('id', orderedIds);
  if (materialsError) throw materialsError;

  const byId = new Map(materials.map((material) => [material.id, material]));
  return orderedIds.map((id) => byId.get(id)).filter((m): m is MaterialRow => m !== undefined);
}

export async function listBookmarkedMaterialIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('bookmarks').select('material_id').eq('user_id', userId);
  if (error) throw error;
  return new Set(data.map((row) => row.material_id));
}

export async function addBookmark(materialId: string): Promise<void> {
  const { error } = await supabase.from('bookmarks').insert({ material_id: materialId });
  if (error) throw error;
}

export async function removeBookmark(materialId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('bookmarks').delete().eq('material_id', materialId).eq('user_id', userId);
  if (error) throw error;
}
