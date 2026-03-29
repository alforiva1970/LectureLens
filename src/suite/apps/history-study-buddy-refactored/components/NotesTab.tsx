import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2, ClipboardList } from 'lucide-react';
import Markdown from 'react-markdown';

interface NotesTabProps {
  transcription: string;
  summary: string;
  isProcessing: boolean;
  isGeneratingPDF: boolean;
  downloadPDF: () => void;
}

export function NotesTab({
  transcription, summary, isProcessing, isGeneratingPDF, downloadPDF
}: NotesTabProps) {
  return (
    <motion.div 
      key="notes"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid md:grid-cols-2 gap-8"
    >
      {/* Transcription Column */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <FileText className="w-5 h-5 text-amber-600" />
            Trascrizione Lezione
          </div>
          {transcription && (
            <button 
              onClick={downloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              title="Scarica PDF Professionale"
            >
              {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Scarica PDF Appunti
            </button>
          )}
        </div>
        <div className="p-6 overflow-y-auto flex-1 prose prose-slate max-w-none">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Trascrivendo la lezione...</p>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-sm">
              {transcription || "La trascrizione apparirà qui."}
            </p>
          )}
        </div>
      </div>

      {/* Summary Column */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 font-bold text-slate-700">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
          Riassunto per lo Studio
        </div>
        <div className="p-6 overflow-y-auto flex-1 markdown-body">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Sintetizzando i concetti storici...</p>
            </div>
          ) : (
            summary ? (
              <Markdown>{summary}</Markdown>
            ) : (
              <p className="text-slate-400 italic">Il riassunto apparirà qui.</p>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
