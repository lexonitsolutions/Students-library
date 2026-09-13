import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { IconButton } from '../components/ui/IconButton';
import { PdfViewer } from '../components/ui/PdfViewer';
import { SignupPromptModal } from '../components/ui/SignupPromptModal';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { getMaterialForUI } from '../services/materialsService';

export function ReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isExploring, stopExploring } = useAuth();
  const { setRedirectPath } = useSignupRedirect();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [material, setMaterial] = useState<Material | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isExploring) {
      setShowSignupPrompt(true);
    }
  }, [isExploring]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getMaterialForUI(id).then((data) => active && setMaterial(data));
    return () => {
      active = false;
    };
  }, [id]);

  const handleSignupRedirect = () => {
    setRedirectPath(location.pathname);
    stopExploring();
    navigate('/signup');
  };

  const handleCloseSignupPrompt = () => {
    setShowSignupPrompt(false);
    navigate('/dashboard');
  };

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
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-surface-container-lowest text-on-surface">
        <header className="flex items-center gap-3 border-b border-card-border px-4 py-3 sm:px-6">
          <IconButton label="Back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-semibold text-on-surface">{material?.title ?? 'Loading...'}</p>
            <p className="text-label-xs text-on-surface-variant">
              {material?.subject} • {material?.type === 'past-paper' ? 'Past Paper' : material?.type === 'doc' ? 'Document' : 'Material'}
            </p>
          </div>
          <IconButton label="Options">
            <MoreVertical size={20} />
          </IconButton>
        </header>

        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-surface-container-lowest p-1 sm:p-4">
          {!material ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-body-sm text-on-surface-variant">Loading document...</p>
            </div>
          ) : isImageFile ? (
            <div className="relative flex h-full w-full max-w-4xl items-center justify-center">
              <img
                src={imageList[currentImageIndex] || material.fileUrl}
                alt={material.title}
                className="max-h-full max-w-full rounded-lg object-contain shadow-xl"
              />

              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm hover:bg-black/90 transition-all cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm hover:bg-black/90 transition-all cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight size={24} />
                  </button>

                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-label-sm font-semibold text-white backdrop-blur-sm shadow-md">
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
                className="h-full w-full max-w-6xl rounded-lg border-0 bg-white shadow-xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-lg bg-surface-container p-8 text-center shadow-lg max-w-md">
                <FileText size={64} className="text-outline-variant" />
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface">Preview not available</h3>
                  <p className="mt-2 text-body-sm text-on-surface-variant">
                    Microsoft Office previews require a publicly accessible URL. Download the file to view it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(material.fileUrl, '_blank')}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-label-lg font-semibold text-on-primary shadow-md hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Download size={20} />
                  Download File
                </button>
              </div>
            )
          ) : (
            <div className="h-full w-full max-w-5xl rounded-xl bg-white shadow-xl overflow-hidden">
              <PdfViewer
                fileUrl={material.fileUrl}
                title={material.title}
                className="h-full w-full"
              />
            </div>
          )}
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

export default ReaderPage;
