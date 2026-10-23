import React, { useEffect, useState, useRef } from 'react';
import { renderPdfPageToDataUrl } from '../lib/pdfRenderer';

export const PDFPageThumbnail: React.FC<{
  pdfBytes: Uint8Array;
  pageNumber: number;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ pdfBytes, pageNumber, isSelected, onToggle }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !dataUrl) {
      let isMounted = true;
      renderPdfPageToDataUrl(pdfBytes, pageNumber, 0.3)
        .then((res) => {
          if (isMounted) setDataUrl(res.dataUrl);
        })
        .catch(console.error);
      return () => { isMounted = false; };
    }
  }, [isVisible, pdfBytes, pageNumber, dataUrl]);

  return (
    <div
      ref={containerRef}
      onClick={onToggle}
      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all aspect-[1/1.4] flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${
        isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-500/50' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {dataUrl ? (
        <img src={dataUrl} alt={`Page ${pageNumber}`} className="w-full h-full object-contain bg-white" />
      ) : (
        <span className="text-slate-400 text-xs font-medium">Loading {pageNumber}...</span>
      )}
      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border flex items-center justify-center z-10 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-400 bg-white/80'}`}>
        {isSelected && (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[10px] py-1 text-center font-medium backdrop-blur-sm">
        Page {pageNumber}
      </div>
    </div>
  );
};
