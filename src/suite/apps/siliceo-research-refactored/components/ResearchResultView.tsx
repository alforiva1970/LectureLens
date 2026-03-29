import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Check, PlusCircle, ChevronRight, ExternalLink } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../../../../lib/utils';
import { ResearchResult } from '../types';

interface ResearchResultViewProps {
  result: ResearchResult;
  isSaving: boolean;
  lastSavedNoteId: string | null;
  handleSaveToNotes: () => void;
}

export const ResearchResultView: React.FC<ResearchResultViewProps> = ({
  result,
  isSaving,
  lastSavedNoteId,
  handleSaveToNotes
}) => {
  return (
    <motion.div 
      key="result"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 font-sans">
          <BookOpen className="w-4 h-4" />
          Sintesi della Ricerca
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveToNotes}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all font-sans",
              isSaving 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            )}
          >
            {isSaving ? (
              <>
                <Check className="w-4 h-4" />
                Salvato in Notes
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Salva in Notes
              </>
            )}
          </button>
          {isSaving && (
            <a 
              href={"/siliceo-notes?noteId=" + lastSavedNoteId}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-full text-xs font-bold text-black/60 hover:bg-black/5 transition-all font-sans"
            >
              Vai alle Note
              <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      <article className="prose prose-zinc max-w-none">
        <div className="text-xl leading-relaxed text-[#2a2a2a] markdown-body">
          <Markdown>{result.answer}</Markdown>
        </div>
      </article>

      {result.sources.length > 0 && (
        <section className="pt-12 border-t border-black/5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-6 font-sans">Fonti Consultate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.sources.map((source, idx) => (
              <a 
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white border border-black/5 rounded-xl hover:border-indigo-500/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-indigo-600 transition-colors font-sans">{source.title}</p>
                    <p className="text-xs text-black/40 truncate font-sans">{source.uri}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-black/20 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};
