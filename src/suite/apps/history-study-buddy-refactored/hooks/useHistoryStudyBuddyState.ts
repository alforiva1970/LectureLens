import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { uploadFileToGeminiBrowser } from '../../../../services/GeminiAPI';
import { storage } from '../../../../lib/storage';
import { InfographicData, ChatMessage } from '../types';
import { useUserProfile } from '../../../../lib/useUserProfile';

import { MODELS } from '../../../../constants/models';

const getGenAI = () => {
  try {
    const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('SILICEO_GOOGLE_KEY') : null) || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI:', e);
    return null;
  }
};

const genAI = getGenAI();

export function useHistoryStudyBuddyState() {
  const { profile } = useUserProfile();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [infographic, setInfographic] = useState<InfographicData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
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

  useEffect(() => {
    const savedBg = storage.get('HISTORY_BUDDY_BG', null);
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
    if (!audioBlob || !genAI) return;

    setIsProcessing(true);
    setError(null);
    setTranscription('');
    setSummary('');
    setInfographic(null);

    try {
      const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('SILICEO_GOOGLE_KEY') : null) || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
      const uri = await uploadFileToGeminiBrowser(apiKey, new File([audioBlob], "lecture.webm", { type: "audio/webm" }));

      const model = MODELS.FAST;
      
      const academicContext = profile 
        ? `L'utente è uno studente universitario dell'indirizzo ${profile.academicPath.replace('_', ' ')}. Usa un tono e un livello di approfondimento accademico adatto. Se la lezione cita collegamenti con le sue materie attive (${profile.activeSubjects.join(', ')}), evidenziali.`
        : "Sei un assistente specializzato nello studio della storia per studenti universitari.";

      const promptText = `
        ${academicContext}
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
      setError("Si è verificato un errore durante l'elaborazione dell'audio.");
    } finally {
      setIsProcessing(false);
    }
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
    if (!currentMessage.trim() || !infographic?.primary_figure || isChatLoading || !genAI) return;

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
      console.error('Error in chat:', err);
      const errorMsg: ChatMessage = { role: 'model', text: "Si è verificato un errore di comunicazione. Riprova più tardi." };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadPDF = async () => {
    if (!infographic) return;
    
    setIsGeneratingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      
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

      doc.save("Appunti_Storia_" + infographic.title.replace(/\s+/g, '_') + ".pdf");
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
    const content = "TITOLO: " + (infographic?.title || 'Lezione di Storia') + "\n\n" +
      "TRASCRIZIONE:\n" + transcription + "\n\n" +
      "RIASSUNTO:\n" + summary + "\n\n" +
      "INFOGRAFICA (SINTESI):\n" +
      "Timeline: " + (infographic?.timeline.map(t => t.date + ": " + t.event).join(', ') || '') + "\n" +
      "Personaggi: " + (infographic?.key_figures.map(f => f.name + " (" + f.role + ")").join(', ') || '') + "\n";
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
        storage.set('HISTORY_BUDDY_BG', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBackground = () => {
    setBackgroundImage(null);
    storage.set('HISTORY_BUDDY_BG', null);
  };

  return {
    state: {
      isRecording, audioBlob, audioUrl, isProcessing, transcription, summary, infographic,
      error, recordingTime, activeTab, backgroundImage, isSettingsOpen, quizAnswers,
      showQuizResults, chatMessages, currentMessage, isChatLoading, flippedCards,
      sessionImages, isGeneratingPDF
    },
    setters: {
      setActiveTab, setBackgroundImage, setIsSettingsOpen, setQuizAnswers, setShowQuizResults,
      setCurrentMessage, setFlippedCards, setSessionImages, setIsGeneratingPDF, setError
    },
    handlers: {
      startRecording, stopRecording, handleFileUpload, processAudio, reset, handleSendMessage, formatTime,
      downloadPDF, handleSessionImageUpload, removeSessionImage, downloadAll, handleBackgroundUpload, resetBackground
    }
  };
}
