import React from 'react';
import { Clock, HardDrive, FolderOpen, GraduationCap, Coffee } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  activeHistoryId: string | null;
  setActiveHistoryId: (id: string | null) => void;
  setResult: (result: any) => void;
  storageMode: 'browser' | 'disk';
  setStorageMode: (mode: 'browser' | 'disk') => void;
  diskHandle: any;
  setDiskHandle: (handle: any) => void;
  setupDiskStorage: () => void;
  loadFromDiskStorage: () => void;
}

const BMC_URL = import.meta.env.VITE_BUY_ME_A_COFFEE_USERNAME 
  ? `https://buymeacoffee.com/${import.meta.env.VITE_BUY_ME_A_COFFEE_USERNAME}`
  : "https://buymeacoffee.com/alforiva";

export function HistorySidebar({
  history, setHistory, activeHistoryId, setActiveHistoryId, setResult,
  storageMode, setStorageMode, diskHandle, setDiskHandle,
  setupDiskStorage, loadFromDiskStorage
}: HistorySidebarProps) {
  return (
    <div className="space-y-8">
      {/* Buy Me a Coffee Sidebar Card */}
      <div className="p-5 bg-amber-500/5 rounded-[32px] border border-amber-500/10 mt-8 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold dark:text-white">Sostieni LectureLens</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-widest">Community Project</p>
          </div>
        </div>
        <p className="text-[11px] text-black/50 dark:text-white/50 leading-relaxed mb-4">
          LectureLens è gratuito e senza pubblicità. Se ti aiuta a studiare, offrici un caffè per mantenerlo attivo!
        </p>
        <a 
          href={BMC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-[#FFDD00] text-black rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10"
        >
          <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt="BMC" className="w-4 h-4" />
          Offrimi un Caffè
        </a>
      </div>

      {/* History Section */}
      <div className="pt-8 border-t border-black/5 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Archivio Sessioni
          </h3>
          <div className="flex gap-2">
            {storageMode === 'disk' ? (
              <span className="text-[10px] uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> Disco
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50 px-2 py-1 rounded-md">
                Browser
              </span>
            )}
          </div>
        </div>

        {/* Storage Controls */}
        <div className="flex gap-2">
          {storageMode === 'browser' ? (
            <>
              <button 
                onClick={setupDiskStorage}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-xs font-medium transition-colors dark:text-white"
                title="Salva la cronologia su un file locale (es. chiavetta USB)"
              >
                <HardDrive className="w-4 h-4" />
                Salva su Disco
              </button>
              <button 
                onClick={loadFromDiskStorage}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-xs font-medium transition-colors dark:text-white"
                title="Carica una cronologia salvata in precedenza"
              >
                <FolderOpen className="w-4 h-4" />
                Carica
              </button>
            </>
          ) : (
            <button 
              onClick={() => {
                setStorageMode('browser');
                setDiskHandle(null);
                const saved = localStorage.getItem("LECTURE_LENS_HISTORY");
                setHistory(saved ? JSON.parse(saved) : []);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-xs font-medium transition-colors dark:text-white"
            >
              Torna al salvataggio nel Browser
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <>
            <div className="flex items-center justify-end">
              <button 
                onClick={() => {
                  if (storageMode === 'browser') {
                    localStorage.removeItem("LECTURE_LENS_HISTORY");
                  } else if (diskHandle) {
                    // Clear the file
                    diskHandle.createWritable().then((writable: any) => {
                      writable.write("[]").then(() => writable.close());
                    });
                  }
                  setHistory([]);
                }}
                className="text-xs text-black/20 dark:text-white/20 hover:text-red-400 transition-colors"
              >
                Cancella Tutto
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setResult(item.result);
                    setActiveHistoryId(item.id);
                  }}
                  className={cn(
                    "w-full p-4 rounded-2xl border transition-all text-left group",
                    activeHistoryId === item.id 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm" 
                      : "bg-white dark:bg-zinc-900 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm"
                  )}
                >
                  <p className={cn(
                    "text-sm font-medium truncate transition-colors",
                    activeHistoryId === item.id ? "text-emerald-700 dark:text-emerald-400" : "dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                  )}>{item.name}</p>
                  <p className="text-[10px] text-black/30 dark:text-white/30 mt-1 uppercase tracking-tighter">{item.date}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-sm text-black/40 dark:text-white/40 italic">
            Nessuna lezione salvata
          </div>
        )}

        {/* Academic Knowledge Base */}
        {history.some(h => h.keyConcepts && h.keyConcepts.length > 0) && (
          <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
            <h3 className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest flex items-center gap-2 mb-4">
              <GraduationCap className="w-3 h-3" />
              Conoscenze Acquisite
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
              {history
                .flatMap(h => h.keyConcepts || [])
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((concept, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold rounded-md border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-tighter"
                  >
                    {concept}
                  </span>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
