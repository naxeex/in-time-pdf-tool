import React from 'react';
import { Search, Sun, Moon, Clock, ShieldCheck } from 'lucide-react';
import { ToolCategory } from '../data/toolsCatalog';

interface HeaderProps {
  onSearchClick: () => void;
  onCategorySelect: (category: ToolCategory | 'All') => void;
  onPrivacyClick: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeCategory: ToolCategory | 'All';
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchClick,
  onCategorySelect,
  onPrivacyClick,
  theme,
  onToggleTheme,
  activeCategory,
  onHomeClick,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1 -ml-1 transition-transform active:scale-95"
          aria-label="IN TIME PDF Tools Home"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
            IN TIME <span className="text-blue-600 dark:text-blue-400 font-normal">PDF Tools</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onCategorySelect('All')}
            className={`transition-colors whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'All'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : ''
            }`}
          >
            All Tools
          </button>
          <button
            onClick={() => onCategorySelect('Organize')}
            className={`transition-colors whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'Organize'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : ''
            }`}
          >
            Organize
          </button>
          <button
            onClick={() => onCategorySelect('Edit')}
            className={`transition-colors whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'Edit'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : ''
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => onCategorySelect('Convert to PDF')}
            className={`transition-colors whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'Convert to PDF' || activeCategory === 'Convert from PDF'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : ''
            }`}
          >
            Convert
          </button>
          <button
            onClick={onPrivacyClick}
            className="flex items-center gap-1.5 transition-colors whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Privacy</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions & Search */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
            aria-label="Search tools"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-500 shadow-2xs">
              /
            </kbd>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            onClick={() => onCategorySelect('Organize')}
            className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all whitespace-nowrap"
          >
            Explore Tools
          </button>
        </div>
      </div>
    </header>
  );
};
