import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileQuestion,
  FileText,
  Flag,
  ThumbsUp,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { DocumentPreviewCard } from '../components/ui/DocumentPreviewCard';
import { PdfViewer } from '../components/ui/PdfViewer';
import { SignupPromptModal } from '../components/ui/SignupPromptModal';
import { UserProfilePanel, type UploaderProfile } from '../components/ui/UserProfilePanel';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { cleanDocumentTitle } from '../lib/materialMapper';
import { getDocumentSection } from '../services/adminService';
import * as bookmarksService from '../services/bookmarksService';
import {
  fetchUserDownloadedIds,
  fetchUserLikedIds,
  getLocalDownloadsCount,
  getLocalLikesCount,
  getLocalSharesCount,
  incrementShare,
  recordDownloadWithCount,
  toggleLike,
} from '../services/likesService';
import { getMaterialForUI, incrementViews, listApprovedMaterialsForUI, updateMaterialDetails } from '../services/materialsService';
import { reportMaterial } from '../services/reportsService';

export function MaterialDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isExploring, stopExploring } = useAuth();
  const { setRedirectPath } = useSignupRedirect();

  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [material, setMaterial] = useState<Material | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [downloadsCount, setDownloadsCount] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UploaderProfile | null>(null);
  const [relatedMaterials, setRelatedMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (isExploring) {
      setShowSignupPrompt(true);
    }
  }, [isExploring]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        const savedSet = user && !isExploring ? await bookmarksService.listBookmarkedMaterialIds(user.id) : undefined;
        const itemIsSaved = savedSet ? savedSet.has(id) : false;

        if (active) {
          setIsSaved(itemIsSaved);
        }

        const data = await getMaterialForUI(id, savedSet || (user && !isExploring ? user.id : undefined));
        if (active && data) {
          setMaterial(data);
          setIsSaved(!!data.isSaved);
          setLikesCount(getLocalLikesCount(data.id, data.likes ?? 0));
          setSharesCount(getLocalSharesCount(data.id, data.shares ?? 0));
          setDownloadsCount(getLocalDownloadsCount(data.id, data.downloads ?? 0));

          if (user && !isExploring) {
            fetchUserLikedIds(user.id).then((likedSet) => {
              if (active) setIsLiked(likedSet.has(data.id));
            });
            fetchUserDownloadedIds(user.id).catch(() => {});
          }

          // Fetch related materials from same subject
          if (data.subject) {
            listApprovedMaterialsForUI({ subjects: [data.subject], limit: 4 }, savedSet)
              .then((list) => {
                if (active) {
                  setRelatedMaterials(list.filter((m) => m.id !== data.id).slice(0, 3));
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Material load warning:', err);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, user?.id, isExploring]);

  useEffect(() => {
    if (!id || !material || isExploring) return;

    // Do not count uploader's own views
    if (user?.id && material.uploaderId === user.id) return;

    // Session cache to prevent view spam
    const sessionKey = `viewed_material_${id}`;
    if (sessionStorage.getItem(sessionKey)) return;

    sessionStorage.setItem(sessionKey, '1');
    incrementViews(id).catch(() => {});
  }, [id, material?.uploaderId, user?.id, isExploring]);

  const handlePageCountLoaded = useCallback((count: number) => {
    if (!material?.id || !count || count <= 0) return;
    if (material.pages !== count) {
      setMaterial((prev) => (prev ? { ...prev, pages: count } : prev));
      updateMaterialDetails(material.id, { pages: count }).catch(() => {});
    }
  }, [material?.id, material?.pages]);

  const toggleSave = async () => {
    if (isExploring) {
      setShowSignupPrompt(true);
      return;
    }
    if (!user || !material) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setMaterial((prev) => (prev ? { ...prev, isSaved: nextSaved } : null));

    if (nextSaved) {
      await bookmarksService.addBookmark(material.id, user.id);
    } else {
      await bookmarksService.removeBookmark(material.id, user.id);
    }
  };

  const handleDownload = async () => {
    if (isExploring) {
      setShowSignupPrompt(true);
      return;
    }
    if (!material || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(material.fileUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();

      const target = material.filePath || material.fileUrl || '';
      const extMatch = target.match(/\.([a-z0-9]+)($|\?)/i);
      const ext = extMatch ? extMatch[1] : 'pdf';
      const fileName = `${cleanDocumentTitle(material.title)}.${ext}`;

      try {
        if ('showSaveFilePicker' in window) {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        throw err;
      }

      const { newCount } = await recordDownloadWithCount(
        material.id,
        user?.id,
        downloadsCount || material.downloads || 0
      );
      setDownloadsCount(newCount);
      setMaterial((prev) => (prev ? { ...prev, downloads: newCount } : null));
    } catch (err) {
      console.warn('Download error:', err);
      alert('Failed to download the file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLike = async () => {
    if (isExploring) {
      setShowSignupPrompt(true);
      return;
    }
    if (!material || !user) {
      alert('You must be signed in to like materials.');
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      const result = await toggleLike(user.id, material.id, likesCount);
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
      setMaterial((prev) => (prev ? { ...prev, likes: result.likesCount, isLiked: result.isLiked } : null));
    } catch (err) {
      console.warn('Like toggle failed:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      if (material) {
        const { newCount } = await incrementShare(material.id, user?.id, sharesCount || material.shares || 0);
        setSharesCount(newCount);
        setMaterial((prev) => (prev ? { ...prev, shares: newCount } : null));
      }
      if (navigator.share) {
        await navigator.share({
          title: material?.title,
          text: `Check out ${material?.title} on Studexa!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.warn('Share failed:', err);
    }
  };

  const handleReport = async () => {
    if (isExploring) {
      setShowSignupPrompt(true);
      return;
    }
    if (!user || !material) return;
    const reason = window.prompt('Please enter reason for reporting this content:');
    if (!reason) return;
    try {
      await reportMaterial(material.id, reason);
      alert('Report submitted successfully.');
    } catch {
      alert('Report submitted successfully.');
    }
  };

  const handleUploaderClick = () => {
    if (!material) return;
    setSelectedProfile({
      uploaderId: material.uploaderId,
      uploaderName: material.uploaderName || 'Anonymous Student',
      uploaderUsername: material.uploaderUsername,
      uploaderAvatar: material.uploaderAvatar || '',
      uploaderUniversity: material.uploaderUniversity,
      uploaderCollege: material.uploaderCollege,
      uploaderLocation: material.uploaderLocation,
      uploaderUploadsCount: material.uploaderUploadsCount,
      uploaderJoinedAt: material.uploaderJoinedAt,
    });
  };

  if (!material) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-body-sm font-medium text-on-surface-variant">Loading document workspace...</p>
      </div>
    );
  }

  const isImageFile = material
    ? !!(material.filePath || material.fileUrl).match(/\.(jpeg|jpg|png|webp|gif|heic)($|\?)/i) ||
      material.fileUrl.startsWith('data:image/')
    : false;

  const isOfficeDocument = material ? !!(material.filePath || material.fileUrl).match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/i) : false;
  const isPublicUrl = material ? material.fileUrl.startsWith('http') && !material.fileUrl.includes('localhost') && !material.fileUrl.includes('127.0.0.1') : false;

  const targetPath = material.filePath || material.fileUrl || '';
  const extMatch = targetPath.match(/\.([a-z0-9]+)($|\?)/i);
  const fileExt = (extMatch ? extMatch[1] : 'pdf').toUpperCase();

  const section = getDocumentSection(material);
  const sectionConfig = (() => {
    if (section === 'testpapers') {
      return {
        label: 'Test Paper',
        icon: FileQuestion,
        badgeClass: 'badge-testpaper bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      };
    }
    if (section === 'assignments') {
      return {
        label: 'Assignment',
        icon: ClipboardList,
        badgeClass: 'badge-assignment bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      };
    }
    return {
      label: 'Study Material',
      icon: BookOpen,
      badgeClass: 'badge-material bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    };
  })();

  const SectionIcon = sectionConfig.icon;
  const sizeString = material.fileSizeMb ? `${material.fileSizeMb} MB` : material.fileSizeMb === 0 ? '< 0.01 MB' : 'PDF';
  const cleanTitle = cleanDocumentTitle(material.title);

  return (
    <>
      {/* ── DESKTOP FLOATING BACK BUTTON (Docked at top-left margin next to sidebar) ── */}
      <div className="hidden lg:block fixed top-20 left-[88px] z-20">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="group inline-flex items-center gap-2 rounded-xl border border-card-border bg-surface-container-low/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-primary/40 hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5 text-primary" />
          <span>Back</span>
        </button>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 pb-12 max-[1280px]:pt-8">
        {/* ── MOBILE BACK BUTTON (In-flow for small screens) ── */}
        <div className="flex items-center pt-1 lg:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="group inline-flex items-center gap-2 rounded-xl border border-card-border bg-surface-container-low px-3.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-primary/40 hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5 text-primary" />
            <span>Back</span>
          </button>
        </div>

        {/* ── 2. DOCUMENT HERO BANNER ── */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Semantic Category Badge */}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${sectionConfig.badgeClass}`}>
              <SectionIcon size={12} />
              {sectionConfig.label}
            </span>

            {/* Subject Pill */}
            <span className="inline-flex items-center rounded-md border border-card-border bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface">
              {material.subject}
            </span>

            {/* Semester */}
            {material.semester && (
              <span className="inline-flex items-center rounded-md border border-card-border bg-surface-container-high px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                {material.semester}
              </span>
            )}

            {/* Verified Badge */}
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              Verified Document
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            {cleanTitle}
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-3xl">
            {material.description?.trim() || `Course resource for ${material.subject}${material.semester ? ` (${material.semester})` : ''}. Available for online reading, reference, and offline download.`}
          </p>
        </div>

        {/* ── 3. MAIN WORKSPACE GRID (VIEWER + INSPECTOR) ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* ── LEFT: PROFESSIONAL DOCUMENT VIEWER STAGE (8 COLS) ── */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="overflow-hidden rounded-2xl border border-card-border bg-surface-container-low shadow-card">
              
              {/* Top Chrome / Toolbar */}
              <div className="flex items-center justify-between gap-3 border-b border-card-border bg-surface-container px-4 py-2.5 select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    <FileText size={15} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-bold text-on-surface tracking-wider">
                      {fileExt}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant truncate max-w-[200px] sm:max-w-[450px]">
                      {cleanTitle}
                    </span>
                  </div>
                </div>

                {/* Direct quick fullscreen reader button */}
                <button
                  type="button"
                  onClick={() => navigate(`/reader/${material.id}`)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all cursor-pointer shrink-0"
                  title="Open full screen reader"
                >
                  <BookOpen size={13} />
                  <span>Reader</span>
                </button>
              </div>

              {/* Document Canvas Stage */}
              <div className="relative flex min-h-[min(440px,55dvh)] sm:min-h-[560px] lg:min-h-[700px] w-full items-center justify-center bg-slate-100/60 dark:bg-slate-900/40 p-2 sm:p-6">
                {isImageFile ? (
                  <div className="relative flex h-[min(440px,55dvh)] sm:h-[540px] lg:h-[640px] w-full items-center justify-center overflow-auto">
                    <img
                      src={material.fileUrl}
                      alt={cleanTitle}
                      className="max-h-full max-w-full rounded-xl object-contain shadow-md border border-card-border/70"
                    />
                  </div>
                ) : isOfficeDocument ? (
                  isPublicUrl ? (
                    <div
                      className="h-[min(440px,55dvh)] sm:h-[580px] lg:h-[680px] w-full rounded-xl bg-white shadow-md border border-card-border/80 overflow-y-auto overflow-x-auto"
                      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
                    >
                      <iframe
                        title={cleanTitle}
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.fileUrl)}`}
                        className="h-full w-full border-0 min-h-full min-w-full"
                        scrolling="yes"
                        style={{ touchAction: 'pan-y' }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-[360px] sm:h-[420px] w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface p-6 text-center border border-card-border">
                      <FileText size={48} className="text-primary/60" />
                      <div>
                        <h3 className="text-base font-bold text-on-surface">Local Document Preview</h3>
                        <p className="mt-1 text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
                          This file was uploaded from a local server. Download it directly or launch reader to view in full fidelity.
                        </p>
                      </div>
                      <Button variant="primary" size="md" onClick={handleDownload} icon={<Download size={16} />}>
                        Download {fileExt} ({sizeString})
                      </Button>
                    </div>
                  )
                ) : (
                  /* High Quality Native Touch-Scrollable PDF Viewport */
                  <div className="h-[min(460px,55dvh)] sm:h-[580px] lg:h-[700px] w-full max-w-3xl rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-card-border/80 overflow-hidden">
                    <PdfViewer
                      fileUrl={material.fileUrl}
                      title={cleanTitle}
                      className="h-full w-full"
                      onPageCountLoaded={handlePageCountLoaded}
                    />
                  </div>
                )}
              </div>

              {/* Mobile Quick Helper Bar */}
              <div className="sm:hidden flex items-center justify-between px-3.5 py-2 bg-surface-container-high/40 border-t border-card-border text-[11px] text-on-surface-variant">
                <span>Swipe inside document to scroll</span>
                <button
                  type="button"
                  onClick={() => navigate(`/reader/${material.id}`)}
                  className="font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Full screen</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: UNIFIED DOCUMENT INSPECTOR & ACTIONS (4 COLS) ── */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            
            {/* Primary Action Card */}
            <div className="flex flex-col gap-4 rounded-2xl border border-card-border bg-surface-container-low p-5 shadow-card">
              
              {/* Primary Launch Reader */}
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center font-bold shadow-sm cursor-pointer"
                icon={<BookOpen size={18} />}
                onClick={() => navigate(`/reader/${material.id}`)}
              >
                {section === 'testpapers'
                  ? 'View Past Papers'
                  : section === 'assignments'
                    ? 'Solve Document'
                    : 'Open Document Reader'}
              </Button>

              {/* Secondary Direct Download */}
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-center font-semibold cursor-pointer border-card-border hover:border-primary/40"
                icon={isDownloading ? <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <Download size={16} />}
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? 'Preparing Download...' : `Download Document (${sizeString})`}
              </Button>

              {/* Social Action Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-card-border">
                {/* Like button */}
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={isLiking}
                  title={isLiked ? 'Unlike this document' : 'Like this document'}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    isLiking ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    isLiked
                      ? 'bg-primary/10 text-primary border-primary/30 font-bold'
                      : 'bg-surface hover:bg-surface-container-high border-card-border text-on-surface'
                  }`}
                >
                  <ThumbsUp size={15} className={isLiked ? 'fill-primary text-primary' : 'text-on-surface-variant'} />
                  <span>{likesCount.toLocaleString()}</span>
                </button>

                {/* Bookmark button */}
                <button
                  type="button"
                  onClick={toggleSave}
                  title={isSaved ? 'Remove from saved' : 'Save for later'}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-surface hover:bg-surface-container-high border-card-border text-on-surface'
                  }`}
                >
                  <Bookmark size={15} className={isSaved ? 'fill-current text-primary' : 'text-on-surface-variant'} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                {/* Share button */}
                <button
                  type="button"
                  onClick={handleShare}
                  title="Share document link"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-card-border bg-surface hover:bg-surface-container-high py-2.5 text-xs font-semibold text-on-surface transition-all cursor-pointer"
                >
                  <Share2 size={15} className="text-on-surface-variant" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Contributor Card */}
            <div className="flex flex-col gap-3.5 rounded-2xl border border-card-border bg-surface-container-low p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Contributor
                </span>
                <button
                  type="button"
                  onClick={handleReport}
                  title="Report this document"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant/70 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Flag size={12} />
                  <span>Report</span>
                </button>
              </div>

              <div
                onClick={handleUploaderClick}
                className="group flex items-center gap-3.5 rounded-xl border border-card-border bg-surface p-3 transition-all hover:border-primary/40 hover:bg-surface-container cursor-pointer select-none"
              >
                <Avatar
                  src={material.uploaderAvatar}
                  name={material.uploaderName || 'Student'}
                  size={46}
                  className="shrink-0 ring-2 ring-card-border group-hover:ring-primary/40 transition-all"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                      {material.uploaderName || 'Anonymous Student'}
                    </p>
                    <ShieldCheck size={14} className="text-primary shrink-0" />
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">
                    {material.uploaderCollege || material.uploaderUniversity || '-'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-on-surface-variant/80">
                    Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="shrink-0 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

            {/* Document Specifications Card (CLEANED UP - ONLY SUBJECT, TYPE, FILE SIZE) */}
            <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-surface-container-low p-5 shadow-card text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Document Details
              </span>

              <div className="divide-y divide-card-border">
                <div className="flex items-center justify-between py-2">
                  <span className="text-on-surface-variant">Subject</span>
                  <span className="font-semibold text-on-surface text-right">{material.subject}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-on-surface-variant">Document Type</span>
                  <span className="font-semibold text-on-surface text-right">{sectionConfig.label}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-on-surface-variant">File Size</span>
                  <span className="font-semibold text-on-surface text-right">{sizeString}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 4. RELATED MATERIALS RECOMMENDATION ── */}
        {relatedMaterials.length > 0 && (
          <div className="mt-12 pt-8 border-t border-card-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                  More in {material.subject}
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Explore peer-shared materials and questions for this course
                </p>
              </div>
              <Link
                to={`/?subject=${encodeURIComponent(material.subject)}`}
                className="text-xs sm:text-sm font-semibold text-primary hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1900px]:grid-cols-5 gap-5">
              {relatedMaterials.map((item) => (
                <DocumentPreviewCard
                  key={item.id}
                  material={item}
                  onUploaderClick={(prof) => setSelectedProfile(prof)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Sidebar Panel */}
      <UserProfilePanel
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />

      {/* Guest Signup Prompt */}
      <SignupPromptModal
        isOpen={showSignupPrompt}
        onClose={() => {
          setShowSignupPrompt(false);
          navigate('/dashboard');
        }}
        onSignup={() => {
          setRedirectPath(location.pathname);
          stopExploring();
          navigate('/signup');
        }}
      />
    </>
  );
}

export default MaterialDetailsPage;
