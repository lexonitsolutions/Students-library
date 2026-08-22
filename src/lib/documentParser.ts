import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export async function getDocumentPageCount(file: File): Promise<number | undefined> {
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    } 
    
    if (['docx', 'pptx'].includes(extension || '')) {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      const appXmlFile = zip.file('docProps/app.xml');
      if (appXmlFile) {
        const appXmlText = await appXmlFile.async('text');
        
        if (extension === 'docx') {
          const match = appXmlText.match(/<Pages>(\d+)<\/Pages>/i) || appXmlText.match(/<[^:]+:Pages>(\d+)<\/[^:]+:Pages>/i);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
        } else if (extension === 'pptx') {
          const match = appXmlText.match(/<Slides>(\d+)<\/Slides>/i) || appXmlText.match(/<[^:]+:Slides>(\d+)<\/[^:]+:Slides>/i);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to parse page count for ${file.name}:`, error);
  }
  
  return undefined;
}

export async function getUrlPageCount(url: string, extension: string): Promise<number | undefined> {
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();

    if (extension === 'pdf') {
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    } 
    
    if (['docx', 'pptx'].includes(extension)) {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const appXmlFile = zip.file('docProps/app.xml');
      if (appXmlFile) {
        const appXmlText = await appXmlFile.async('text');
        
        if (extension === 'docx') {
          const match = appXmlText.match(/<Pages>(\d+)<\/Pages>/i) || appXmlText.match(/<[^:]+:Pages>(\d+)<\/[^:]+:Pages>/i);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
        } else if (extension === 'pptx') {
          const match = appXmlText.match(/<Slides>(\d+)<\/Slides>/i) || appXmlText.match(/<[^:]+:Slides>(\d+)<\/[^:]+:Slides>/i);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to parse page count for URL ${url}:`, error);
  }
  return undefined;
}
