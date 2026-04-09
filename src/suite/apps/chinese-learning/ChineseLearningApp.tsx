import React from 'react';
import { useChineseLearningState } from './hooks/useChineseLearningState';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { QuizSection } from './components/QuizSection';
import { Footer } from '../../components/Footer';

export default function ChineseLearningApp() {
  const { state, setters, handlers } = useChineseLearningState();

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#1a1a1a] font-serif">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <UploadSection 
            handleFileUpload={handlers.handleFileUpload}
            loading={state.loading}
            words={state.words}
            error={state.error}
          />

          <QuizSection 
            startQuiz={handlers.startQuiz}
            currentQuizWord={state.currentQuizWord}
            quizAnswer={state.quizAnswer}
            setQuizAnswer={setters.setQuizAnswer}
            checkAnswer={handlers.checkAnswer}
            quizFeedback={state.quizFeedback}
          />
        </div>
      </main>

      <Footer activeApp="chinese-learning" />
    </div>
  );
}
