import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Languages, Upload, BrainCircuit, RefreshCw } from 'lucide-react';
import { Footer } from '../../components/Footer';
import { extractChineseWords } from '../../../services/GeminiAPI';
import { storage } from '../../../lib/storage';

interface ChineseWord {
  word: string;
  pinyin: string;
  translation: string;
}

export default function ChineseLearning() {
  const [words, setWords] = useState<ChineseWord[]>(() => storage.get('CHINESE', []));
  const [loading, setLoading] = useState(false);
  const [currentQuizWord, setCurrentQuizWord] = useState<ChineseWord | null>(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      const extractedWords = await extractChineseWords(apiKey, file);
      const updatedWords = [...words, ...extractedWords];
      setWords(updatedWords);
      storage.set('CHINESE', updatedWords);
    } catch (error) {
      console.error(error);
      alert("Errore nell'estrazione delle parole.");
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (words.length === 0) return;
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentQuizWord(randomWord);
    setQuizAnswer('');
    setQuizFeedback('');
  };

  const checkAnswer = () => {
    if (!currentQuizWord) return;
    if (quizAnswer.toLowerCase() === currentQuizWord.translation.toLowerCase()) {
      setQuizFeedback('Corretto! 🎉');
    } else {
      setQuizFeedback(`Sbagliato. La traduzione corretta è: ${currentQuizWord.translation}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#1a1a1a] font-serif">
      <header className="sticky top-0 z-50 bg-[#fcfcf9]/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/suite" className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white">
                <Languages className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight font-sans">Siliceo Chinese</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" /> Carica Appunti/Foto
            </h2>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
            {loading && <p className="mt-4 text-red-600">Analisi in corso...</p>}
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Parole Registrate ({words.length})</h3>
              <ul className="space-y-2">
                {words.map((w, i) => (
                  <li key={i} className="text-sm p-2 bg-zinc-100 rounded">
                    {w.word} ({w.pinyin}) - {w.translation}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" /> Quiz Rapido
            </h2>
            <button onClick={startQuiz} className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-red-700 transition">
              <RefreshCw className="w-4 h-4 inline mr-2" /> Estrai Parola
            </button>
            
            {currentQuizWord && (
              <div className="space-y-4">
                <p className="text-4xl font-bold">{currentQuizWord.word}</p>
                <input 
                  type="text" 
                  value={quizAnswer} 
                  onChange={(e) => setQuizAnswer(e.target.value)} 
                  placeholder="Traduci in italiano..."
                  className="w-full p-2 border rounded"
                />
                <button onClick={checkAnswer} className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-900 transition">
                  Verifica
                </button>
                {quizFeedback && <p className="font-semibold">{quizFeedback}</p>}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer activeApp="chinese-learning" />
    </div>
  );
}
