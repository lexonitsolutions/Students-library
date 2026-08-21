import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, MoreVertical } from 'lucide-react';
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
    ? !!(material.filePath || material.fileUrl).match(/\.(jpeg|jpg|png|webp|gif|heic)($|\?)/i) ||
      material.fileUrl.startsWith('data:image/')
    : false;

  const isOfficeDocument = material
    ? !!(material.filePath || material.fileUrl).match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/i)
    : false;

  const isPublicUrl = material
    ? material.fileUrl.startsWith('http') && !material.fileUrl.includes('localhost') && !material.fileUrl.includes('127.0.0.1')
    : false;

  const imageList = isImageFile && material
    ? [material.fileUrl]
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
          ) : isOfficeDocument ? (
            isPublicUrl ? (
              <iframe
                title={material.title}
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.fileUrl)}`}
                className="h-full w-full border-0 overflow-hidden"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-surface-container-high">
                <FileText size={64} className="text-outline-variant" />
                <div className="text-center px-6">
                  <h3 className="text-headline-sm font-bold text-on-surface">Preview not available</h3>
                  <p className="mt-2 text-body-md text-on-surface-variant max-w-sm mx-auto">
                    Microsoft Office previews require a publicly accessible URL. Since this file was uploaded locally (via a mock user), you can download it to view it on your device.
                  </p>
                </div>
                <a
                  href={material.fileUrl}
                  download
                  className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-label-md font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Download size={20} />
                  Download File
                </a>
              </div>
            )
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
