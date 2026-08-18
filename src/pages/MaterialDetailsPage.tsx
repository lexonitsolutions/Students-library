import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Flag,
  GraduationCap,
  MapPin,
  Maximize2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import * as bookmarksService from '../services/bookmarksService';
import { getMaterialForUI, incrementViews, recordDownload } from '../services/materialsService';
import { reportMaterial } from '../services/reportsService';
import { cn } from '../lib/cn';
import { accentBg, materialTypeIcon } from '../lib/materialIcons';
import { mockMaterials } from '../data/mockData';

export function MaterialDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [material, setMaterial] = useState<Material | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'preview'>('reader');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const mock = mockMaterials.find((m) => m.id === id);
    if (mock) {
      setMaterial(mock);
    }

    getMaterialForUI(id)
      .then((data) => {
        if (active && data) {
          setMaterial(data);
          setIsSaved(!!data.isSaved);
        }
      })
      .catch((err) => {
        console.warn('Material load warning:', err);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      incrementViews(id).catch(() => {});
    }
  }, [id]);

  const toggleSave = async () => {
    if (!user || !material) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setMaterial((prev) => (prev ? { ...prev, isSaved: nextSaved } : null));

    try {
      if (nextSaved) {
        await bookmarksService.addBookmark(material.id);
      } else {
        await bookmarksService.removeBookmark(material.id, user.id);
      }
    } catch {
      setIsSaved(!nextSaved);
    }
  };

  const handleDownload = async () => {
    if (!material) return;
    setMaterial((prev) => (prev ? { ...prev, downloads: prev.downloads + 1 } : null));
    try {
      await recordDownload(material.id);
    } catch {}

    const link = document.createElement('a');
    link.href = material.fileUrl;
    link.download = `${material.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReport = async () => {
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

  if (!material) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-body-md text-on-surface-variant">Loading material details...</p>
      </div>
    );
  }

  const TypeIcon = materialTypeIcon[material.type] || FileText;

  const isImageFile =
    material.fileUrl.match(/\.(jpeg|jpg|png|webp|gif|heic)($|\?)/i) ||
    material.fileUrl.startsWith('blob:') ||
    material.fileUrl.startsWith('data:image/');

  const imageList = isImageFile
    ? [
        material.fileUrl,
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
      ]
    : [];

  return (
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
            <div className="flex items-center justify-between border-b border-card-border px-4 py-3 bg-white">
              <div className="flex items-center gap-1 rounded-lg bg-surface-soft p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('reader')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-label-sm font-semibold transition-colors cursor-pointer',
                    activeTab === 'reader'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  Paper Reader
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-label-sm font-semibold transition-colors cursor-pointer',
                    activeTab === 'preview'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  Preview Card
                </button>
              </div>
            </div>

            <div className="relative min-h-[520px] sm:min-h-[600px] w-full bg-surface-container-low flex flex-col items-center justify-center group">
              {activeTab === 'reader' ? (
                isImageFile ? (
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
                ) : (
                  <iframe
                    title={material.title}
                    src={`${material.fileUrl}#toolbar=0&navpanes=0`}
                    className="h-[580px] w-full border-0"
                  />
                )
              ) : (
                <div className="flex aspect-[4/5] flex-col items-center justify-center gap-4 p-8 text-center sm:aspect-[3/4]">
                  <span className={cn('flex h-20 w-20 items-center justify-center rounded-2xl', accentBg[material.accentColor])}>
                    <TypeIcon size={40} />
                  </span>
                  <div>
                    <h3 className="text-headline-md font-bold text-on-surface">{material.title}</h3>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{material.subject} &bull; {material.semester}</p>
                    <p className="mt-2 text-label-sm text-outline">
                      {material.pages ? `${material.pages} pages` : 'Document'} &bull; {material.fileSizeMb ? `${material.fileSizeMb} MB` : 'File'}
                    </p>
                  </div>
                  <Button variant="primary" size="md" icon={<Maximize2 size={16} />} onClick={() => navigate(`/reader/${material.id}`)}>
                    Open Fullscreen Reader
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 bg-white text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <span className="font-medium text-on-surface">{material.type.toUpperCase()} Paper</span>
                {material.fileSizeMb && <span>({material.fileSizeMb} MB)</span>}
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
                View Paper
              </Button>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant={isSaved ? 'primary' : 'secondary'}
                  size="md"
                  onClick={toggleSave}
                  className="justify-center cursor-pointer"
                  icon={<Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleDownload}
                  className="justify-center cursor-pointer"
                  icon={<Download size={16} />}
                >
                  Download
                </Button>
              </div>
            </div>
          </Card>

          <Card hoverable={false} className="flex flex-col gap-4 border border-card-border">
            <h3 className="text-headline-md font-bold text-on-surface">Uploader Details</h3>

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
                <FileText size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-label-xs font-semibold text-outline uppercase tracking-wider">Papers Uploaded</p>
                  <p className="font-semibold text-on-surface">{material.uploaderUploadsCount || 3} Papers Uploaded by Uploader</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <GraduationCap size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-label-xs font-semibold text-outline uppercase tracking-wider">University</p>
                  <p className="font-semibold text-on-surface">{material.uploaderUniversity || 'Fergusson College Pune'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-label-xs font-semibold text-outline uppercase tracking-wider">College & Department</p>
                  <p className="font-semibold text-on-surface">{material.uploaderCollege || 'Fergusson College Pune'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-label-xs font-semibold text-outline uppercase tracking-wider">Place / Location</p>
                  <p className="font-semibold text-on-surface">{material.uploaderLocation || 'Fergusson College Pune'}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default MaterialDetailsPage;
