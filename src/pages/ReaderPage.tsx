import { ArrowLeft, ChevronLeft, ChevronRight, Download, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconButton } from '../components/ui/IconButton';
import type { Material } from '../data/types';
import { getMaterialForUI } from '../services/materialsService';

export function ReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getMaterialForUI(id).then((data) => active && setMaterial(data));
    return () => {
      active = false;
    };
  }, [id]);

  const isImageFile = material
    ? material.fileUrl.match(/\.(jpeg|jpg|png|webp|gif|heic)($|\?)/i) ||
      material.fileUrl.startsWith('blob:') ||
      material.fileUrl.startsWith('data:image/')
    : false;

  const imageList = isImageFile && material
    ? [
        material.fileUrl,
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
      ]
    : [];

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
          isImageFile ? (
            <div className="relative flex h-full w-full items-center justify-center p-6 overflow-hidden bg-surface-container-low">
              <img
                src={imageList[currentImageIndex] || material.fileUrl}
                alt={material.title}
                className="max-h-full max-w-full rounded-lg object-contain shadow-lg transition-all duration-300"
              />

              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white shadow-xl backdrop-blur-xs hover:bg-black/80 hover:scale-105 transition-all cursor-pointer z-10"
                    aria-label="Previous Page Image"
                  >
                    <ChevronLeft size={26} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white shadow-xl backdrop-blur-xs hover:bg-black/80 hover:scale-105 transition-all cursor-pointer z-10"
                    aria-label="Next Page Image"
                  >
                    <ChevronRight size={26} />
                  </button>

                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-4 py-1.5 text-label-md font-semibold text-white backdrop-blur-xs shadow-lg z-10">
                    Page {currentImageIndex + 1} of {imageList.length}
                  </span>
                </>
              )}
            </div>
          ) : (
            <iframe
              title={material.title}
              src={`${material.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              scrolling="no"
              className="h-full w-full border-0 overflow-hidden"
              style={{ overflow: 'hidden' }}
            />
          )
        ) : (
          <p className="text-body-sm text-on-surface-variant">Loading document...</p>
        )}
      </div>
    </div>
  );
}

export default ReaderPage;
