import React from 'react';
import { motion } from 'motion/react';
import { FileText, ChevronLeft, Search, Plus } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Footer } from '../../../components/Footer';
import { NoteNode } from '../types';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleAddNote: () => void;
  notes: NoteNode[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  searchQuery,
  setSearchQuery,
  handleAddNote,
  notes,
  activeNoteId,
  setActiveNoteId
}) => {
  return (
    <motion.div 
      initial={false}
      animate={{ width: isSidebarOpen ? 320 : 0 }}
      className="bg-white dark:bg-zinc-900 border-r border-black/5 dark:border-white/10 flex flex-col overflow-hidden"
    >
      <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
            <FileText className="w-5 h-5" />
          </div>
          <span className="font-bold dark:text-white">Siliceo Notes</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 dark:text-white/60" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
          <input 
            type="text"
            placeholder="Cerca note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/5 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white"
          />
        </div>

        <button 
          onClick={handleAddNote}
          className="w-full mb-6 p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          Nuova Nota
        </button>

        <div className="space-y-2">
          {notes
            .filter(n => 
              n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              n.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(note => (
            <button
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={cn(
                "w-full p-3 rounded-xl text-left transition-all group",
                activeNoteId === note.id 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60"
              )}
            >
              <div className="font-bold truncate">{note.title || 'Senza titolo'}</div>
              <div className="text-xs opacity-60 truncate">{note.content.substring(0, 40)}...</div>
            </button>
          ))}
        </div>
      </div>
      <Footer activeApp="siliceo-notes" compact className="border-t-0 bg-transparent" />
    </motion.div>
  );
};
