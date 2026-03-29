import React from 'react';
import { History, Settings } from 'lucide-react';

interface HeaderProps {
  setIsSettingsOpen: (val: boolean) => void;
}

export function Header({ setIsSettingsOpen }: HeaderProps) {
  return (
    <header className="mb-10 text-center relative">
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="absolute right-0 top-0 p-2 text-slate-400 hover:text-amber-600 transition-colors"
        title="Personalizza App"
      >
        <Settings className="w-6 h-6" />
      </button>
      <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-2xl mb-4 text-amber-700">
        <History className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
        History Study Buddy
      </h1>
      <p className="text-slate-500 max-w-xl mx-auto">
        Trasforma le tue lezioni di storia in appunti perfetti, riassunti e infografiche visive per studiare meglio.
      </p>
    </header>
  );
}
