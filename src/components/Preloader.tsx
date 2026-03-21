import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Inizializzazione sistema...");

  const messages = [
    "Caricamento moduli AI...",
    "Calibrazione visione artificiale...",
    "Preparazione ambiente di studio...",
    "Ottimizzazione per lezioni scientifiche...",
    "Analisi fluidodinamica e meccanica...",
    "Quasi pronto..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        const next = prev + Math.random() * 15;
        
        // Update message based on progress
        const msgIndex = Math.min(Math.floor((next / 100) * messages.length), messages.length - 1);
        setMessage(messages[msgIndex]);
        
        return next;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [onComplete, messages]);

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-500">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center max-w-sm w-full"
      >
        <div className="relative mb-12">
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-32 h-32 rounded-[40px] bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center"
          >
            <Rocket className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          
          {/* Decorative rings */}
          <div className="absolute inset-0 border-2 border-emerald-500/5 dark:border-emerald-500/10 rounded-[40px] -m-4 animate-pulse" />
          <div className="absolute inset-0 border border-emerald-500/10 dark:border-emerald-500/20 rounded-[40px] -m-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2 dark:text-white">LectureLens</h2>
        <p className="text-black/40 dark:text-white/40 text-sm font-medium mb-8 uppercase tracking-widest">{message}</p>

        <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-4">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between w-full text-[10px] font-mono text-black/20 dark:text-white/20 uppercase tracking-tighter">
          <span>Booting AI Core</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Preloader;
