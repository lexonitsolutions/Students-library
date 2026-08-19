import { Bookmark, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Material } from '../../data/types';
import { cn } from '../../lib/cn';
import { Avatar } from './Avatar';

export interface DocumentPreviewCardProps {
  readonly material: Material;
  readonly onToggleSave?: (id: string) => void;
  readonly className?: string;
}

export function DocumentPreviewCard({ material, onToggleSave, className }: Readonly<DocumentPreviewCardProps>) {
  const navigate = useNavigate();

  const pagesCount = material.pages || 1;
  const sizeMb = material.fileSizeMb || 2.4;
  const isSaved = !!material.isSaved;

  const fileTypeLabel =
    material.type === 'past-paper'
      ? 'PAPER'
      : material.type === 'doc'
        ? 'DOC'
        : 'PDF';

  const badgeColor =
    material.type === 'past-paper'
      ? 'bg-amber-600'
      : material.type === 'doc'
        ? 'bg-blue-600'
        : 'bg-red-600';

  const isImageFile = material.fileUrl
    ? material.fileUrl.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) ||
      material.fileUrl.startsWith('data:image/') ||
      material.fileUrl.startsWith('blob:')
    : false;

  const isPdfFile = material.fileUrl && material.fileUrl.toLowerCase().includes('.pdf');
  const actualImageSrc = material.previewUrl || (isImageFile ? material.fileUrl : null);



  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[20px] border border-card-border bg-surface-container-high shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md',
        className
      )}
    >
      {/* 1. Preview Thumbnail Area (~50% top of card - Actual Document 1st Page) */}
      <Link
        to={`/materials/${material.id}`}
        className="relative flex h-52 w-full flex-col items-center justify-center overflow-hidden border-b border-card-border bg-slate-100 dark:bg-slate-950 p-2.5 select-none cursor-pointer"
      >
        <div className="relative flex h-full w-full max-w-[98%] flex-col overflow-hidden rounded-t-lg border border-slate-300 dark:border-slate-800 bg-white shadow-xs">
          {actualImageSrc ? (
            <img
              src={actualImageSrc}
              alt={material.title}
              className="h-full w-full object-cover object-top"
            />
          ) : isPdfFile && material.fileUrl && !material.fileUrl.includes('dummy.pdf') ? (
            <div className="relative h-full w-full overflow-hidden">
              <iframe
                src={`${material.fileUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
                title={material.title}
                scrolling="no"
                className="border-0 pointer-events-none overflow-hidden"
                style={{
                  width: 'calc(100% + 28px)',
                  height: 'calc(100% + 28px)',
                  marginRight: '-28px',
                  marginBottom: '-28px',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ) : (
            /* First Page Document Sheet with actual material content */
            <div className="flex h-full w-full flex-col bg-white p-3 font-sans text-slate-900 overflow-hidden">
              <div className="border-b border-slate-300 pb-1.5 mb-2 text-center">
                <h4 className="font-extrabold text-[12px] leading-tight text-slate-900 line-clamp-2">
                  {material.title}
                </h4>
                <p className="text-[9px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                  {material.subject} &bull; {material.semester}
                </p>
              </div>

              {/* Material Actual Description / Content Snippet */}
              {material.description && (
                <p className="line-clamp-2 text-[9.5px] text-slate-700 leading-snug mb-2 italic bg-slate-50 p-1.5 rounded border border-slate-200">
                  &ldquo;{material.description}&rdquo;
                </p>
              )}

              {/* Dynamic Content Grid for Page 1 */}
              <div className="mt-auto rounded border border-slate-300 bg-slate-50 p-1.5 text-[9px] leading-tight">
                <div className="grid grid-cols-2 gap-1 border-b border-slate-300 pb-1 font-bold text-slate-900">
                  <span>Document Field</span>
                  <span>Value</span>
                </div>
                <div className="grid grid-cols-2 gap-1 border-b border-slate-200 py-0.5 text-slate-700">
                  <span className="font-semibold text-slate-900">Subject</span>
                  <span className="truncate">{material.subject}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 border-b border-slate-200 py-0.5 text-slate-700">
                  <span className="font-semibold text-slate-900">Document Type</span>
                  <span className="truncate">{fileTypeLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 py-0.5 text-slate-700">
                  <span className="font-semibold text-slate-900">Pages & Size</span>
                  <span className="truncate">{pagesCount} pgs ({sizeMb} MB)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* 2. File Info Row & Timestamp */}
      <div className="flex flex-col p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* File-type Icon Badge */}
          <div
            className={cn(
              'flex h-11 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-white shadow-xs font-bold text-[11px] tracking-wider uppercase',
              badgeColor
            )}
          >
            <span>{fileTypeLabel}</span>
          </div>

          {/* Two-line Text Block */}
          <div className="min-w-0 flex-1">
            <Link to={`/materials/${material.id}`}>
              <h3 className="line-clamp-2 text-body-md font-bold leading-snug text-on-surface hover:text-primary transition-colors">
                {material.title}
              </h3>
            </Link>
            <p className="mt-1 text-label-sm font-medium text-on-surface-variant">
              {pagesCount} page{pagesCount === 1 ? '' : 's'} &bull; {fileTypeLabel} &bull; {sizeMb} MB
            </p>
          </div>
        </div>

        {/* Uploader Avatar & Name aligned right */}
        <div className="mt-2 flex items-center justify-end gap-1.5 text-label-sm text-on-surface-variant font-medium">
          <Avatar name={material.uploaderName} src={material.uploaderAvatar} size={18} />
          <span className="max-w-[120px] truncate text-[12px] font-semibold text-on-surface-variant">
            {material.uploaderName}
          </span>
        </div>
      </div>

      {/* 3. Divider Line */}
      <div className="h-px w-full bg-card-border" />

      {/* 4. Action Row (Text-based buttons side by side) */}
      <div className="grid grid-cols-2 divide-x divide-card-border/60 py-1 text-label-md font-semibold">
        <button
          type="button"
          onClick={() => navigate(`/materials/${material.id}`)}
          className="flex h-10 items-center justify-center gap-1.5 text-primary hover:text-primary-container transition-colors cursor-pointer"
        >
          <Eye size={16} />
          View
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(material.id);
          }}
          className={cn(
            'flex h-10 items-center justify-center gap-1.5 transition-colors cursor-pointer',
            isSaved
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
          {isSaved ? 'Saved' : 'Save as…'}
        </button>
      </div>
    </div>
  );
}

export default DocumentPreviewCard;
