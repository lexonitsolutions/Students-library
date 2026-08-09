import { ArrowLeft, Download, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconButton } from '../components/ui/IconButton';
import type { Material } from '../data/types';
import { getMaterialForUI } from '../services/materialsService';

export function ReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getMaterialForUI(id).then((data) => active && setMaterial(data));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-card-border px-4 py-3 sm:px-6">
        <IconButton label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-semibold text-on-surface">{material?.title ?? 'Loading...'}</p>
          <p className="text-label-sm text-on-surface-variant">{material?.subject}</p>
        </div>
        {material && (
          <a href={material.fileUrl} target="_blank" rel="noreferrer" download>
            <IconButton label="Download">
              <Download size={18} />
            </IconButton>
          </a>
        )}
        <IconButton label="More options">
          <MoreVertical size={18} />
        </IconButton>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface-container-low">
        {material ? (
          <iframe title={material.title} src={material.fileUrl} className="h-full w-full border-0" />
        ) : (
          <p className="text-body-sm text-on-surface-variant">Loading document...</p>
        )}
      </div>
    </div>
  );
}

export default ReaderPage;
