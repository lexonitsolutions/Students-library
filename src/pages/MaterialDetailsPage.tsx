import { motion } from 'framer-motion';
import { Bookmark, ChevronRight, Download, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { materials, myUploads } from '../data/mockData';

const allMaterials = [...materials, ...myUploads];

export function MaterialDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const material = allMaterials.find((item) => item.id === id) ?? allMaterials[0];

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

            <dl className="mt-5 grid grid-cols-2 gap-y-3 text-body-sm">
              <dt className="text-on-surface-variant">University</dt>
              <dd className="text-right font-medium text-on-surface">Stanford University</dd>
              <dt className="text-on-surface-variant">Branch</dt>
              <dd className="text-right font-medium text-on-surface">Software Engineering</dd>
              <dt className="text-on-surface-variant">Course Code</dt>
              <dd className="text-right font-medium text-on-surface">{material.subject.slice(0, 2).toUpperCase()}101</dd>
            </dl>

            <div className="mt-5 flex items-center gap-3 border-t border-card-border pt-5">
              <Avatar name={material.uploaderName} src={material.uploaderAvatar} size={36} />
              <div>
                <p className="text-body-sm font-semibold text-on-surface">{material.uploaderName}</p>
                <p className="text-label-sm text-on-surface-variant">Uploaded {material.uploadedAt}</p>
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
              <Button variant="secondary" className="flex-1" icon={<Download size={18} />}>
                Download
              </Button>
              <Button
                variant="secondary"
                size="md"
                aria-label={isSaved ? 'Remove from saved' : 'Save material'}
                onClick={() => setIsSaved((value) => !value)}
                className="px-3"
              >
                <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default MaterialDetailsPage;
