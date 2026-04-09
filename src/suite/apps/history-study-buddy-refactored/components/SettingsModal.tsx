import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, ImageIcon, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  backgroundImage: string | null;
  handleBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetBackground: () => void;
}

export function SettingsModal({
  isSettingsOpen, setIsSettingsOpen, backgroundImage, handleBackgroundUpload, resetBackground
}: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <Settings className="w-5 h-5" />
                Personalizza la tua App
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 hover:bg-amber-100 rounded-full text-amber-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Sfondo Personalizzato
                </label>
                <p className="text-sm text-slate-500">
                  Scegli una foto (del tuo cantante preferito, un paesaggio o altro) per rendere l'app unica.
                </p>
                
                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-center gap-2 w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold cursor-pointer transition-all shadow-md">
                    <ImageIcon className="w-5 h-5" />
                    Carica Foto
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleBackgroundUpload} 
                    />
                  </label>
                  
                  {backgroundImage && (
                    <button
                      onClick={resetBackground}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Ripristina Sfondo Default
                    </button>
                  )}
                </div>
              </div>

              {backgroundImage && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Anteprima</span>
                  <div className="h-32 w-full rounded-xl overflow-hidden border-2 border-amber-100 shadow-inner">
                    <img 
                      src={backgroundImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 text-center">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-amber-700 font-bold hover:underline"
              >
                Chiudi e torna a studiare
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
