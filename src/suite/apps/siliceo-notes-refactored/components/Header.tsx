import React from 'react';
import { ChevronRight, ArrowLeft, Trash2, Share2, Settings } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isDeleteMode: boolean;
  setIsDeleteMode: (mode: boolean) => void;
  isLinkingMode: boolean;
  setIsLinkingMode: (mode: boolean) => void;
  setLinkingSourceId: (id: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isDeleteMode,
  setIsDeleteMode,
  isLinkingMode,
  setIsLinkingMode,
  setLinkingSourceId
}) => {
  return (
    <div className="h-16 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 dark:text-white/60" />
          </button>
        )}
        <a href="/" className="flex items-center gap-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Suite
        </a>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => {
            setIsDeleteMode(!isDeleteMode);
            setIsLinkingMode(false);
            setLinkingSourceId(null);
          }}
          className={cn(
            "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold",
            isDeleteMode 
              ? "bg-red-500 text-white" 
              : "hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60"
          )}
          title="Modalità cancellazione"
        >
          <Trash2 className="w-5 h-5" />
          {isDeleteMode && "Clicca nodi o archi"}
        </button>
        <button 
          onClick={() => {
            setIsLinkingMode(!isLinkingMode);
            setIsDeleteMode(false);
            setLinkingSourceId(null);
          }}
          className={cn(
            "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold",
            isLinkingMode 
              ? "bg-amber-500 text-white" 
              : "hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60"
          )}
          title="Collega due note"
        >
          <Share2 className="w-5 h-5" />
          {isLinkingMode && "Seleziona destinazione"}
        </button>
        <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-black/60 dark:text-white/60">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
