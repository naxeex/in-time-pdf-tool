import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CategoryFilter } from './components/CategoryFilter';
import { RecentToolsSection } from './components/RecentToolsSection';
import { ToolGrid } from './components/ToolGrid';
import { ToolWorkspace } from './components/ToolWorkspace';
import { SearchModal } from './components/SearchModal';
import { PrivacyModal } from './components/PrivacyModal';
import { Footer } from './components/Footer';
import { TOOLS_CATALOG, ToolDefinition, ToolCategory, CATEGORIES } from './data/toolsCatalog';
import {
  getFavoriteToolIds,
  toggleFavoriteToolId,
  getRecentToolIds,
  recordRecentTool,
  getStoredTheme,
  setStoredTheme,
} from './lib/storage';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStoredTheme());
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => getFavoriteToolIds());
  const [recentToolIds, setRecentToolIds] = useState<string[]>(() => getRecentToolIds());

  // Sync theme with DOM document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // URL syncing & Back/Forward browser support
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const toolParam = params.get('tool') || window.location.hash.replace('#', '');
      if (toolParam) {
        const found = TOOLS_CATALOG.find((t) => t.id === toolParam);
        if (found) {
          setActiveTool(found);
          recordRecentTool(found.id);
          setRecentToolIds(getRecentToolIds());
        }
      } else {
        setActiveTool(null);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const handleSelectTool = useCallback((tool: ToolDefinition) => {
    setActiveTool(tool);
    recordRecentTool(tool.id);
    setRecentToolIds(getRecentToolIds());
    window.history.pushState({}, '', `?tool=${tool.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToCatalog = useCallback(() => {
    setActiveTool(null);
    window.history.pushState({}, '', window.location.pathname);
  }, []);

  const handleToggleFavorite = useCallback((toolId: string) => {
    const updated = toggleFavoriteToolId(toolId);
    setFavorites(updated);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered tools
  const filteredTools = useMemo(() => {
    let result = TOOLS_CATALOG;

    if (selectedCategory !== 'All') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return result;
  }, [selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: TOOLS_CATALOG.length };
    CATEGORIES.forEach((cat) => {
      counts[cat] = TOOLS_CATALOG.filter((t) => t.category === cat).length;
    });
    return counts;
  }, []);

  // Recent tools models
  const recentTools = useMemo(() => {
    return recentToolIds
      .map((id) => TOOLS_CATALOG.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);
  }, [recentToolIds]);

  // Popular tools
  const popularTools = useMemo(() => {
    return TOOLS_CATALOG.filter((t) => t.popular);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        onSearchClick={() => setIsSearchModalOpen(true)}
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          if (activeTool) handleBackToCatalog();
        }}
        onPrivacyClick={() => setIsPrivacyModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeCategory={selectedCategory}
        onHomeClick={() => {
          setSelectedCategory('All');
          setSearchQuery('');
          handleBackToCatalog();
        }}
      />

      <main className="grow">
        {activeTool ? (
          <ToolWorkspace tool={activeTool} onBack={handleBackToCatalog} />
        ) : (
          <>
            <HeroSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              popularTools={popularTools}
              onSelectTool={handleSelectTool}
              totalToolsCount={TOOLS_CATALOG.length}
            />

            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
              <RecentToolsSection
                recentTools={recentTools}
                onSelectTool={handleSelectTool}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {selectedCategory === 'All' ? 'All PDF Tools' : selectedCategory}
                  </h2>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    ({filteredTools.length})
                  </span>
                </div>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear search filter
                  </button>
                )}
              </div>

              <ToolGrid
                tools={filteredTools}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectTool={handleSelectTool}
                onResetFilter={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                searchQuery={searchQuery}
              />
            </div>
          </>
        )}
      </main>

      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (activeTool) handleBackToCatalog();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectTool={handleSelectTool}
      />

      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
