import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Eye,
  FileText,
  Flag,
  Heart,
  Share2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SignupPromptModal } from '../components/ui/SignupPromptModal';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import * as bookmarksService from '../services/bookmarksService';
import { toggleLike, getLocalLikesCount, getLocalStorageLikedIds, incrementLocalSharesCount, incrementLocalDownloadsCount } from '../services/likesService';
import { getMaterialForUI, incrementViews, recordDownload } from '../services/materialsService';
import { reportMaterial } from '../services/reportsService';
import { mockMaterials } from '../data/mockData';

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
  const [likesCount, setLikesCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lazyPages, setLazyPages] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isExploring) {
      setShowSignupPrompt(true);
    }
  }, [isExploring]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    // Instant synchronous render from mock database
    const mock = mockMaterials.find((m) => m.id === id);
    if (mock && active) {
      setMaterial(mock);
      setLazyPages(mock.pages);
    }

    (async () => {
      try {
        const savedSet = user && !isExploring ? await bookmarksService.listBookmarkedMaterialIds(user.id) : undefined;
        const itemIsSaved = savedSet ? savedSet.has(id) : false;

        if (active) {
          setIsSaved(itemIsSaved);
          if (mock) {
            setMaterial({ ...mock, isSaved: itemIsSaved });
          }
        }

        const data = await getMaterialForUI(id, savedSet || (user && !isExploring ? user.id : undefined));
        if (active && data) {
          setMaterial(data);
          setLazyPages(data.pages);
          setIsSaved(!!data.isSaved);
          setLikesCount(getLocalLikesCount(data.id));
          if (user && !isExploring) setIsLiked(getLocalStorageLikedIds(user.id).has(data.id));

          if (!data.pages && data.fileUrl) {
            const target = data.filePath || data.fileUrl || '';
            const extMatch = target.match(/\.([a-z0-9]+)($|\?)/i);
            const ext = extMatch ? extMatch[1].toLowerCase() : '';
            if (['pdf', 'docx', 'pptx'].includes(ext)) {
              import('../lib/documentParser').then(({ getUrlPageCount }) => {
                getUrlPageCount(data.fileUrl, ext).then((count) => {
                  if (active && count) {
                    setLazyPages(count);
                    import('../services/materialsService').then(({ updateMaterialDetails }) => {
                      updateMaterialDetails(data.id, { pages: count } as any).catch(() => {});
                    });
                  }
                });
              });
            }
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
    if (id && !isExploring) {
      incrementViews(id).catch(() => {});
    }
  }, [id, isExploring]);

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
      // 1. Fetch the file to memory
      const response = await fetch(material.fileUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();

      const target = material.filePath || material.fileUrl || '';
      const extMatch = target.match(/\.([a-z0-9]+)($|\?)/i);
      const ext = extMatch ? extMatch[1] : 'pdf';
      const fileName = `${material.title}.${ext}`;

      // 2. Prompt user for save location
      try {
        if ('showSaveFilePicker' in window) {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          // Fallback for Firefox/Safari
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
        if (err.name === 'AbortError') return; // User cancelled Save As dialog
        throw err;
      }

      // 3. Record download only after successful completion
      const newCount = incrementLocalDownloadsCount(material.id, material.downloads);
      setMaterial((prev) => (prev ? { ...prev, downloads: newCount } : null));
      await recordDownload(material.id).catch(() => {});
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
    try {
      const result = await toggleLike(user.id, material.id);
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
    } catch (err) {
      console.warn('Like toggle failed:', err);
    }
  };

  const handleShare = async () => {
    try {
      if (material) incrementLocalSharesCount(material.id, user?.id);
      if (navigator.share) {
        await navigator.share({
          title: material?.title,
          text: `Check out ${material?.title} on Lexon!`,
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

  const handleSignupRedirect = () => {
    setRedirectPath(location.pathname);
    stopExploring();
    navigate('/signup');
  };

  const handleCloseSignupPrompt = () => {
    setShowSignupPrompt(false);
    navigate('/dashboard');
  };

  if (!material) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-body-md text-on-surface-variant">Loading material details...</p>
      </div>
    );
  }

  const isImageFile = material
    ? !!(material.filePath || material.fileUrl).match(/\.(jpeg|jpg|png|webp|gif|heic)($|\?)/i) ||
      material.fileUrl.startsWith('data:image/')
    : false;

  const isOfficeDocument = material ? !!(material.filePath || material.fileUrl).match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/i) : false;
  const isPublicUrl = material ? material.fileUrl.startsWith('http') && !material.fileUrl.includes('localhost') && !material.fileUrl.includes('127.0.0.1') : false;

  const imageList = isImageFile && material
    ? [material.fileUrl]
    : [];

  return (
    <>
      <div className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-label-sm text-on-surface-variant">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 font-semibold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <ChevronRight size={14} />
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight size={14} />
          <span>{material.subject}</span>
          <ChevronRight size={14} />
          <span className="truncate text-on-surface font-medium">{material.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-2"
          >
            <Card padded={false} hoverable={false} className="overflow-hidden border border-card-border">
              <div className="relative min-h-[520px] sm:min-h-[600px] w-full bg-surface-container-low flex flex-col items-center justify-center group">
                {isImageFile ? (
                  <div className="relative flex h-[580px] w-full items-center justify-center p-4 overflow-hidden bg-surface-container-low">
                    <img
                      src={imageList[currentImageIndex] || material.fileUrl}
                      alt={`${material.title} page ${currentImageIndex + 1}`}
                      className="max-h-full max-w-full rounded-lg object-contain shadow-md transition-all duration-300"
                    />

                    {imageList.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-xs hover:bg-black/80 hover:scale-105 transition-all cursor-pointer z-10"
                          aria-label="Previous Page Image"
                        >
                          <ChevronLeft size={22} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-xs hover:bg-black/80 hover:scale-105 transition-all cursor-pointer z-10"
                          aria-label="Next Page Image"
                        >
                          <ChevronRight size={22} />
                        </button>

                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-label-sm font-semibold text-white backdrop-blur-xs shadow-md z-10">
                          Page {currentImageIndex + 1} of {imageList.length}
                        </span>
                      </>
                    )}
                  </div>
                ) : isOfficeDocument ? (
                  isPublicUrl ? (
                    <iframe
                      title={material.title}
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.fileUrl)}`}
                      className="h-[580px] w-full border-0 overflow-hidden"
                    />
                  ) : (
                    <div className="flex h-[580px] w-full flex-col items-center justify-center gap-4 bg-surface-container-high p-6 text-center">
                      <FileText size={48} className="text-outline-variant" />
                      <div>
                        <h3 className="text-title-md font-bold text-on-surface">Preview not available</h3>
                        <p className="mt-1 text-body-sm text-on-surface-variant max-w-sm mx-auto">
                          Microsoft Office previews require a publicly accessible URL. Since this file was uploaded locally, you can download it to view it.
                        </p>
                      </div>
                      <Button variant="primary" size="md" onClick={() => window.open(material.fileUrl, '_blank')}>
                        Download File
                      </Button>
                    </div>
                  )
                ) : (
                  <iframe
                    title={material.title}
                    src={`${material.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    scrolling="no"
                    className="h-[580px] w-full border-0 overflow-hidden"
                    style={{ overflow: 'hidden' }}
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 bg-white text-label-sm text-on-surface-variant">
                <span className="flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <span className="font-medium text-on-surface">
                    {(() => {
                      const target = material.filePath || material.fileUrl || '';
                      const extMatch = target.match(/\.([a-z0-9]+)($|\?)/i);
                      const ext = extMatch ? extMatch[1].toLowerCase() : '';
                      if (['pdf'].includes(ext)) return 'PDF Document';
                      if (['doc', 'docx'].includes(ext)) return 'Word Document';
                      if (['ppt', 'pptx'].includes(ext)) return 'PowerPoint';
                      if (['xls', 'xlsx'].includes(ext)) return 'Excel Spreadsheet';
                      if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif'].includes(ext) || target.startsWith('data:image/') || target.startsWith('blob:')) return 'Image File';
                      return 'Document';
                    })()}
                  </span>
                  <span className="opacity-75">
                    ({material.fileSizeMb ? `${material.fileSizeMb} MB` : material.fileSizeMb === 0 ? '< 0.01 MB' : 'Unknown Size'})
                  </span>
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} /> {material.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Download size={14} /> {material.downloads.toLocaleString()} downloads
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="flex flex-col gap-6"
          >
            <Card hoverable={false} className="flex flex-col gap-5 border border-card-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-label-sm font-semibold text-primary">
                    {material.subject}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label="Report material"
                  onClick={handleReport}
                  title="Report material"
                >
                  <Flag size={16} />
                </Button>
              </div>

              <div>
                <h1 className="text-headline-lg font-bold text-on-surface">{material.title}</h1>
                <p className="mt-2 text-body-sm text-on-surface-variant leading-relaxed">
                  {material.description || 'No description provided for this paper.'}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-card-border pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center cursor-pointer"
                  icon={<Eye size={18} />}
                  onClick={() => navigate(`/reader/${material.id}`)}
                >
                  {material.type === 'past-paper'
                    ? 'View Papers'
                    : material.type === 'doc'
                      ? 'Solve'
                      : 'View Material'}
                </Button>

                <div className="grid grid-cols-4 gap-2.5">
                  <Button
                    variant={isLiked ? 'primary' : 'secondary'}
                    size="md"
                    onClick={handleLike}
                    className="justify-center cursor-pointer px-0"
                    icon={<Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />}
                    title="Like"
                    aria-label="Like"
                  >
                    {likesCount > 0 ? likesCount.toLocaleString() : null}
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleShare}
                    className="justify-center cursor-pointer px-0"
                    icon={<Share2 size={18} />}
                    title="Share"
                    aria-label="Share"
                  />

                  <Button
                    variant={isSaved ? 'primary' : 'secondary'}
                    size="md"
                    onClick={toggleSave}
                    className="justify-center cursor-pointer px-0"
                    icon={<Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />}
                    title={isSaved ? 'Unsave' : 'Save'}
                    aria-label={isSaved ? 'Unsave' : 'Save'}
                  />

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleDownload}
                    className="justify-center cursor-pointer px-0"
                    icon={isDownloading ? <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <Download size={18} />}
                    title="Download"
                    aria-label="Download"
                    disabled={isDownloading}
                  />
                </div>
              </div>
            </Card>

            <Card hoverable={false} className="flex flex-col gap-4 border border-card-border">
              <h3 className="text-headline-md font-bold text-on-surface">Material Info</h3>

              <div className="flex items-center gap-3 border-b border-card-border pb-4">
                <Avatar
                  src={material.uploaderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  name={material.uploaderName || 'Anonymous Student'}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md font-bold text-on-surface">
                    {material.uploaderName || 'Anonymous Student'}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-body-sm">
                <div className="flex items-start gap-2.5">
                  <BookOpen size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-label-xs font-semibold text-outline uppercase tracking-wider">Subject</p>
                    <p className="font-semibold text-on-surface">{material.subject}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Database size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-label-xs font-semibold text-outline uppercase tracking-wider">File Size</p>
                    <p className="font-semibold text-on-surface">
                      {material.fileSizeMb ? `${material.fileSizeMb} MB` : material.fileSizeMb === 0 ? '< 0.01 MB' : 'Unknown'}
                    </p>
                  </div>
                </div>

                {lazyPages ? (
                  <div className="flex items-start gap-2.5">
                    <FileText size={18} className="mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="text-label-xs font-semibold text-outline uppercase tracking-wider">Pages</p>
                      <p className="font-semibold text-on-surface">
                        {lazyPages} Page{lazyPages === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <SignupPromptModal
        isOpen={showSignupPrompt}
        onClose={handleCloseSignupPrompt}
        onSignup={handleSignupRedirect}
      />
    </>
  );
}

export default MaterialDetailsPage;
