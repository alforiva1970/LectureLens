import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Trash2, Save } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { NoteNode, DaemonInsight } from '../types';
import { DaemonInsights } from './DaemonInsights';

interface EditorViewProps {
  activeNote: NoteNode;
  setActiveNoteId: (id: string | null) => void;
  handleSaveNote: (id: string, title: string, content: string, color?: string) => void;
  handleDeleteNote: (id: string) => void;
  daemonInsights: DaemonInsight[];
  handleCreateLink: (id: string) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  activeNote,
  setActiveNoteId,
  handleSaveNote,
  handleDeleteNote,
  daemonInsights,
  handleCreateLink
}) => {
  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-[450px] bg-white dark:bg-zinc-900 border-l border-black/5 dark:border-white/10 flex flex-col shadow-2xl z-20"
    >
      <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
        <div className="flex-1">
          <input 
            type="text"
            value={activeNote.title}
            onChange={(e) => handleSaveNote(activeNote.id, e.target.value, activeNote.content)}
            className="bg-transparent border-none focus:ring-0 font-bold text-xl dark:text-white w-full"
            placeholder="Titolo della nota..."
          />
          <div className="flex gap-2 mt-2">
            {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
              <button
                key={color}
                onClick={() => handleSaveNote(activeNote.id, activeNote.title, activeNote.content, color)}
                className={cn(
                  "w-4 h-4 rounded-full border border-black/10 dark:border-white/10",
                  activeNote.color === color && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <button 
          onClick={() => setActiveNoteId(null)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 dark:text-white/60" />
        </button>
      </div>
      <textarea 
        value={activeNote.content}
        onChange={(e) => handleSaveNote(activeNote.id, activeNote.title, e.target.value)}
        className="flex-1 p-8 bg-transparent border-none focus:ring-0 resize-none text-black/80 dark:text-white/80 leading-relaxed custom-scrollbar"
        placeholder="Inizia a scrivere..."
      />

      <DaemonInsights 
        insights={daemonInsights}
        handleCreateLink={handleCreateLink}
      />

      <div className="p-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
        <button 
          onClick={() => handleDeleteNote(activeNote.id)}
          className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Elimina
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-black/40 dark:text-white/40">
          <Save className="w-4 h-4" />
          Salvato automaticamente
        </div>
      </div>
    </motion.div>
  );
};
