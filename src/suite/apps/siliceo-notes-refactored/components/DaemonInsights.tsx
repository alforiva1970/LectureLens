import React from 'react';
import { Zap, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { DaemonInsight } from '../types';

interface DaemonInsightsProps {
  insights: DaemonInsight[];
  handleCreateLink: (id: string) => void;
}

export const DaemonInsights: React.FC<DaemonInsightsProps> = ({
  insights,
  handleCreateLink
}) => {
  if (insights.length === 0) return null;

  return (
    <div className="px-8 py-4 bg-indigo-500/5 border-t border-indigo-500/10">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-3">
        <Zap className="w-3 h-3" />
        Silex Daemon Insights
      </div>
      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-zinc-800 rounded-lg border border-indigo-500/10 group animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold truncate dark:text-white">{insight.title}</div>
              <div className="text-[9px] text-black/40 dark:text-white/40 truncate">{insight.reason}</div>
            </div>
            {insight.type === 'note' ? (
              <button 
                onClick={() => handleCreateLink(insight.id)}
                className="p-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors shadow-sm"
                title="Crea collegamento"
              >
                <LinkIcon className="w-3 h-3" />
              </button>
            ) : (
              <a 
                href="/siliceo-research"
                className="p-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors shadow-sm"
                title="Vedi ricerca"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
