import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { FileText, LayoutDashboard, BrainCircuit } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Footer } from '../../components/Footer';
import { useHistoryStudyBuddyState } from './hooks/useHistoryStudyBuddyState';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { NotesTab } from './components/NotesTab';
import { InfographicTab } from './components/InfographicTab';
import { StudyTab } from './components/StudyTab';
import { SettingsModal } from './components/SettingsModal';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Ops! Qualcosa è andato storto.</h2>
            <p className="text-slate-600">Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors"
            >
              Ricarica Pagina
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function HistoryStudyBuddyContent() {
  const { state, setters, handlers } = useHistoryStudyBuddyState();

  return (
    <div 
      className="min-h-screen bg-slate-50 font-sans transition-all duration-500"
      style={state.backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.9), rgba(248, 250, 252, 0.95)), url(${state.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <Header setIsSettingsOpen={setters.setIsSettingsOpen} />

        <main className="space-y-8">
          <UploadSection 
            audioBlob={state.audioBlob}
            audioUrl={state.audioUrl}
            isRecording={state.isRecording}
            isProcessing={state.isProcessing}
            recordingTime={state.recordingTime}
            sessionImages={state.sessionImages}
            error={state.error}
            startRecording={handlers.startRecording}
            stopRecording={handlers.stopRecording}
            handleFileUpload={handlers.handleFileUpload}
            handleSessionImageUpload={handlers.handleSessionImageUpload}
            removeSessionImage={handlers.removeSessionImage}
            processAudio={handlers.processAudio}
            reset={handlers.reset}
            formatTime={handlers.formatTime}
          />

          {(state.transcription || state.isProcessing) && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-center gap-2 p-2 bg-slate-200/50 rounded-2xl backdrop-blur-sm w-fit mx-auto">
                <button
                  onClick={() => setters.setActiveTab('notes')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
                    state.activeTab === 'notes' ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  Appunti e Riassunto
                </button>
                <button
                  onClick={() => setters.setActiveTab('infographic')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
                    state.activeTab === 'infographic' ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Infografica Visiva
                </button>
                <button
                  onClick={() => setters.setActiveTab('study')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
                    state.activeTab === 'study' ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <BrainCircuit className="w-4 h-4" />
                  Studio Attivo
                </button>
              </div>

              <AnimatePresence mode="wait">
                {state.activeTab === 'notes' ? (
                  <NotesTab 
                    transcription={state.transcription}
                    summary={state.summary}
                    isProcessing={state.isProcessing}
                    isGeneratingPDF={state.isGeneratingPDF}
                    downloadPDF={handlers.downloadPDF}
                  />
                ) : state.activeTab === 'infographic' ? (
                  <InfographicTab 
                    isProcessing={state.isProcessing}
                    infographic={state.infographic}
                    flippedCards={state.flippedCards}
                    setFlippedCards={setters.setFlippedCards}
                  />
                ) : (
                  <StudyTab 
                    infographic={state.infographic}
                    quizAnswers={state.quizAnswers}
                    setQuizAnswers={setters.setQuizAnswers}
                    showQuizResults={state.showQuizResults}
                    setShowQuizResults={setters.setShowQuizResults}
                    chatMessages={state.chatMessages}
                    currentMessage={state.currentMessage}
                    setCurrentMessage={setters.setCurrentMessage}
                    isChatLoading={state.isChatLoading}
                    handleSendMessage={handlers.handleSendMessage}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </main>

        <SettingsModal 
          isSettingsOpen={state.isSettingsOpen}
          setIsSettingsOpen={setters.setIsSettingsOpen}
          backgroundImage={state.backgroundImage}
          handleBackgroundUpload={handlers.handleBackgroundUpload}
          resetBackground={handlers.resetBackground}
        />

        <Footer activeApp="history-study-buddy" />
      </div>
    </div>
  );
}

export default function HistoryStudyBuddyApp() {
  return (
    <ErrorBoundary>
      <HistoryStudyBuddyContent />
    </ErrorBoundary>
  );
}
