import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export async function parsePdfPageCount(arrayBuffer: ArrayBuffer): Promise<number | undefined> {
  // Strategy 1: pdfjsLib (Browser standard PDF viewer engine)
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/',
      cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    if (pdf && pdf.numPages > 0) {
      return pdf.numPages;
    }
  } catch (err) {
    console.warn('PDF.js parse warning, trying pdf-lib:', err);
  }

  // Strategy 2: pdf-lib
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const count = pdfDoc.getPageCount();
    if (count > 0) return count;
  } catch (err) {
    console.warn('pdf-lib parse warning, trying binary regex:', err);
  }

  // Strategy 3: Binary string scan for /Count N in page tree or /Type /Page
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const text = decoder.decode(bytes);

    const countMatches = text.match(/\/Count\s+(\d+)/g);
    if (countMatches && countMatches.length > 0) {
      let maxCount = 0;
      for (const m of countMatches) {
        const num = m.match(/\d+/);
        if (num) {
          const val = parseInt(num[0], 10);
          if (val > maxCount && val < 50000) {
            maxCount = val;
          }
        }
      }
      if (maxCount > 0) return maxCount;
    }

    const pageMatches = text.match(/\/Type\s*\/Page\b/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }
  } catch (err) {
    console.warn('Binary regex scan warning:', err);
  }

  return undefined;
}

export async function parseDocxPageCount(arrayBuffer: ArrayBuffer): Promise<number | undefined> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    let detectedBreaks = 0;
    const docXmlFile = zip.file('word/document.xml');
    if (docXmlFile) {
      const docXmlText = await docXmlFile.async('text');
      const renderedBreaks = (docXmlText.match(/<w:lastRenderedPageBreak\b/g) || []).length;
      const manualBreaks = (docXmlText.match(/<w:br\b[^>]*w:type=["']page["']/g) || []).length;
      const sectionBreaks = (docXmlText.match(/<w:sectPr\b/g) || []).length;
      const breaks = renderedBreaks + manualBreaks;
      if (breaks > 0) {
        detectedBreaks = breaks + 1;
      } else if (sectionBreaks > 1) {
        detectedBreaks = sectionBreaks;
      }
    }

    const appXmlFile = zip.file('docProps/app.xml');
    if (appXmlFile) {
      const appXmlText = await appXmlFile.async('text');
      const match =
        appXmlText.match(/<Pages>(\d+)<\/Pages>/i) ||
        appXmlText.match(/<[^:]+:Pages>(\d+)<\/[^:]+:Pages>/i);
      const appPages = match && match[1] ? parseInt(match[1], 10) : 0;

      if (appPages > 1) {
        return Math.max(appPages, detectedBreaks);
      }

      if (detectedBreaks > 1) {
        return detectedBreaks;
      }

      // Estimate by words if available
      const wordsMatch =
        appXmlText.match(/<Words>(\d+)<\/Words>/i) ||
        appXmlText.match(/<[^:]+:Words>(\d+)<\/[^:]+:Words>/i);
      if (wordsMatch && wordsMatch[1]) {
        const words = parseInt(wordsMatch[1], 10);
        if (words > 400) {
          return Math.max(1, Math.ceil(words / 320));
        }
      }

      if (appPages > 0) return appPages;
    }

    if (detectedBreaks > 0) return detectedBreaks;
  } catch (err) {
    console.warn('DOCX parse warning:', err);
  }
  return undefined;
}

export async function parsePptxSlideCount(arrayBuffer: ArrayBuffer): Promise<number | undefined> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Exact count of slides in ppt/slides/
    const slideFiles = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name));
    if (slideFiles.length > 0) {
      return slideFiles.length;
    }

    const appXmlFile = zip.file('docProps/app.xml');
    if (appXmlFile) {
      const appXmlText = await appXmlFile.async('text');
      const match =
        appXmlText.match(/<Slides>(\d+)<\/Slides>/i) ||
        appXmlText.match(/<[^:]+:Slides>(\d+)<\/[^:]+:Slides>/i);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
  } catch (err) {
    console.warn('PPTX parse warning:', err);
  }
  return undefined;
}

export async function getDocumentPageCount(file: File): Promise<number | undefined> {
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    if (extension === 'pdf') {
      return await parsePdfPageCount(arrayBuffer);
    }
    if (extension === 'docx') {
      return await parseDocxPageCount(arrayBuffer);
    }
    if (extension === 'pptx') {
      return await parsePptxSlideCount(arrayBuffer);
    }
  } catch (error) {
    console.warn(`Failed to parse page count for ${file.name}:`, error);
  }
  return undefined;
}

export async function getUrlPageCount(url: string, extension: string): Promise<number | undefined> {
  try {
    const cleanExt = extension.toLowerCase().replace(/^\./, '');
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const arrayBuffer = await res.arrayBuffer();

    if (cleanExt === 'pdf') {
      return await parsePdfPageCount(arrayBuffer);
    }
    if (cleanExt === 'docx') {
      return await parseDocxPageCount(arrayBuffer);
    }
    if (cleanExt === 'pptx') {
      return await parsePptxSlideCount(arrayBuffer);
    }
  } catch (error) {
    console.warn(`Failed to parse page count for URL ${url}:`, error);
  }
  return undefined;
}
