import React from 'react';
import { Clock } from 'lucide-react';
import { ToolDefinition } from '../data/toolsCatalog';
import { DynamicIcon } from './DynamicIcon';

interface RecentToolsSectionProps {
  recentTools: ToolDefinition[];
  onSelectTool: (tool: ToolDefinition) => void;
}

export const RecentToolsSection: React.FC<RecentToolsSectionProps> = ({
  recentTools,
  onSelectTool,
}) => {
  if (recentTools.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Recently Used Tools
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {recentTools.slice(0, 4).map((tool) => (
          <button
            key={`recent-${tool.id}`}
            onClick={() => onSelectTool(tool)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <DynamicIcon name={tool.iconName} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {tool.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {tool.category}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
