import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  HardDrive,
  X,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Avatar } from '../ui/Avatar';
import { cleanDocumentTitle } from '../../lib/materialMapper';
import type { ModerationItem } from '../../services/adminService';

export interface AdminMaterialViewerModalProps {
  readonly item: ModerationItem | null;
  readonly queue?: ModerationItem[];
  readonly onClose: () => void;
  readonly onApprove?: (id: string) => void;
  readonly onReject?: (id: string) => void;
  readonly onNavigate?: (item: ModerationItem) => void;
}

export function AdminMaterialViewerModal({
  item,
  queue,
  onClose,
  onApprove,
  onReject,
  onNavigate,
}: Readonly<AdminMaterialViewerModalProps>) {
  if (!item) return null;

  const target = item.filePath || item.fileUrl || '';
  const extMatch = target.match(/\.([a-z0-9]+)($|\?)/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf';

  const isImageFile =
    ['jpeg', 'jpg', 'png', 'webp', 'gif', 'heic'].includes(ext) ||
    (item.fileUrl?.startsWith('data:image/') ?? false) ||
    (item.fileUrl?.startsWith('blob:') ?? false);

  const isOfficeDocument = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext);
  const isPublicUrl =
    item.fileUrl?.startsWith('http') &&
    !item.fileUrl.includes('localhost') &&
    !item.fileUrl.includes('127.0.0.1');

  const fileTypeLabel = (() => {
    if (ext === 'pdf') return 'PDF Document';
    if (['doc', 'docx'].includes(ext)) return 'Word Document';
    if (['ppt', 'pptx'].includes(ext)) return 'PowerPoint';
    if (['xls', 'xlsx'].includes(ext)) return 'Excel Sheet';
    if (isImageFile) return 'Image File';
    return 'Document';
  })();

  const sizeMbStr = item.fileSizeMb
    ? `${item.fileSizeMb} MB`
    : item.fileSizeMb === 0
      ? '< 0.01 MB'
      : '0.04 MB';

  const isPending = Boolean(onApprove || onReject);

  const currentIndex = queue && item ? queue.findIndex((q) => q.id === item.id) : -1;
  const hasQueueNav = Boolean(queue && queue.length > 1 && currentIndex !== -1);
  const hasPrev = hasQueueNav && currentIndex > 0;
  const hasNext = hasQueueNav && currentIndex < (queue?.length ?? 0) - 1;

  const studentOtherDocs = useMemo(() => {
    if (!queue || !item) return [];
    return queue.filter(
      (q) =>
        q.id !== item.id &&
        ((q.uploaderDetails?.id && q.uploaderDetails.id === item.uploaderDetails?.id) ||
          (q.uploader && q.uploader === item.uploader))
    );
  }, [queue, item]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {/* Backdrop click to dismiss */}
        <button
          type="button"
          aria-label="Close document viewer"
          className="absolute inset-0 bg-transparent cursor-default"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-6xl h-[90vh] max-h-[860px] flex flex-col rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 shadow-2xl shadow-slate-950/30 overflow-hidden z-10"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 px-5 py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shrink-0">
            {hasQueueNav ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Document <strong className="text-slate-900 dark:text-white">{currentIndex + 1}</strong> of{' '}
                  {queue?.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={!hasPrev}
                    onClick={() => queue && onNavigate?.(queue[currentIndex - 1])}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Previous document"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={() => queue && onNavigate?.(queue[currentIndex + 1])}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Next document"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            ) : <div />}
            <div className="flex items-center gap-2 shrink-0">
              {item.fileUrl && (
                <button
                  type="button"
                  onClick={() => window.open(item.fileUrl, '_blank')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Open original file in new tab"
                >
                  <ExternalLink size={13} strokeWidth={2} />
                  <span className="hidden sm:inline">Open File</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* 2-Column Workstation Layout */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left Column: Dedicated Document Canvas */}
            <div className="flex-1 flex flex-col bg-slate-950 dark:bg-[#080a0f] relative overflow-hidden min-h-[360px] lg:min-h-0">
              {/* Document Stage Viewport */}
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
                {isImageFile ? (
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="max-h-full max-w-full rounded-lg object-contain shadow-2xl shadow-black/70 border border-white/10 transition-all"
                    />
                  </div>
                ) : isOfficeDocument ? (
                  isPublicUrl ? (
                    <iframe
                      title={item.title}
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.fileUrl || '')}`}
                      className="h-full w-full rounded-lg border border-white/10 shadow-2xl overflow-hidden"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center text-zinc-400">
                      <FileText size={48} className="text-zinc-600" />
                      <div>
                        <h3 className="text-base font-semibold text-white">Office Preview Not Available</h3>
                        <p className="mt-1 text-xs text-zinc-400 max-w-xs mx-auto">
                          Download the file to inspect the Microsoft Office presentation or document.
                        </p>
                      </div>
                      {item.fileUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(item.fileUrl, '_blank')}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                          <Download size={14} /> Download Document
                        </button>
                      )}
                    </div>
                  )
                ) : item.fileUrl ? (
                  <iframe
                    title={item.title}
                    src={`${item.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    scrolling="no"
                    className="h-full w-full rounded-lg border border-white/10 shadow-2xl overflow-hidden bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                    <FileText size={42} strokeWidth={1.5} />
                    <p className="text-xs">No file preview available</p>
                  </div>
                )}
              </div>

              {/* Bottom Canvas Control Toolbar */}
              <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 bg-black/40 backdrop-blur-md text-xs text-zinc-400 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-zinc-200 font-medium">
                    <FileText size={14} className="text-indigo-400" />
                    {fileTypeLabel}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span>{sizeMbStr}</span>
                </div>

                <div className="flex items-center gap-3">
                  {item.fileUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(item.fileUrl, '_blank')}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Sleek Inspection Panel */}
            <div className="w-full lg:w-[380px] bg-slate-50/70 dark:bg-zinc-900/90 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between overflow-y-auto p-5 sm:p-6 space-y-6 shrink-0">
              <div className="space-y-5">
                {/* Subject & Category Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <BookOpen size={13} />
                    {item.subject}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 text-xs font-medium text-slate-600 dark:text-zinc-300">
                    <GraduationCap size={13} />
                    {item.course}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                    {cleanDocumentTitle(item.title)}
                  </h3>
                  {item.description ? (
                    <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800 text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                      {item.description}
                    </div>
                  ) : null}
                </div>

                {/* Rejected Banner if item was rejected */}
                {item.status === 'rejected' && (
                  <div className="p-3.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                    <ShieldAlert size={16} className="shrink-0 text-rose-500 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-rose-800 dark:text-rose-200">Rejected Submission</span>
                        {item.rejectedByAdminName && (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            By {item.rejectedByAdminName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 leading-relaxed">
                        Reason: {item.rejectionReason || 'Did not meet submission guidelines.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved Banner if item was approved */}
                {item.status === 'approved' && item.approvedByAdminName && (
                  <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={item.approvedByAdminAvatar} name={item.approvedByAdminName} size={22} className="shrink-0" />
                      <span className="font-medium text-emerald-900 dark:text-emerald-200 truncate">
                        Approved by <strong className="font-bold">{item.approvedByAdminName}</strong>
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  </div>
                )}

                {/* Contributor Card */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={item.uploaderDetails?.avatarUrl}
                      name={item.uploaderDetails?.name || item.uploader}
                      size={38}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.uploaderDetails?.name || item.uploader}
                        </p>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                          Student
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> Uploaded {item.date}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other Uploads by this Student in Queue */}
                {studentOtherDocs.length > 0 && (
                  <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                        Other uploads by this student ({studentOtherDocs.length})
                      </span>
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                        In queue
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {studentOtherDocs.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => onNavigate?.(doc)}
                          className="w-full text-left p-2 rounded-lg bg-white/90 dark:bg-zinc-900/80 border border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <FileText size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="text-xs text-slate-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium">
                              {cleanDocumentTitle(doc.title)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                            {doc.course}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Specifications Grid */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2.5">
                    Document Specs
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[11px] mb-1">
                        <FileText size={13} className="text-indigo-500" />
                        <span>Format</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {fileTypeLabel}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[11px] mb-1">
                        <HardDrive size={13} className="text-blue-500" />
                        <span>File Size</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {sizeMbStr}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[11px] mb-1">
                        <GraduationCap size={13} className="text-emerald-500" />
                        <span>Branch</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {item.course}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Moderation Action Controls */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-zinc-800 space-y-2.5">
                {item.status === 'rejected' ? (
                  <>
                    {onApprove && (
                      <button
                        type="button"
                        onClick={() => {
                          onApprove?.(item.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs h-10 px-4 shadow-sm transition-all cursor-pointer"
                      >
                        <Check size={16} strokeWidth={2.2} />
                        <span>Restore & Approve Material</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-medium text-xs h-10 transition-colors cursor-pointer"
                    >
                      Close Viewer
                    </button>
                  </>
                ) : isPending ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onApprove?.(item.id);
                        if (queue && queue.length > 1) {
                          const nextDoc = hasNext ? queue[currentIndex + 1] : (hasPrev ? queue[currentIndex - 1] : null);
                          if (nextDoc) {
                            onNavigate?.(nextDoc);
                          } else {
                            onClose();
                          }
                        } else {
                          onClose();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs h-10 px-4 shadow-sm transition-all cursor-pointer"
                    >
                      <Check size={16} strokeWidth={2.2} />
                      <span>Approve Material</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onReject?.(item.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-medium text-xs h-10 px-4 transition-colors cursor-pointer"
                    >
                      <ShieldAlert size={15} strokeWidth={2} />
                      <span>Reject Material</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-medium text-xs h-10 transition-colors cursor-pointer"
                  >
                    Close Viewer
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

export default AdminMaterialViewerModal;

