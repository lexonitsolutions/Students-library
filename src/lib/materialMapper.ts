import type { Material } from '../data/types';
import type { MaterialRow, PublicProfileRow } from '../types/database.types';

const ACCENT_COLORS = ['indigo', 'blue', 'amber', 'rose', 'emerald'] as const;

function accentColorFor(id: string): Material['accentColor'] {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}

export function toMaterial(row: MaterialRow, uploader: PublicProfileRow | undefined, isSaved = false): Material {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    subject: row.subject,
    semester: row.semester ?? '',
    type: row.type,
    uploaderId: row.uploader_id,
    uploaderName: uploader?.name ?? 'Unknown',
    uploaderAvatar: uploader?.avatar_url ?? `https://i.pravatar.cc/80?u=${row.uploader_id}`,
    uploaderUniversity: uploader?.university ?? row.university ?? 'Harvard University',
    uploaderCollege: uploader?.college ?? row.college ?? 'School of Academic Studies',
    uploaderLocation: uploader?.branch ? `${uploader.branch}, ${uploader.university ?? ''}` : row.university ?? 'Cambridge, MA',
    uploaderUploadsCount: 3,
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
