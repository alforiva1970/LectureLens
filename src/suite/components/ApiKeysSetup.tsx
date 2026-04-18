import React, { useState, useEffect } from 'react';
import { Key, Save, X, Eye, EyeOff } from 'lucide-react';

export function ApiKeysSetup({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [googleKey, setGoogleKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  
  const [showGoogle, setShowGoogle] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    // Carica chiavi dal localStorage se esistono
    if (isOpen) {
      setGoogleKey(localStorage.getItem('SILICEO_GOOGLE_KEY') || '');
      setOpenAiKey(localStorage.getItem('SILICEO_OPENAI_KEY') || '');
      setAnthropicKey(localStorage.getItem('SILICEO_ANTHROPIC_KEY') || '');
      setSavedStatus(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaving(true);
    
    // Save to localStorage
    if (googleKey) localStorage.setItem('SILICEO_GOOGLE_KEY', googleKey);
    else localStorage.removeItem('SILICEO_GOOGLE_KEY');
      
    if (openAiKey) localStorage.setItem('SILICEO_OPENAI_KEY', openAiKey);
    else localStorage.removeItem('SILICEO_OPENAI_KEY');
      
    if (anthropicKey) localStorage.setItem('SILICEO_ANTHROPIC_KEY', anthropicKey);
    else localStorage.removeItem('SILICEO_ANTHROPIC_KEY');
      
    setTimeout(() => {
      setIsSaving(false);
      setSavedStatus(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <Key className="w-5 h-5 text-indigo-500" />
            Gestore API Keys (BYOK)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Le tue chiavi vengono salvate esclusivamente all'interno della memoria di questo browser (LocalStorage). Non vengono mai trasmesse ai nostri database, garantendo Privacy e Zero Trust.
          </p>

          <div className="space-y-4">
            {/* Google Gemini */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold dark:text-white flex items-center gap-2">
                Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showGoogle ? 'text' : 'password'}
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowGoogle(!showGoogle)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showGoogle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* OpenAI */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold dark:text-white flex items-center gap-2">
                OpenAI API Key (Opzionale)
              </label>
              <div className="relative">
                <input
                  type={showOpenAi ? 'text' : 'password'}
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowOpenAi(!showOpenAi)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showOpenAi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Anthropic */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold dark:text-white flex items-center gap-2">
                Anthropic API Key (Opzionale)
              </label>
              <div className="relative">
                <input
                  type={showAnthropic ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowAnthropic(!showAnthropic)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/50 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : savedStatus ? (
              <Save className="w-5 h-5 text-green-300" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? 'Salvataggio...' : savedStatus ? 'Salvato!' : 'Salva Chiavi nel Browser'}
          </button>
        </div>
      </div>
    </div>
  );
}
