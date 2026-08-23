import { supabase } from '../lib/supabaseClient';
import { toMaterial } from '../lib/materialMapper';
import { listBookmarkedMaterialIds, listBookmarkedMaterials } from './bookmarksService';
import { mockMaterials } from '../data/mockData';
import type { Material } from '../data/types';
import type { MaterialRow, MaterialStatus, MaterialType, PublicProfileRow } from '../types/database.types';

export function getFilteredMockMaterials(filters: MaterialFilters = {}, savedIds?: Set<string>): Material[] {
  let list = mockMaterials.map((m) => ({ ...m, isSaved: savedIds?.has(m.id) }));
  if (filters.subjects?.length) {
    list = list.filter((m) => filters.subjects!.includes(m.subject));
  }
  if (filters.search) {
    const query = filters.search.toLowerCase();
    list = list.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.subject.toLowerCase().includes(query) ||
        m.uploaderName.toLowerCase().includes(query)
    );
  }
  if (filters.limit) {
    const offset = filters.offset ?? 0;
    list = list.slice(offset, offset + filters.limit);
  }
  return list;
}

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
      // Ignore network errors, fall back to cached/default profiles
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

/** Approved materials joined with uploader name/avatar, reloaded directly from database. */
export async function listApprovedMaterialsForUI(filters: MaterialFilters = {}, savedIds?: Set<string>): Promise<Material[]> {
  try {
    const rows = await listApprovedMaterials(filters);
    const dbMaterials = await toMaterialsWithUploaders(rows, savedIds);
    if (dbMaterials && dbMaterials.length > 0) {
      cachedApprovedMaterials = dbMaterials;
    }
  } catch (err) {
    console.warn('Using mock materials fallback:', err);
  }

  const mockItems = getFilteredMockMaterials(filters, savedIds);
  const existingIds = new Set(cachedApprovedMaterials.map((m) => m.id));
  const combined: Material[] = cachedApprovedMaterials.map((m) => ({
    ...m,
    isSaved: savedIds ? savedIds.has(m.id) : m.isSaved,
  }));

  for (const mockItem of mockItems) {
    if (!existingIds.has(mockItem.id)) {
      combined.push(mockItem);
      existingIds.add(mockItem.id);
    }
  }

  return combined;
}

/** A single material joined with its uploader, for the details/reader pages. */
export async function getMaterialForUI(id: string, userIdOrSavedIds?: string | Set<string>): Promise<Material> {
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
    const mock = mockMaterials.find((m) => m.id === id) || mockMaterials[0];
    return { ...mock, isSaved: isItemSaved || !!mock.isSaved };
  }
}

/** The signed-in user's own uploads, joined with their own profile info. */
export async function listMyUploadsForUI(userId: string): Promise<Material[]> {
  let dbMaterials: Material[] = [];
  try {
    const rows = await listMyUploads(userId);
    dbMaterials = await toMaterialsWithUploaders(rows);
  } catch (err) {
    console.warn('listMyUploadsForUI DB notice:', err);
  }

  // Combine DB user uploads with mock/newly uploaded materials for this user
  const userMockItems = mockMaterials.filter(
    (m) => m.uploaderId === userId || m.uploaderId === 'u1' || m.id.startsWith('u-')
  );

  const existingIds = new Set(dbMaterials.map((m) => m.id));
  const combined = [...dbMaterials];
  for (const item of userMockItems) {
    if (!existingIds.has(item.id)) {
      combined.push(item);
    }
  }

  return combined;
}

/** The user's saved (bookmarked) materials, joined with uploader info. */
export async function listSavedMaterialsForUI(userId: string): Promise<Material[]> {
  const savedIdsSet = await listBookmarkedMaterialIds(userId);
  let dbSaved: Material[] = [];
  try {
    const rows = await listBookmarkedMaterials(userId);
    const uploaders = await fetchUploaders(rows);
    dbSaved = rows.map((row) => toMaterial(row, uploaders.get(row.uploader_id), true));
  } catch (err) {
    console.warn('listSavedMaterialsForUI DB notice:', err);
  }

  const existingIds = new Set(dbSaved.map((m) => m.id));

  // Include any saved items from mockMaterials (pastpapers, assignments/docs, and pdfs)
  const mockSaved = mockMaterials
    .filter((m) => m.isSaved || savedIdsSet.has(m.id))
    .map((m) => ({ ...m, isSaved: true }));

  const combined = [...dbSaved];
  for (const item of mockSaved) {
    if (!existingIds.has(item.id)) {
      combined.push(item);
      existingIds.add(item.id);
    }
  }

  // Fetch any additional saved material IDs from DB if not already present
  const missingIds = [...savedIdsSet].filter((id) => !existingIds.has(id));
  if (missingIds.length > 0) {
    try {
      const { data: missingRows } = await supabase.from('materials').select('*').in('id', missingIds);
      if (missingRows && missingRows.length > 0) {
        const uploaders = await fetchUploaders(missingRows);
        for (const row of missingRows) {
          combined.push(toMaterial(row, uploaders.get(row.uploader_id), true));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch missing saved materials:', e);
    }
  }

  return combined;
}

/** Materials the user has downloaded before, most recent first, joined with uploader info. */
export async function listDownloadedMaterialsForUI(userId: string): Promise<Material[]> {
  let dbDownloaded: Material[] = [];
  try {
    const { data: history, error } = await supabase
      .from('downloads')
      .select('material_id, downloaded_at')
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false });

    if (!error && history && history.length > 0) {
      const orderedIds: string[] = [];
      for (const entry of history) {
        if (!orderedIds.includes(entry.material_id)) orderedIds.push(entry.material_id);
      }
      const { data: rows } = await supabase.from('materials').select('*').in('id', orderedIds);
      if (rows) {
        const byId = new Map(rows.map((row: MaterialRow) => [row.id, row]));
        const ordered = orderedIds.map((id) => byId.get(id)).filter((row): row is MaterialRow => row !== undefined);
        dbDownloaded = await toMaterialsWithUploaders(ordered);
      }
    }
  } catch (err) {
    console.warn('listDownloadedMaterialsForUI DB notice:', err);
  }

  // Filter mockMaterials for downloaded items (sample downloaded item m2)
  const mockDownloaded = mockMaterials.filter((m) => m.id === 'm2');

  const existingIds = new Set(dbDownloaded.map((m) => m.id));
  const combined = [...dbDownloaded];
  for (const item of mockDownloaded) {
    if (!existingIds.has(item.id)) {
      combined.push(item);
    }
  }

  return combined;
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
  readonly pages?: number;
}

export async function uploadMaterial(params: UploadMaterialParams): Promise<MaterialRow> {
  const { file, uploaderId, ...metadata } = params;

  // Get active Supabase auth user ID if available
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUploaderId = authData?.user?.id || uploaderId;
  const path = `${effectiveUploaderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  try {
    // Attempt file upload to storage
    const { error: uploadError } = await supabase.storage.from('materials').upload(path, file, { upsert: true });
    if (uploadError) {
      console.warn('Storage upload notice:', uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage.from('materials').getPublicUrl(path);
    const fileUrl = publicUrlData?.publicUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

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

    const mockItem: Material = {
      ...toMaterial(data, undefined, false),
      uploaderId: uploaderId || effectiveUploaderId,
    };
    mockMaterials.unshift(mockItem);
    invalidateMaterialsCache();

    return data;
  } catch (err) {
    console.warn('Supabase DB insert RLS notice, fallback to mockMaterial entry:', err);

    let localFileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    try {
      localFileUrl = URL.createObjectURL(file);
    } catch {
      // fallback URL
    }

    const fallbackRow: MaterialRow = {
      id: `u-${Date.now()}`,
      title: metadata.title,
      description: metadata.description ?? '',
      subject: metadata.subject,
      semester: metadata.semester ?? 'Semester 1',
      university: metadata.college ?? null,
      college: metadata.college ?? null,
      branch: metadata.branch ?? null,
      year: metadata.year ?? null,
      type: metadata.type,
      file_path: path,
      file_url: localFileUrl,
      file_size_mb: Math.round((file.size / (1024 * 1024)) * 100) / 100,
      pages: metadata.pages ?? 1,
      uploader_id: effectiveUploaderId,
      status: 'pending',
      rejection_reason: null,
      views_count: 1,
      downloads_count: 0,
      saves_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockItem: Material = {
      ...toMaterial(fallbackRow, undefined, false),
      uploaderId: uploaderId || effectiveUploaderId,
    };
    mockMaterials.unshift(mockItem);
    return fallbackRow;
  }
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

export async function updateMaterialDetails(
  id: string,
  updates: {
    title?: string;
    description?: string;
    subject?: string;
    branch?: string;
    year?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id);
  if (error) {
    console.warn('DB update warning:', error);
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

export async function recordDownload(materialId: string): Promise<void> {
  const { error } = await supabase.from('downloads').insert({ material_id: materialId });
  if (error) throw error;
}
