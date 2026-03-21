/**
 * @license
 * Proprietary License - All Rights Reserved
 * Built by Progetto Siliceo (progettosiliceo.online)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  MessageSquareText, 
  BookOpen, 
  Copy, 
  Printer, 
  Download, 
  AlertCircle, 
  Zap, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  MonitorDown, 
  Key, 
  HardDrive, 
  FolderOpen,
  X,
  MessageCircle,
  Sigma,
  Clock,
  Briefcase,
  Languages,
  Globe,
  Scale,
  GraduationCap,
  ShieldCheck,
  User,
  Send,
  Rocket,
  Heart,
  ExternalLink,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from './lib/utils';

// Modular Services & Components
import { extractAudio } from './services/AudioExtractor';
import { extractFrames } from './services/VisionExtractor';
import { 
  analyzeShortVideo, 
  analyzeFramesInChunks, 
  generateNotesLongVideo, 
  generateQuiz, 
  generateExtra 
} from './services/GeminiAPI';
import { SUBJECT_CONFIG, SubjectType } from './constants/SubjectConfig';
import TutorChat from './components/TutorChat';

// Components
import Preloader from './components/Preloader';
import SetupWizard from './components/SetupWizard';

interface HistoryItem {
  id: string;
  name: string;
  date: string;
  result: { transcription: string; notes: string };
}

interface ProcessingStep {
  message: string;
  percentage?: number;
}

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
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("LECTURE_LENS_HISTORY");
    return saved ? JSON.parse(saved) : [];
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState<string | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [isQuizFullScreen, setIsQuizFullScreen] = useState(false);
  const [isExtraFullScreen, setIsExtraFullScreen] = useState(false);
  const [extraContent, setExtraContent] = useState<string | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Footer Modals
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Storage State
  const [storageMode, setStorageMode] = useState<'browser' | 'disk'>('browser');
  const [diskHandle, setDiskHandle] = useState<any>(null);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [subjectType, setSubjectType] = useState<SubjectType>('scientific');
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

  const handleProcessVideo = async () => {
    if (!file) return;
    if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
      setError("Chiave API mancante. Inserisci una chiave valida nel Setup Wizard.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Inizializzazione...");

    try {
      let audioBase64 = "";
      let visualContext = "";
      let finalResult;

      if (isLongVideo) {
        // Extract Audio
        setProgress("Estrazione e compressione audio (Mannaia a Basso Bitrate)...");
        try {
          audioBase64 = await extractAudio(file, (p) => setProgress(p.message));
        } catch (err) {
          console.error("Audio extraction failed:", err);
        }

        // Extract Frames
        setProgress("Estrazione frame ad alta qualità...");
        const frames = await extractFrames(file, (p) => setProgress(p.message));

        // Analyze Frames in chunks
        visualContext = await analyzeFramesInChunks(
          effectiveApiKey,
          frames,
          (msg) => setProgress(msg)
        );

        // Final Synthesis
        setProgress("Generazione appunti finali...");
        finalResult = await generateNotesLongVideo(
          effectiveApiKey,
          subjectType,
          visualContext,
          audioBase64
        );
      } else {
        // Short video: direct analysis
        setProgress("Analisi video in corso...");
        finalResult = await analyzeShortVideo(effectiveApiKey, subjectType, file);
      }

      if (finalResult) {
        setResult(finalResult);

        // Save to history
        const newItem = {
          id: Date.now().toString(),
          name: file.name,
          date: new Date().toLocaleString(),
          result: finalResult
        };
        const updatedHistory = [newItem, ...history].slice(0, 10);
        setHistory(updatedHistory);
        
        if (storageMode === 'browser') {
          localStorage.setItem("LECTURE_LENS_HISTORY", JSON.stringify(updatedHistory));
        } else if (diskHandle) {
          // Update disk storage
          try {
            const writable = await diskHandle.createWritable();
            await writable.write(JSON.stringify(updatedHistory));
            await writable.close();
          } catch (e) {
            console.error("Errore salvataggio su disco:", e);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(`Errore: ${err.message || "Analisi fallita"}`);
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleGenerateQuiz = async () => {
    if (!result || !effectiveApiKey) return;
    setLoadingQuiz(true);
    try {
      const quizData = await generateQuiz(effectiveApiKey, subjectType, result.notes);
      setQuiz(quizData);
      setShowQuiz(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleGenerateExtra = async () => {
    if (!result || !effectiveApiKey) return;
    setLoadingExtra(true);
    try {
      const extraData = await generateExtra(effectiveApiKey, subjectType, result.notes);
      setExtraContent(extraData);
      setShowExtra(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExtra(false);
    }
  };

  const downloadNotes = () => {
    if (!result) return;
    let content = `# Appunti: ${file?.name || 'Lezione'}\n\n${result.notes}`;
    if (extraContent) {
      content += `\n\n# Approfondimento\n\n${extraContent}`;
    }
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LectureLens_${(file?.name || 'Appunti').replace(/\.[^/.]+$/, "")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const setupDiskStorage = async () => {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName: 'lecture_lens_history.json',
        types: [{
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        }],
      });
      setDiskHandle(handle);
      setStorageMode('disk');
      
      // Try to read existing data if any
      try {
        const file = await handle.getFile();
        const text = await file.text();
        if (text) {
          const parsed = JSON.parse(text);
          setHistory(parsed);
        }
      } catch (e) {
        // File might be empty or new, that's fine
        console.log("Nuovo file di cronologia creato");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Errore accesso al disco:", err);
        alert("Impossibile accedere al disco. Il browser potrebbe non supportare questa funzione.");
      }
    }
  };

  const loadFromDiskStorage = async () => {
    try {
      // @ts-ignore - File System Access API
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        }],
      });
      setDiskHandle(handle);
      setStorageMode('disk');
      
      const file = await handle.getFile();
      const text = await file.text();
      if (text) {
        const parsed = JSON.parse(text);
        setHistory(parsed);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Errore lettura dal disco:", err);
        alert("Impossibile leggere il file.");
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

      {/* Extra Content Modal */}
      <AnimatePresence>
        {showExtra && extraContent && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isExtraFullScreen ? 'p-0' : 'p-6'} no-print`}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExtra(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isExtraFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-2xl rounded-3xl max-h-[80vh]'}`}
            >
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-blue-50/30 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                  {React.createElement(SUBJECT_CONFIG[subjectType].extraIcon, { className: "w-5 h-5" })}
                  <span>{SUBJECT_CONFIG[subjectType].extraBtn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title={`Stampa ${SUBJECT_CONFIG[subjectType].extraBtn}`}
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsExtraFullScreen(!isExtraFullScreen)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title={isExtraFullScreen ? "Riduci" : "Ingrandisci"}
                  >
                    {isExtraFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setShowExtra(false)}
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
                  {extraContent}
                </ReactMarkdown>
              </div>
              <div className="p-6 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] flex justify-end">
                <button 
                  onClick={() => setShowExtra(false)}
                  className="px-6 py-2 bg-black dark:bg-white dark:text-black text-white rounded-xl font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-all"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <TutorChat 
            onClose={() => setShowChat(false)} 
            notes={result?.notes || ""} 
            subjectType={subjectType}
            apiKey={effectiveApiKey || ""}
          />
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
        ) : showExtra ? (
          <div className="prose prose-blue max-w-none">
            <h1>{SUBJECT_CONFIG[subjectType].extraBtn}</h1>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {extraContent}
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-black/40 dark:text-white/40">2. Carica il Video</h3>
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
            </section>

            <button
              onClick={handleProcessVideo}
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
            <div className="pt-8 border-t border-black/5 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black/30 dark:text-white/30">Cronologia</h3>
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
                        onClick={() => setResult(item.result)}
                        className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:shadow-sm transition-all text-left group"
                      >
                        <p className="text-sm font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors dark:text-white">{item.name}</p>
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
            </div>
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
                          onClick={handleGenerateExtra}
                          disabled={loadingExtra}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-medium disabled:opacity-50"
                        >
                          {loadingExtra ? <Loader2 className="w-3 h-3 animate-spin" /> : React.createElement(SUBJECT_CONFIG[subjectType].extraIcon, { className: "w-3 h-3" })}
                          {SUBJECT_CONFIG[subjectType].extraBtn}
                        </button>
                        <button 
                          onClick={() => setShowChat(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all font-medium disabled:opacity-50"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Tutor AI
                        </button>
                        <button 
                          onClick={handleGenerateQuiz}
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

            {result && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-200/80 text-sm no-print">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  <strong>Attenzione:</strong> LectureLens utilizza l'Intelligenza Artificiale per generare questi appunti. L'AI può commettere errori, omettere dettagli o generare informazioni inesatte. Verifica sempre i risultati confrontandoli con il materiale originale o con i tuoi libri di testo.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5 dark:border-white/10 mt-12 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 opacity-60 dark:text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by Gemini 3.1 Flash</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-black/20 dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Accademico & Sicuro</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-black/20 dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-medium">Proprietary License</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-black/80 dark:text-white/80">
              Built by <a href="https://progettosiliceo.online" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">Progetto Siliceo</a>
            </div>
            <div className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest font-medium">
              © 2026 All Rights Reserved
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-8 text-sm font-medium text-black/40 dark:text-white/40">
          <button onClick={() => setShowPrivacy(true)} className="hover:text-black dark:hover:text-white transition-colors">Privacy</button>
          <button onClick={() => setShowTerms(true)} className="hover:text-black dark:hover:text-white transition-colors">Termini</button>
          <button onClick={() => setShowSupport(true)} className="hover:text-black dark:hover:text-white transition-colors">Supporto</button>
        </div>
      </footer>

      {/* Info Modals */}
      <AnimatePresence>
        {(showPrivacy || showTerms || showSupport) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowPrivacy(false); setShowTerms(false); setShowSupport(false); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 w-full max-w-2xl rounded-3xl max-h-[80vh]"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-xl dark:text-white">
                  {showPrivacy ? "Informativa sulla Privacy" : showTerms ? "Termini di Servizio" : "Supporto"}
                </h3>
                <button 
                  onClick={() => { setShowPrivacy(false); setShowTerms(false); setShowSupport(false); }}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors dark:text-white/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto prose prose-sm dark:prose-invert max-w-none custom-scrollbar">
                {showPrivacy && (
                  <>
                    <p><strong>1. Raccolta Dati:</strong> LectureLens elabora i file video e audio localmente nel tuo browser per estrarre i frame. I dati vengono inviati alle API di Google Gemini esclusivamente per la generazione degli appunti e delle trascrizioni.</p>
                    <p><strong>2. Conservazione:</strong> La cronologia delle tue lezioni viene salvata localmente nel tuo browser (LocalStorage/IndexedDB). Nessun dato personale o video viene salvato sui nostri server.</p>
                    <p><strong>3. API Key:</strong> La tua chiave API di Google Gemini viene salvata crittografata localmente sul tuo dispositivo e inviata direttamente ai server di Google. Non abbiamo accesso alla tua chiave.</p>
                  </>
                )}
                {showTerms && (
                  <>
                    <p><strong>1. Uso del Servizio:</strong> LectureLens è uno strumento di supporto allo studio. L'utente è l'unico responsabile dei file caricati e deve assicurarsi di avere i diritti per analizzarli.</p>
                    <p><strong>2. Intelligenza Artificiale:</strong> Il servizio utilizza modelli di Intelligenza Artificiale (LLM). L'AI può commettere errori, generare "allucinazioni" o omettere informazioni. L'utente è tenuto a verificare sempre la correttezza degli appunti generati confrontandoli con il materiale originale.</p>
                    <p><strong>3. Limitazione di Responsabilità:</strong> Non ci assumiamo responsabilità per eventuali errori nei riassunti, nei quiz o nelle risposte del Tutor AI che potrebbero influire sul rendimento accademico.</p>
                  </>
                )}
                {showSupport && (
                  <>
                    <p>Hai bisogno di aiuto con LectureLens?</p>
                    <ul>
                      <li><strong>Problemi di caricamento:</strong> Assicurati che il video sia in formato MP4, WebM o MOV e che non superi i limiti di memoria del tuo browser.</li>
                      <li><strong>Errore API:</strong> Verifica che la tua chiave API di Google Gemini sia valida e abbia credito sufficiente. Puoi aggiornarla cliccando sull'icona della chiave in alto a destra.</li>
                      <li><strong>Appunti imprecisi:</strong> I modelli AI funzionano meglio con audio chiaro e slide leggibili. Prova a ricaricare il video o a utilizzare la funzione Tutor AI per chiarire i dubbi.</li>
                    </ul>
                    <p>Per ulteriore assistenza, contatta il supporto tecnico all'indirizzo email fornito dal tuo istituto o sviluppatore.</p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
