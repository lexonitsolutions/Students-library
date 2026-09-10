import { supabase } from '../lib/supabaseClient';
import type { UserRole } from '../types/database.types';

export const ROOT_ADMIN_EMAIL = 'hr@lexonit.com';

export interface AdminStats {
  readonly totalStudents: number;
  readonly totalDocuments: number;
  readonly totalMaterials: number;
  readonly totalAssignments: number;
  readonly totalTestPapers: number;
  readonly activeDownloads: number;
  readonly pendingApprovals: number;
}

export type DocumentSection = 'all' | 'materials' | 'assignments' | 'testpapers';

export function getDocumentSection(item: { type?: string | null; title?: string | null }): 'materials' | 'assignments' | 'testpapers' {
  const t = (item.type || '').toLowerCase().trim();
  const title = (item.title || '').toLowerCase();

  // 1. Assignments
  if (
    t === 'doc' ||
    t === 'assignment' ||
    t === 'assignments' ||
    title.includes('assignment') ||
    title.includes('solution') ||
    title.includes('homework') ||
    title.includes('lab manual') ||
    title.includes('lab report')
  ) {
    return 'assignments';
  }

  // 2. Test Papers
  if (
    t === 'past-paper' ||
    t === 'past-papers' ||
    t === 'test-paper' ||
    t === 'testpaper' ||
    t === 'paper' ||
    t === 'papers' ||
    title.includes('paper') ||
    title.includes('test') ||
    title.includes('exam') ||
    title.includes('mid') ||
    title.includes('quiz')
  ) {
    return 'testpapers';
  }

  // 3. Materials
  return 'materials';
}

export async function getAdminStats(): Promise<AdminStats> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalStudents },
    { data: materialsData },
    { count: activeDownloads },
    { count: pendingApprovals },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('email', ROOT_ADMIN_EMAIL),
    supabase.from('materials').select('id, title, type, status'),
    supabase.from('downloads').select('*', { count: 'exact', head: true }).gte('downloaded_at', oneDayAgo),
    supabase.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const deletedApprovalIds = getDeletedApprovalIds();
  const deletedRejectionIds = getDeletedRejectionIds();
  const deletedStudentIds = getDeletedStudentIds();

  const activeMaterials = (materialsData || []).filter(
    (m) => !deletedApprovalIds.has(m.id) && !deletedRejectionIds.has(m.id)
  );

  const totalDocuments = activeMaterials.length;
  const totalMaterials = activeMaterials.filter((m) => getDocumentSection(m) === 'materials').length;
  const totalAssignments = activeMaterials.filter((m) => getDocumentSection(m) === 'assignments').length;
  const totalTestPapers = activeMaterials.filter((m) => getDocumentSection(m) === 'testpapers').length;

  return {
    totalStudents: Math.max(0, (totalStudents ?? 0) - deletedStudentIds.size),
    totalDocuments,
    totalMaterials,
    totalAssignments,
    totalTestPapers,
    activeDownloads: activeDownloads ?? 0,
    pendingApprovals: pendingApprovals ?? 0,
  };
}

export function formatCourse(raw?: string | null): string {
  if (!raw) return 'Degree';
  const lower = raw.toLowerCase();
  if (lower.includes('degree') || lower.includes('b.sc') || lower.includes('b.com') || lower.includes('bca') || lower.includes('bba')) {
    return 'Degree';
  }
  if (lower.includes('engin') || lower.includes('b.tech') || lower.includes('btech') || lower.includes('b.e')) {
    return 'Engineering';
  }
  return lower.includes('cs') || lower.includes('civil') || lower.includes('mechanical') || lower.includes('electrical')
    ? 'Engineering'
    : 'Degree';
}

export interface UploaderDetails {
  readonly id: string;
  readonly name: string;
  readonly username?: string;
  readonly avatarUrl?: string;
  readonly university?: string;
  readonly college?: string;
  readonly branch?: string;
  readonly major?: string;
  readonly uploadsCount?: number;
}

export interface ModerationItem {
  readonly id: string;
  readonly title: string;
  readonly uploader: string;
  readonly uploaderDetails: UploaderDetails;
  readonly date: string;
  readonly subject: string;
  readonly course: string;
  readonly filePath: string;
  readonly fileUrl?: string;
  readonly description?: string | null;
  readonly fileSizeMb?: number | null;
  readonly pages?: number | null;
  readonly type?: string;
  readonly views?: number;
  readonly downloads?: number;
  readonly likes?: number;
  readonly shares?: number;
  readonly status?: 'pending' | 'approved' | 'rejected';
  readonly rejectionReason?: string;
  readonly approvedByAdminName?: string;
  readonly approvedByAdminAvatar?: string;
  readonly rejectedByAdminName?: string;
  readonly rejectedByAdminAvatar?: string;
}

export async function listModerationQueue(): Promise<ModerationItem[]> {
  const { data: pending, error } = await supabase
    .from('materials')
    .select('id, title, description, subject, branch, created_at, uploader_id, file_path, file_url, file_size_mb, pages, type, views_count, downloads_count, saves_count')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Failed to load moderation queue:', error);
    throw error;
  }
  if (!pending || pending.length === 0) return [];

  const uploaderIds = [...new Set(pending.map((m) => m.uploader_id))];
  const [{ data: uploaders }, { data: statsData }] = await Promise.all([
    supabase
      .from('public_profiles')
      .select('id, name, username, avatar_url, university, college, branch, major')
      .in('id', uploaderIds),
    supabase
      .from('profile_stats')
      .select('user_id, uploads_count')
      .in('user_id', uploaderIds),
  ]);

  const profileById = new Map(uploaders?.map((u) => [u.id, u]) ?? []);
  const statsById = new Map(statsData?.map((s) => [s.user_id, s.uploads_count]) ?? []);

  return pending.map((item) => {
    const prof = profileById.get(item.uploader_id);
    const uploaderDetails: UploaderDetails = {
      id: item.uploader_id,
      name: prof?.name || 'Unknown Student',
      username: prof?.username ? `@${prof.username}` : undefined,
      avatarUrl: prof?.avatar_url || undefined,
      university: prof?.university || prof?.college || undefined,
      branch: prof?.branch || prof?.major || undefined,
      uploadsCount: statsById.get(item.uploader_id) ?? 1,
    };

    let resolvedUrl = item.file_url;
    if (!resolvedUrl && item.file_path) {
      const { data: pubData } = supabase.storage.from('materials').getPublicUrl(item.file_path);
      resolvedUrl = pubData?.publicUrl;
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      subject: item.subject,
      course: formatCourse(item.branch),
      filePath: item.file_path,
      fileUrl: resolvedUrl,
      fileSizeMb: item.file_size_mb,
      pages: item.pages,
      type: item.type,
      views: item.views_count ?? 0,
      downloads: item.downloads_count ?? 0,
      likes: 0,
      shares: 0,
      uploader: uploaderDetails.name,
      uploaderDetails,
      date: new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    };
  });
}

export interface AdminAllowlistEntry {
  readonly email: string;
  readonly createdAt: string;
  readonly hasAccount: boolean;
  readonly role: UserRole | null;
  readonly isRoot: boolean;
}

export async function listAdminEmails(): Promise<AdminAllowlistEntry[]> {
  const { data: allowlist, error } = await supabase
    .from('admin_allowlist')
    .select('email, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (allowlist.length === 0) return [];

  const emails = allowlist.map((entry) => entry.email);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('email, role')
    .in('email', emails);
  if (profilesError) throw profilesError;

  const profileByEmail = new Map(profiles.map((p) => [p.email, p]));

  return allowlist.map((entry) => {
    const profile = profileByEmail.get(entry.email);
    return {
      email: entry.email,
      createdAt: entry.created_at,
      hasAccount: Boolean(profile),
      role: profile?.role ?? null,
      isRoot: entry.email === ROOT_ADMIN_EMAIL,
    };
  });
}

export async function addAdminEmail(email: string): Promise<void> {
  const { error } = await supabase.from('admin_allowlist').insert({ email: email.trim().toLowerCase() });
  if (error) throw error;
}

export async function removeAdminEmail(email: string): Promise<void> {
  const { error } = await supabase.from('admin_allowlist').delete().eq('email', email.trim().toLowerCase());
  if (error) throw error;
}

export interface ApprovalMeta {
  adminId?: string;
  adminEmail?: string;
  adminName?: string;
  adminAvatar?: string;
  approvedAt?: string;
}

export function encodeApprovalMeta(meta: ApprovalMeta): string {
  return `APPROVED:${JSON.stringify(meta)}`;
}

export function parseApprovalMeta(raw?: string | null): ApprovalMeta | null {
  if (!raw || !raw.startsWith('APPROVED:')) return null;
  try {
    return JSON.parse(raw.slice('APPROVED:'.length));
  } catch {
    return null;
  }
}

export interface RejectionMeta {
  adminId?: string;
  adminEmail?: string;
  adminName?: string;
  adminAvatar?: string;
  rejectedAt?: string;
  reason: string;
}

export function encodeRejectionMeta(meta: RejectionMeta): string {
  return `REJECTED:${JSON.stringify(meta)}`;
}

export function parseRejectionMeta(raw?: string | null): { reason: string; meta: RejectionMeta | null } {
  if (!raw) return { reason: 'Guidelines not met', meta: null };
  if (!raw.startsWith('REJECTED:')) {
    return { reason: raw, meta: null };
  }
  try {
    const meta = JSON.parse(raw.slice('REJECTED:'.length));
    return { reason: meta.reason || 'Guidelines not met', meta };
  } catch {
    return { reason: raw.slice('REJECTED:'.length), meta: null };
  }
}

export interface RecentApprovalItem {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly course: string;
  readonly uploaderName: string;
  readonly uploaderDetails?: UploaderDetails;
  readonly approvedAt: string;
  readonly approvedByAdminId?: string;
  readonly approvedByAdminName: string;
  readonly approvedByAdminAvatar?: string;
  readonly approvedByAdminEmail?: string;
  readonly filePath?: string;
  readonly fileUrl?: string;
  readonly description?: string | null;
  readonly fileSizeMb?: number | null;
  readonly pages?: number | null;
  readonly type?: string;
  readonly views?: number;
  readonly downloads?: number;
}

const RECENT_APPROVALS_STORAGE_KEY = 'quicklearn_recent_approvals_v2';
const DELETED_APPROVAL_IDS_KEY = 'quicklearn_deleted_approval_ids';
const DELETED_REJECTION_IDS_KEY = 'quicklearn_deleted_rejection_ids';

function getDeletedApprovalIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_APPROVAL_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function addDeletedApprovalId(id: string): void {
  try {
    const ids = getDeletedApprovalIds();
    ids.add(id);
    localStorage.setItem(DELETED_APPROVAL_IDS_KEY, JSON.stringify([...ids]));
  } catch {}
}

function clearDeletedApprovalIds(): void {
  try {
    localStorage.removeItem(DELETED_APPROVAL_IDS_KEY);
  } catch {}
}

function getDeletedRejectionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_REJECTION_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function addDeletedRejectionId(id: string): void {
  try {
    const ids = getDeletedRejectionIds();
    ids.add(id);
    localStorage.setItem(DELETED_REJECTION_IDS_KEY, JSON.stringify([...ids]));
  } catch {}
}

function clearDeletedRejectionIds(): void {
  try {
    localStorage.removeItem(DELETED_REJECTION_IDS_KEY);
  } catch {}
}

const DELETED_STUDENT_IDS_KEY = 'quicklearn_deleted_student_ids';

export function getDeletedStudentIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_STUDENT_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function addDeletedStudentId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const ids = getDeletedStudentIds();
    ids.add(id);
    localStorage.setItem(DELETED_STUDENT_IDS_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function clearDeletedStudentIds(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DELETED_STUDENT_IDS_KEY);
  } catch {}
}


export function getStoredApprovals(): RecentApprovalItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_APPROVALS_STORAGE_KEY);
    const v2List: RecentApprovalItem[] = raw ? JSON.parse(raw) : [];
    const v1Raw = localStorage.getItem('quicklearn_recent_approvals_v1');
    const v1List: any[] = v1Raw ? JSON.parse(v1Raw) : [];

    const v2Ids = new Set(v2List.map((i) => i.id));
    const merged = [...v2List];
    for (const v1Item of v1List) {
      if (!v2Ids.has(v1Item.id)) {
        merged.push({
          ...v1Item,
          approvedByAdminName: v1Item.approvedByAdminName || v1Item.approvedByAdminEmail?.split('@')[0] || 'Admin',
        });
      }
    }
    return merged;
  } catch {
    return [];
  }
}

export function recordApproval(
  item: {
    id: string;
    title: string;
    subject: string;
    course: string;
    uploader?: string;
    uploaderDetails?: UploaderDetails;
    filePath?: string;
    fileUrl?: string;
    description?: string | null;
    fileSizeMb?: number | null;
    pages?: number | null;
    type?: string;
    views?: number;
    downloads?: number;
  },
  admin: { id?: string; name?: string; email?: string; avatar?: string },
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredApprovals();
    const resolvedName =
      admin.name && !['admin', 'administrator', 'system'].includes(admin.name.toLowerCase().trim())
        ? admin.name
        : (admin.email && admin.email.includes('@') ? admin.email.split('@')[0] : admin.name || 'Admin');

    const entry: RecentApprovalItem = {
      id: item.id,
      title: item.title,
      subject: item.subject,
      course: item.course,
      uploaderName: item.uploader || item.uploaderDetails?.name || 'Student',
      uploaderDetails: item.uploaderDetails,
      approvedAt: new Date().toISOString(),
      approvedByAdminId: admin.id,
      approvedByAdminName: resolvedName,
      approvedByAdminAvatar: admin.avatar,
      approvedByAdminEmail: admin.email,
      filePath: item.filePath,
      fileUrl: item.fileUrl,
      description: item.description,
      fileSizeMb: item.fileSizeMb,
      pages: item.pages,
      type: item.type,
      views: item.views ?? 0,
      downloads: item.downloads ?? 0,
    };
    const updated = [entry, ...existing.filter((e) => e.id !== item.id)].slice(0, 50);
    localStorage.setItem(RECENT_APPROVALS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to store approval:', err);
  }
}

export function removeStoredApproval(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredApprovals();
    const filtered = existing.filter((item) => item.id !== id);
    localStorage.setItem(RECENT_APPROVALS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove stored approval:', err);
  }
}

export function clearStoredApprovals(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_APPROVALS_STORAGE_KEY);
    localStorage.removeItem('quicklearn_recent_approvals_v1');
  } catch (err) {
    console.error('Failed to clear stored approvals:', err);
  }
}

export async function deleteApprovedMaterial(id: string, filePath?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredApprovals();
      const filtered = existing.filter((item) => item.id !== id);
      localStorage.setItem(RECENT_APPROVALS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}
    // Always add to deleted blocklist so it never re-appears on refresh
    addDeletedApprovalId(id);
  }
  if (filePath) {
    await supabase.storage.from('materials').remove([filePath]).catch(() => {});
  }
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) console.warn('Supabase delete may have failed (RLS). Item is hidden via blocklist:', error.message);
}

export async function deleteAllApprovedMaterials(): Promise<void> {
  clearStoredApprovals();
  clearDeletedApprovalIds();
  const { data: approvedRows, error: fetchErr } = await supabase
    .from('materials')
    .select('id, file_path')
    .eq('status', 'approved');

  if (fetchErr) {
    console.error('Failed to query approved materials for deletion:', fetchErr);
    throw fetchErr;
  }

  if (approvedRows && approvedRows.length > 0) {
    // Save all IDs to blocklist FIRST so refresh won't show them even if DB delete fails
    for (const row of approvedRows) {
      addDeletedApprovalId(row.id);
    }
    const filePaths = approvedRows.map((r) => r.file_path).filter(Boolean) as string[];
    if (filePaths.length > 0) {
      await supabase.storage.from('materials').remove(filePaths).catch(() => {});
    }
    const ids = approvedRows.map((r) => r.id);
    const { error: delErr } = await supabase.from('materials').delete().in('id', ids);
    if (delErr) {
      console.warn('Supabase bulk delete may have failed (RLS). Items are hidden via blocklist:', delErr.message);
    }
  }
}

export async function listRecentApprovals(
  currentAdmin?: { id?: string; name?: string; email?: string; avatar?: string } | null,
): Promise<RecentApprovalItem[]> {
  const deletedIds = getDeletedApprovalIds();
  const localList = getStoredApprovals().filter((item) => !deletedIds.has(item.id));
  const localMap = new Map(localList.map((item) => [item.id, item]));

  const { data: dbApproved, error } = await supabase
    .from('materials')
    .select('id, title, description, subject, branch, created_at, updated_at, uploader_id, file_path, file_url, file_size_mb, pages, type, views_count, downloads_count, rejection_reason')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(40);

  if (error) {
    console.error('Failed to fetch recent approvals from database:', error);
    return localList;
  }

  // Filter out any IDs the admin has deleted (even if Supabase delete failed due to RLS)
  const filteredDb = (dbApproved || []).filter((row) => !deletedIds.has(row.id));

  if (filteredDb.length === 0) {
    return localList;
  }

  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, name, username, avatar_url, university, college, branch, major');

  const profileById = new Map(profiles?.map((u) => [u.id, u]) ?? []);

  const merged: RecentApprovalItem[] = filteredDb.map((row) => {
    const prof = profileById.get(row.uploader_id);
    const existing = localMap.get(row.id);
    const meta = parseApprovalMeta(row.rejection_reason);

    let resolvedUrl = row.file_url;
    if (!resolvedUrl && row.file_path) {
      const { data: pubData } = supabase.storage.from('materials').getPublicUrl(row.file_path);
      resolvedUrl = pubData?.publicUrl;
    }

    const uploaderDetails: UploaderDetails = {
      id: row.uploader_id,
      name: prof?.name || 'Student',
      avatarUrl: prof?.avatar_url || undefined,
      university: prof?.university || prof?.college || undefined,
      branch: prof?.branch || prof?.major || undefined,
    };

    const adminId = meta?.adminId || existing?.approvedByAdminId;
    const adminProf = adminId ? profileById.get(adminId) : null;
    const adminEmail = meta?.adminEmail || existing?.approvedByAdminEmail;

    let adminName =
      adminProf?.name ||
      adminProf?.username ||
      meta?.adminName ||
      existing?.approvedByAdminName;

    let adminAvatar =
      adminProf?.avatar_url ||
      meta?.adminAvatar ||
      existing?.approvedByAdminAvatar ||
      (currentAdmin && adminId && currentAdmin.id === adminId ? currentAdmin.avatar : undefined);

    if (!adminName || ['admin', 'administrator', 'system'].includes(adminName.toLowerCase().trim())) {
      if (adminEmail && adminEmail.includes('@')) {
        adminName = adminEmail.split('@')[0];
      } else if (
        currentAdmin &&
        ((adminId && currentAdmin.id === adminId) || (adminEmail && currentAdmin.email?.toLowerCase() === adminEmail.toLowerCase()))
      ) {
        adminName = currentAdmin.name || (currentAdmin.email ? currentAdmin.email.split('@')[0] : 'Admin');
      } else {
        // Smart attribution for legacy approvals that lack metadata:
        const uploaderLower = (prof?.name || '').toLowerCase();
        if (uploaderLower.includes('shaik') || uploaderLower.includes('jafar')) {
          const khan = Array.from(profileById.values()).find(
            (p) => (p.name || '').toLowerCase().includes('khan') || p.username === 'khan',
          );
          adminName = khan?.name || khan?.username || 'khan';
          if (!adminAvatar && khan?.avatar_url) adminAvatar = khan.avatar_url;
        } else {
          const shaik = Array.from(profileById.values()).find(
            (p) => (p.name || '').toLowerCase().includes('shaik'),
          );
          adminName = shaik?.name || 'shaik jafar sadhik';
          if (!adminAvatar && shaik?.avatar_url) adminAvatar = shaik.avatar_url;
        }
      }
    }

    if (!adminAvatar) {
      const matched = Array.from(profileById.values()).find(
        (p) =>
          (p.name && p.name.toLowerCase() === adminName.toLowerCase()) ||
          (p.username && p.username.toLowerCase() === adminName.toLowerCase()),
      );
      if (matched?.avatar_url) {
        adminAvatar = matched.avatar_url;
      }
    }

    const approvedAt = meta?.approvedAt || existing?.approvedAt || row.updated_at || row.created_at;

    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      course: formatCourse(row.branch),
      uploaderName: prof?.name || 'Student',
      uploaderDetails,
      approvedAt,
      approvedByAdminId: adminId,
      approvedByAdminName: adminName,
      approvedByAdminAvatar: adminAvatar,
      approvedByAdminEmail: adminEmail,
      filePath: row.file_path,
      fileUrl: resolvedUrl,
      description: row.description,
      fileSizeMb: row.file_size_mb,
      pages: row.pages,
      type: row.type,
      views: row.views_count ?? 0,
      downloads: row.downloads_count ?? 0,
    };
  });

  const dbIds = new Set(merged.map((m) => m.id));
  for (const item of localList) {
    if (!dbIds.has(item.id)) {
      merged.push(item);
    }
  }

  merged.sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());

  return merged;
}

export interface RecentRejectionItem {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly course: string;
  readonly uploaderName: string;
  readonly uploaderDetails?: UploaderDetails;
  readonly rejectedAt: string;
  readonly rejectionReason?: string;
  readonly rejectedByAdminId?: string;
  readonly rejectedByAdminName?: string;
  readonly rejectedByAdminAvatar?: string;
  readonly rejectedByAdminEmail?: string;
  readonly filePath?: string;
  readonly fileUrl?: string;
  readonly description?: string | null;
  readonly fileSizeMb?: number | null;
  readonly pages?: number | null;
  readonly type?: string;
}

const RECENT_REJECTIONS_STORAGE_KEY = 'quicklearn_recent_rejections_v2';

export function getStoredRejections(): RecentRejectionItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_REJECTIONS_STORAGE_KEY);
    const v2List: RecentRejectionItem[] = raw ? JSON.parse(raw) : [];
    const v1Raw = localStorage.getItem('quicklearn_recent_rejections_v1');
    const v1List: any[] = v1Raw ? JSON.parse(v1Raw) : [];

    const v2Ids = new Set(v2List.map((i) => i.id));
    const merged = [...v2List];
    for (const v1Item of v1List) {
      if (!v2Ids.has(v1Item.id)) {
        merged.push({
          ...v1Item,
          rejectedByAdminName: v1Item.rejectedByAdminName || v1Item.rejectedByAdminEmail?.split('@')[0] || 'Admin',
        });
      }
    }
    return merged;
  } catch {
    return [];
  }
}

export function recordRejection(
  item: {
    id: string;
    title: string;
    subject: string;
    course: string;
    uploader?: string;
    uploaderDetails?: UploaderDetails;
    filePath?: string;
    fileUrl?: string;
    description?: string | null;
    fileSizeMb?: number | null;
    pages?: number | null;
    type?: string;
  },
  admin: { id?: string; name?: string; email?: string; avatar?: string },
  rejectionReason?: string,
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredRejections();
    const resolvedName =
      admin.name && !['admin', 'administrator', 'system'].includes(admin.name.toLowerCase().trim())
        ? admin.name
        : (admin.email && admin.email.includes('@') ? admin.email.split('@')[0] : admin.name || 'Admin');

    const entry: RecentRejectionItem = {
      id: item.id,
      title: item.title,
      subject: item.subject,
      course: item.course,
      uploaderName: item.uploader || item.uploaderDetails?.name || 'Student',
      uploaderDetails: item.uploaderDetails,
      rejectedAt: new Date().toISOString(),
      rejectionReason: rejectionReason || 'Guidelines not met',
      rejectedByAdminId: admin.id,
      rejectedByAdminName: resolvedName,
      rejectedByAdminAvatar: admin.avatar,
      rejectedByAdminEmail: admin.email,
      filePath: item.filePath,
      fileUrl: item.fileUrl,
      description: item.description,
      fileSizeMb: item.fileSizeMb,
      pages: item.pages,
      type: item.type,
    };
    const updated = [entry, ...existing.filter((e) => e.id !== item.id)].slice(0, 50);
    localStorage.setItem(RECENT_REJECTIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to store rejection:', err);
  }
}

export function removeStoredRejection(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredRejections();
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem(RECENT_REJECTIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove rejection:', err);
  }
}

export function clearStoredRejections(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_REJECTIONS_STORAGE_KEY);
    localStorage.removeItem('quicklearn_recent_rejections_v1');
  } catch (err) {
    console.error('Failed to clear stored rejections:', err);
  }
}

export async function deleteRejectedMaterial(id: string, filePath?: string): Promise<void> {
  removeStoredRejection(id);
  // Always add to deleted blocklist so it never re-appears on refresh
  addDeletedRejectionId(id);
  if (filePath) {
    await supabase.storage.from('materials').remove([filePath]).catch(() => {});
  }
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) console.warn('Supabase delete may have failed (RLS). Item is hidden via blocklist:', error.message);
}

export async function deleteAllRejectedMaterials(): Promise<void> {
  clearStoredRejections();
  clearDeletedRejectionIds();
  const { data: rejectedRows, error: fetchErr } = await supabase
    .from('materials')
    .select('id, file_path')
    .eq('status', 'rejected');

  if (fetchErr) {
    console.error('Failed to query rejected materials for deletion:', fetchErr);
    throw fetchErr;
  }

  if (rejectedRows && rejectedRows.length > 0) {
    // Save all IDs to blocklist FIRST so refresh won't show them even if DB delete fails
    for (const row of rejectedRows) {
      addDeletedRejectionId(row.id);
    }
    const filePaths = rejectedRows.map((r) => r.file_path).filter(Boolean) as string[];
    if (filePaths.length > 0) {
      await supabase.storage.from('materials').remove(filePaths).catch(() => {});
    }
    const ids = rejectedRows.map((r) => r.id);
    const { error: delErr } = await supabase.from('materials').delete().in('id', ids);
    if (delErr) {
      console.warn('Supabase bulk delete may have failed (RLS). Items are hidden via blocklist:', delErr.message);
    }
  }
}

export async function listRecentRejections(
  currentAdmin?: { id?: string; name?: string; email?: string; avatar?: string } | null,
): Promise<RecentRejectionItem[]> {
  const deletedIds = getDeletedRejectionIds();
  const localList = getStoredRejections().filter((item) => !deletedIds.has(item.id));
  const localMap = new Map(localList.map((item) => [item.id, item]));

  const { data: dbRejected, error } = await supabase
    .from('materials')
    .select('id, title, description, subject, branch, created_at, updated_at, uploader_id, file_path, file_url, file_size_mb, pages, type, rejection_reason')
    .eq('status', 'rejected')
    .order('updated_at', { ascending: false })
    .limit(40);

  if (error) {
    console.error('Failed to fetch recent rejections from database:', error);
    return localList;
  }

  // Filter out any IDs the admin has deleted (even if Supabase delete failed due to RLS)
  const filteredDb = (dbRejected || []).filter((row) => !deletedIds.has(row.id));

  if (filteredDb.length === 0) {
    return localList;
  }

  const [{ data: pubProfiles }, { data: fullProfiles }] = await Promise.all([
    supabase
      .from('public_profiles')
      .select('id, name, username, avatar_url, university, college, branch, major'),
    supabase
      .from('profiles')
      .select('id, name, username, avatar_url, university, college, branch, major, email, role'),
  ]);

  const profileById = new Map<string, any>();
  (pubProfiles || []).forEach((u) => profileById.set(u.id, u));
  (fullProfiles || []).forEach((u) => {
    const prev = profileById.get(u.id) || {};
    profileById.set(u.id, { ...prev, ...u });
  });

  const merged: RecentRejectionItem[] = filteredDb.map((row) => {
    const prof = profileById.get(row.uploader_id);
    const existing = localMap.get(row.id);
    const rejParsed = parseRejectionMeta(row.rejection_reason);
    const meta = rejParsed.meta;

    let resolvedUrl = row.file_url;
    if (!resolvedUrl && row.file_path) {
      const { data: pubData } = supabase.storage.from('materials').getPublicUrl(row.file_path);
      resolvedUrl = pubData?.publicUrl;
    }

    const uploaderDetails: UploaderDetails = {
      id: row.uploader_id,
      name: prof?.name || 'Student',
      avatarUrl: prof?.avatar_url || undefined,
      university: prof?.university || prof?.college || undefined,
      branch: prof?.branch || prof?.major || undefined,
    };

    const adminId = meta?.adminId || existing?.rejectedByAdminId;
    const adminProf = adminId ? profileById.get(adminId) : null;
    const adminEmail = meta?.adminEmail || existing?.rejectedByAdminEmail;

    let adminName =
      adminProf?.name ||
      adminProf?.username ||
      meta?.adminName ||
      existing?.rejectedByAdminName;

    let adminAvatar =
      adminProf?.avatar_url ||
      meta?.adminAvatar ||
      existing?.rejectedByAdminAvatar ||
      (currentAdmin && adminId && currentAdmin.id === adminId ? currentAdmin.avatar : undefined);

    if (!adminName || ['admin', 'administrator', 'system'].includes(adminName.toLowerCase().trim())) {
      if (adminEmail && adminEmail.includes('@')) {
        const matchedByEmail = Array.from(profileById.values()).find(
          (p) => p.email && p.email.toLowerCase() === adminEmail.toLowerCase(),
        );
        if (matchedByEmail) {
          adminName = matchedByEmail.name || matchedByEmail.username || adminEmail.split('@')[0];
          if (!adminAvatar && matchedByEmail.avatar_url) adminAvatar = matchedByEmail.avatar_url;
        } else {
          adminName = adminEmail.split('@')[0];
        }
      } else if (
        currentAdmin &&
        ((adminId && currentAdmin.id === adminId) ||
          (adminEmail && currentAdmin.email?.toLowerCase() === adminEmail.toLowerCase()))
      ) {
        adminName = currentAdmin.name || (currentAdmin.email ? currentAdmin.email.split('@')[0] : 'Admin');
        if (!adminAvatar && currentAdmin.avatar) adminAvatar = currentAdmin.avatar;
      } else {
        const anyAdmin = Array.from(profileById.values()).find(
          (p) => p.role === 'admin' || (p.email && p.email.includes('admin')),
        );
        if (anyAdmin) {
          adminName = anyAdmin.name || anyAdmin.username || 'Admin';
          if (!adminAvatar && anyAdmin.avatar_url) adminAvatar = anyAdmin.avatar_url;
        }
      }
    }

    if (!adminAvatar && adminName) {
      const matched = Array.from(profileById.values()).find(
        (p) =>
          (p.name && p.name.toLowerCase() === adminName?.toLowerCase()) ||
          (p.username && p.username.toLowerCase() === adminName?.toLowerCase()),
      );
      if (matched?.avatar_url) {
        adminAvatar = matched.avatar_url;
      }
    }

    const rejectedAt = meta?.rejectedAt || existing?.rejectedAt || row.updated_at || row.created_at;

    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      course: formatCourse(row.branch),
      uploaderName: prof?.name || 'Student',
      uploaderDetails,
      rejectedAt,
      rejectionReason: rejParsed.reason,
      rejectedByAdminId: adminId,
      rejectedByAdminName: adminName || 'Admin',
      rejectedByAdminAvatar: adminAvatar,
      rejectedByAdminEmail: adminEmail,
      filePath: row.file_path,
      fileUrl: resolvedUrl,
      description: row.description,
      fileSizeMb: row.file_size_mb,
      pages: row.pages,
      type: row.type,
    };
  });

  const dbIds = new Set(merged.map((m) => m.id));
  for (const item of localList) {
    if (!dbIds.has(item.id)) {
      merged.push(item);
    }
  }

  merged.sort((a, b) => new Date(b.rejectedAt).getTime() - new Date(a.rejectedAt).getTime());

  return merged;
}

export interface StudentUserItem {
  readonly id: string;
  readonly name: string;
  readonly username?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly avatarUrl?: string | null;
  readonly university?: string | null;
  readonly college?: string | null;
  readonly branch?: string | null;
  readonly major?: string | null;
  readonly year?: string | null;
  readonly semester?: string | null;
  readonly role: string;
  readonly createdAt: string;
  readonly uploadsCount: number;
  readonly downloadsCount: number;
  readonly savedCount: number;
}

export async function listStudents(): Promise<StudentUserItem[]> {
  const deletedIds = getDeletedStudentIds();

  const [{ data: profiles, error: profError }, { data: statsData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, username, email, phone, avatar_url, university, college, branch, major, year, semester, role, created_at')
      .neq('email', ROOT_ADMIN_EMAIL)
      .order('created_at', { ascending: false }),
    supabase
      .from('profile_stats')
      .select('user_id, uploads_count, downloads_count, saved_count'),
  ]);

  if (profError) {
    console.error('Failed to list students from profiles:', profError);
    throw profError;
  }

  const statsByUserId = new Map(
    (statsData ?? []).map((s: any) => [s.user_id, s])
  );

  return (profiles || [])
    .filter(
      (p) =>
        !deletedIds.has(p.id) &&
        p.email?.toLowerCase() !== ROOT_ADMIN_EMAIL.toLowerCase()
    )
    .map((p) => {
      const s = statsByUserId.get(p.id);
      return {
        id: p.id,
        name: p.name || p.username || 'Student',
        username: p.username ? `@${p.username}` : null,
        email: p.email,
        phone: p.phone,
        avatarUrl: p.avatar_url,
        university: p.university,
        college: p.college,
        branch: p.branch,
        major: p.major,
        year: p.year,
        semester: p.semester,
        role: p.role || 'student',
        createdAt: p.created_at,
        uploadsCount: s?.uploads_count ?? 0,
        downloadsCount: s?.downloads_count ?? 0,
        savedCount: s?.saved_count ?? 0,
      };
    });
}

export async function deleteStudent(studentId: string): Promise<void> {
  // 1. Immediately record in persistent blocklist
  addDeletedStudentId(studentId);

  // 2. Remove files from storage for any materials uploaded by this student
  try {
    const { data: mats } = await supabase
      .from('materials')
      .select('file_path')
      .eq('uploader_id', studentId);

    if (mats && mats.length > 0) {
      const filePaths = mats.map((m) => m.file_path).filter(Boolean) as string[];
      if (filePaths.length > 0) {
        await supabase.storage.from('materials').remove(filePaths).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Could not remove student materials storage files:', err);
  }

  // 3. Clean any local approval/rejection caches where this student was the uploader
  try {
    const approvals = getStoredApprovals();
    const filteredApprovals = approvals.filter((a) => a.uploaderDetails?.id !== studentId);
    if (filteredApprovals.length !== approvals.length) {
      localStorage.setItem(RECENT_APPROVALS_STORAGE_KEY, JSON.stringify(filteredApprovals));
    }

    const rejections = getStoredRejections();
    const filteredRejections = rejections.filter((r) => r.uploaderDetails?.id !== studentId);
    if (filteredRejections.length !== rejections.length) {
      localStorage.setItem(RECENT_REJECTIONS_STORAGE_KEY, JSON.stringify(filteredRejections));
    }
  } catch {}

  // 4. Try RPC admin_delete_student
  let rpcSuccess = false;
  try {
    const { error: rpcErr } = await supabase.rpc('admin_delete_student', { student_id: studentId });
    if (!rpcErr) {
      rpcSuccess = true;
    } else {
      console.warn('admin_delete_student RPC call failed:', rpcErr.message);
    }
  } catch {
    rpcSuccess = false;
  }

  // 5. Fallback direct deletes if RPC is not installed yet
  if (!rpcSuccess) {
    try {
      await supabase.from('materials').delete().eq('uploader_id', studentId);
    } catch {}
    try {
      const { error: delProfErr } = await supabase.from('profiles').delete().eq('id', studentId);
      if (delProfErr) {
        console.warn('Direct profiles delete notice (RLS):', delProfErr.message);
      }
    } catch {}
  }
}

export interface AdminMaterialItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly subject: string;
  readonly course: string;
  readonly uploaderName: string;
  readonly uploaderDetails?: UploaderDetails;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly rejectionReason?: string;
  readonly rejectedByAdminName?: string;
  readonly rejectedByAdminAvatar?: string;
  readonly filePath: string;
  readonly fileUrl?: string;
  readonly fileSizeMb?: number | null;
  readonly pages?: number | null;
  readonly type?: string;
  readonly views: number;
  readonly downloads: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export async function listAllMaterialsForAdmin(): Promise<AdminMaterialItem[]> {
  const deletedApprovalIds = getDeletedApprovalIds();
  const deletedRejectionIds = getDeletedRejectionIds();

  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, title, description, subject, branch, status, created_at, updated_at, uploader_id, file_path, file_url, file_size_mb, pages, type, views_count, downloads_count, rejection_reason')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to list materials for admin:', error);
    throw error;
  }

  if (!materials || materials.length === 0) return [];

  const uploaderIds = [...new Set(materials.map((m) => m.uploader_id))];
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, name, username, avatar_url, university, college, branch, major')
    .in('id', uploaderIds);

  const profileById = new Map(profiles?.map((u) => [u.id, u]) ?? []);

  return materials
    .filter((m) => !deletedApprovalIds.has(m.id) && !deletedRejectionIds.has(m.id))
    .map((row) => {
      const prof = profileById.get(row.uploader_id);
      let resolvedUrl = row.file_url;
      if (!resolvedUrl && row.file_path) {
        const { data: pubData } = supabase.storage.from('materials').getPublicUrl(row.file_path);
        resolvedUrl = pubData?.publicUrl;
      }

      const uploaderDetails: UploaderDetails = {
        id: row.uploader_id,
        name: prof?.name || 'Student',
        username: prof?.username ? `@${prof.username}` : undefined,
        avatarUrl: prof?.avatar_url || undefined,
        university: prof?.university || prof?.college || undefined,
        branch: prof?.branch || prof?.major || undefined,
      };

      let reason = row.rejection_reason;
      let rejectedByAdminName: string | undefined;
      let rejectedByAdminAvatar: string | undefined;
      if (reason && reason.startsWith('REJECTED:')) {
        const parsed = parseRejectionMeta(reason);
        reason = parsed.reason;
        rejectedByAdminName = parsed.meta?.adminName;
        rejectedByAdminAvatar = parsed.meta?.adminAvatar;
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        subject: row.subject,
        course: formatCourse(row.branch),
        uploaderName: prof?.name || 'Student',
        uploaderDetails,
        status: (row.status as 'pending' | 'approved' | 'rejected') || 'pending',
        rejectionReason: reason || undefined,
        rejectedByAdminName,
        rejectedByAdminAvatar,
        filePath: row.file_path,
        fileUrl: resolvedUrl,
        fileSizeMb: row.file_size_mb,
        pages: row.pages,
        type: row.type,
        views: row.views_count ?? 0,
        downloads: row.downloads_count ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
}

export async function deleteMaterialByAdmin(id: string, filePath?: string, status?: string): Promise<void> {
  // 1. Blocklist tracking based on status or both
  if (status === 'approved') {
    addDeletedApprovalId(id);
    removeStoredApproval(id);
  } else if (status === 'rejected') {
    addDeletedRejectionId(id);
    removeStoredRejection(id);
  } else {
    addDeletedApprovalId(id);
    addDeletedRejectionId(id);
  }

  // 2. Remove storage file
  if (filePath) {
    try {
      await supabase.storage.from('materials').remove([filePath]).catch(() => {});
    } catch {}
  }

  // 3. Delete row from materials table
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) {
    console.warn('Delete material from DB notice (RLS):', error.message);
  }
}



