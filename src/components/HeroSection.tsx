import React from 'react';
import { Search, Shield, Zap, Lock, Cpu, Star } from 'lucide-react';
import { ToolDefinition } from '../data/toolsCatalog';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  popularTools: ToolDefinition[];
  onSelectTool: (tool: ToolDefinition) => void;
  totalToolsCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  popularTools,
  onSelectTool,
  totalToolsCount,
}) => {
  return (
    <section className="relative overflow-hidden pt-10 pb-8 sm:pt-14 sm:pb-12 bg-linear-to-b from-blue-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Anti-slop zero pill metadata */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 tracking-wide">
          <span className="text-blue-600 dark:text-blue-400 font-semibold">{totalToolsCount} PDF Utilities</span>
          <span aria-hidden="true">·</span>
          <span>In-Browser Processing</span>
          <span aria-hidden="true">·</span>
          <span>100% Private</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight text-balance">
          Every PDF Tool You Need.
        </h1>

        <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
          Merge, split, compress, convert, edit, and secure your PDF documents right in your browser. Fast, free, and private with zero file uploads.
        </p>

        {/* Prominent Search Box */}
        <div className="mt-7 max-w-2xl mx-auto relative">
          <div className="relative flex items-center shadow-md rounded-xl bg-white dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/20 transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
            <input
              type="text"
              id="hero-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search 100 tools (e.g. Merge, Split, Compress, JPG to PDF, Watermark)..."
              className="w-full py-3.5 pl-3 pr-12 text-sm sm:text-base text-slate-900 dark:text-white bg-transparent placeholder-slate-400 focus:outline-none"
              aria-label="Search all PDF tools"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 px-1.5 py-0.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search query"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Popular Tools Fast Track */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Popular:
          </span>
          {popularTools.slice(0, 6).map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-md transition-colors shadow-2xs font-medium"
            >
              {tool.name}
            </button>
          ))}
        </div>

        {/* Privacy & Engine Benefits strip */}
        <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">100% Local Privacy</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Files never leave your machine.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Instant Speed</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Zero network upload wait times.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">No Registration</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Free unlimited document use.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">WebAssembly Engine</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Real PDF manipulation logic.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
