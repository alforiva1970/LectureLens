import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Coffee } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FooterProps {
  activeApp?: 'lecturelens' | 'history-study-buddy' | 'siliceo-notes' | 'siliceo-research' | 'chinese-learning' | 'dashboard';
  className?: string;
  compact?: boolean;
}

const BMC_USERNAME = import.meta.env.VITE_BUY_ME_A_COFFEE_USERNAME || 'progetto_siliceo';
const BMC_URL = BMC_USERNAME.startsWith('http') 
  ? BMC_USERNAME 
  : `https://www.buymeacoffee.com/${BMC_USERNAME}`;

export const Footer = ({ activeApp, className, compact }: FooterProps) => {
  const apps = [
    { id: 'lecturelens', name: 'LectureLens', link: '/' },
    { id: 'history-study-buddy', name: 'History Study Buddy', link: '/history-study-buddy' },
    { id: 'siliceo-notes', name: 'Siliceo Notes', link: '/siliceo-notes' },
    { id: 'siliceo-research', name: 'Siliceo Research', link: '/siliceo-research' },
    { id: 'chinese-learning', name: 'Siliceo Chinese', link: '/chinese-learning' },
  ];

  if (compact) {
    return (
      <footer className={cn("p-6 border-t border-black/5 dark:border-white/10 mt-auto bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm", className)}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="text-sm font-bold dark:text-white">Siliceo Suite</span>
          </div>
          <div className="text-[10px] text-black/40 dark:text-white/40 leading-relaxed">
            Parte della missione Siliceo per un'istruzione democratica.
          </div>
          <div className="flex flex-wrap gap-3">
             <a href="https://progettosiliceo.online" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Progetto Siliceo</a>
             <a href={BMC_URL} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline">Supporta</a>
          </div>
          <div className="text-[9px] text-black/20 dark:text-white/20 font-mono uppercase tracking-widest">
            Silex Protocol v2.5
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("max-w-7xl mx-auto px-6 py-12 border-t border-black/5 dark:border-white/10 mt-12 no-print", className)}>
      <div className="grid md:grid-cols-3 gap-12 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold dark:text-white">Siliceo Suite</span>
          </div>
          <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed">
            Trasformiamo l'apprendimento in un'esperienza strutturata e connessa. Parte della missione Siliceo per un'istruzione democratica e potenziata dall'AI.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">Ecosistema Siliceo</h4>
          <div className="grid grid-cols-1 gap-2">
            {apps.map((app) => (
              <div key={app.id} className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                activeApp === app.id 
                  ? "text-emerald-600 dark:text-emerald-400 font-bold" 
                  : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
              )}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  activeApp === app.id ? "bg-emerald-500" : "bg-black/10 dark:bg-white/10"
                )} />
                <Link to={app.link}>{app.name} {activeApp === app.id && "(Attivo)"}</Link>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 font-medium">
            Un unico ecosistema per tutto il tuo percorso accademico.
          </p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-black/80 dark:text-white/80">
            Built by <a href="https://progettosiliceo.online" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">Progetto Siliceo</a>
          </div>
          <a 
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#FFDD00] text-black rounded-xl text-sm font-bold hover:scale-105 transition-all shadow-sm"
          >
            <Coffee className="w-4 h-4" />
            Offrimi un caffè
          </a>
          <div className="text-[10px] text-black/20 dark:text-white/20 font-mono">
            Silex Protocol v2.5 | 2026
          </div>
        </div>
      </div>
      
      <div className="pt-8 border-t border-black/5 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest font-bold">
          © 2026 Progetto Siliceo - Intelligenza Artificiale Relazionale
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-[10px] text-black/40 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-widest font-bold">Privacy</a>
          <a href="#" className="text-[10px] text-black/40 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-widest font-bold">Termini</a>
          <a href="https://progettosiliceo.online" target="_blank" rel="noopener noreferrer" className="text-[10px] text-black/40 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-widest font-bold">Sito Web</a>
        </div>
      </div>
    </footer>
  );
};
