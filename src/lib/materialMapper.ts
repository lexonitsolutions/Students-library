import type { Material } from '../data/types';
import type { MaterialRow, PublicProfileRow } from '../types/database.types';

const ACCENT_COLORS = ['indigo', 'blue', 'amber', 'rose', 'emerald'] as const;

function accentColorFor(id: string): Material['accentColor'] {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}

export function toMaterial(row: MaterialRow, uploader: PublicProfileRow | undefined, isSaved = false): Material {
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

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    subject: row.subject,
    semester: row.semester ?? '',
    type: row.type,
    uploaderId: row.uploader_id,
    uploaderName: finalUploaderName || 'Anonymous Student',
    uploaderAvatar: finalAvatar || `https://i.pravatar.cc/80?u=${row.uploader_id}`,
    uploaderUniversity: finalUniversity || 'Harvard University',
    uploaderCollege: finalCollege || 'School of Academic Studies',
    uploaderLocation: finalLocation || 'Cambridge, MA',
    uploaderUploadsCount: finalUploadsCount,
    uploadedAt: row.created_at,
    views: row.views_count,
    downloads: row.downloads_count,
    saves: row.saves_count,
    status: row.status,
    accentColor: accentColorFor(row.id),
    fileUrl: row.file_url,
    filePath: row.file_path,
    pages: row.pages ?? undefined,
    fileSizeMb: row.file_size_mb ?? undefined,
    isSaved,
  };
}
