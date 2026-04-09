import React from 'react';
import { Sparkles, ShieldCheck, LayoutDashboard, Coffee, Key, Sun, Moon, MonitorDown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../../lib/utils';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  setShowPrivacy: (val: boolean) => void;
  setShowSupport: (val: boolean) => void;
  setForceWizard: (val: boolean) => void;
  isInstallable: boolean;
  handleInstall: () => void;
  bmcUrl: string;
}

export function Header({
  darkMode, setDarkMode, setShowPrivacy, setShowSupport, setForceWizard, isInstallable, handleInstall, bmcUrl
}: HeaderProps) {
  return (
    <header className="border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 no-print transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight dark:text-white">LectureLens</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Backend Active</span>
          </div>
          <button 
            onClick={() => setShowPrivacy(true)}
            className="p-2 hover:bg-emerald-500/10 rounded-xl transition-colors text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
            title="Privacy & Sicurezza"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:block">Privacy Protetta</span>
          </button>
          <Link 
            to="/suite"
            className="p-2 hover:bg-indigo-500/10 rounded-xl transition-colors text-indigo-600 dark:text-indigo-400"
            title="Siliceo Suite"
          >
            <LayoutDashboard className="w-5 h-5" />
          </Link>
          <a 
            href={bmcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-amber-500/10 rounded-xl transition-colors text-amber-600 dark:text-amber-400"
            title="Offrimi un Caffè"
          >
            <Coffee className="w-5 h-5" />
          </a>
          <button 
            onClick={() => setShowSupport(true)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-black/60 dark:text-white/60"
            title="Supporto & Aiuto"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setForceWizard(true)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-black/60 dark:text-white/60"
            title="Configura API Key"
          >
            <Key className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-black/60 dark:text-white/60"
            title={darkMode ? "Attiva Tema Chiaro" : "Attiva Tema Scuro"}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isInstallable && (
            <button 
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              <MonitorDown className="w-4 h-4" />
              Installa App
            </button>
          )}
          <div className="text-xs font-mono text-black/40 dark:text-white/40 uppercase tracking-widest hidden sm:block">
            AI-Powered Study Assistant
          </div>
        </div>
      </div>
    </header>
  );
}
