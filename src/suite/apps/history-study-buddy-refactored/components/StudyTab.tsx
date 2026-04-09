import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCw, UserCircle, HelpCircle, MessageCircle, Send } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { InfographicData, ChatMessage } from '../types';

interface StudyTabProps {
  infographic: InfographicData | null;
  quizAnswers: Record<number, number>;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  showQuizResults: boolean;
  setShowQuizResults: React.Dispatch<React.SetStateAction<boolean>>;
  chatMessages: ChatMessage[];
  currentMessage: string;
  setCurrentMessage: React.Dispatch<React.SetStateAction<string>>;
  isChatLoading: boolean;
  handleSendMessage: () => void;
}

export function StudyTab({
  infographic, quizAnswers, setQuizAnswers, showQuizResults, setShowQuizResults,
  chatMessages, currentMessage, setCurrentMessage, isChatLoading, handleSendMessage
}: StudyTabProps) {
  return (
    <motion.div 
      key="study"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="grid md:grid-cols-2 gap-8"
    >
      {/* Quiz Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3 text-amber-700 font-black uppercase tracking-widest text-sm">
            <Trophy className="w-5 h-5" />
            Quiz di Verifica
          </div>
          {showQuizResults && (
            <div className="text-sm font-bold text-amber-600">
              Punteggio: {Object.entries(quizAnswers).filter(([idx, ans]) => infographic?.quiz[Number(idx)].correct_index === ans).length} / 5
            </div>
          )}
        </div>

        <div className="space-y-8 overflow-y-auto max-h-[500px] pr-2">
          {infographic?.quiz?.map((q, qIdx) => (
            <div key={qIdx} className="space-y-4">
              <p className="font-bold text-slate-800">{qIdx + 1}. {q.question}</p>
              <div className="grid gap-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = quizAnswers[qIdx] === oIdx;
                  const isCorrect = q.correct_index === oIdx;
                  const showCorrect = showQuizResults && isCorrect;
                  const showWrong = showQuizResults && isSelected && !isCorrect;

                  return (
                    <button
                      key={oIdx}
                      disabled={showQuizResults}
                      onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-all text-sm",
                        isSelected && !showQuizResults ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-100 hover:border-slate-200 text-slate-600",
                        showCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900",
                        showWrong && "border-red-500 bg-red-50 text-red-900"
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showQuizResults && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100 italic">
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {!showQuizResults ? (
          <button
            onClick={() => setShowQuizResults(true)}
            disabled={Object.keys(quizAnswers).length < 5}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold disabled:opacity-50 transition-all shadow-md mt-auto"
          >
            Conferma Risposte
          </button>
        ) : (
          <button
            onClick={() => {
              setQuizAnswers({});
              setShowQuizResults(false);
            }}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all mt-auto flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Riprova Quiz
          </button>
        )}
      </div>

      {/* Chat Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col h-[650px] overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Intervista a</div>
              <div className="font-black text-indigo-900">{infographic?.primary_figure}</div>
            </div>
          </div>
          <HelpCircle className="w-5 h-5 text-indigo-300" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          {chatMessages.length === 0 && (
            <div className="text-center py-10 space-y-4">
              <MessageCircle className="w-12 h-12 text-indigo-100 mx-auto" />
              <p className="text-slate-400 text-sm max-w-[200px] mx-auto">
                Fai una domanda a {infographic?.primary_figure} sulla lezione di oggi!
              </p>
            </div>
          )}
          {chatMessages.map((msg, idx) => (
            <div 
              key={idx} 
              className={cn(
                "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                msg.role === 'user' 
                  ? "ml-auto bg-indigo-600 text-white rounded-tr-none" 
                  : "mr-auto bg-white text-slate-700 border border-slate-100 rounded-tl-none"
              )}
            >
              {msg.text}
            </div>
          ))}
          {isChatLoading && (
            <div className="mr-auto bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Chiedi a ${infographic?.primary_figure}...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isChatLoading}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
