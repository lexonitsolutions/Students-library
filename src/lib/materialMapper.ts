import type { Material } from '../data/types';
import type { MaterialRow, PublicProfileRow } from '../types/database.types';
import { parseRejectionMeta } from '../services/adminService';

const ACCENT_COLORS = ['indigo', 'blue', 'amber', 'rose', 'emerald'] as const;

function accentColorFor(id: string): Material['accentColor'] {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}

export function cleanDocumentTitle(rawTitle?: string | null): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*\(\s*(?:part\s*)?\d+\s*\/\s*\d+[^)]*\)/gi, '')
    .replace(/^\s*\(\s*(?:part\s*)?\d+\s*\/\s*\d+[^)]*\)\s*/gi, '')
    .trim();
}

export function toMaterial(row: MaterialRow, uploader: PublicProfileRow | undefined, isSaved = false, isLiked = false): Material {
  let finalUploaderName = uploader?.name;
  let finalAvatar = uploader?.avatar_url;
  let finalUniversity = uploader?.university ?? row.university;
  let finalCollege = uploader?.college ?? row.college;
  let finalLocation = uploader?.branch ? `${uploader.branch}, ${uploader.university ?? ''}` : row.university;
  let finalUploadsCount = 3;

  if (!uploader) {
    try {
      const raw = localStorage.getItem('quicklearnit.demo_user');
      if (raw) {
        const demoUser = JSON.parse(raw);
        if (demoUser.id === row.uploader_id || !row.uploader_id) {
          finalUploaderName = demoUser.name;
          finalAvatar = demoUser.avatar || demoUser.coverImage;
          finalUniversity = demoUser.university;
          finalCollege = demoUser.college;
          finalLocation = demoUser.location || (demoUser.university ? `${demoUser.university} Campus` : null);
          finalUploadsCount = demoUser.stats?.uploads || 3;
        }
      }
    } catch {
      // ignore
    }
  }

  let rejectionReason: string | undefined = undefined;
  let rejectedByAdminName: string | undefined = undefined;
  let rejectedByAdminAvatar: string | undefined = undefined;
  let rejectedAt: string | undefined = undefined;

  if (row.rejection_reason) {
    const rejParsed = parseRejectionMeta(row.rejection_reason);
    rejectionReason = rejParsed.reason || row.rejection_reason;
    rejectedByAdminName = rejParsed.meta?.adminName;
    rejectedByAdminAvatar = rejParsed.meta?.adminAvatar;
    rejectedAt = rejParsed.meta?.rejectedAt;
  }

  return {
    id: row.id,
    title: cleanDocumentTitle(row.title),
    description: row.description ?? '',
    subject: row.subject,
    semester: row.semester ?? '',
    type: row.type,
    uploaderId: row.uploader_id,
    uploaderName: finalUploaderName || 'Anonymous Student',
    uploaderUsername: uploader?.username,
    uploaderAvatar: finalAvatar || `https://i.pravatar.cc/80?u=${row.uploader_id}`,
    uploaderUniversity: finalUniversity || undefined,
    uploaderCollege: finalCollege || undefined,
    uploaderLocation: finalLocation || undefined,
    uploaderUploadsCount: finalUploadsCount,
    uploaderJoinedAt: uploader?.joined_at,
    uploadedAt: row.created_at,
    views: row.views_count,
    downloads: row.downloads_count,
    saves: row.saves_count,
    likes: row.saves_count ?? 0,
    shares: row.shares_count ?? 0,
    status: row.status,
    accentColor: accentColorFor(row.id),
    fileUrl: row.file_url,
    filePath: row.file_path,
    pages: row.pages ?? undefined,
    fileSizeMb: row.file_size_mb ?? undefined,
    isSaved,
    isLiked,
    rejectionReason: rejectionReason ?? (row.rejection_reason || undefined),
    rejectedByAdminName,
    rejectedByAdminAvatar,
    rejectedAt,
  };
}
