import { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { storage } from '../../../../lib/storage';
import { QueueItem, HistoryItem, Message } from '../types';
import { SubjectType } from '../../../../constants/SubjectConfig';
import { analyzeVideoWithFileApi, extractKeyConcepts, generateQuiz, generateExtra } from '../../../../services/GeminiAPI';
import * as UniversityService from '../../../../services/UniversityService';

export function useLectureLensState() {
  const [darkMode, setDarkMode] = useState(() => storage.get("LECTURE_LENS_DARK_MODE", false));
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [skipWizard, setSkipWizard] = useState(false);
  const [forceWizard, setForceWizard] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ transcription: string; notes: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [isLongVideo, setIsLongVideo] = useState(false);
  const [useThreePass, setUseThreePass] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  useEffect(() => {
    const saved = storage.get("LECTURE_LENS_HISTORY", []);
    if (saved) {
      try {
        setHistory(saved);
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }
    setIsInitializing(false);
  }, []);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState<string | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [isQuizFullScreen, setIsQuizFullScreen] = useState(false);
  const [isExtraFullScreen, setIsExtraFullScreen] = useState(false);
  const [extraContent, setExtraContent] = useState<string | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [viewMode, setViewMode] = useState<'upload' | 'university'>('upload');
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [isSyncingUni, setIsSyncingUni] = useState(false);
  const [uniCourses, setUniCourses] = useState<UniversityService.UniCourse[]>([]);
  const [uniLessons, setUniLessons] = useState<UniversityService.UniLesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<UniversityService.UniCourse | null>(null);
  const [isAuthenticatedUni, setIsAuthenticatedUni] = useState(false);

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const videoUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const [storageMode, setStorageMode] = useState<'browser' | 'disk'>('browser');
  const [diskHandle, setDiskHandle] = useState<any>(null);

  const [showChat, setShowChat] = useState(false);
  const [subjectType, setSubjectType] = useState<SubjectType>('scientific');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(localStorage.getItem("LECTURE_LENS_KEY"));
  const [studyTime, setStudyTime] = useState(0);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const envApiKey = process.env.GEMINI_API_KEY;
  const effectiveApiKey = (envApiKey && envApiKey !== "MY_GEMINI_API_KEY" && envApiKey !== "undefined") ? envApiKey : userApiKey;

  useEffect(() => {
    storage.set("LECTURE_LENS_DARK_MODE", darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const videoFiles = selectedFiles.filter(f => f.type.startsWith('video/'));
    
    if (videoFiles.length > 0) {
      const newItems: QueueItem[] = videoFiles.map(f => ({
        id: crypto.randomUUID(),
        file: f,
        subjectType: subjectType,
        extractFormulas: false,
        status: 'pending'
      }));
      setQueue(prev => [...prev, ...newItems]);
      setError(null);
      setFile(videoFiles[0]);
      setIsLongVideo(videoFiles[0].size > 15 * 1024 * 1024);
    } else if (selectedFiles.length > 0) {
      setError("Per favore seleziona file video validi.");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessQueue = async () => {
    if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
      setError("Chiave API mancante. Inserisci una chiave valida nel Setup Wizard.");
      return;
    }

    setIsProcessingQueue(true);
    setError(null);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'completed') continue;

      setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'processing', progress: 'Caricamento...' } : x));

      try {
        const formData = new FormData();
        formData.append("file", item.file);

        const uploadResponse = await fetch("/api/upload", { 
          method: "POST", 
          body: formData,
          headers: {
            "x-api-key": effectiveApiKey
          }
        });
        if (!uploadResponse.ok) throw new Error("Errore durante l'upload del file");

        const { uri } = await uploadResponse.json();
        setQueue(q => q.map(x => x.id === item.id ? { ...x, progress: 'Analisi con Gemini...' } : x));

        const finalResult = await analyzeVideoWithFileApi(effectiveApiKey, item.subjectType, uri, { extractFormulas: item.extractFormulas });

        setQueue(q => q.map(x => x.id === item.id ? { ...x, progress: 'Estrazione concetti chiave...' } : x));
        
        let keyConcepts: string[] = [];
        try {
          keyConcepts = await extractKeyConcepts(effectiveApiKey, finalResult.notes);
        } catch (e) {
          console.error("Key concepts extraction failed:", e);
        }

        const newItem: HistoryItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: item.file.name,
          date: new Date().toLocaleString(),
          result: finalResult,
          chatHistory: [],
          keyConcepts
        };

        setHistory(prev => {
          const updatedHistory = [newItem, ...prev].slice(0, 50);
          if (storageMode === 'browser') {
            storage.set("LECTURE_LENS_HISTORY", updatedHistory);
          } else if (diskHandle) {
            diskHandle.createWritable().then(async (writable: any) => {
              await writable.write(JSON.stringify(updatedHistory));
              await writable.close();
            }).catch((e: any) => console.error("Errore salvataggio su disco:", e));
          }
          return updatedHistory;
        });

        setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'completed', result: finalResult, progress: 'Completato' } : x));
        
        if (queue.length === 1) {
          setResult(finalResult);
          setActiveHistoryId(newItem.id);
        }

      } catch (err: any) {
        console.error(err);
        setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'error', progress: err.message || "Errore" } : x));
      }
    }
    setIsProcessingQueue(false);
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

  const handleExtractFormulas = async () => {
    if (!result || !effectiveApiKey) return;
    setLoadingExtra(true);
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Estrai tutte le formule matematiche, fisiche o chimiche e i teoremi dai seguenti appunti. 
Restituisci solo un elenco formattato in Markdown con la sintassi LaTeX per le formule (es. $$ E = mc^2 $$) e una breve spiegazione per ciascuna.

Appunti:
${result.notes}`,
      });
      setExtraContent(response.text || "");
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
    if (extraContent) content += `\n\n# Approfondimento\n\n${extraContent}`;
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
      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName: 'lecture_lens_history.json',
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
      });
      setDiskHandle(handle);
      setStorageMode('disk');
      try {
        const file = await handle.getFile();
        const text = await file.text();
        if (text) setHistory(JSON.parse(text));
      } catch (e) {
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
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
      });
      setDiskHandle(handle);
      setStorageMode('disk');
      const file = await handle.getFile();
      const text = await file.text();
      if (text) setHistory(JSON.parse(text));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Errore lettura dal disco:", err);
        alert("Impossibile leggere il file.");
      }
    }
  };

  useEffect(() => {
    let interval: any;
    if (result && !loading && !showBreakModal) {
      interval = setInterval(() => {
        setStudyTime(prev => {
          const next = prev + 1;
          if (next >= 1500) {
            setShowBreakModal(true);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [result, loading, showBreakModal]);

  const handleSaveNotes = () => {
    if (!result || !activeHistoryId) return;
    const updatedResult = { ...result, notes: editedNotes };
    setResult(updatedResult);
    setIsEditingNotes(false);
    
    setHistory(prev => {
      const updated = prev.map(item => item.id === activeHistoryId ? { ...item, result: updatedResult } : item);
      if (storageMode === 'browser') {
        storage.set("LECTURE_LENS_HISTORY", updated);
      } else if (diskHandle) {
        diskHandle.createWritable().then((writable: any) => {
          writable.write(JSON.stringify(updated)).then(() => writable.close());
        }).catch((e: any) => console.error("Errore salvataggio note su disco:", e));
      }
      return updated;
    });
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      if (event.data?.type === 'UNI_AUTH_SUCCESS') {
        setIsAuthenticatedUni(true);
        fetchUniData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchUniData = async () => {
    setIsSyncingUni(true);
    try {
      const courses = await UniversityService.getCourses();
      setUniCourses(courses);
      setSelectedUniversity("Portale Ateneo Sincronizzato");
    } catch (error) {
      console.error("Errore recupero corsi:", error);
      setIsAuthenticatedUni(false);
    } finally {
      setIsSyncingUni(false);
    }
  };

  const handleUniLogin = async () => {
    try {
      const url = await UniversityService.getAuthUrl();
      window.open(url, 'uni_auth_popup', 'width=600,height=700');
    } catch (error) {
      console.error("Errore recupero URL auth:", error);
      alert("Errore nella configurazione del portale universitario. Verifica il file .env.");
    }
  };

  const handleCourseSelect = async (course: UniversityService.UniCourse) => {
    setSelectedCourse(course);
    setIsSyncingUni(true);
    try {
      const lessons = await UniversityService.getLessons(course.id);
      setUniLessons(lessons);
    } catch (error) {
      console.error("Errore recupero lezioni:", error);
    } finally {
      setIsSyncingUni(false);
    }
  };

  const handleLoadUniLesson = async (lessonName: string, fileUrl?: string) => {
    setLoading(true);
    setProgress("Connessione al server ateneo...");
    try {
      if (fileUrl) {
        setProgress("Download risorsa in corso...");
        const downloadedFile = await UniversityService.downloadLessonFile(fileUrl);
        setFile(downloadedFile);
      } else {
        const mockFile = new File([""], lessonName + ".mp4", { type: "video/mp4" });
        setFile(mockFile);
      }
      setLoading(false);
      setViewMode('upload');
      setProgress("");
    } catch (error) {
      console.error("Errore caricamento lezione:", error);
      setError("Impossibile scaricare la lezione dal portale universitario.");
      setLoading(false);
    }
  };

  const handleMessagesChange = (newMessages: Message[]) => {
    if (!activeHistoryId) return;
    setHistory(prev => {
      const updated = prev.map(item => item.id === activeHistoryId ? { ...item, chatHistory: newMessages } : item);
      if (storageMode === 'browser') {
        storage.set("LECTURE_LENS_HISTORY", updated);
      } else if (diskHandle) {
        diskHandle.createWritable().then((writable: any) => {
          writable.write(JSON.stringify(updated)).then(() => writable.close());
        }).catch((e: any) => console.error("Errore salvataggio chat su disco:", e));
      }
      return updated;
    });
  };

  const handlePrint = () => window.print();

  const forceUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) await registration.unregister();
    }
    const cacheNames = await caches.keys();
    for (const name of cacheNames) await caches.delete(name);
    window.location.reload();
  };

  return {
    state: {
      darkMode, queue, isProcessingQueue, isInitializing, skipWizard, forceWizard,
      activeHistoryId, file, loading, result, error, progress, isLongVideo, useThreePass,
      history, showQuiz, quiz, loadingQuiz, showExtra, isQuizFullScreen, isExtraFullScreen,
      extraContent, loadingExtra, isEditingNotes, editedNotes, viewMode, selectedUniversity,
      isSyncingUni, uniCourses, uniLessons, selectedCourse, isAuthenticatedUni, showPrivacy,
      showTerms, showSupport, videoUrl, storageMode, diskHandle, showChat, subjectType,
      deferredPrompt, isInstallable, userApiKey, studyTime, showBreakModal, effectiveApiKey
    },
    refs: { fileInputRef, videoRef },
    setters: {
      setDarkMode, setQueue, setIsProcessingQueue, setIsInitializing, setSkipWizard, setForceWizard,
      setActiveHistoryId, setFile, setLoading, setResult, setError, setProgress,
      setIsLongVideo, setUseThreePass, setHistory, setShowQuiz, setQuiz, setLoadingQuiz,
      setShowExtra, setIsQuizFullScreen, setIsExtraFullScreen, setExtraContent, setLoadingExtra,
      setIsEditingNotes, setEditedNotes, setViewMode, setSelectedUniversity, setIsSyncingUni,
      setUniCourses, setUniLessons, setSelectedCourse, setIsAuthenticatedUni, setShowPrivacy,
      setShowTerms, setShowSupport, setStorageMode, setDiskHandle, setShowChat, setSubjectType,
      setUserApiKey, setStudyTime, setShowBreakModal
    },
    handlers: {
      handleInstall, handleFileChange, handleProcessQueue, handleGenerateQuiz, handleGenerateExtra, handleExtractFormulas,
      downloadNotes, setupDiskStorage, loadFromDiskStorage, handleSaveNotes, handleUniLogin,
      handleCourseSelect, handleLoadUniLesson, handleMessagesChange, handlePrint, forceUpdate,
      fetchUniData
    }
  };
}
