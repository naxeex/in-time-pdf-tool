import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
}

export interface RenderedPageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads a PDF document and renders a specific page to an HTML canvas, returning a data URL.
 */
export async function renderPdfPageToDataUrl(
  pdfBytes: Uint8Array,
  pageNumber: number,
  scale: number = 0.5
): Promise<RenderedPageThumbnail> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }

  // White background for transparent PDF pages
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  return {
    pageNumber,
    dataUrl,
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * Converts all pages of a PDF to images and bundles them in a JSZip file (or single image).
 */
export async function convertPdfToImagesZip(
  pdfBytes: Uint8Array,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg',
  scale: number = 1.5,
  onProgress?: (current: number, total: number) => void
): Promise<{ zipBlob: Blob; images: { page: number; dataUrl: string; filename: string }[] }> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const zip = new JSZip();
  const images: { page: number; dataUrl: string; filename: string }[] = [];
  const ext = format === 'jpeg' ? 'jpg' : format;
  const mimeType = `image/${format}`;

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (context) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport, canvas }).promise;

      const dataUrl = canvas.toDataURL(mimeType, 0.92);
      const filename = `page-${i.toString().padStart(3, '0')}.${ext}`;
      images.push({ page: i, dataUrl, filename });

      // Add to ZIP as base64 without header
      const base64Data = dataUrl.split(',')[1];
      zip.file(filename, base64Data, { base64: true });
    }

    if (onProgress) {
      onProgress(i, total);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { zipBlob, images };
}

/**
 * Extracts pure embedded text from all pages of a PDF.
 */
export async function extractTextFromPdf(
  pdfBytes: Uint8Array,
  onProgress?: (current: number, total: number) => void
): Promise<{ fullText: string; pageTexts: { page: number; text: string }[] }> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const pageTexts: { page: number; text: string }[] = [];
  let fullText = '';

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as { str: string; hasEOL?: boolean }[];

    let pageStr = '';
    for (const item of items) {
      pageStr += item.str + (item.hasEOL ? '\n' : ' ');
    }

    pageTexts.push({ page: i, text: pageStr.trim() });
    fullText += `--- Page ${i} ---\n` + pageStr.trim() + '\n\n';

    if (onProgress) {
      onProgress(i, total);
    }
  }

  return { fullText: fullText.trim(), pageTexts };
}
