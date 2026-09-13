import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/cn';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfViewerProps {
  readonly fileUrl: string;
  readonly title?: string;
  readonly className?: string;
  readonly onPageCountLoaded?: (count: number) => void;
}

interface PageData {
  pageNumber: number;
  width: number;
  height: number;
}

export function PdfViewer({ fileUrl, title, className, onPageCountLoaded }: Readonly<PdfViewerProps>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState<PageData[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<'fit-width' | 'custom'>('fit-width');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, any>>(new Map());

  // 1. Load the PDF Document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setPages([]);
    canvasRefs.current.clear();
    renderTasksRef.current.forEach((t) => t.cancel?.());
    renderTasksRef.current.clear();

    const loadingTask = pdfjsLib.getDocument({
      url: fileUrl,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/',
      cMapPacked: true,
    });

    loadingTask.promise
      .then(async (pdf) => {
        if (!isMounted) return;
        pdfDocRef.current = pdf;
        const total = pdf.numPages;
        setNumPages(total);
        onPageCountLoaded?.(total);

        // Fetch dimension metadata for all pages
        const pageDataList: PageData[] = [];
        for (let i = 1; i <= total; i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            pageDataList.push({
              pageNumber: i,
              width: viewport.width,
              height: viewport.height,
            });
          } catch {
            pageDataList.push({ pageNumber: i, width: 600, height: 800 });
          }
        }

        if (isMounted) {
          setPages(pageDataList);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('PDF.js failed to load document:', err);
        setError('Failed to render document preview.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      loadingTask.destroy().catch(() => {});
    };
  }, [fileUrl, onPageCountLoaded]);

  // 2. High-DPI Page Rendering
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      if (!pdfDocRef.current) return;

      // Cancel any existing render task for this page to prevent blurry overwrites
      const existingTask = renderTasksRef.current.get(pageNumber);
      if (existingTask) {
        existingTask.cancel();
      }

      try {
        const page = await pdfDocRef.current.getPage(pageNumber);
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth || 600;
        const unscaledViewport = page.getViewport({ scale: 1 });

        // Calculate display scale
        let effectiveScale = zoomLevel;
        if (fitMode === 'fit-width') {
          // On mobile screens, fill edge-to-edge with minimal margin
          const horizontalPadding = containerWidth < 640 ? 12 : 32;
          const targetWidth = Math.max(containerWidth - horizontalPadding, 300);
          effectiveScale = targetWidth / unscaledViewport.width;
        }

        // High-DPI multiplier (min 2.5x to 3x for crisp text on Retina/OLED screens)
        const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2.5), 3.5);
        const renderViewport = page.getViewport({ scale: effectiveScale * dpr });

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Set high physical resolution on canvas buffer
        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);

        // Display size in CSS points
        const cssWidth = Math.floor(renderViewport.width / dpr);
        const cssHeight = Math.floor(renderViewport.height / dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        const renderTask = page.render({
          canvasContext: context,
          viewport: renderViewport,
          canvas,
        } as any);

        renderTasksRef.current.set(pageNumber, renderTask);
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Failed to render page ${pageNumber}:`, err);
        }
      } finally {
        renderTasksRef.current.delete(pageNumber);
      }
    },
    [fitMode, zoomLevel]
  );

  // Trigger re-render of all mounted canvases when zoom or pages change
  useEffect(() => {
    if (loading || pages.length === 0) return;

    pages.forEach((p) => {
      const canvas = canvasRefs.current.get(p.pageNumber);
      if (canvas) {
        renderPage(p.pageNumber, canvas);
      }
    });
  }, [loading, pages, renderPage]);

  // Handle container resize (e.g. phone orientation change)
  useEffect(() => {
    if (!containerRef.current || fitMode !== 'fit-width') return;

    let resizeTimer: any;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        pages.forEach((p) => {
          const canvas = canvasRefs.current.get(p.pageNumber);
          if (canvas) {
            renderPage(p.pageNumber, canvas);
          }
        });
      }, 150);
    });

    observer.observe(containerRef.current);
    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [fitMode, pages, renderPage]);

  // Zoom helpers
  const handleZoomIn = () => {
    setFitMode('custom');
    setZoomLevel((prev) => Math.min(2.5, Math.round((prev + 0.2) * 10) / 10));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setZoomLevel((prev) => Math.max(0.6, Math.round((prev - 0.2) * 10) / 10));
  };

  const handleResetZoom = () => {
    setFitMode('custom');
    setZoomLevel(1.0);
  };

  const handleToggleFitWidth = () => {
    if (fitMode === 'fit-width') {
      setFitMode('custom');
      setZoomLevel(1.2); // Comfortable zoomed reading scale
    } else {
      setFitMode('fit-width');
    }
  };

  if (loading) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 p-8 text-on-surface-variant min-h-[360px]', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-medium">Loading high-resolution document…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('relative w-full h-full min-h-[400px]', className)}>
        <iframe
          title={title || 'Document'}
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full border-0 rounded-xl"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100/70 dark:bg-slate-900/50">
      {/* Scrollable Document Canvas Container */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 w-full overflow-y-auto overflow-x-auto p-1.5 sm:p-4 space-y-4 [-webkit-overflow-scrolling:touch]',
          className
        )}
        style={{ touchAction: 'pan-x pan-y' }}
      >
        {pages.map((p) => (
          <div
            key={p.pageNumber}
            className="relative flex flex-col items-center mx-auto max-w-full"
          >
            <div className="relative rounded-xl overflow-hidden shadow-lg border border-card-border/80 bg-white">
              <canvas
                ref={(el) => {
                  if (el) {
                    canvasRefs.current.set(p.pageNumber, el);
                    renderPage(p.pageNumber, el);
                  } else {
                    canvasRefs.current.delete(p.pageNumber);
                  }
                }}
                className="block max-w-none"
              />
            </div>

            {numPages > 1 && (
              <div className="mt-1.5 text-[10px] sm:text-[11px] font-semibold text-on-surface-variant/90 bg-surface-container-high/90 px-3 py-0.5 rounded-full border border-card-border/60 shadow-2xs">
                Page {p.pageNumber} of {numPages}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modern Floating Reading Toolbar (Pill) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full border border-card-border/80 bg-surface/95 px-2.5 py-1.5 shadow-xl backdrop-blur-md text-xs font-semibold text-on-surface">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={fitMode === 'custom' && zoomLevel <= 0.6}
          className="p-1 rounded-full hover:bg-surface-container-high text-on-surface transition-colors disabled:opacity-40 cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          className="px-2 py-0.5 rounded-md hover:bg-surface-container-high transition-colors font-mono text-[11px] text-on-surface font-bold cursor-pointer"
          title="Reset Zoom to 100%"
        >
          {fitMode === 'fit-width' ? 'Fit' : `${Math.round(zoomLevel * 100)}%`}
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={fitMode === 'custom' && zoomLevel >= 2.5}
          className="p-1 rounded-full hover:bg-surface-container-high text-on-surface transition-colors disabled:opacity-40 cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn size={15} />
        </button>

        <div className="h-3.5 w-px bg-card-border mx-1" />

        <button
          type="button"
          onClick={handleToggleFitWidth}
          className={cn(
            'flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer',
            fitMode === 'fit-width'
              ? 'bg-primary text-white shadow-2xs font-semibold'
              : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
          )}
          title="Toggle Fit Width / Zoom"
        >
          <Maximize2 size={12} />
          <span>{fitMode === 'fit-width' ? 'Full Width' : 'Fit'}</span>
        </button>
      </div>
    </div>
  );
}

export default PdfViewer;
