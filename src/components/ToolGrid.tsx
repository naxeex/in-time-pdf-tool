import React from 'react';
import { ToolDefinition } from '../data/toolsCatalog';
import { ToolCard } from './ToolCard';
import { SearchX, RotateCcw } from 'lucide-react';

interface ToolGridProps {
  tools: ToolDefinition[];
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  onSelectTool: (tool: ToolDefinition) => void;
  onResetFilter: () => void;
  searchQuery: string;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  tools,
  favorites,
  onToggleFavorite,
  onSelectTool,
  onResetFilter,
  searchQuery,
}) => {
  if (tools.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          No matching tools found
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          We couldn&apos;t find any tool matching &quot;{searchQuery}&quot;. Try a different keyword or browse all categories.
        </p>
        <button
          onClick={onResetFilter}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Search</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5">
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          isFavorite={favorites.includes(tool.id)}
          onToggleFavorite={onToggleFavorite}
          onSelect={onSelectTool}
        />
      ))}
    </div>
  );
};
