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
  const onPageCountLoadedRef = useRef(onPageCountLoaded);
  const lastContainerWidthRef = useRef<number>(0);

  useEffect(() => {
    onPageCountLoadedRef.current = onPageCountLoaded;
  }, [onPageCountLoaded]);

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
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/standard_fonts/',
    });

    loadingTask.promise
      .then(async (pdf) => {
        if (!isMounted) return;
        pdfDocRef.current = pdf;
        const total = pdf.numPages;
        setNumPages(total);
        onPageCountLoadedRef.current?.(total);

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
  }, [fileUrl]);

  // 2. High-DPI Page Rendering
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      if (!pdfDocRef.current) return;

      // Cancel any existing render task for this page to prevent blurry overwrites
      const existingTask = renderTasksRef.current.get(pageNumber);
      if (existingTask) {
        try {
          existingTask.cancel();
        } catch {
          // ignore
        }
        renderTasksRef.current.delete(pageNumber);
      }

      try {
        const page = await pdfDocRef.current.getPage(pageNumber);
        // Clamp to actual viewport width to prevent horizontal overflow on mobile
        const rawWidth = containerRef.current?.clientWidth || window.innerWidth || 600;
        const containerWidth = Math.min(rawWidth, window.innerWidth);
        lastContainerWidthRef.current = containerWidth;
        const unscaledViewport = page.getViewport({ scale: 1 });

        // Calculate display scale
        let effectiveScale = zoomLevel;
        if (fitMode === 'fit-width') {
          // On mobile screens, fill edge-to-edge with minimal margin
          const horizontalPadding = containerWidth < 640 ? 12 : 32;
          const targetWidth = Math.max(containerWidth - horizontalPadding, 100);
          effectiveScale = targetWidth / (unscaledViewport.width || 600);
        }

        // On mobile, cap DPR at 2.0 to avoid WebKit canvas memory exhaustion which causes blank pages
        const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
        const maxDpr = isMobileScreen ? 2 : 2.5;
        const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), maxDpr);
        const renderViewport = page.getViewport({ scale: effectiveScale * dpr });

        // Use standard 2D context (WITHOUT alpha:false which initializes canvas to solid black)
        const context = canvas.getContext('2d');
        if (!context) return;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Set high physical resolution on canvas buffer
        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);

        // Pre-paint pure white paper background so transparent PDFs don't appear black or blank
        context.save();
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();

        // Responsive display sizing: fluid width up to max CSS width, keeping exact aspect ratio
        const cssWidth = Math.floor(renderViewport.width / dpr);
        canvas.style.width = '100%';
        canvas.style.maxWidth = `${cssWidth}px`;
        canvas.style.height = 'auto';
        canvas.style.aspectRatio = `${renderViewport.width} / ${renderViewport.height}`;

        const renderTask = page.render({
          canvasContext: context,
          viewport: renderViewport,
          canvas,
          background: 'rgb(255, 255, 255)',
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
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const newWidth = entry ? Math.round(entry.contentRect.width) : containerRef.current?.clientWidth || 0;
      // Only re-render if the width changed significantly (e.g. orientation change or real resize > 15px)
      if (Math.abs(newWidth - lastContainerWidthRef.current) < 15) return;

      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lastContainerWidthRef.current = newWidth;
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
      <div className={cn('relative w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-surface rounded-xl border border-card-border gap-3', className)}>
        <p className="text-sm font-semibold text-on-surface">Unable to display {title || 'PDF preview'}</p>
        <p className="text-xs text-on-surface-variant max-w-sm">
          This document could not be rendered inside the inline reader. You can open or download it directly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            Open File in New Tab
          </a>
          <a
            href={fileUrl}
            download
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container border border-card-border text-on-surface text-xs font-semibold shadow-xs hover:bg-surface-container-high transition-all cursor-pointer"
          >
            Download PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100/70 dark:bg-slate-900/50">
      {/* Scrollable Document Canvas Container */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 w-full overflow-y-auto overflow-x-hidden p-1.5 sm:p-4 space-y-4 [-webkit-overflow-scrolling:touch]',
          className
        )}
        style={{ touchAction: 'pan-x pan-y' }}
      >
        {pages.map((p) => (
          <div
            key={p.pageNumber}
            className="relative flex flex-col items-center mx-auto w-full max-w-full"
          >
            <div className="relative rounded-xl overflow-hidden shadow-lg border border-card-border/80 bg-white max-w-full w-full flex justify-center">
              <canvas
                ref={(el) => {
                  if (el) {
                    canvasRefs.current.set(p.pageNumber, el);
                  } else {
                    canvasRefs.current.delete(p.pageNumber);
                  }
                }}
                className="block max-w-full h-auto bg-white mx-auto"
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
      <div
        className="absolute left-1/2 z-30 flex items-center gap-1 rounded-full border border-card-border/80 bg-surface/95 px-2.5 py-1.5 shadow-xl backdrop-blur-md text-xs font-semibold text-on-surface -translate-x-1/2"
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
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
