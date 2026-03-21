/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  FileVideo, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  BookOpen, 
  MessageSquareText,
  Sparkles,
  Download,
  GraduationCap,
  Key,
  ArrowRight,
  Heart,
  Info,
  ExternalLink,
  Rocket,
  Cpu,
  Globe,
  Zap,
  Sigma,
  Printer,
  Maximize2,
  Minimize2,
  MonitorDown,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
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
  }, []);

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

const SetupWizard = ({ onComplete, onSkip }: { onComplete: (key: string) => void, onSkip: () => void }) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");

  const steps = [
    {
      title: "Benvenuto in LectureLens",
      description: "Questo strumento è stato creato per aiutarti a ottimizzare il tuo tempo. Trasformeremo le tue lezioni video in appunti pronti per lo studio.",
      icon: <Heart className="w-8 h-8 text-rose-500" />
    },
    {
      title: "Il potere di Google Gemini",
      description: "L'app usa l'intelligenza artificiale più avanzata di Google. Per iniziare, hai solo bisogno di una 'chiave' gratuita che permette all'app di parlare con il cervello di Gemini.",
      icon: <Sparkles className="w-8 h-8 text-amber-500" />
    },
    {
      title: "Ottieni la tua chiave API",
      description: "È semplicissimo: clicca il pulsante qui sotto, premi 'Create API key' e copiala. È totalmente gratuito per uso personale.",
      icon: <Key className="w-8 h-8 text-emerald-500" />,
      action: (
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-black/80 transition-all font-medium mt-4"
        >
          Vai a Google AI Studio <ExternalLink className="w-4 h-4" />
        </a>
      )
    },
    {
      title: "Configurazione Finale",
      description: "Incolla qui la tua chiave API. Verrà salvata solo nel tuo browser per permetterti di usare l'app ogni volta che vuoi.",
      icon: <CheckCircle2 className="w-8 h-8 text-blue-500" />,
      input: true
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-2xl rounded-[40px] p-12 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-black/5 dark:bg-white/5">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>

        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl flex items-center justify-center">
            {currentStep.icon}
          </div>
        </div>

        <h2 className="text-3xl font-bold tracking-tight mb-4 dark:text-white">{currentStep.title}</h2>
        <p className="text-black/50 dark:text-white/50 leading-relaxed mb-8 text-lg">
          {currentStep.description}
        </p>

        {currentStep.action && <div className="mb-8">{currentStep.action}</div>}

        {currentStep.input && (
          <div className="mb-8">
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Incolla qui la tua API Key (es. AIza...)"
              className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-center font-mono dark:text-white"
            />
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-4">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-8 py-4 text-black/40 dark:text-white/40 font-medium hover:text-black dark:hover:text-white transition-colors"
              >
                Indietro
              </button>
            )}
            <button 
              onClick={() => {
                if (step === steps.length) {
                  if (apiKey.trim()) onComplete(apiKey.trim());
                } else {
                  setStep(step + 1);
                }
              }}
              disabled={currentStep.input && !apiKey.trim()}
              className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {step === steps.length ? "Inizia a studiare" : "Continua"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={onSkip}
            className="mt-2 text-sm text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white underline underline-offset-4 transition-colors"
          >
            Salta questo passaggio (usa la chiave di sistema se disponibile)
          </button>
        </div>

        <div className="mt-12 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i + 1 === step ? "w-8 bg-emerald-500" : "bg-black/10 dark:bg-white/10"
              )} 
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("LECTURE_LENS_DARK_MODE");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("LECTURE_LENS_DARK_MODE", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [isInitializing, setIsInitializing] = useState(true);
  const [skipWizard, setSkipWizard] = useState(false);
  const [forceWizard, setForceWizard] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ transcription: string; notes: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [isLongVideo, setIsLongVideo] = useState(false);
  const [history, setHistory] = useState<{ id: string; name: string; date: string; result: any }[]>(() => {
    const saved = localStorage.getItem("LECTURE_LENS_HISTORY");
    return saved ? JSON.parse(saved) : [];
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState<string | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [isQuizFullScreen, setIsQuizFullScreen] = useState(false);
  const [isFormulasFullScreen, setIsFormulasFullScreen] = useState(false);
  const [formulas, setFormulas] = useState<string | null>(null);
  const [loadingFormulas, setLoadingFormulas] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(localStorage.getItem("LECTURE_LENS_KEY"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const envApiKey = process.env.GEMINI_API_KEY;
  const effectiveApiKey = (envApiKey && envApiKey !== "MY_GEMINI_API_KEY" && envApiKey !== "undefined") ? envApiKey : userApiKey;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setError(null);
      // Se il file è più grande di 15MB, lo consideriamo "lungo" e attiviamo il campionamento
      // per evitare di superare i limiti di payload dell'API con un singolo file base64
      setIsLongVideo(selectedFile.size > 15 * 1024 * 1024);
    } else {
      setError("Per favore seleziona un file video valido.");
    }
  };

  const extractFrames = async (videoFile: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.playsInline = true;
      
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(video.src);
        reject("Il video sta impiegando troppo tempo per caricarsi. Prova con un formato diverso (MP4 consigliato).");
      }, 30000);

      const startExtraction = async () => {
        clearTimeout(timeout);
        try {
          const duration = video.duration;
          if (!duration || isNaN(duration)) {
            throw new Error("Impossibile determinare la durata del video.");
          }

          // Campioniamo circa 15 frame distribuiti su tutta la durata
          const interval = duration / 15; 
          
          for (let i = 0; i < duration; i += interval) {
            video.currentTime = i;
            await new Promise((r, rej) => {
              const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                r(null);
              };
              video.addEventListener('seeked', onSeeked);
              // Timeout più lungo e fallback
              setTimeout(() => {
                video.removeEventListener('seeked', onSeeked);
                r(null); // Fallback: procedi comunque se scade il timeout
              }, 3000);
            });
            
            const maxWidth = 1024;
            const scale = Math.min(1, maxWidth / video.videoWidth);
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameData = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
            frames.push(frameData);
            setProgress(`Ottimizzazione visiva: ${Math.round((i / duration) * 100)}%`);
          }
          
          URL.revokeObjectURL(video.src);
          resolve(frames);
        } catch (err) {
          URL.revokeObjectURL(video.src);
          reject(err);
        }
      };

      video.onloadeddata = () => {
        if (video.readyState >= 2) {
          startExtraction();
        }
      };

      if (video.readyState >= 2) {
        startExtraction();
      }

      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(video.src);
        reject("Errore nel caricamento del video. Assicurati che il file non sia corrotto e che il formato sia supportato dal browser.");
      };
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processVideo = async () => {
    if (!file) return;

    if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
      setError("Chiave API mancante. Ricarica la pagina e inserisci una chiave API valida, oppure assicurati che l'ambiente sia configurato correttamente.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Inizializzazione...");

    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey || "" });
      const model = "gemini-3-flash-preview";
      
      let parts: any[] = [];

      if (isLongVideo) {
        setProgress("Ottimizzazione video in corso...");
        const frames = await extractFrames(file);
        
        setProgress("Analisi AI dei contenuti...");
        frames.forEach((frame) => {
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: frame
            }
          });
        });

        parts.push({
          text: `Sei un assistente universitario esperto e meticoloso. Questi sono frame estratti sequenzialmente da una lezione. 
          Basandoti su queste immagini e sulla loro sequenza:
          1. Ricostruisci il filo logico della lezione e riassumi i concetti chiave.
          2. Estrai in modo strutturato tutti gli appunti, le definizioni e le dimostrazioni visibili (lavagna, slide).
          3. Organizza il testo in sezioni logiche con titoli chiari (usando Markdown).
          4. Usa SEMPRE la notazione LaTeX per QUALSIASI formula matematica, chimica, fisica o ingegneristica (es. $H_2O$, $x^2$, $\frac{\partial f}{\partial x}$, $\iint_D f(x,y) dA$, $\vec{F} = m\vec{a}$).
          5. Se ci sono grafici o diagrammi, descrivili brevemente a parole.
          6. Aggiungi una sezione finale "Punti Chiave" con un elenco puntato dei concetti più importanti.
          
          Formatta la risposta ESATTAMENTE in questo formato JSON:
          {
            "transcription": "Riassunto discorsivo della lezione basato sui frame...",
            "notes": "Appunti strutturati in markdown con formule in LaTeX..."
          }`
        });
      } else {
        setProgress("Preparazione file...");
        const base64Data = await fileToBase64(file);
        setProgress("Analisi AI completa...");
        
        parts = [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: `Sei un assistente universitario esperto e meticoloso. Analizza questo video di una lezione. 
            1. Trascrivi e riassumi in modo discorsivo i concetti chiave spiegati a voce dal professore.
            2. Estrai in modo strutturato tutti gli appunti, le definizioni e le dimostrazioni visibili (lavagna, slide).
            3. Organizza il testo in sezioni logiche con titoli chiari (usando Markdown).
            4. Usa SEMPRE la notazione LaTeX per QUALSIASI formula matematica, chimica, fisica o ingegneristica (es. $H_2O$, $x^2$, $\frac{\partial f}{\partial x}$, $\iint_D f(x,y) dA$, $\vec{F} = m\vec{a}$).
            5. Se ci sono grafici o diagrammi, descrivili brevemente a parole.
            6. Aggiungi una sezione finale "Punti Chiave" con un elenco puntato dei concetti più importanti.
            
            Formatta la risposta ESATTAMENTE in questo formato JSON:
            {
              "transcription": "Riassunto discorsivo della lezione...",
              "notes": "Appunti strutturati in markdown con formule in LaTeX..."
            }`
          }
        ];
      }
      
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts }],
        config: { responseMimeType: "application/json" }
      });

      if (!response.text) {
        throw new Error("L'AI non ha restituito una risposta valida.");
      }

      const content = JSON.parse(response.text);
      const newResult = {
        transcription: content.transcription || "Nessun risultato.",
        notes: content.notes || "Nessun risultato."
      };
      setResult(newResult);

      // Salva in cronologia
      const newHistoryItem = {
        id: Date.now().toString(),
        name: file.name,
        date: new Date().toLocaleString(),
        result: newResult
      };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem("LECTURE_LENS_HISTORY", JSON.stringify(updatedHistory));
    } catch (err: any) {
      console.error(err);
      setError(`Errore durante l'analisi: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadNotes = () => {
    if (!result) return;
    let content = `# Trascrizione Lezione: ${file?.name || 'Lezione'}\n\n${result.transcription}\n\n# Appunti Estratti\n\n${result.notes}`;
    
    if (formulas) {
      content += `\n\n# Formulario & Teoremi\n\n${formulas}`;
    }
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Appunti_${(file?.name || 'Lezione').replace(/\.[^/.]+$/, "")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateQuiz = async () => {
    if (!result || !effectiveApiKey) return;
    setLoadingQuiz(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sei un professore universitario severo ma giusto. Basandoti ESCLUSIVAMENTE su questi appunti di una lezione, genera un quiz di verifica di 5 domande a scelta multipla (con 4 opzioni ciascuna, A, B, C, D).
        Le domande devono testare sia la comprensione teorica (definizioni, teoremi) sia la capacità di applicare le formule (piccoli esercizi di calcolo).
        Usa SEMPRE la notazione LaTeX per le formule matematiche.
        Alla fine del quiz, aggiungi una sezione "Soluzioni e Spiegazioni" dove indichi la risposta corretta per ogni domanda e spieghi brevemente il perché.
        
        Appunti della lezione:
        ${result.notes}`,
      });
      setQuiz(response.text || "Impossibile generare il quiz.");
      setShowQuiz(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const generateFormulas = async () => {
    if (!result || !effectiveApiKey) return;
    setLoadingFormulas(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sei un tutor universitario. Basandoti ESCLUSIVAMENTE su questi appunti, estrai un "Formulario e Teoremi" essenziale e ben organizzato.
        Strutturalo in questo modo:
        1. **Definizioni Principali**: I concetti base introdotti.
        2. **Formule e Leggi**: Tutte le equazioni matematiche o fisiche presenti, spiegate brevemente (es. a cosa servono i vari termini dell'equazione).
        3. **Teoremi e Principi**: Enunciati dei teoremi citati, con eventuali ipotesi e tesi.
        
        Usa SEMPRE la notazione LaTeX per le formule. Se gli appunti non contengono formule o teoremi, riassumi i concetti chiave in forma schematica.
        
        Appunti della lezione:
        ${result.notes}`,
      });
      setFormulas(response.text || "Nessuna formula estratta.");
      setShowFormulas(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFormulas(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-emerald-100 transition-colors duration-300",
      darkMode ? "dark bg-zinc-950 text-zinc-100" : "bg-[#F8F9FA] text-[#1A1A1A]"
    )}>
      <AnimatePresence>
        {isInitializing && (
          <Preloader onComplete={() => setIsInitializing(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isInitializing && (!skipWizard && (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") || forceWizard) && (
          <SetupWizard 
            onComplete={(key) => {
              localStorage.setItem("LECTURE_LENS_KEY", key);
              setUserApiKey(key);
              setForceWizard(false);
            }} 
            onSkip={() => {
              setSkipWizard(true);
              setForceWizard(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && quiz && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isQuizFullScreen ? 'p-0' : 'p-6'} no-print`}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuiz(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isQuizFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-2xl rounded-3xl max-h-[80vh]'}`}
            >
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-emerald-50/30 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                  <Zap className="w-5 h-5" />
                  <span>Quiz di Ripasso</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title="Stampa Quiz"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsQuizFullScreen(!isQuizFullScreen)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title={isQuizFullScreen ? "Riduci" : "Ingrandisci"}
                  >
                    {isQuizFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setShowQuiz(false)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors dark:text-white/60"
                  >
                    <AlertCircle className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto prose prose-emerald dark:prose-invert max-w-none custom-scrollbar text-black dark:text-white">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {quiz}
                </ReactMarkdown>
              </div>
              <div className="p-6 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] flex justify-end">
                <button 
                  onClick={() => setShowQuiz(false)}
                  className="px-6 py-2 bg-black dark:bg-white dark:text-black text-white rounded-xl font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-all"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Formulas Modal */}
      <AnimatePresence>
        {showFormulas && formulas && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isFormulasFullScreen ? 'p-0' : 'p-6'} no-print`}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormulas(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isFormulasFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-2xl rounded-3xl max-h-[80vh]'}`}
            >
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-blue-50/30 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                  <Sigma className="w-5 h-5" />
                  <span>Formulario & Teoremi</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title="Stampa Formulario"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsFormulasFullScreen(!isFormulasFullScreen)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title={isFormulasFullScreen ? "Riduci" : "Ingrandisci"}
                  >
                    {isFormulasFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setShowFormulas(false)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors dark:text-white/60"
                  >
                    <AlertCircle className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto prose prose-blue dark:prose-invert max-w-none custom-scrollbar text-black dark:text-white">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {formulas}
                </ReactMarkdown>
              </div>
              <div className="p-6 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] flex justify-end">
                <button 
                  onClick={() => setShowFormulas(false)}
                  className="px-6 py-2 bg-black dark:bg-white dark:text-black text-white rounded-xl font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-all"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print-only content */}
      <div className="hidden print:block print-content p-10">
        {showQuiz ? (
          <div className="prose prose-emerald max-w-none">
            <h1>Quiz di Ripasso</h1>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {quiz}
            </ReactMarkdown>
          </div>
        ) : showFormulas ? (
          <div className="prose prose-blue max-w-none">
            <h1>Formulario & Teoremi</h1>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {formulas}
            </ReactMarkdown>
          </div>
        ) : result ? (
          <div className="prose prose-emerald max-w-none">
            <h1>Appunti: {file?.name || 'Lezione'}</h1>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {result.notes}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>

      {/* Header */}
      <header className="border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight dark:text-white">LectureLens</h1>
          </div>
          <div className="flex items-center gap-3">
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

      <main className="max-w-7xl mx-auto px-6 py-12 no-print">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4">
              <h2 className="text-3xl font-medium tracking-tight leading-tight dark:text-white">
                Trasforma le tue lezioni in <span className="italic font-serif">conoscenza strutturata</span>.
              </h2>
              <p className="text-black/60 dark:text-white/60 leading-relaxed">
                Carica il video della tua lezione. Estrarremo automaticamente la trascrizione audio e gli appunti scritti sulla lavagna.
              </p>
            </section>

            {file ? (
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 aspect-video">
                  <video 
                    ref={videoRef}
                    src={URL.createObjectURL(file)} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                  <button 
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all"
                    title="Rimuovi video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="font-medium dark:text-white truncate px-4">{file.name}</p>
                  <p className="text-sm text-black/40 dark:text-white/40 mt-1">
                    {isLongVideo ? "Video ottimizzato: Campionamento attivo" : "Pronto per l'analisi"}
                  </p>
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
                />
                
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40">
                  <Upload />
                </div>

                <div className="text-center">
                  <p className="font-medium dark:text-white">Seleziona un video</p>
                  <p className="text-sm text-black/40 dark:text-white/40 mt-1">
                    MP4 (consigliato), MOV o AVI
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={processVideo}
              disabled={!file || loading}
              className={cn(
                "w-full py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-2",
                !file || loading 
                  ? "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-not-allowed" 
                  : "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] shadow-xl shadow-black/10 dark:shadow-white/5"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{progress || "Elaborazione..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analizza Lezione</span>
                </>
              )}
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* History Section */}
            {history.length > 0 && (
              <div className="pt-8 border-t border-black/5 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black/30 dark:text-white/30">Cronologia Recente</h3>
                  <button 
                    onClick={() => {
                      localStorage.removeItem("LECTURE_LENS_HISTORY");
                      setHistory([]);
                    }}
                    className="text-xs text-black/20 dark:text-white/20 hover:text-red-400 transition-colors"
                  >
                    Cancella
                  </button>
                </div>
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setResult(item.result)}
                      className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm transition-all text-left group"
                    >
                      <p className="text-sm font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-black/30 dark:text-white/30 mt-1 uppercase tracking-tighter">{item.date}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Transcription Card */}
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
                      <div className="flex items-center gap-2 font-medium dark:text-white">
                        <MessageSquareText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{isLongVideo ? "Riassunto Strutturato" : "Trascrizione Audio"}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(result.transcription)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-8 max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none custom-scrollbar text-black dark:text-white">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {result.transcription}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Visual Notes Card */}
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
                      <div className="flex items-center gap-2 font-medium dark:text-white">
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Appunti Estratti</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={generateFormulas}
                          disabled={loadingFormulas}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-medium disabled:opacity-50"
                        >
                          {loadingFormulas ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sigma className="w-3 h-3" />}
                          Estrai Formulario
                        </button>
                        <button 
                          onClick={generateQuiz}
                          disabled={loadingQuiz}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all font-medium disabled:opacity-50"
                        >
                          {loadingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Genera Quiz
                        </button>
                        <button 
                          onClick={handlePrint}
                          className="flex items-center gap-2 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs rounded-lg hover:bg-black/80 dark:hover:bg-white/80 transition-all"
                        >
                          <Printer className="w-3 h-3" />
                          Stampa / PDF
                        </button>
                        <button 
                          onClick={downloadNotes}
                          className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 text-black dark:text-white text-xs rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          Scarica .md
                        </button>
                        <button 
                          onClick={() => copyToClipboard(result.notes)}
                          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-8 max-h-[600px] overflow-y-auto prose prose-emerald dark:prose-invert max-w-none custom-scrollbar text-black dark:text-white">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {result.notes}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center text-black/20 dark:text-white/10 gap-4">
                  <div className="w-20 h-20 rounded-full bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-center">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <p className="font-medium">I risultati appariranno qui dopo l'analisi</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5 dark:border-white/10 mt-12 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 opacity-40 dark:text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by Gemini 3.1 Flash</span>
            </div>
            <div className="w-px h-4 bg-black/20 dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm italic">Per chi studia e lavora con passione</span>
            </div>
          </div>
          <div className="flex gap-8 text-sm font-medium text-black/40 dark:text-white/40">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Termini</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Supporto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
