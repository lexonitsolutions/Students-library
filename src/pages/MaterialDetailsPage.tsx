import { motion } from 'framer-motion';
import { Bookmark, ChevronRight, Download, FileText, Flag, ZoomIn, ZoomOut } from 'lucide-react';
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

export function MaterialDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [material, setMaterial] = useState<Material | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const savedIds = user ? await bookmarksService.listBookmarkedMaterialIds(user.id) : undefined;
      const data = await getMaterialForUI(id, savedIds);
      if (!active) return;
      setMaterial(data);
      setIsSaved(data.isSaved ?? false);
      incrementViews(id).catch(() => {});
    })();
    return () => {
      active = false;
    };
  }, [id, user]);

  const toggleSave = async () => {
    if (!user || !material) return;
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) {
        await bookmarksService.addBookmark(material.id);
      } else {
        await bookmarksService.removeBookmark(material.id, user.id);
      }
    } catch {
      setIsSaved(!next);
    }
  };

  const handleDownload = async () => {
    if (!material) return;
    window.open(material.fileUrl, '_blank');
    try {
      await recordDownload(material.id);
    } catch {
      // non-critical: download history/count just won't reflect this attempt
    }
  };

  const handleReport = async () => {
    if (!material) return;
    const reason = window.prompt('What is wrong with this material?');
    if (!reason) return;
    await reportMaterial(material.id, reason);
    window.alert('Thanks, our team will review this material.');
  };

  if (!material) return null;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-label-sm text-on-surface-variant">
        <Link to="/explore" className="hover:text-primary">
          Explore
        </Link>
        <ChevronRight size={14} />
        <span>{material.subject}</span>
        <ChevronRight size={14} />
        <span className="truncate text-on-surface">{material.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card hoverable={false} padded={false} className="overflow-hidden">
            <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 bg-surface-container-low sm:aspect-[3/4]">
              <FileText size={56} className="text-outline" />
              <p className="text-label-sm text-on-surface-variant">Document Preview</p>
            </div>
            <div className="flex items-center justify-center gap-4 border-t border-card-border py-3">
              <button type="button" aria-label="Zoom out" className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <ZoomOut size={18} />
              </button>
              <span className="text-label-sm text-on-surface-variant">1 / {material.pages ?? 12}</span>
              <button type="button" aria-label="Zoom in" className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <ZoomIn size={18} />
              </button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Card hoverable={false}>
            <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
              <span>{material.subject}</span>
              <span aria-hidden>&middot;</span>
              <span>{material.semester}</span>
            </div>
            <h1 className="mt-1.5 text-headline-lg-mobile text-on-surface">{material.title}</h1>
            <p className="mt-3 text-body-sm text-on-surface-variant">{material.description}</p>

            <div className="mt-5 flex items-center gap-3 border-t border-card-border pt-5">
              <Avatar name={material.uploaderName} src={material.uploaderAvatar} size={36} />
              <div>
                <p className="text-body-sm font-semibold text-on-surface">{material.uploaderName}</p>
                <p className="text-label-sm text-on-surface-variant">
                  Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-label-sm text-on-surface-variant">
              <span>{material.views.toLocaleString()} views</span>
              <span>{material.downloads.toLocaleString()} downloads</span>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Button variant="primary" className="flex-1" icon={<FileText size={18} />} onClick={() => navigate(`/reader/${material.id}`)}>
                Read PDF
              </Button>
              <Button variant="secondary" className="flex-1" icon={<Download size={18} />} onClick={handleDownload}>
                Download
              </Button>
              <Button
                variant="secondary"
                size="md"
                aria-label={isSaved ? 'Remove from saved' : 'Save material'}
                onClick={toggleSave}
                className="px-3"
              >
                <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
              </Button>
              <Button
                variant="secondary"
                size="md"
                aria-label="Report material"
                onClick={handleReport}
                className="px-3"
              >
                <Flag size={18} />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default MaterialDetailsPage;
