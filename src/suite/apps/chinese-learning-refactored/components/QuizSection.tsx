import React from 'react';
import { BrainCircuit, RefreshCw } from 'lucide-react';
import { ChineseWord } from '../types';

interface QuizSectionProps {
  startQuiz: () => void;
  currentQuizWord: ChineseWord | null;
  quizAnswer: string;
  setQuizAnswer: (answer: string) => void;
  checkAnswer: () => void;
  quizFeedback: string;
}

export const QuizSection: React.FC<QuizSectionProps> = ({
  startQuiz,
  currentQuizWord,
  quizAnswer,
  setQuizAnswer,
  checkAnswer,
  quizFeedback
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BrainCircuit className="w-5 h-5" /> Quiz Rapido
      </h2>
      <button 
        onClick={startQuiz} 
        className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-red-700 transition flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" /> Estrai Parola
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
          <button 
            onClick={checkAnswer} 
            className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-900 transition"
          >
            Verifica
          </button>
          {quizFeedback && <p className="font-semibold">{quizFeedback}</p>}
        </div>
      )}
    </div>
  );
};
