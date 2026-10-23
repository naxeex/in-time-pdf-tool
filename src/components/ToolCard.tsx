import React from 'react';
import { Star, CheckCircle, Server, Wrench } from 'lucide-react';
import { ToolDefinition } from '../data/toolsCatalog';
import { DynamicIcon } from './DynamicIcon';

interface ToolCardProps {
  tool: ToolDefinition;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  onSelect: (tool: ToolDefinition) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(tool)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(tool);
        }
      }}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500/70 hover:shadow-md transition-all duration-150 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Tool Icon */}
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-150 shrink-0">
            <DynamicIcon name={tool.iconName} className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Status indicator */}
            {tool.status === 'tested' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400" title="Tested & working locally in browser">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tested</span>
              </span>
            )}
            {tool.status === 'requires_backend' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400" title="Requires external server/backend processing">
                <Server className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Backend</span>
              </span>
            )}
            {tool.status === 'planned' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400" title="Planned feature">
                <Wrench className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Roadmap</span>
              </span>
            )}

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(tool.id);
              }}
              aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
              className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Unboxed metadata footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span className="font-medium text-slate-500 dark:text-slate-400">{tool.category}</span>
        {tool.badge && (
          <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
            {tool.badge}
          </span>
        )}
      </div>
    </div>
  );
};
