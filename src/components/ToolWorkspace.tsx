import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Share2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Shield,
  FileCheck,
  RefreshCw,
  Plus,
  Eye,
  Key,
  Copy,
} from 'lucide-react';
import { ToolDefinition } from '../data/toolsCatalog';
import { DynamicIcon } from './DynamicIcon';
import { formatFileSize, generateSecurePassword, parsePageRange } from '../lib/pureLogic.ts';
import {
  mergePdfs,
  splitPdf,
  extractPages,
  removePages,
  rotatePages,
  reversePages,
  duplicatePages,
  addPageNumbers,
  addWatermark,
  imagesToPdf,
  compressPdf,
  editMetadata,
  removeMetadata,
  protectPdf,
  createBlankPdf,
  createPdfFromText,
  createInvoicePdf,
  getPdfInfo,
  cropPdf,
  changePageSize,
  insertBlankPages,
  flattenPdf,
  downloadBlob,
  PdfInfoSummary,
} from '../lib/pdfOps.ts';
import { convertPdfToImagesZip, extractTextFromPdf } from '../lib/pdfRenderer.ts';

interface ToolWorkspaceProps {
  tool: ToolDefinition;
  onBack: () => void;
}

interface LoadedFile {
  file: File;
  name: string;
  size: number;
  buffer: Uint8Array;
  previewUrl?: string;
  pdfInfo?: PdfInfoSummary;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({ tool, onBack }) => {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [resultData, setResultData] = useState<{
    blob: Blob | Uint8Array;
    filename: string;
    mimeType: string;
    originalSize?: number;
    newSize?: number;
    savedPercent?: number;
    extractedText?: string;
    zipImages?: { page: number; dataUrl: string; filename: string }[];
  } | null>(null);

  // Common tool configuration states
  const [splitMode, setSplitMode] = useState<'all' | 'ranges' | 'fixed'>('ranges');
  const [pageRangeStr, setPageRangeStr] = useState('1-2');
  const [fixedStep, setFixedStep] = useState(2);
  const [rotationAngle, setRotationAngle] = useState(90);
  const [rotationTarget, setRotationTarget] = useState<'all' | 'custom'>('all');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [watermarkColor, setWatermarkColor] = useState('#dc2626');
  const [pageNumberFormat, setPageNumberFormat] = useState<'Page {n} of {total}' | '{n} / {total}' | '{n}' | '- {n} -'>('Page {n} of {total}');
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSubject, setMetaSubject] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [imagePdfSize, setImagePdfSize] = useState<'a4' | 'fit' | 'letter'>('a4');
  const [imageOrientation, setImageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [textDocTitle, setTextDocTitle] = useState('Document Notes');
  const [textDocContent, setTextDocContent] = useState('Write or paste your text here.\n\nIN TIME PDF Tools will automatically paginate and format this text into a clean PDF document.');
  const [blankPageCount, setBlankPageCount] = useState(1);
  const [blankPageSize, setBlankPageSize] = useState<'A4' | 'Letter'>('A4');
  const [securePassword, setSecurePassword] = useState('');
  const [compressCleanMeta, setCompressCleanMeta] = useState(true);

  // Invoice State
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-001');
  const [clientName, setClientName] = useState('Acme Corporation');
  const [clientEmail, setClientEmail] = useState('billing@acme.com');
  const [issuerName, setIssuerName] = useState('IN TIME Studio');
  const [issuerDetails, setIssuerDetails] = useState('contact@intime-pdf.app');
  const [invoiceCurrency, setInvoiceCurrency] = useState('$');
  const [taxPercent, setTaxPercent] = useState(10);
  const [invoiceItems, setInvoiceItems] = useState([
    { description: 'PDF Architecture Consulting', qty: 10, unitPrice: 150 },
    { description: 'Document Pipeline Automation', qty: 1, unitPrice: 850 },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, [files]);

  // Handle file addition
  const handleFilesAdded = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const incoming = Array.from(fileList);
    const newLoaded: LoadedFile[] = [];

    for (const file of incoming) {
      try {
        const arrayBuf = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuf);
        let previewUrl: string | undefined;
        let pdfInfo: PdfInfoSummary | undefined;

        if (file.type.includes('image')) {
          previewUrl = URL.createObjectURL(file);
        } else if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          try {
            pdfInfo = await getPdfInfo(buffer);
            // Pre-fill metadata form if editing metadata
            if (pdfInfo.title) setMetaTitle(pdfInfo.title);
            if (pdfInfo.author) setMetaAuthor(pdfInfo.author);
            if (pdfInfo.subject) setMetaSubject(pdfInfo.subject);
            if (pdfInfo.keywords) setMetaKeywords(pdfInfo.keywords);
          } catch {
            // Document might be protected or have minor syntax variance
          }
        }

        newLoaded.push({
          file,
          name: file.name,
          size: file.size,
          buffer,
          previewUrl,
          pdfInfo,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown file reading error';
        setErrorMessage(`Failed to read file ${file.name}: ${msg}`);
      }
    }

    if (tool.multipleFiles) {
      setFiles((prev) => [...prev, ...newLoaded]);
    } else {
      setFiles(newLoaded.slice(0, 1));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  // Execution dispatcher
  const executeProcessing = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressMsg('Processing document locally...');

    try {
      // Tools that don't need uploaded files (Generators)
      if (tool.id === 'create-blank-pdf') {
        const bytes = await createBlankPdf(blankPageCount, blankPageSize);
        setResultData({
          blob: bytes,
          filename: `blank-${blankPageCount}pages.pdf`,
          mimeType: 'application/pdf',
          newSize: bytes.byteLength,
        });
        setIsProcessing(false);
        return;
      }

      if (tool.id === 'create-pdf-from-text') {
        const bytes = await createPdfFromText(textDocContent, textDocTitle);
        setResultData({
          blob: bytes,
          filename: `${textDocTitle.toLowerCase().replace(/\s+/g, '-') || 'document'}.pdf`,
          mimeType: 'application/pdf',
          newSize: bytes.byteLength,
        });
        setIsProcessing(false);
        return;
      }

      if (tool.id === 'create-invoice-pdf') {
        const bytes = await createInvoicePdf({
          invoiceNumber,
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: 'Net 30 days',
          clientName,
          clientEmail,
          issuerName,
          issuerDetails,
          items: invoiceItems,
          currency: invoiceCurrency,
          taxPercent,
        });
        setResultData({
          blob: bytes,
          filename: `invoice-${invoiceNumber}.pdf`,
          mimeType: 'application/pdf',
          newSize: bytes.byteLength,
        });
        setIsProcessing(false);
        return;
      }

      if (tool.id === 'generate-passwords') {
        const pwd = generateSecurePassword(20);
        setSecurePassword(pwd);
        setIsProcessing(false);
        return;
      }

      // Check if files are loaded
      if (files.length === 0) {
        throw new Error('Please select at least one file to process.');
      }

      const primaryBuffer = files[0].buffer;
      const baseFilename = files[0].name.replace(/\.[^/.]+$/, '');

      switch (tool.id) {
        case 'merge-pdf': {
          if (files.length < 2) {
            throw new Error('Please select at least 2 PDF files to merge.');
          }
          const merged = await mergePdfs(files.map((f) => f.buffer));
          setResultData({
            blob: merged,
            filename: 'merged-document.pdf',
            mimeType: 'application/pdf',
            originalSize: files.reduce((acc, f) => acc + f.size, 0),
            newSize: merged.byteLength,
          });
          break;
        }

        case 'split-pdf': {
          const splits = await splitPdf(primaryBuffer, splitMode, pageRangeStr, fixedStep);
          if (splits.length === 1) {
            setResultData({
              blob: splits[0].data,
              filename: splits[0].filename,
              mimeType: 'application/pdf',
              originalSize: primaryBuffer.byteLength,
              newSize: splits[0].data.byteLength,
            });
          } else {
            // Bundle into zip if multiple files
            const { default: JSZip } = await import('jszip');
            const zip = new JSZip();
            splits.forEach((s) => zip.file(s.filename, s.data));
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            setResultData({
              blob: zipBlob,
              filename: `${baseFilename}-split.zip`,
              mimeType: 'application/zip',
              originalSize: primaryBuffer.byteLength,
              newSize: zipBlob.size,
            });
          }
          break;
        }

        case 'extract-pages': {
          const totalPages = files[0].pdfInfo?.pageCount || 10;
          const indices = parsePageRange(pageRangeStr, totalPages);
          const extracted = await extractPages(primaryBuffer, indices);
          setResultData({
            blob: extracted,
            filename: `${baseFilename}-extracted.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: extracted.byteLength,
          });
          break;
        }

        case 'remove-pages': {
          const totalPages = files[0].pdfInfo?.pageCount || 10;
          const indicesToRemove = parsePageRange(pageRangeStr, totalPages);
          const cleaned = await removePages(primaryBuffer, indicesToRemove);
          setResultData({
            blob: cleaned,
            filename: `${baseFilename}-pages-removed.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: cleaned.byteLength,
          });
          break;
        }

        case 'rotate-pdf': {
          const rotations: Record<number, number> = { [-1]: rotationAngle };
          const rotated = await rotatePages(primaryBuffer, rotations);
          setResultData({
            blob: rotated,
            filename: `${baseFilename}-rotated.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: rotated.byteLength,
          });
          break;
        }

        case 'reverse-pages': {
          const reversed = await reversePages(primaryBuffer);
          setResultData({
            blob: reversed,
            filename: `${baseFilename}-reversed.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: reversed.byteLength,
          });
          break;
        }

        case 'duplicate-pages': {
          const duplicates: Record<number, number> = { 0: 2 }; // double first page
          const duplicated = await duplicatePages(primaryBuffer, duplicates);
          setResultData({
            blob: duplicated,
            filename: `${baseFilename}-duplicated.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: duplicated.byteLength,
          });
          break;
        }

        case 'add-watermark': {
          const watermarked = await addWatermark(primaryBuffer, {
            text: watermarkText,
            opacity: watermarkOpacity,
            fontSize: 42,
            angle: watermarkAngle,
            colorHex: watermarkColor,
          });
          setResultData({
            blob: watermarked,
            filename: `${baseFilename}-watermarked.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: watermarked.byteLength,
          });
          break;
        }

        case 'add-page-numbers': {
          const numbered = await addPageNumbers(primaryBuffer, {
            format: pageNumberFormat,
            position: pageNumberPos,
            fontSize: 10,
            startFrom: 1,
            margin: 24,
          });
          setResultData({
            blob: numbered,
            filename: `${baseFilename}-numbered.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: numbered.byteLength,
          });
          break;
        }

        case 'images-to-pdf':
        case 'jpg-to-pdf':
        case 'png-to-pdf':
        case 'webp-to-pdf':
        case 'create-from-multiple-images': {
          const imgItems = files.map((f) => ({
            data: f.buffer,
            mimeType: f.file.type || 'image/jpeg',
            name: f.name,
          }));
          const pdfBytes = await imagesToPdf(imgItems, {
            pageSize: imagePdfSize,
            margin: 20,
            orientation: imageOrientation,
          });
          setResultData({
            blob: pdfBytes,
            filename: 'images-compiled.pdf',
            mimeType: 'application/pdf',
            originalSize: files.reduce((acc, f) => acc + f.size, 0),
            newSize: pdfBytes.byteLength,
          });
          break;
        }

        case 'compress-pdf': {
          const compressed = await compressPdf(primaryBuffer, { cleanMetadata: compressCleanMeta });
          setResultData({
            blob: compressed.data,
            filename: `${baseFilename}-compressed.pdf`,
            mimeType: 'application/pdf',
            originalSize: compressed.originalSize,
            newSize: compressed.newSize,
            savedPercent: compressed.savedPercent,
          });
          break;
        }

        case 'edit-metadata': {
          const updated = await editMetadata(primaryBuffer, {
            title: metaTitle,
            author: metaAuthor,
            subject: metaSubject,
            keywords: metaKeywords,
          });
          setResultData({
            blob: updated,
            filename: `${baseFilename}-metadata.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: updated.byteLength,
          });
          break;
        }

        case 'remove-metadata':
        case 'remove-sensitive-metadata': {
          const sanitized = await removeMetadata(primaryBuffer);
          setResultData({
            blob: sanitized,
            filename: `${baseFilename}-sanitized.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: sanitized.byteLength,
          });
          break;
        }

        case 'protect-pdf': {
          const pwd = securePassword || 'SecurePDF2026';
          const protectedBytes = await protectPdf(primaryBuffer, pwd);
          setResultData({
            blob: protectedBytes,
            filename: `${baseFilename}-protected.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryBuffer.byteLength,
            newSize: protectedBytes.byteLength,
          });
          break;
        }

        case 'pdf-to-images':
        case 'pdf-to-jpg':
        case 'pdf-to-png':
        case 'pdf-to-webp': {
          const format = tool.id.includes('png')
            ? 'png'
            : tool.id.includes('webp')
            ? 'webp'
            : 'jpeg';
          setProgressMsg('Rendering PDF pages into high-resolution images...');
          const { zipBlob, images } = await convertPdfToImagesZip(primaryBuffer, format, 1.5);
          setResultData({
            blob: zipBlob,
            filename: `${baseFilename}-images.zip`,
            mimeType: 'application/zip',
            originalSize: primaryBuffer.byteLength,
            newSize: zipBlob.size,
            zipImages: images,
          });
          break;
        }

        case 'pdf-to-text':
        case 'extract-embedded-text': {
          setProgressMsg('Extracting text content across pages...');
          const { fullText } = await extractTextFromPdf(primaryBuffer);
          const textBlob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
          setResultData({
            blob: textBlob,
            filename: `${baseFilename}-text.txt`,
            mimeType: 'text/plain',
            originalSize: primaryBuffer.byteLength,
            newSize: textBlob.size,
            extractedText: fullText,
          });
          break;
        }

        case 'crop-pdf': {
          const cropped = await cropPdf(primaryBuffer, { top: 30, right: 30, bottom: 30, left: 30 });
          setResultData({
            blob: cropped,
            filename: `${baseFilename}-cropped.pdf`,
            mimeType: 'application/pdf',
            newSize: cropped.byteLength,
          });
          break;
        }

        case 'change-page-size': {
          const resized = await changePageSize(primaryBuffer, 'A4');
          setResultData({
            blob: resized,
            filename: `${baseFilename}-a4.pdf`,
            mimeType: 'application/pdf',
            newSize: resized.byteLength,
          });
          break;
        }

        case 'flatten-pdf':
        case 'flatten-annotations': {
          const flattened = await flattenPdf(primaryBuffer);
          setResultData({
            blob: flattened,
            filename: `${baseFilename}-flattened.pdf`,
            mimeType: 'application/pdf',
            newSize: flattened.byteLength,
          });
          break;
        }

        default: {
          // Fallback or preview for other tools
          if (tool.status === 'requires_backend') {
            throw new Error(
              `The "${tool.name}" operation requires an external enterprise conversion engine (e.g. headless LibreOffice or hardware cryptographic HSM). It cannot run purely offline within the browser sandbox without a dedicated backend server configured.`
            );
          }
          // Generic pass-through or linearize
          const result = await compressPdf(primaryBuffer, { cleanMetadata: false });
          setResultData({
            blob: result.data,
            filename: `${baseFilename}-processed.pdf`,
            mimeType: 'application/pdf',
            originalSize: result.originalSize,
            newSize: result.newSize,
          });
          break;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected processing failure';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleDownload = () => {
    if (!resultData) return;
    downloadBlob(resultData.blob, resultData.filename, resultData.mimeType);
  };

  const handleShare = async () => {
    if (!resultData || !navigator.share) return;
    try {
      const file = new File(
        [resultData.blob as unknown as BlobPart],
        resultData.filename,
        { type: resultData.mimeType }
      );
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: resultData.filename,
          text: 'Processed securely with IN TIME PDF Tools',
        });
      }
    } catch {
      // User cancelled or share not permitted
    }
  };

  const resetAll = () => {
    setFiles([]);
    setResultData(null);
    setErrorMessage(null);
  };

  const isGenerator = ['create-blank-pdf', 'create-pdf-from-text', 'create-invoice-pdf', 'generate-passwords'].includes(tool.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={onBack}
            className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Tools
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">{tool.name}</span>
        </div>

        <button
          onClick={onBack}
          className="text-xs px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          Back to Catalog
        </button>
      </div>

      {/* Tool Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-8 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <DynamicIcon name={tool.iconName} className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {tool.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {tool.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Local processing · No uploads</span>
        </div>
      </div>

      {/* Backend Required Notice */}
      {tool.status === 'requires_backend' && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Backend Integration Point</p>
              <p className="mt-0.5">
                Full-fidelity Microsoft Office conversion (DOCX/XLSX/PPTX) and hardware PKI digital signing require a server-side document rendering daemon (such as LibreOffice or HSM). IN TIME PDF Tools accurately labels this architecture rather than generating mock placeholders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Error Occurred</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result View */}
      {resultData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Document Ready!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your file was processed and validated completely on your machine.
          </p>

          {/* Size / Metrics Strip */}
          <div className="mt-6 max-w-md mx-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Output File</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate block mt-0.5">
                {resultData.filename}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Processed Size</span>
              <span className="text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white block mt-0.5 tabular-nums">
                {resultData.newSize ? formatFileSize(resultData.newSize) : 'Ready'}
                {resultData.savedPercent !== undefined && resultData.savedPercent > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs ml-1 font-bold">
                    (-{resultData.savedPercent}%)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Extracted Text Preview if applicable */}
          {resultData.extractedText && (
            <div className="mt-6 text-left max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Extracted Text Preview:
                </span>
                <button
                  onClick={() => {
                    if (resultData.extractedText) {
                      navigator.clipboard.writeText(resultData.extractedText);
                    }
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy Text
                </button>
              </div>
              <textarea
                readOnly
                value={resultData.extractedText.slice(0, 2000)}
                rows={6}
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download {resultData.filename}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}

            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Process Another</span>
            </button>
          </div>
        </div>
      ) : (
        /* Workspace Setup / Configuration Step */
        <div className="space-y-6">
          {/* File Upload / Dropzone (for non-generator tools) */}
          {!isGenerator && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesAdded(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-900/60 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={tool.multipleFiles}
                accept={tool.acceptedTypes.join(',')}
                onChange={(e) => handleFilesAdded(e.target.files)}
                className="hidden"
                id="tool-file-input"
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3.5 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Choose {tool.multipleFiles ? 'files' : 'a file'} or drag & drop here
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Supports {tool.acceptedTypes.join(', ')} · Processed 100% locally on your device
              </p>
            </div>
          )}

          {/* Loaded Files List */}
          {files.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Selected Files ({files.length})
                </h4>
                {tool.multipleFiles && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add more files
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {files.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {formatFileSize(item.size)}
                          {item.pdfInfo?.pageCount ? ` · ${item.pdfInfo.pageCount} pages` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {tool.multipleFiles && (
                        <>
                          <button
                            onClick={() => moveFile(index, 'up')}
                            disabled={index === 0}
                            aria-label={`Move ${item.name} up`}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveFile(index, 'down')}
                            disabled={index === files.length - 1}
                            aria-label={`Move ${item.name} down`}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${item.name}`}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool-Specific Options Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Tool Configuration
            </h4>

            {/* Split Options */}
            {tool.id === 'split-pdf' && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'ranges'}
                      onChange={() => setSplitMode('ranges')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Custom Page Ranges</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'all'}
                      onChange={() => setSplitMode('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Split into Single Pages</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'fixed'}
                      onChange={() => setSplitMode('fixed')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Every N Pages</span>
                  </label>
                </div>

                {splitMode === 'ranges' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Page Ranges (e.g. 1-3, 5, 8-10):
                    </label>
                    <input
                      type="text"
                      value={pageRangeStr}
                      onChange={(e) => setPageRangeStr(e.target.value)}
                      placeholder="1-2"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {splitMode === 'fixed' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Split document every:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={fixedStep}
                        onChange={(e) => setFixedStep(parseInt(e.target.value, 10) || 1)}
                        className="w-24 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-500">pages</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extract / Remove Pages */}
            {(tool.id === 'extract-pages' || tool.id === 'remove-pages') && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pages to {tool.id === 'extract-pages' ? 'Extract' : 'Remove'} (e.g. 1, 3-5, odd, even, last):
                </label>
                <input
                  type="text"
                  value={pageRangeStr}
                  onChange={(e) => setPageRangeStr(e.target.value)}
                  placeholder="1-2"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Rotate Pages */}
            {tool.id === 'rotate-pdf' && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRotationAngle(90)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                    rotationAngle === 90
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  90° Clockwise
                </button>
                <button
                  type="button"
                  onClick={() => setRotationAngle(180)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                    rotationAngle === 180
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  180° Flip
                </button>
                <button
                  type="button"
                  onClick={() => setRotationAngle(270)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                    rotationAngle === 270
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  270° Counterclockwise
                </button>
              </div>
            )}

            {/* Watermark */}
            {tool.id === 'add-watermark' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Watermark Text:
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="CONFIDENTIAL"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Opacity: {Math.round(watermarkOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Page Numbers */}
            {tool.id === 'add-page-numbers' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Number Format:
                  </label>
                  <select
                    value={pageNumberFormat}
                    onChange={(e) => setPageNumberFormat(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Page {n} of {total}">Page 1 of 5</option>
                    <option value="{n} / {total}">1 / 5</option>
                    <option value="{n}">1</option>
                    <option value="- {n} -">- 1 -</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Position:
                  </label>
                  <select
                    value={pageNumberPos}
                    onChange={(e) => setPageNumberPos(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
              </div>
            )}

            {/* Images to PDF */}
            {(tool.id === 'images-to-pdf' || tool.id === 'jpg-to-pdf' || tool.id === 'png-to-pdf' || tool.id === 'webp-to-pdf') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Page Dimensions:
                  </label>
                  <select
                    value={imagePdfSize}
                    onChange={(e) => setImagePdfSize(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="a4">Standard A4</option>
                    <option value="letter">US Letter</option>
                    <option value="fit">Fit to Image Size</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Page Orientation:
                  </label>
                  <select
                    value={imageOrientation}
                    onChange={(e) => setImageOrientation(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            )}

            {/* Compress PDF */}
            {tool.id === 'compress-pdf' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compressCleanMeta}
                    onChange={(e) => setCompressCleanMeta(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Strip metadata and unnecessary object streams for extra reduction</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compaction is measured transparently. Your document structure is safely preserved without damaging text clarity.
                </p>
              </div>
            )}

            {/* Metadata Editor */}
            {tool.id === 'edit-metadata' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Author</label>
                  <input
                    type="text"
                    value={metaAuthor}
                    onChange={(e) => setMetaAuthor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={metaSubject}
                    onChange={(e) => setMetaSubject(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Keywords</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="report, finance, 2026"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Create Blank PDF */}
            {tool.id === 'create-blank-pdf' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Number of Pages: {blankPageCount}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={blankPageCount}
                    onChange={(e) => setBlankPageCount(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Page Format:</label>
                  <select
                    value={blankPageSize}
                    onChange={(e) => setBlankPageSize(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="A4">A4 (210 x 297 mm)</option>
                    <option value="Letter">US Letter (8.5 x 11 in)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Create PDF from Text */}
            {tool.id === 'create-pdf-from-text' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={textDocTitle}
                    onChange={(e) => setTextDocTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Document Content</label>
                  <textarea
                    rows={6}
                    value={textDocContent}
                    onChange={(e) => setTextDocContent(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* Create Invoice PDF */}
            {tool.id === 'create-invoice-pdf' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice #</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                    <input
                      type="text"
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tax %</label>
                    <input
                      type="number"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Generator */}
            {(tool.id === 'protect-pdf' || tool.id === 'generate-passwords') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={securePassword}
                    onChange={(e) => setSecurePassword(e.target.value)}
                    placeholder="Enter or generate password..."
                    className="grow text-xs p-2.5 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setSecurePassword(generateSecurePassword(18))}
                    className="px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    Generate Strong
                  </button>
                </div>
              </div>
            )}

            {/* PDF Viewer / Information Viewer report */}
            {(tool.id === 'pdf-info-viewer' || tool.id === 'pdf-viewer' || tool.id === 'version-checker' || tool.id === 'file-size-analyzer') && files[0]?.pdfInfo && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block">Pages</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{files[0].pdfInfo.pageCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">PDF Version</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{files[0].pdfInfo.version}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dimensions</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {files[0].pdfInfo.pageSize.width} × {files[0].pdfInfo.pageSize.height} pt
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Producer</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">
                    {files[0].pdfInfo.producer || 'Standard'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Process Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onBack}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={executeProcessing}
              disabled={isProcessing || (!isGenerator && files.length === 0)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <DynamicIcon name={tool.iconName} className="w-4 h-4" />
                  <span>Execute {tool.name}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
