import { useState, useCallback } from 'react';
import { storage } from '../../../../lib/storage';
import { extractChineseWords } from '../../../../services/GeminiAPI';
import { ChineseWord } from '../types';

export function useChineseLearningState() {
  const [words, setWords] = useState<ChineseWord[]>(() => storage.get('CHINESE', []));
  const [loading, setLoading] = useState(false);
  const [currentQuizWord, setCurrentQuizWord] = useState<ChineseWord | null>(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const envApiKey = process.env.GEMINI_API_KEY;
      const apiKey = (envApiKey && envApiKey !== "undefined") ? envApiKey : '';
      const extractedWords = await extractChineseWords(apiKey, file);
      
      if (extractedWords.length === 0) {
        setError("Nessun carattere trovato nell'immagine.");
      } else {
        const updatedWords = [...words, ...extractedWords];
        setWords(updatedWords);
        storage.set('CHINESE', updatedWords);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Errore nell'estrazione delle parole.");
    } finally {
      setLoading(false);
    }
  }, [words]);

  const startQuiz = useCallback(() => {
    if (words.length === 0) return;
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentQuizWord(randomWord);
    setQuizAnswer('');
    setQuizFeedback('');
  }, [words]);

  const checkAnswer = useCallback(() => {
    if (!currentQuizWord) return;
    if (quizAnswer.toLowerCase() === currentQuizWord.translation.toLowerCase()) {
      setQuizFeedback('Corretto! 🎉');
    } else {
      setQuizFeedback("Sbagliato. La traduzione corretta è: " + currentQuizWord.translation);
    }
  }, [currentQuizWord, quizAnswer]);

  return {
    state: {
      words,
      loading,
      currentQuizWord,
      quizAnswer,
      quizFeedback,
      error
    },
    setters: {
      setQuizAnswer
    },
    handlers: {
      handleFileUpload,
      startQuiz,
      checkAnswer
    }
  };
}
