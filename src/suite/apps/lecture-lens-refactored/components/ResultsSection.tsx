import React from 'react';
import { MessageSquareText, Copy, BookOpen, Edit3, CheckCircle2, Loader2, MessageCircle, Zap, Printer, Download, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { SUBJECT_CONFIG, SubjectType } from '../../../../constants/SubjectConfig';
import { cn } from '../../../../lib/utils';

interface ResultsSectionProps {
  result: any;
  isLongVideo: boolean;
  copyToClipboard: (text: string) => void;
  isEditingNotes: boolean;
  setIsEditingNotes: (val: boolean) => void;
  editedNotes: string;
  setEditedNotes: (val: string) => void;
  handleSaveNotes: () => void;
  handleGenerateExtra: () => void;
  handleExtractFormulas: () => void;
  loadingExtra: boolean;
  subjectType: SubjectType;
  setShowChat: (val: boolean) => void;
  handleGenerateQuiz: () => void;
  loadingQuiz: boolean;
  handlePrint: () => void;
  downloadNotes: () => void;
}

export function ResultsSection({
  result, isLongVideo, copyToClipboard, isEditingNotes, setIsEditingNotes,
  editedNotes, setEditedNotes, handleSaveNotes, handleGenerateExtra, handleExtractFormulas, loadingExtra,
  subjectType, setShowChat, handleGenerateQuiz, loadingQuiz, handlePrint, downloadNotes
}: ResultsSectionProps) {
  return (
    <div className="lg:col-span-8">
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Transcription Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="flex items-center gap-2 font-medium dark:text-white">
                  <MessageSquareText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isLongVideo ? "Riassunto Strutturato" : "Trascrizione Audio"}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(result.transcription)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="p-8 max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none custom-scrollbar text-black dark:text-white">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {result.transcription}
                </ReactMarkdown>
              </div>
            </div>

            {/* Visual Notes Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="flex items-center gap-2 font-medium dark:text-white">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Appunti Estratti</span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditingNotes ? (
                    <button 
                      onClick={handleSaveNotes}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-all font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Salva
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditedNotes(result.notes);
                        setIsEditingNotes(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-black/60 dark:text-white/60 text-xs rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-medium"
                    >
                      <Edit3 className="w-3 h-3" />
                      Modifica
                    </button>
                  )}
                  <button 
                    onClick={handleExtractFormulas}
                    disabled={loadingExtra}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all font-medium disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    Estrai Formule
                  </button>
                  <button 
                    onClick={handleGenerateExtra}
                    disabled={loadingExtra}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-medium disabled:opacity-50"
                  >
                    {loadingExtra ? <Loader2 className="w-3 h-3 animate-spin" /> : React.createElement(SUBJECT_CONFIG[subjectType].extraIcon, { className: "w-3 h-3" })}
                    {SUBJECT_CONFIG[subjectType].extraBtn}
                  </button>
                  <button 
                    onClick={() => setShowChat(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all font-medium disabled:opacity-50"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Tutor AI
                  </button>
                  <button 
                    onClick={handleGenerateQuiz}
                    disabled={loadingQuiz}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all font-medium disabled:opacity-50"
                  >
                    {loadingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Genera Quiz
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-all"
                  >
                    <Printer className="w-3 h-3" />
                    Stampa / PDF
                  </button>
                  <button 
                    onClick={downloadNotes}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 text-black dark:text-white text-xs rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  >
                    <Download className="w-3 h-3" />
                    Scarica .md
                  </button>
                  <button 
                    onClick={() => copyToClipboard(result.notes)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                {isEditingNotes ? (
                  <textarea 
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full h-[500px] bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl p-6 text-sm font-mono focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white resize-none"
                    placeholder="Modifica i tuoi appunti qui (supporta Markdown e LaTeX)..."
                  />
                ) : (
                  <div className="prose prose-emerald dark:prose-invert max-w-none text-black dark:text-white">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {result.notes.replace(/\\n/g, '\n')}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full min-h-[400px] border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center text-black/20 dark:text-white/10 gap-4">
            <div className="w-20 h-20 rounded-full bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-center">
              <Sparkles className="w-10 h-10" />
            </div>
            <p className="font-medium">I risultati appariranno qui dopo l'analisi</p>
          </div>
        )}
      </AnimatePresence>

      {result && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-200/80 text-sm no-print">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>Attenzione:</strong> LectureLens utilizza l'Intelligenza Artificiale per generare questi appunti. L'AI può commettere errori, omettere dettagli o generare informazioni inesatte. Verifica sempre i risultati confrontandoli con il materiale originale o con i tuoi libri di testo.
          </p>
        </div>
      )}
    </div>
  );
}
