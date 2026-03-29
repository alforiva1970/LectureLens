import React from 'react';
import { History } from 'lucide-react';
import { ResearchResult } from '../types';

interface HistorySuggestionsProps {
  history: ResearchResult[];
  onSelect: (h: ResearchResult) => void;
}

export const HistorySuggestions: React.FC<HistorySuggestionsProps> = ({
  history,
  onSelect
}) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-20 max-w-2xl mx-auto">
      <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-6 font-sans flex items-center gap-2">
        <History className="w-4 h-4" />
        Ricerche Recenti
      </h3>
      <div className="flex flex-wrap gap-2">
        {history.map((h, idx) => (
          <button 
            key={idx}
            onClick={() => onSelect(h)}
            className="px-4 py-2 bg-white border border-black/5 rounded-full text-sm hover:border-indigo-500 hover:text-indigo-600 transition-all font-sans"
          >
            {h.query}
          </button>
        ))}
      </div>
    </div>
  );
};
