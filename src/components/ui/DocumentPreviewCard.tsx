import { Bookmark, Eye, Heart, Share2, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Material } from '../../data/types';
import { cn } from '../../lib/cn';
import { cleanDocumentTitle } from '../../lib/materialMapper';
import { Avatar } from './Avatar';
import { getLocalLikesCount, getLocalSharesCount, getLocalDownloadsCount } from '../../services/likesService';
import { useAuth } from '../../hooks/useAuth';
import { useSignupRedirect } from '../../hooks/useSignupRedirect';

export interface DocumentPreviewCardProps {
  readonly material: Material;
  readonly onToggleSave?: (id: string) => void;
  readonly onUploaderClick?: (profile: import('./UserProfilePanel').UploaderProfile) => void;
  readonly className?: string;
}

export function DocumentPreviewCard({ material, onToggleSave, onUploaderClick, className }: Readonly<DocumentPreviewCardProps>) {
  const navigate = useNavigate();
  const { isExploring } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const [likesCount, setLikesCount] = useState(material.likes ?? 0);
  const [sharesCount, setSharesCount] = useState(material.shares ?? 0);
  const [downloadsCount, setDownloadsCount] = useState(material.downloads ?? 0);
  const [lazyPages, setLazyPages] = useState<number | undefined>(material.pages);

  const handleDocumentClick = (e: React.MouseEvent) => {
    if (isExploring) {
      e.preventDefault();
      e.stopPropagation();
      openSignupModal(`/materials/${material.id}`);
    }
  };

  useEffect(() => {
    setLikesCount(getLocalLikesCount(material.id, material.likes ?? 0));
    setSharesCount(getLocalSharesCount(material.id, material.shares ?? 0));
    setDownloadsCount(getLocalDownloadsCount(material.id, material.downloads ?? 0));
  }, [material.id, material.downloads, material.likes, material.shares]);

  useEffect(() => {
    if (!material.pages && material.fileUrl) {
      let isMounted = true;
      const target = material.filePath || material.fileUrl || '';
      const extMatch = target.match(/\.([a-z0-9]+)($|\?)/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : '';
      
      if (['pdf', 'docx', 'pptx'].includes(ext)) {
        import('../../lib/documentParser').then(({ getUrlPageCount }) => {
          getUrlPageCount(material.fileUrl, ext).then((count) => {
            if (isMounted && count) {
              setLazyPages(count);
              // Optimistically update DB without awaiting
              import('../../services/materialsService').then(({ updateMaterialDetails }) => {
                updateMaterialDetails(material.id, { pages: count } as any).catch(() => {});
              });
            }
          });
        });
      }
      return () => { isMounted = false; };
    } else {
      setLazyPages(material.pages);
    }
  }, [material.id, material.pages, material.fileUrl, material.filePath]);

  const sizeMbStr = material.fileSizeMb ? material.fileSizeMb.toString() : material.fileSizeMb === 0 ? '<0.01' : '?';
  const isSaved = !!material.isSaved;

  const target = material.filePath || material.fileUrl || '';
  const extMatch = target.match(/\.([a-z0-9]+)($|\?)/i);
  const realExt = extMatch ? extMatch[1].toUpperCase() : '';

  const fallbackCategoryLabel =
    material.type === 'past-paper'
      ? 'PAPER'
      : material.type === 'doc'
        ? 'DOC'
        : 'PDF';

  const fileTypeLabel = realExt || fallbackCategoryLabel;

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
  const isOfficeDocument = material.fileUrl && material.fileUrl.match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/i);
  const isPublicUrl = material.fileUrl?.startsWith('http') && !material.fileUrl.includes('localhost') && !material.fileUrl.includes('127.0.0.1');
  const actualImageSrc = material.previewUrl || (isImageFile ? material.fileUrl : null);

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[20px] border border-card-border bg-surface-container shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30',
        className
      )}
    >
      {/* 1. Preview Thumbnail Area (~50% top of card - Actual Document 1st Page) */}
      <Link
        to={`/materials/${material.id}`}
        onClick={handleDocumentClick}
        className="relative flex h-52 w-full flex-col items-center justify-center overflow-hidden border-b border-card-border bg-surface-container-low p-2.5 select-none cursor-pointer"
      >
        <div className="relative flex h-full w-full max-w-[98%] flex-col overflow-hidden rounded-t-lg border border-card-border bg-surface shadow-xs">
          {actualImageSrc ? (
            <img
              src={actualImageSrc}
              alt={material.title}
              className="h-full w-full object-cover object-top"
            />
          ) : isOfficeDocument && material.fileUrl && isPublicUrl ? (
            <div className="relative h-full w-full overflow-hidden">
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.fileUrl)}`}
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
                  {cleanDocumentTitle(material.title)}
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
                  <span className="truncate">{lazyPages ? `${lazyPages} pgs (${sizeMbStr} MB)` : `${sizeMbStr} MB`}</span>
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
            <Link to={`/materials/${material.id}`} onClick={handleDocumentClick}>
              <h3 className="line-clamp-2 text-body-md font-bold leading-snug text-on-surface hover:text-primary transition-colors">
                {cleanDocumentTitle(material.title)}
              </h3>
            </Link>
            <p className="mt-1 text-label-sm font-medium text-on-surface-variant">
              {lazyPages ? `${lazyPages} page${lazyPages === 1 ? '' : 's'} \u2022 ` : ''}{fileTypeLabel} &bull; {sizeMbStr} MB
            </p>
          </div>
        </div>

        {/* Stats & Uploader Avatar */}
        <div className="mt-2 flex items-center justify-between gap-1.5 text-label-sm text-on-surface-variant font-medium">
          <div className="flex items-center gap-2.5 opacity-80">
            <div className="flex items-center gap-1" title="Likes">
              <Heart size={14} className={likesCount > 0 ? 'fill-primary text-primary' : ''} />
              <span className="text-[12px] font-semibold">{likesCount > 0 ? likesCount.toLocaleString() : '0'}</span>
            </div>
            <div className="flex items-center gap-1" title="Downloads">
              <Download size={14} />
              <span className="text-[12px] font-semibold">{downloadsCount > 0 ? downloadsCount.toLocaleString() : '0'}</span>
            </div>
            <div className="flex items-center gap-1" title="Shares">
              <Share2 size={14} />
              <span className="text-[12px] font-semibold">{sharesCount > 0 ? sharesCount.toLocaleString() : '0'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUploaderClick?.({
              uploaderId: material.uploaderId,
              uploaderName: material.uploaderName,
              uploaderUsername: material.uploaderUsername,
              uploaderAvatar: material.uploaderAvatar,
              uploaderUniversity: material.uploaderUniversity,
              uploaderCollege: material.uploaderCollege,
              uploaderLocation: material.uploaderLocation,
              uploaderUploadsCount: material.uploaderUploadsCount,
              uploaderJoinedAt: material.uploaderJoinedAt,
            })}
            className="flex items-center gap-1.5 shrink-0 rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-surface-container transition-colors cursor-pointer"
            title={`View ${material.uploaderName}'s profile`}
          >
            <Avatar name={material.uploaderName} src={material.uploaderAvatar} size={18} />
            <span className="max-w-[80px] truncate text-[12px] font-semibold text-on-surface-variant hover:text-primary transition-colors">
              {material.uploaderName}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Divider Line */}
      <div className="h-px w-full bg-card-border" />

      {/* 4. Action Row (Text-based buttons side by side) */}
      <div className="grid grid-cols-2 divide-x divide-card-border/60 py-1 text-label-md font-semibold">
        <button
          type="button"
          onClick={(e) => {
            if (isExploring) {
              handleDocumentClick(e);
            } else {
              navigate(`/materials/${material.id}`);
            }
          }}
          className="flex h-10 items-center justify-center gap-1.5 text-primary hover:text-primary-container transition-colors cursor-pointer"
        >
          <Eye size={16} />
          View
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isExploring) {
              openSignupModal(`/materials/${material.id}`);
            } else {
              onToggleSave?.(material.id);
            }
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
