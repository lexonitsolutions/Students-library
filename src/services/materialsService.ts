import { supabase } from '../lib/supabaseClient';
import { toMaterial } from '../lib/materialMapper';
import { listBookmarkedMaterials } from './bookmarksService';
import type { Material } from '../data/types';
import type { MaterialRow, MaterialStatus, MaterialType, PublicProfileRow } from '../types/database.types';

async function fetchUploaders(rows: readonly MaterialRow[]): Promise<Map<string, PublicProfileRow>> {
  const ids = [...new Set(rows.map((row) => row.uploader_id))];
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from('public_profiles').select('*').in('id', ids);
  if (error) throw error;
  return new Map(data.map((profile) => [profile.id, profile]));
}

async function toMaterialsWithUploaders(rows: MaterialRow[], savedIds?: Set<string>): Promise<Material[]> {
  const uploaders = await fetchUploaders(rows);
  return rows.map((row) => toMaterial(row, uploaders.get(row.uploader_id), savedIds?.has(row.id)));
}

/** Approved materials joined with uploader name/avatar, ready for MaterialCard/MaterialRow. */
export async function listApprovedMaterialsForUI(filters: MaterialFilters = {}, savedIds?: Set<string>): Promise<Material[]> {
  const rows = await listApprovedMaterials(filters);
  return toMaterialsWithUploaders(rows, savedIds);
}

/** A single material joined with its uploader, for the details/reader pages. */
export async function getMaterialForUI(id: string, savedIds?: Set<string>): Promise<Material> {
  const row = await getMaterialById(id);
  const uploaders = await fetchUploaders([row]);
  return toMaterial(row, uploaders.get(row.uploader_id), savedIds?.has(row.id));
}

/** The signed-in user's own uploads, joined with their own profile info. */
export async function listMyUploadsForUI(userId: string): Promise<Material[]> {
  const rows = await listMyUploads(userId);
  return toMaterialsWithUploaders(rows);
}

/** The user's saved (bookmarked) materials, joined with uploader info. */
export async function listSavedMaterialsForUI(userId: string): Promise<Material[]> {
  const rows = await listBookmarkedMaterials(userId);
  const uploaders = await fetchUploaders(rows);
  return rows.map((row) => toMaterial(row, uploaders.get(row.uploader_id), true));
}

/** Materials the user has downloaded before, most recent first, joined with uploader info. */
export async function listDownloadedMaterialsForUI(userId: string): Promise<Material[]> {
  const { data: history, error } = await supabase
    .from('downloads')
    .select('material_id, downloaded_at')
    .eq('user_id', userId)
    .order('downloaded_at', { ascending: false });
  if (error) throw error;

  const orderedIds: string[] = [];
  for (const entry of history) {
    if (!orderedIds.includes(entry.material_id)) orderedIds.push(entry.material_id);
  }
  if (orderedIds.length === 0) return [];

  const { data: rows, error: rowsError } = await supabase.from('materials').select('*').in('id', orderedIds);
  if (rowsError) throw rowsError;

  const byId = new Map(rows.map((row: MaterialRow) => [row.id, row]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((row): row is MaterialRow => row !== undefined);
  return toMaterialsWithUploaders(ordered);
}

export interface MaterialFilters {
  readonly subjects?: readonly string[];
  readonly universities?: readonly string[];
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export async function listApprovedMaterials(filters: MaterialFilters = {}): Promise<MaterialRow[]> {
  let query = supabase.from('materials').select('*').eq('status', 'approved').order('created_at', { ascending: false });

  if (filters.subjects?.length) query = query.in('subject', filters.subjects as string[]);
  if (filters.universities?.length) query = query.in('university', filters.universities as string[]);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
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
}

export async function uploadMaterial(params: UploadMaterialParams): Promise<MaterialRow> {
  const { file, uploaderId, ...metadata } = params;
  const path = `${uploaderId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from('materials').upload(path, file);
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('materials').getPublicUrl(path);

  const { data, error } = await supabase
    .from('materials')
    .insert({
      ...metadata,
      file_path: path,
      file_url: publicUrlData.publicUrl,
      file_size_mb: Math.round((file.size / (1024 * 1024)) * 100) / 100,
    })
    .select()
    .single();

  if (error) throw error;
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

export async function recordDownload(materialId: string): Promise<void> {
  const { error } = await supabase.from('downloads').insert({ material_id: materialId });
  if (error) throw error;
}
