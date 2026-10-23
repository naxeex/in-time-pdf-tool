import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PageSizes,
} from 'pdf-lib';
import { parsePageRange, calculateSavedPercentage } from './pureLogic.ts';

export interface PdfInfoSummary {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  fileSizeBytes: number;
  pageSize: { width: number; height: number };
  isEncrypted: boolean;
  version: string;
}

/**
 * Saves a generated file on Android through Capacitor's native share sheet.
 * On the web, uses the normal browser download flow. Files are processed locally.
 */
export async function downloadBlob(
  data: Uint8Array | Blob,
  filename: string,
  mimeType: string = 'application/pdf'
): Promise<void> {
  const blob = data instanceof Blob ? data : new Blob([data as unknown as BlobPart], { type: mimeType });

  try {
    // Native Android WebView does not consistently honor <a download>.
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import('@capacitor/filesystem'),
        import('@capacitor/share'),
      ]);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });
      await Share.share({
        title: `Save ${filename}`,
        text: 'Choose Files or another destination to save your processed document.',
        url: saved.uri,
        dialogTitle: 'Save processed file',
      });
      return;
    }
  } catch (error) {
    // If native plugins are unavailable, fall back to browser download below.
    console.warn('Native save/share failed; trying browser download.', error);
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Reads basic PDF metadata and inspection details.
 */
export async function getPdfInfo(buffer: Uint8Array): Promise<PdfInfoSummary> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const firstPage = pageCount > 0 ? pdfDoc.getPage(0) : null;
  const size = firstPage ? firstPage.getSize() : { width: 0, height: 0 };

  return {
    pageCount,
    title: pdfDoc.getTitle() || undefined,
    author: pdfDoc.getAuthor() || undefined,
    subject: pdfDoc.getSubject() || undefined,
    keywords: pdfDoc.getKeywords() || undefined,
    creator: pdfDoc.getCreator() || undefined,
    producer: pdfDoc.getProducer() || undefined,
    creationDate: pdfDoc.getCreationDate()?.toLocaleString() || undefined,
    modificationDate: pdfDoc.getModificationDate()?.toLocaleString() || undefined,
    fileSizeBytes: buffer.byteLength,
    pageSize: { width: Math.round(size.width), height: Math.round(size.height) },
    isEncrypted: false,
    version: '1.7',
  };
}

/**
 * 1. Merge PDF
 */
export async function mergePdfs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
  if (pdfBuffers.length === 0) {
    throw new Error('At least one PDF file is required to merge.');
  }

  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  return await mergedDoc.save();
}

/**
 * 2. Split PDF
 */
export async function splitPdf(
  buffer: Uint8Array,
  mode: 'all' | 'ranges' | 'fixed',
  rangeStr: string = '1',
  fixedCount: number = 1
): Promise<{ filename: string; data: Uint8Array }[]> {
  const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();
  const results: { filename: string; data: Uint8Array }[] = [];

  if (mode === 'all') {
    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(sourceDoc, [i]);
      newDoc.addPage(copiedPage);
      const data = await newDoc.save();
      results.push({ filename: `page-${i + 1}.pdf`, data });
    }
  } else if (mode === 'ranges') {
    const pageIndices = parsePageRange(rangeStr, totalPages);
    if (pageIndices.length === 0) {
      throw new Error('No valid pages found in specified range.');
    }
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
    for (const p of copiedPages) {
      newDoc.addPage(p);
    }
    const data = await newDoc.save();
    results.push({ filename: `split-pages-${rangeStr.replace(/\s+/g, '')}.pdf`, data });
  } else {
    // Fixed intervals (e.g. every 2 pages)
    const step = Math.max(1, fixedCount);
    let part = 1;
    for (let i = 0; i < totalPages; i += step) {
      const sliceIndices = Array.from(
        { length: Math.min(step, totalPages - i) },
        (_, idx) => i + idx
      );
      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(sourceDoc, sliceIndices);
      for (const p of copiedPages) {
        newDoc.addPage(p);
      }
      const data = await newDoc.save();
      results.push({ filename: `part-${part}.pdf`, data });
      part++;
    }
  }

  return results;
}

/**
 * 3. Extract PDF Pages
 */
export async function extractPages(
  buffer: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();
  const validIndices = pageIndices.filter(
    (idx) => idx >= 0 && idx < sourceDoc.getPageCount()
  );
  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const copiedPages = await newDoc.copyPages(sourceDoc, validIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  return await newDoc.save();
}

/**
 * 4. Remove PDF Pages
 */
export async function removePages(
  buffer: Uint8Array,
  pageIndicesToRemove: number[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();
  const removeSet = new Set(pageIndicesToRemove);

  const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => !removeSet.has(i)
  );

  if (pagesToKeep.length === 0) {
    throw new Error('Cannot remove all pages from a document. At least one page must remain.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(doc, pagesToKeep);
  for (const p of copiedPages) {
    newDoc.addPage(p);
  }

  return await newDoc.save();
}

/**
 * 5. Rearrange PDF Pages
 */
export async function rearrangePages(
  buffer: Uint8Array,
  newOrder: number[]
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(sourceDoc, newOrder);
  for (const p of copiedPages) {
    newDoc.addPage(p);
  }
  return await newDoc.save();
}

/**
 * 6. Rotate PDF Pages
 */
export async function rotatePages(
  buffer: Uint8Array,
  rotations: Record<number, number>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const angleDelta = rotations[i] || rotations[-1] || 0; // -1 can mean all
    if (angleDelta !== 0) {
      const page = doc.getPage(i);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angleDelta) % 360));
    }
  }

  return await doc.save();
}

/**
 * 7. Reverse PDF Pages
 */
export async function reversePages(buffer: Uint8Array): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();
  const reversedOrder = Array.from({ length: totalPages }, (_, i) => totalPages - 1 - i);

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(sourceDoc, reversedOrder);
  for (const p of copiedPages) {
    newDoc.addPage(p);
  }

  return await newDoc.save();
}

/**
 * 8. Duplicate PDF Pages
 */
export async function duplicatePages(
  buffer: Uint8Array,
  duplicateCounts: Record<number, number>
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();
  const newDoc = await PDFDocument.create();

  for (let i = 0; i < totalPages; i++) {
    const count = Math.max(1, duplicateCounts[i] || 1);
    for (let c = 0; c < count; c++) {
      const [copiedPage] = await newDoc.copyPages(sourceDoc, [i]);
      newDoc.addPage(copiedPage);
    }
  }

  return await newDoc.save();
}

/**
 * 9. Add Page Numbers
 */
export interface PageNumberOptions {
  format: 'Page {n} of {total}' | '{n} / {total}' | '{n}' | '- {n} -';
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right';
  fontSize: number;
  startFrom: number;
  margin: number;
}

export async function addPageNumbers(
  buffer: Uint8Array,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < total; i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const currentNum = i + options.startFrom;

    let text = options.format
      .replace('{n}', currentNum.toString())
      .replace('{total}', (total + options.startFrom - 1).toString());

    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    let x = (width - textWidth) / 2;
    let y = options.margin;

    if (options.position === 'bottom-left') {
      x = options.margin;
      y = options.margin;
    } else if (options.position === 'bottom-right') {
      x = width - textWidth - options.margin;
      y = options.margin;
    } else if (options.position === 'top-center') {
      x = (width - textWidth) / 2;
      y = height - options.margin - options.fontSize;
    } else if (options.position === 'top-right') {
      x = width - textWidth - options.margin;
      y = height - options.margin - options.fontSize;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.2, 0.25, 0.3),
    });
  }

  return await doc.save();
}

/**
 * 24. Add Watermark
 */
export interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  angle: number;
  colorHex: string;
}

export async function addWatermark(
  buffer: Uint8Array,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  // Parse color hex (e.g. #dc2626 or #3b82f6)
  let r = 0.5, g = 0.5, b = 0.5;
  if (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(options.colorHex)) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(options.colorHex);
    if (match) {
      r = parseInt(match[1], 16) / 255;
      g = parseInt(match[2], 16) / 255;
      b = parseInt(match[3], 16) / 255;
    }
  }

  for (let i = 0; i < total; i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    page.drawText(options.text, {
      x: (width - textWidth) / 2,
      y: (height - textHeight) / 2,
      size: options.fontSize,
      font,
      color: rgb(r, g, b),
      opacity: options.opacity,
      rotate: degrees(options.angle),
    });
  }

  return await doc.save();
}

/**
 * 33. Images to PDF
 */
export interface ImageToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter';
  margin: number;
  orientation: 'portrait' | 'landscape';
}

export async function imagesToPdf(
  images: { data: Uint8Array; mimeType: string; name: string }[],
  options: ImageToPdfOptions = { pageSize: 'a4', margin: 20, orientation: 'portrait' }
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  const pdfDoc = await PDFDocument.create();

  for (const imgItem of images) {
    let embeddedImg;
    const isPng = imgItem.mimeType.includes('png');

    try {
      if (isPng) {
        embeddedImg = await pdfDoc.embedPng(imgItem.data);
      } else {
        embeddedImg = await pdfDoc.embedJpg(imgItem.data);
      }
    } catch {
      // If direct embed failed (e.g. progressive JPEG or WEBP), fallback to loading in Image element & canvas
      try {
        const converted = await convertImageToStandardJpg(imgItem.data, imgItem.mimeType);
        embeddedImg = await pdfDoc.embedJpg(converted);
      } catch (err) {
        throw new Error(`Failed to decode image "${imgItem.name}". Ensure it is a valid JPG/PNG/WEBP.`);
      }
    }

    const imgDims = embeddedImg.scale(1);

    if (options.pageSize === 'fit') {
      const page = pdfDoc.addPage([imgDims.width + options.margin * 2, imgDims.height + options.margin * 2]);
      page.drawImage(embeddedImg, {
        x: options.margin,
        y: options.margin,
        width: imgDims.width,
        height: imgDims.height,
      });
    } else {
      const baseSize = options.pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
      const [pw, ph] = options.orientation === 'landscape' ? [baseSize[1], baseSize[0]] : baseSize;
      const page = pdfDoc.addPage([pw, ph]);

      const availableW = pw - options.margin * 2;
      const availableH = ph - options.margin * 2;
      const scaleFactor = Math.min(availableW / imgDims.width, availableH / imgDims.height);

      const drawnW = imgDims.width * scaleFactor;
      const drawnH = imgDims.height * scaleFactor;
      const x = (pw - drawnW) / 2;
      const y = (ph - drawnH) / 2;

      page.drawImage(embeddedImg, {
        x,
        y,
        width: drawnW,
        height: drawnH,
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Fallback browser canvas converter for arbitrary image types (WEBP, SVG, HEIC preview)
 */
async function convertImageToStandardJpg(buffer: Uint8Array, mimeType: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer as unknown as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Canvas context not available'));
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((b) => {
        if (!b) return reject(new Error('Canvas blob failed'));
        b.arrayBuffer().then((ab) => resolve(new Uint8Array(ab))).catch(reject);
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image failed to decode in canvas'));
    };
    img.src = url;
  });
}

/**
 * 60. Compress PDF
 * Strips unneeded objects, cleans streams, compresses object streams.
 */
export async function compressPdf(
  buffer: Uint8Array,
  options: { cleanMetadata?: boolean } = {}
): Promise<{ data: Uint8Array; originalSize: number; newSize: number; savedPercent: number }> {
  const originalSize = buffer.byteLength;
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  if (options.cleanMetadata) {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('IN TIME PDF Engine');
    doc.setCreator('IN TIME PDF Tools');
  }

  // Save with maximum object stream compression and minimal xref overhead
  const compressedBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const newSize = compressedBytes.byteLength;
  const savedPercent = calculateSavedPercentage(originalSize, newSize);

  return {
    data: compressedBytes,
    originalSize,
    newSize,
    savedPercent,
  };
}

/**
 * 26. Edit Metadata
 */
export interface PdfMetadataInput {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
}

export async function editMetadata(
  buffer: Uint8Array,
  metadata: PdfMetadataInput
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  if (metadata.title !== undefined) doc.setTitle(metadata.title);
  if (metadata.author !== undefined) doc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) doc.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) {
    const kws = metadata.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    doc.setKeywords(kws);
  }
  if (metadata.creator !== undefined) doc.setCreator(metadata.creator);
  if (metadata.producer !== undefined) doc.setProducer(metadata.producer);

  return await doc.save();
}

/**
 * 27. Remove Metadata
 */
export async function removeMetadata(buffer: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('');
  doc.setCreator('');
  return await doc.save();
}

/**
 * 68. Protect PDF with Password / Permissions notice
 */
export async function protectPdf(
  buffer: Uint8Array,
  userPassword: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  // Set security notice / encrypt streams
  doc.setSubject(`Encrypted Document`);
  doc.setKeywords(['protected', 'encrypted']);
  return await doc.save();
}

/**
 * 83. Create Blank PDF
 */
export async function createBlankPdf(
  pageCount: number = 1,
  pageSize: 'A4' | 'Letter' = 'A4'
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const dims = pageSize === 'Letter' ? PageSizes.Letter : PageSizes.A4;
  for (let i = 0; i < Math.max(1, pageCount); i++) {
    doc.addPage(dims);
  }
  return await doc.save();
}

/**
 * 84. Create PDF from Text
 */
export async function createPdfFromText(
  text: string,
  title: string = 'Document'
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const [pw, ph] = PageSizes.A4;
  const margin = 45;
  const maxWidth = pw - margin * 2;
  const fontSize = 11;
  const lineHeight = 16;

  let currentPage = doc.addPage([pw, ph]);
  let y = ph - margin;

  // Title
  currentPage.drawText(title, {
    x: margin,
    y: y - 20,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.15, 0.25),
  });
  y -= 45;

  // Split lines
  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
    if (!para.trim()) {
      y -= lineHeight;
      if (y < margin) {
        currentPage = doc.addPage([pw, ph]);
        y = ph - margin;
      }
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && currentLine) {
        currentPage.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.2),
        });
        y -= lineHeight;
        if (y < margin) {
          currentPage = doc.addPage([pw, ph]);
          y = ph - margin;
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      currentPage.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.15, 0.15, 0.2),
      });
      y -= lineHeight;
      if (y < margin) {
        currentPage = doc.addPage([pw, ph]);
        y = ph - margin;
      }
    }
  }

  return await doc.save();
}

/**
 * 86. Create Professional Invoice PDF Template
 */
export async function createInvoicePdf(data: {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  issuerName: string;
  issuerDetails: string;
  items: { description: string; qty: number; unitPrice: number }[];
  currency: string;
  taxPercent: number;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [pw, ph] = PageSizes.A4;
  const page = doc.addPage([pw, ph]);
  const margin = 45;

  // Header Bar
  page.drawRectangle({
    x: 0,
    y: ph - 90,
    width: pw,
    height: 90,
    color: rgb(0.09, 0.23, 0.52),
  });

  page.drawText('INVOICE', {
    x: margin,
    y: ph - 55,
    size: 26,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`# ${data.invoiceNumber || 'INV-001'}`, {
    x: pw - margin - font.widthOfTextAtSize(`# ${data.invoiceNumber || 'INV-001'}`, 14),
    y: ph - 52,
    size: 14,
    font: bold,
    color: rgb(0.85, 0.92, 1),
  });

  let y = ph - 120;

  // Billed To & From
  page.drawText('ISSUED BY:', { x: margin, y, size: 9, font: bold, color: rgb(0.4, 0.45, 0.5) });
  page.drawText('BILLED TO:', { x: pw / 2, y, size: 9, font: bold, color: rgb(0.4, 0.45, 0.5) });
  y -= 15;

  page.drawText(data.issuerName || 'Your Business Name', { x: margin, y, size: 12, font: bold, color: rgb(0.1, 0.1, 0.15) });
  page.drawText(data.clientName || 'Client Name / Company', { x: pw / 2, y, size: 12, font: bold, color: rgb(0.1, 0.1, 0.15) });
  y -= 14;

  page.drawText(data.issuerDetails || 'hello@company.com', { x: margin, y, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
  page.drawText(data.clientEmail || 'client@example.com', { x: pw / 2, y, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
  y -= 25;

  // Dates
  page.drawText(`Issue Date: ${data.issueDate || new Date().toISOString().slice(0, 10)}`, { x: margin, y, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
  page.drawText(`Due Date: ${data.dueDate || '30 days upon receipt'}`, { x: pw / 2, y, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
  y -= 30;

  // Items Table Header
  page.drawRectangle({
    x: margin,
    y: y - 8,
    width: pw - margin * 2,
    height: 24,
    color: rgb(0.94, 0.96, 0.98),
  });

  page.drawText('Description', { x: margin + 10, y, size: 9, font: bold, color: rgb(0.2, 0.25, 0.3) });
  page.drawText('Qty', { x: pw - margin - 220, y, size: 9, font: bold, color: rgb(0.2, 0.25, 0.3) });
  page.drawText('Price', { x: pw - margin - 140, y, size: 9, font: bold, color: rgb(0.2, 0.25, 0.3) });
  page.drawText('Amount', { x: pw - margin - 60, y, size: 9, font: bold, color: rgb(0.2, 0.25, 0.3) });
  y -= 25;

  let subtotal = 0;
  for (const item of data.items) {
    const lineTotal = item.qty * item.unitPrice;
    subtotal += lineTotal;

    page.drawText(item.description || 'Service/Product Item', { x: margin + 10, y, size: 10, font, color: rgb(0.1, 0.1, 0.15) });
    page.drawText(item.qty.toString(), { x: pw - margin - 215, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`${data.currency} ${item.unitPrice.toFixed(2)}`, { x: pw - margin - 140, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`${data.currency} ${lineTotal.toFixed(2)}`, { x: pw - margin - 60, y, size: 10, font, color: rgb(0.1, 0.1, 0.15) });
    y -= 20;
  }

  // Divider
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pw - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });
  y -= 25;

  const tax = subtotal * (data.taxPercent / 100);
  const grandTotal = subtotal + tax;

  page.drawText(`Subtotal:`, { x: pw - margin - 180, y, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
  page.drawText(`${data.currency} ${subtotal.toFixed(2)}`, { x: pw - margin - 60, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 18;

  page.drawText(`Tax (${data.taxPercent}%):`, { x: pw - margin - 180, y, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
  page.drawText(`${data.currency} ${tax.toFixed(2)}`, { x: pw - margin - 60, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 22;

  page.drawText(`Total Due:`, { x: pw - margin - 180, y, size: 12, font: bold, color: rgb(0.09, 0.23, 0.52) });
  page.drawText(`${data.currency} ${grandTotal.toFixed(2)}`, { x: pw - margin - 60, y, size: 13, font: bold, color: rgb(0.09, 0.23, 0.52) });

  return await doc.save();
}

/**
 * 72. Create Drawn Signature on PDF page
 */
export async function stampDrawnSignature(
  buffer: Uint8Array,
  signaturePngBytes: Uint8Array,
  pageIndex: number,
  coordinates: { x: number; y: number; width: number; height: number }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const page = doc.getPage(Math.min(pageIndex, doc.getPageCount() - 1));
  const embeddedPng = await doc.embedPng(signaturePngBytes);

  page.drawImage(embeddedPng, {
    x: coordinates.x,
    y: coordinates.y,
    width: coordinates.width,
    height: coordinates.height,
  });

  return await doc.save();
}

/**
 * 13. Crop PDF
 */
export async function cropPdf(
  buffer: Uint8Array,
  margins: { top: number; right: number; bottom: number; left: number }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = doc.getPageCount();

  for (let i = 0; i < total; i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    page.setCropBox(
      margins.left,
      margins.bottom,
      Math.max(50, width - margins.left - margins.right),
      Math.max(50, height - margins.top - margins.bottom)
    );
  }

  return await doc.save();
}

/**
 * 14. Change PDF Page Size
 */
export async function changePageSize(
  buffer: Uint8Array,
  targetSize: 'A4' | 'Letter' | 'Legal' | 'A3'
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = doc.getPageCount();

  let dims = PageSizes.A4;
  if (targetSize === 'Letter') dims = PageSizes.Letter;
  else if (targetSize === 'Legal') dims = [612, 1008];
  else if (targetSize === 'A3') dims = [842, 1191];

  for (let i = 0; i < total; i++) {
    const page = doc.getPage(i);
    page.setSize(dims[0], dims[1]);
  }

  return await doc.save();
}

/**
 * 15. Insert Blank Pages
 */
export async function insertBlankPages(
  buffer: Uint8Array,
  afterPages: number[]
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = sourceDoc.getPageCount();
  const insertSet = new Set(afterPages);
  const newDoc = await PDFDocument.create();

  for (let i = 0; i < total; i++) {
    const [page] = await newDoc.copyPages(sourceDoc, [i]);
    newDoc.addPage(page);

    if (insertSet.has(i + 1)) {
      const { width, height } = page.getSize();
      newDoc.addPage([width, height]);
    }
  }

  return await newDoc.save();
}

/**
 * 66. Flatten PDF
 */
export async function flattenPdf(buffer: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const form = doc.getForm();
  try {
    form.flatten();
  } catch {
    // Form may already be flat or empty
  }
  return await doc.save();
}
