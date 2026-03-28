/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { 
  Mic, 
  Square, 
  FileAudio, 
  Loader2, 
  FileText, 
  ClipboardList, 
  Download, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  History,
  Calendar,
  Users,
  Lightbulb,
  ArrowRightLeft,
  LayoutDashboard,
  BookOpen,
  Settings,
  X,
  Image as ImageIcon,
  Camera,
  RotateCcw,
  MessageCircle,
  BrainCircuit,
  Trophy,
  Send,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  HelpCircle,
  UserCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { Footer } from '../../components/Footer';
import { storage } from '../../../lib/storage';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini API
const getGenAI = () => {
  try {
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI:', e);
    return null;
  }
};

const genAI = getGenAI();

interface TimelineItem {
  date: string;
  event: string;
}

interface KeyFigure {
  name: string;
  role: string;
}

interface InfographicData {
  title: string;
  timeline: TimelineItem[];
  key_figures: KeyFigure[];
  causes_consequences: {
    causes: string[];
    consequences: string[];
  };
  key_terms: { term: string; definition: string }[];
  quiz: QuizQuestion[];
  primary_figure: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("HistoryStudyBuddy Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ops! Qualcosa è andato storto</h2>
            <p className="text-slate-500 mb-6">
              Si è verificato un errore durante il caricamento dell'app. Riprova o torna alla dashboard.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all"
              >
                Ricarica Pagina
              </button>
              <Link 
                to="/suite"
                className="block w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Torna alla Dashboard
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-slate-50 rounded-xl text-left text-[10px] text-red-500 overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function HistoryStudyBuddyContent() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [infographic, setInfographic] = useState<InfographicData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  useEffect(() => {
    console.log("HistoryStudyBuddy mounted");
    return () => console.log("HistoryStudyBuddy unmounted");
  }, []);

  const [activeTab, setActiveTab] = useState<'notes' | 'infographic' | 'study'>('notes');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Flashcards State
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [sessionImages, setSessionImages] = useState<string[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    const savedBg = storage.get('history_buddy_bg', null);
    if (savedBg) setBackgroundImage(savedBg);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Impossibile accedere al microfono. Assicurati di aver concesso i permessi.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Per favore seleziona un file audio valido.');
        return;
      }
      setError(null);
      setAudioBlob(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setTranscription('');
      setSummary('');
      setInfographic(null);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);
    setTranscription('');
    setSummary('');
    setInfographic(null);

    try {
      // Upload file to server
      const formData = new FormData();
      formData.append("file", audioBlob, "lecture.webm");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Errore durante l'upload del file");
      }

      const { uri } = await uploadResponse.json();

      const model = "gemini-3-flash-preview";
      
      const promptText = `
        Sei un assistente specializzato nello studio della storia per studenti delle superiori.
        Analizza l'audio fornito ${sessionImages.length > 0 ? 'e le immagini della lavagna/appunti allegate' : ''} e genera:
        1. Una trascrizione completa della lezione.
        2. Un riassunto strutturato in Markdown.
        3. Dati per un'infografica visiva che riassuma l'INTERA lezione.
        4. Un QUIZ di 5 domande a risposta multipla (4 opzioni ciascuna) per testare la comprensione.
        5. Identifica il PERSONAGGIO STORICO principale (primary_figure) con cui lo studente potrebbe voler parlare.
        
        Rispondi ESCLUSIVAMENTE in formato JSON con questa struttura:
        {
          "transcription": "testo...",
          "summary": "riassunto...",
          "infographic": { 
            "title": "...", 
            "timeline": [{"date": "...", "event": "..."}], 
            "key_figures": [{"name": "...", "role": "..."}],
            "causes_consequences": {"causes": ["..."], "consequences": ["..."]},
            "key_terms": [{"term": "...", "definition": "..."}],
            "quiz": [{"question": "...", "options": ["...", "...", "...", "..."], "correct_index": 0, "explanation": "..."}],
            "primary_figure": "Nome del personaggio"
          }
        }
      `;

      const parts: any[] = [
        { text: promptText },
        {
          fileData: {
            mimeType: audioBlob.type || 'audio/webm',
            fileUri: uri
          }
        }
      ];

      // Add images
      sessionImages.forEach(imgBase64 => {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imgBase64.split(',')[1]
          }
        });
      });

      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      setTranscription(result.transcription || '');
      setSummary(result.summary || '');
      setInfographic(result.infographic || null);
      setActiveTab('infographic');
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Si è verificato un errore durante l\'elaborazione dell\'audio.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setSummary('');
    setInfographic(null);
    setError(null);
    setRecordingTime(0);
    setQuizAnswers({});
    setShowQuizResults(false);
    setChatMessages([]);
    setCurrentMessage('');
    setFlippedCards({});
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !infographic?.primary_figure || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: currentMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setCurrentMessage('');
    setIsChatLoading(true);

    try {
      const chatPrompt = `
        Ti chiami ${infographic.primary_figure}. Sei un personaggio storico.
        Rispondi allo studente in modo coerente con la tua epoca e i fatti storici, ma sii accessibile.
        Usa le informazioni della lezione se necessario: ${summary.substring(0, 2000)}
        
        Studente: ${currentMessage}
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: chatPrompt }] }]
      });

      const modelMsg: ChatMessage = { role: 'model', text: response.text || "Scusa, non ho capito la domanda." };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { role: 'model', text: "Errore di connessione con il personaggio storico." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!infographic) return;
    
    setIsGeneratingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text(infographic.title.toUpperCase(), 20, 30);
      
      doc.setDrawColor(180, 83, 9);
      doc.setLineWidth(1);
      doc.line(20, 35, 60, 35);
      
      // Summary Section
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("RIASSUNTO DELLA LEZIONE", 20, 50);
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // Slate-600
      const splitSummary = doc.splitTextToSize(summary.replace(/[#*]/g, ''), pageWidth - 40);
      doc.text(splitSummary, 20, 60);
      
      let currentY = 60 + (splitSummary.length * 5) + 10;
      
      // Timeline
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(180, 83, 9);
      doc.text("TIMELINE DEGLI EVENTI", 20, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      infographic.timeline.forEach(item => {
        if (currentY > 270) { doc.addPage(); currentY = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(item.date + ":", 20, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(item.event, 50, currentY);
        currentY += 7;
      });
      
      currentY += 10;
      
      // Key Figures
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(67, 56, 202); // Indigo-700
      doc.text("PROTAGONISTI", 20, currentY);
      currentY += 10;
      
      infographic.key_figures.forEach(figure => {
        if (currentY > 270) { doc.addPage(); currentY = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(figure.name, 20, currentY);
        doc.setFont("helvetica", "italic");
        doc.text(" - " + figure.role, 60, currentY);
        currentY += 7;
      });

      doc.save(`Appunti_Storia_${infographic.title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF Error:', err);
      alert("Errore durante la generazione del PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSessionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSessionImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeSessionImage = (index: number) => {
    setSessionImages(prev => prev.filter((_, i) => i !== index));
  };

  const downloadAll = () => {
    const content = `
TITOLO: ${infographic?.title || 'Lezione di Storia'}

TRASCRIZIONE:
${transcription}

RIASSUNTO:
${summary}

INFOGRAFICA (SINTESI):
Timeline: ${infographic?.timeline.map(t => `${t.date}: ${t.event}`).join(', ')}
Personaggi: ${infographic?.key_figures.map(f => `${f.name} (${f.role})`).join(', ')}
    `;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "appunti_storia.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBackgroundImage(base64String);
        storage.set('history_buddy_bg', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBackground = () => {
    setBackgroundImage(null);
    storage.set('HISTORY_BUDDY_BG', null);
  };

  return (
    <div 
      className="min-h-screen transition-all duration-500 bg-fixed bg-cover bg-center"
      style={{ 
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundColor: backgroundImage ? 'transparent' : '#fff7ed'
      }}
    >
      <div className={cn(
        "min-h-screen p-4 md:p-8 max-w-6xl mx-auto font-sans",
        backgroundImage && "bg-white/80 backdrop-blur-sm min-h-screen"
      )}>
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

      <main className="grid gap-8">
        {/* Control Section */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {!audioBlob ? (
              <>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all duration-300 shadow-lg",
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  )}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-5 h-5 fill-current" />
                      Stop Registrazione ({formatTime(recordingTime)})
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Registra Lezione
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4 text-slate-400">
                  <span className="h-px w-8 bg-slate-200"></span>
                  <span className="text-xs font-bold uppercase tracking-widest">oppure</span>
                  <span className="h-px w-8 bg-slate-200"></span>
                </div>

                <label className="flex items-center gap-3 px-8 py-4 rounded-full font-bold bg-white border-2 border-slate-200 hover:border-amber-600 hover:text-amber-600 cursor-pointer transition-all duration-300">
                  <FileAudio className="w-5 h-5" />
                  Carica Registrazione
                  <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                </label>

                <label className="flex items-center gap-3 px-8 py-4 rounded-full font-bold bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 cursor-pointer transition-all duration-300">
                  <Camera className="w-5 h-5" />
                  Foto Lavagna/Appunti
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleSessionImageUpload} />
                </label>
              </>
            ) : (
              <div className="w-full flex flex-col items-center gap-6">
                <div className="w-full max-w-md bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <audio src={audioUrl!} controls className="w-full" />
                </div>
                
                {sessionImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {sessionImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt="Appunto" className="w-16 h-16 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => removeSessionImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4">
                  <button
                    onClick={processAudio}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold disabled:opacity-50 transition-all shadow-md"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        L'IA sta studiando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Genera Appunti e Infografica
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={reset}
                    disabled={isProcessing}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Elimina e ricomincia"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </section>

        {/* Results Section */}
        {(transcription || summary || isProcessing) && (
          <div className="space-y-6">
            <div className="flex justify-center gap-2 p-1 bg-slate-100 rounded-xl w-fit mx-auto">
              <button
                onClick={() => setActiveTab('notes')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
                  activeTab === 'notes' ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <BookOpen className="w-4 h-4" />
                Appunti e Riassunto
              </button>
              <button
                onClick={() => setActiveTab('infographic')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
                  activeTab === 'infographic' ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Infografica Visiva
              </button>
              <button
                onClick={() => setActiveTab('study')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
                  activeTab === 'study' ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <BrainCircuit className="w-4 h-4" />
                Studio Attivo
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'notes' ? (
                <motion.div 
                  key="notes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid md:grid-cols-2 gap-8"
                >
                  {/* Transcription Column */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <FileText className="w-5 h-5 text-amber-600" />
                        Trascrizione Lezione
                      </div>
                      {transcription && (
                        <button 
                          onClick={downloadPDF}
                          disabled={isGeneratingPDF}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                          title="Scarica PDF Professionale"
                        >
                          {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          Scarica PDF Appunti
                        </button>
                      )}
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 prose prose-slate max-w-none">
                      {isProcessing ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <p className="text-sm">Trascrivendo la lezione...</p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-sm">
                          {transcription || "La trascrizione apparirà qui."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary Column */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 font-bold text-slate-700">
                      <ClipboardList className="w-5 h-5 text-emerald-600" />
                      Riassunto per lo Studio
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 markdown-body">
                      {isProcessing ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <p className="text-sm">Sintetizzando i concetti storici...</p>
                        </div>
                      ) : (
                        summary ? (
                          <Markdown>{summary}</Markdown>
                        ) : (
                          <p className="text-slate-400 italic">Il riassunto apparirà qui.</p>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'infographic' ? (
                <motion.div 
                  key="infographic"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-10 min-h-[600px]"
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-[500px] gap-4 text-slate-400">
                      <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                      <p className="text-lg font-medium">Creando l'infografica visiva...</p>
                    </div>
                  ) : infographic ? (
                    <div className="space-y-10">
                      <div className="text-center border-b border-slate-100 pb-8">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
                          {infographic.title}
                        </h2>
                        <div className="w-20 h-1.5 bg-amber-500 mx-auto rounded-full"></div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-8">
                        {/* Timeline */}
                        <div className="md:col-span-2 space-y-6">
                          <div className="flex items-center gap-3 text-amber-700 font-black uppercase tracking-widest text-sm">
                            <Calendar className="w-5 h-5" />
                            Timeline degli Eventi
                          </div>
                          <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                            {infographic.timeline.map((item, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full border-4 border-white bg-amber-500 shadow-sm"></div>
                                <div className="font-bold text-amber-600 text-sm mb-1">{item.date}</div>
                                <div className="text-slate-700 font-medium">{item.event}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Key Figures */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 text-indigo-700 font-black uppercase tracking-widest text-sm">
                            <Users className="w-5 h-5" />
                            Protagonisti
                          </div>
                          <div className="grid gap-4">
                            {infographic.key_figures.map((figure, idx) => (
                              <div key={idx} className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                <div className="font-bold text-indigo-900">{figure.name}</div>
                                <div className="text-xs text-indigo-600 font-medium uppercase mt-1">{figure.role}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                        {/* Causes & Consequences */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 text-emerald-700 font-black uppercase tracking-widest text-sm">
                            <ArrowRightLeft className="w-5 h-5" />
                            Cause e Conseguenze
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-400 uppercase">Cause</div>
                              {infographic.causes_consequences.causes.map((c, i) => (
                                <div key={i} className="text-sm text-slate-700 flex gap-2">
                                  <span className="text-emerald-500">•</span> {c}
                                </div>
                              ))}
                            </div>
                            <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-400 uppercase">Conseguenze</div>
                              {infographic.causes_consequences.consequences.map((c, i) => (
                                <div key={i} className="text-sm text-slate-700 flex gap-2">
                                  <span className="text-amber-500">•</span> {c}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Key Terms / Flashcards */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 text-rose-700 font-black uppercase tracking-widest text-sm">
                            <Lightbulb className="w-5 h-5" />
                            Flashcards Concetti Chiave
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {infographic.key_terms.map((term, idx) => (
                              <div 
                                key={idx} 
                                className="h-32 perspective-1000 cursor-pointer"
                                onClick={() => setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              >
                                <motion.div 
                                  className="relative w-full h-full transition-all duration-500 preserve-3d"
                                  animate={{ rotateY: flippedCards[idx] ? 180 : 0 }}
                                >
                                  {/* Front */}
                                  <div className="absolute inset-0 backface-hidden bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-100 flex items-center justify-center text-center font-bold shadow-sm">
                                    {term.term}
                                  </div>
                                  {/* Back */}
                                  <div 
                                    className="absolute inset-0 backface-hidden bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center text-center text-xs overflow-y-auto"
                                    style={{ transform: 'rotateY(180deg)' }}
                                  >
                                    {term.definition}
                                  </div>
                                </motion.div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
                      <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
                      <p>L'infografica verrà generata dopo l'analisi della lezione.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="study"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid md:grid-cols-2 gap-8"
                >
                  {/* Quiz Section */}
                  <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3 text-amber-700 font-black uppercase tracking-widest text-sm">
                        <Trophy className="w-5 h-5" />
                        Quiz di Verifica
                      </div>
                      {showQuizResults && (
                        <div className="text-sm font-bold text-amber-600">
                          Punteggio: {Object.entries(quizAnswers).filter(([idx, ans]) => infographic?.quiz[Number(idx)].correct_index === ans).length} / 5
                        </div>
                      )}
                    </div>

                    <div className="space-y-8 overflow-y-auto max-h-[500px] pr-2">
                      {infographic?.quiz?.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-4">
                          <p className="font-bold text-slate-800">{qIdx + 1}. {q.question}</p>
                          <div className="grid gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = quizAnswers[qIdx] === oIdx;
                              const isCorrect = q.correct_index === oIdx;
                              const showCorrect = showQuizResults && isCorrect;
                              const showWrong = showQuizResults && isSelected && !isCorrect;

                              return (
                                <button
                                  key={oIdx}
                                  disabled={showQuizResults}
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                  className={cn(
                                    "text-left p-4 rounded-xl border-2 transition-all text-sm",
                                    isSelected && !showQuizResults ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-100 hover:border-slate-200 text-slate-600",
                                    showCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900",
                                    showWrong && "border-red-500 bg-red-50 text-red-900"
                                  )}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {showQuizResults && (
                            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100 italic">
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {!showQuizResults ? (
                      <button
                        onClick={() => setShowQuizResults(true)}
                        disabled={Object.keys(quizAnswers).length < 5}
                        className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold disabled:opacity-50 transition-all shadow-md mt-auto"
                      >
                        Conferma Risposte
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuizAnswers({});
                          setShowQuizResults(false);
                        }}
                        className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all mt-auto flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Riprova Quiz
                      </button>
                    )}
                  </div>

                  {/* Chat Section */}
                  <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col h-[650px] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
                          <UserCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Intervista a</div>
                          <div className="font-black text-indigo-900">{infographic?.primary_figure}</div>
                        </div>
                      </div>
                      <HelpCircle className="w-5 h-5 text-indigo-300" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-10 space-y-4">
                          <MessageCircle className="w-12 h-12 text-indigo-100 mx-auto" />
                          <p className="text-slate-400 text-sm max-w-[200px] mx-auto">
                            Fai una domanda a {infographic?.primary_figure} sulla lezione di oggi!
                          </p>
                        </div>
                      )}
                      {chatMessages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                            msg.role === 'user' 
                              ? "ml-auto bg-indigo-600 text-white rounded-tr-none" 
                              : "mr-auto bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                          )}
                        >
                          {msg.text}
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="mr-auto bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={`Chiedi a ${infographic?.primary_figure}...`}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!currentMessage.trim() || isChatLoading}
                          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-md"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Settings Modal */}
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

      <Footer activeApp="history-study-buddy" />
      </div>
    </div>
  );
}

export default function HistoryStudyBuddy() {
  return (
    <ErrorBoundary>
      <HistoryStudyBuddyContent />
    </ErrorBoundary>
  );
}
