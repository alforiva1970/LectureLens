import React from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { SUBJECT_CONFIG, SubjectType } from '../../../../constants/SubjectConfig';
import { QueueItem } from '../types';

interface UploadSectionProps {
  queue: QueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  isProcessingQueue: boolean;
  subjectType: SubjectType;
  setSubjectType: (type: SubjectType) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProcessQueue: () => void;
  setFile: (file: File | null) => void;
  isLongVideo: boolean;
  useThreePass: boolean;
  setUseThreePass: (val: boolean) => void;
  error: string | null;
}

export function UploadSection({
  queue, setQueue, isProcessingQueue, subjectType, setSubjectType,
  fileInputRef, handleFileChange, handleProcessQueue, setFile,
  isLongVideo, useThreePass, setUseThreePass, error
}: UploadSectionProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-3xl font-medium tracking-tight leading-tight dark:text-white">
          Trasforma le tue lezioni in <span className="italic font-serif">conoscenza strutturata</span>.
        </h2>
        <p className="text-black/60 dark:text-white/60 leading-relaxed">
          Carica il video della tua lezione. Estrarremo automaticamente la trascrizione audio e gli appunti scritti sulla lavagna.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black/40 dark:text-white/40">1. Seleziona la Materia</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(SUBJECT_CONFIG) as [SubjectType, typeof SUBJECT_CONFIG[SubjectType]][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setSubjectType(key)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex flex-col gap-2",
                  subjectType === key 
                    ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow-md" 
                    : "bg-white dark:bg-zinc-900 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-black/70 dark:text-white/70"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4 shrink-0", subjectType === key ? "text-white dark:text-black" : "text-black/40 dark:text-white/40")} />
                  <span className="text-sm font-semibold">{config.title}</span>
                </div>
                <span className={cn("text-[10px] leading-tight", subjectType === key ? "text-white/70 dark:text-black/70" : "text-black/40 dark:text-white/40")}>{config.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black/40 dark:text-white/40">2. Carica Video (Singolo o Multiplo)</h3>
        {queue.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Coda di Lavoro ({queue.length})</h3>
              <button 
                onClick={() => { setQueue([]); setFile(null); }}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Svuota Coda
              </button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {queue.map(item => (
                <div key={item.id} className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate dark:text-white">{item.file.name}</p>
                      <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                        {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <button 
                      onClick={() => setQueue(q => q.filter(i => i.id !== item.id))}
                      className="p-1.5 text-black/40 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 transition-colors"
                      disabled={isProcessingQueue}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <select 
                      value={item.subjectType}
                      onChange={(e) => setQueue(q => q.map(i => i.id === item.id ? { ...i, subjectType: e.target.value as SubjectType } : i))}
                      disabled={isProcessingQueue}
                      className="text-xs bg-black/5 dark:bg-white/5 border-none rounded-lg px-2 py-1.5 dark:text-white outline-none"
                    >
                      {Object.entries(SUBJECT_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.title}</option>
                      ))}
                    </select>
                    
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={item.extractFormulas}
                        onChange={(e) => setQueue(q => q.map(i => i.id === item.id ? { ...i, extractFormulas: e.target.checked } : i))}
                        disabled={isProcessingQueue}
                        className="rounded border-black/20 dark:border-white/20 text-black dark:text-white focus:ring-black dark:focus:ring-white"
                      />
                      <span className="dark:text-white/80">Estrai Formule/Teoremi</span>
                    </label>
                  </div>
                  
                  {item.status !== 'pending' && (
                    <div className="flex items-center gap-2 text-xs font-medium">
                      {item.status === 'processing' && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> {item.progress}</span>}
                      {item.status === 'completed' && <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completato</span>}
                      {item.status === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {item.progress}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingQueue}
                className="flex-1 py-3 rounded-xl font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm dark:text-white"
              >
                Aggiungi Altri
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="video/*"
              multiple
            />
            
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40">
              <Upload />
            </div>

            <div className="text-center">
              <p className="font-medium dark:text-white">Seleziona uno o più video</p>
              <p className="text-sm text-black/40 dark:text-white/40 mt-1">
                MP4 (consigliato), MOV o AVI
              </p>
            </div>
          </div>
        )}
      </section>

      <button
        onClick={handleProcessQueue}
        disabled={queue.length === 0 || isProcessingQueue}
        className={cn(
          "w-full py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-2",
          queue.length === 0 || isProcessingQueue 
            ? "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-not-allowed" 
            : "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] shadow-xl shadow-black/10 dark:shadow-white/5"
        )}
      >
        {isProcessingQueue ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Elaborazione Coda in corso...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>{queue.length > 1 ? "Analizza Coda (Notturno)" : "Analizza Lezione"}</span>
          </>
        )}
      </button>

      {!isLongVideo && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="threePass"
            checked={useThreePass}
            onChange={(e) => setUseThreePass(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="threePass" className="text-sm text-black/60 dark:text-white/60">
            Abilita analisi tripla (più precisa)
          </label>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
}
