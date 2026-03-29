import React from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  isSearching: boolean;
  handleSearch: (e?: React.FormEvent) => void;
  hasResult: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  setQuery,
  isSearching,
  handleSearch,
  hasResult
}) => {
  return (
    <div className={cn(
      "transition-all duration-500",
      hasResult || isSearching ? "mb-12" : "max-w-2xl mx-auto"
    )}>
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cosa desideri approfondire?"
          className="w-full pl-14 pr-24 py-5 bg-white border border-black/10 rounded-full text-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm font-sans"
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/30" />
        <button 
          type="submit"
          disabled={isSearching}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold font-sans flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Cerca
            </>
          )}
        </button>
      </form>
    </div>
  );
};
