/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
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
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ transcription: string; notes: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [isLongVideo, setIsLongVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setError(null);
      // Se il file è più grande di 50MB, lo consideriamo "lungo" e attiviamo il campionamento
      setIsLongVideo(selectedFile.size > 50 * 1024 * 1024);
    } else {
      setError("Per favore seleziona un file video valido.");
    }
  };

  const extractFrames = async (videoFile: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.onloadedmetadata = async () => {
        const duration = video.duration;
        // Campioniamo circa 15-20 frame distribuiti su tutta la durata
        // per non eccedere i limiti di memoria ma coprire tutta la lezione
        const interval = duration / 15; 
        
        for (let i = 0; i < duration; i += interval) {
          video.currentTime = i;
          await new Promise(r => video.onseeked = r);
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Comprimiamo il frame per risparmiare spazio
          const frameData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          frames.push(frameData);
          setProgress(`Campionamento visivo: ${Math.round((i / duration) * 100)}%`);
        }
        
        URL.revokeObjectURL(video.src);
        resolve(frames);
      };

      video.onerror = () => reject("Errore nel caricamento del video per il campionamento.");
    });
  };

  const processVideo = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Inizializzazione...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3.1-flash-preview";
      
      let parts: any[] = [];

      if (isLongVideo) {
        setProgress("Analisi intelligente per lezioni lunghe...");
        const frames = await extractFrames(file);
        
        frames.forEach((frame, index) => {
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: frame
            }
          });
        });

        parts.push({
          text: `Questi sono frame estratti sequenzialmente da una lezione universitaria di lunga durata. 
          Basandoti su queste immagini e sulla loro sequenza:
          1. Ricostruisci il filo logico della lezione.
          2. Estrai tutti gli appunti scritti (lavagna, slide).
          3. Crea un riassunto strutturato e dettagliato che mantenga la coerenza temporale.
          
          Formatta la risposta ESATTAMENTE in questo formato JSON:
          {
            "transcription": "Riassunto strutturato della lezione basato sui frame...",
            "notes": "Appunti estratti e organizzati in markdown..."
          }`
        });
      } else {
        setProgress("Conversione file...");
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
            text: `Analizza questo video di una lezione. 
            1. Trascrivi l'audio parlato.
            2. Estrai gli appunti scritti visibili.
            
            Formatta la risposta ESATTAMENTE in questo formato JSON:
            {
              "transcription": "testo della trascrizione...",
              "notes": "appunti in markdown..."
            }`
          }
        ];
      }
      
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts }],
        config: { responseMimeType: "application/json" }
      });

      const content = JSON.parse(response.text || "{}");
      setResult({
        transcription: content.transcription || "Nessun risultato.",
        notes: content.notes || "Nessun risultato."
      });
    } catch (err: any) {
      console.error(err);
      setError("Errore: il video potrebbe essere troppo complesso o il formato non supportato. Prova con un file più piccolo o una clip.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadNotes = () => {
    if (!result) return;
    const content = `# Trascrizione Lezione: ${file?.name}\n\n${result.transcription}\n\n# Appunti Estratti\n\n${result.notes}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Appunti_${file?.name.replace(/\.[^/.]+$/, "")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">LectureLens</h1>
          </div>
          <div className="text-xs font-mono text-black/40 uppercase tracking-widest">
            AI-Powered Study Assistant
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4">
              <h2 className="text-3xl font-medium tracking-tight leading-tight">
                Trasforma le tue lezioni in <span className="italic font-serif">conoscenza strutturata</span>.
              </h2>
              <p className="text-black/60 leading-relaxed">
                Carica il video della tua lezione. Estrarremo automaticamente la trascrizione audio e gli appunti scritti sulla lavagna.
              </p>
            </section>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4",
                file ? "border-emerald-500 bg-emerald-50/50" : "border-black/10 hover:border-black/20 hover:bg-black/[0.02]"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="video/*"
              />
              
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                file ? "bg-emerald-100 text-emerald-600" : "bg-black/5 text-black/40"
              )}>
                {file ? <FileVideo /> : <Upload />}
              </div>

              <div className="text-center">
                <p className="font-medium">{file ? file.name : "Seleziona un video"}</p>
                <p className="text-sm text-black/40 mt-1">
                  {isLongVideo ? "Video lungo rilevato: Ottimizzazione attiva" : "MP4, MOV o AVI"}
                </p>
              </div>
            </div>

            <button
              onClick={processVideo}
              disabled={!file || loading}
              className={cn(
                "w-full py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-2",
                !file || loading 
                  ? "bg-black/5 text-black/20 cursor-not-allowed" 
                  : "bg-black text-white hover:bg-black/90 active:scale-[0.98] shadow-xl shadow-black/10"
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
                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{error}</p>
              </motion.div>
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
                  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-black/[0.01]">
                      <div className="flex items-center gap-2 font-medium">
                        <MessageSquareText className="w-4 h-4 text-emerald-600" />
                        <span>{isLongVideo ? "Riassunto Strutturato" : "Trascrizione Audio"}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(result.transcription)}
                        className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/40 hover:text-black"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-8 max-h-[400px] overflow-y-auto prose prose-sm max-w-none">
                      <p className="text-black/70 leading-relaxed whitespace-pre-wrap">
                        {result.transcription}
                      </p>
                    </div>
                  </div>

                  {/* Visual Notes Card */}
                  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-black/[0.01]">
                      <div className="flex items-center gap-2 font-medium">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>Appunti Estratti</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={downloadNotes}
                          className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-black/80 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          Scarica .md
                        </button>
                        <button 
                          onClick={() => copyToClipboard(result.notes)}
                          className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/40 hover:text-black"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-8 max-h-[600px] overflow-y-auto prose prose-emerald max-w-none">
                      <ReactMarkdown>{result.notes}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed border-black/5 rounded-3xl flex flex-col items-center justify-center text-black/20 gap-4">
                  <div className="w-20 h-20 rounded-full bg-black/[0.02] flex items-center justify-center">
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
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 opacity-40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by Gemini 3.1 Flash</span>
            </div>
            <div className="w-px h-4 bg-black/20" />
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm italic">Per chi studia e lavora con passione</span>
            </div>
          </div>
          <div className="flex gap-8 text-sm font-medium text-black/40">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Termini</a>
            <a href="#" className="hover:text-black transition-colors">Supporto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
