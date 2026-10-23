import React from 'react';
import { Clock, ShieldCheck, Heart } from 'lucide-react';
import { ToolCategory } from '../data/toolsCatalog';

interface FooterProps {
  onSelectCategory: (category: ToolCategory | 'All') => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenPrivacy }) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mission */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                IN TIME <span className="text-blue-600 font-normal">PDF Tools</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every PDF tool you need in one unified platform. Fast, privacy-first, client-side document processing directly in modern web browsers.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero Document Uploads</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Categories
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onSelectCategory('Organize')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Organize & Rearrange
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Edit')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Edit & Annotate
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Convert to PDF')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Convert to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Convert from PDF')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Convert from PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Compress')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Compress & Optimize
                </button>
              </li>
            </ul>
          </div>

          {/* Supported Formats */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Supported Formats
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Standard ISO 32000 PDF, PDF/A-1b/2b, JPEG, PNG, WEBP, SVG, TIFF, Plain Text (TXT), Markdown, HTML.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">.pdf</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">.jpg</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">.png</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">.webp</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">.txt</span>
            </div>
          </div>

          {/* Architecture & Privacy */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Architecture & Trust
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Built on WebAssembly, pdf-lib, and PDF.js. No tracking scripts, no telemetry cookies, and no third-party ads.
            </p>
            <button
              onClick={onOpenPrivacy}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Read Full Privacy Guarantee &rarr;
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>© 2026 IN TIME PDF Tools. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Terms of Service
            </span>
            <span>·</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              ISO Compliance
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
