import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, LayoutDashboard, Calendar, Users, ArrowRightLeft, Lightbulb } from 'lucide-react';
import { InfographicData } from '../types';

interface InfographicTabProps {
  isProcessing: boolean;
  infographic: InfographicData | null;
  flippedCards: Record<number, boolean>;
  setFlippedCards: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}

export function InfographicTab({
  isProcessing, infographic, flippedCards, setFlippedCards
}: InfographicTabProps) {
  return (
    <motion.div 
      key="infographic"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-10 min-h-[600px]"
    >
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center h-[500px] gap-4 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          <p className="text-lg font-medium">Creando l'infografica visiva...</p>
        </div>
      ) : infographic ? (
        <div className="space-y-10">
          <div className="text-center border-b border-slate-100 pb-8">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {infographic.title}
            </h2>
            <div className="w-20 h-1.5 bg-amber-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Timeline */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-3 text-amber-700 font-black uppercase tracking-widest text-sm">
                <Calendar className="w-5 h-5" />
                Timeline degli Eventi
              </div>
              <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {infographic.timeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full border-4 border-white bg-amber-500 shadow-sm"></div>
                    <div className="font-bold text-amber-600 text-sm mb-1">{item.date}</div>
                    <div className="text-slate-700 font-medium">{item.event}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Figures */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-indigo-700 font-black uppercase tracking-widest text-sm">
                <Users className="w-5 h-5" />
                Protagonisti
              </div>
              <div className="grid gap-4">
                {infographic.key_figures.map((figure, idx) => (
                  <div key={idx} className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <div className="font-bold text-indigo-900">{figure.name}</div>
                    <div className="text-xs text-indigo-600 font-medium uppercase mt-1">{figure.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            {/* Causes & Consequences */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-700 font-black uppercase tracking-widest text-sm">
                <ArrowRightLeft className="w-5 h-5" />
                Cause e Conseguenze
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Cause</div>
                  {infographic.causes_consequences.causes.map((c, i) => (
                    <div key={i} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-emerald-500">•</span> {c}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Conseguenze</div>
                  {infographic.causes_consequences.consequences.map((c, i) => (
                    <div key={i} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-amber-500">•</span> {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Terms / Flashcards */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-rose-700 font-black uppercase tracking-widest text-sm">
                <Lightbulb className="w-5 h-5" />
                Flashcards Concetti Chiave
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {infographic.key_terms.map((term, idx) => (
                  <div 
                    key={idx} 
                    className="h-32 perspective-1000 cursor-pointer"
                    onClick={() => setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  >
                    <motion.div 
                      className="relative w-full h-full transition-all duration-500 preserve-3d"
                      animate={{ rotateY: flippedCards[idx] ? 180 : 0 }}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-100 flex items-center justify-center text-center font-bold shadow-sm">
                        {term.term}
                      </div>
                      {/* Back */}
                      <div 
                        className="absolute inset-0 backface-hidden bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center text-center text-xs overflow-y-auto"
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        {term.definition}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
          <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
          <p>L'infografica verrà generata dopo l'analisi della lezione.</p>
        </div>
      )}
    </motion.div>
  );
}
