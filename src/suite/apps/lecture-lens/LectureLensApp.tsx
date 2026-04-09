import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Upload, GraduationCap } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SUBJECT_CONFIG } from '../../../constants/SubjectConfig';

import { useLectureLensState } from './hooks/useLectureLensState';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { UniversitySection } from './components/UniversitySection';
import { HistorySidebar } from './components/HistorySidebar';
import { ResultsSection } from './components/ResultsSection';
import { Modals } from './components/Modals';

import Preloader from '../../../components/Preloader';
import SetupWizard from '../../../components/SetupWizard';
import { Footer } from '../../components/Footer';
import TutorChat from '../../../components/TutorChat';

export function LectureLensApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { state, refs, setters, handlers } = useLectureLensState();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={cn(
      state.darkMode ? "dark bg-zinc-950 text-zinc-100" : "bg-[#F8F9FA] text-[#1A1A1A]"
    )}>
      <AnimatePresence>
        {state.isInitializing && (
          <Preloader onComplete={() => setters.setIsInitializing(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!state.isInitializing && (!state.skipWizard && (!state.effectiveApiKey || state.effectiveApiKey === "MY_GEMINI_API_KEY") || state.forceWizard) && (
          <SetupWizard 
            onComplete={(key) => {
              localStorage.setItem("LECTURE_LENS_KEY", key);
              setters.setUserApiKey(key);
              setters.setForceWizard(false);
            }} 
            onSkip={() => {
              setters.setSkipWizard(true);
              setters.setForceWizard(false);
            }}
          />
        )}
      </AnimatePresence>

      <Modals 
        showBreakModal={state.showBreakModal}
        setShowBreakModal={setters.setShowBreakModal}
        setStudyTime={setters.setStudyTime}
        showPrivacy={state.showPrivacy}
        setShowPrivacy={setters.setShowPrivacy}
        showTerms={state.showTerms}
        setShowTerms={setters.setShowTerms}
        showSupport={state.showSupport}
        setShowSupport={setters.setShowSupport}
        forceUpdate={handlers.forceUpdate}
        showQuiz={state.showQuiz}
        setShowQuiz={setters.setShowQuiz}
        quiz={state.quiz}
        isQuizFullScreen={state.isQuizFullScreen}
        setIsQuizFullScreen={setters.setIsQuizFullScreen}
        handlePrint={handlers.handlePrint}
        showExtra={state.showExtra}
        setShowExtra={setters.setShowExtra}
        extraContent={state.extraContent}
        isExtraFullScreen={state.isExtraFullScreen}
        setIsExtraFullScreen={setters.setIsExtraFullScreen}
        subjectType={state.subjectType}
      />

      {/* Chat Modal */}
      <AnimatePresence>
        {state.showChat && (
          <TutorChat 
            onClose={() => setters.setShowChat(false)} 
            notes={state.result?.notes || ""} 
            subjectType={state.subjectType}
            apiKey={state.effectiveApiKey || ""}
            initialMessages={state.history.find(h => h.id === state.activeHistoryId)?.chatHistory || []}
            onMessagesChange={handlers.handleMessagesChange}
            academicContext={state.history
              .filter(h => h.id !== state.activeHistoryId)
              .flatMap(h => h.keyConcepts || [])
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(", ")}
          />
        )}
      </AnimatePresence>

      {/* Print-only content */}
      <div className="hidden print:block print-content p-10">
        {state.showQuiz ? (
          <div className="prose prose-emerald max-w-none">
            <h1>Quiz di Ripasso</h1>
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
              {(state.quiz || "").replace(/\\n/g, '\n')}
            </ReactMarkdown>
          </div>
        ) : state.showExtra ? (
          <div className="prose prose-blue max-w-none">
            <h1>{SUBJECT_CONFIG[state.subjectType].extraBtn}</h1>
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
              {(state.extraContent || "").replace(/\\n/g, '\n')}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>

      <Header 
        bmcUrl={import.meta.env.VITE_BUY_ME_A_COFFEE_USERNAME}
        darkMode={state.darkMode}
        setDarkMode={setters.setDarkMode}
        setShowPrivacy={setters.setShowPrivacy}
        setShowSupport={setters.setShowSupport}
        setForceWizard={setters.setForceWizard}
        isInstallable={state.isInstallable}
        handleInstall={handlers.handleInstall}
      />

      <main className="max-w-7xl mx-auto px-6 py-12 no-print">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-4 space-y-8">
            {/* View Mode Switcher */}
            <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-black/5 dark:border-white/10 flex gap-1 shadow-sm">
              <button 
                onClick={() => setters.setViewMode('upload')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  state.viewMode === 'upload' ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Manuale
              </button>
              <button 
                onClick={() => setters.setViewMode('university')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  state.viewMode === 'university' ? "bg-emerald-500 text-white shadow-md" : "text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Portale Ateneo
              </button>
            </div>

            {state.viewMode === 'upload' ? (
              <UploadSection 
                queue={state.queue}
                setQueue={setters.setQueue}
                isProcessingQueue={state.isProcessingQueue}
                subjectType={state.subjectType}
                setSubjectType={setters.setSubjectType}
                fileInputRef={refs.fileInputRef}
                handleFileChange={handlers.handleFileChange}
                handleProcessQueue={handlers.handleProcessQueue}
                setFile={setters.setFile}
                resetUpload={setters.resetUpload}
                useThreePass={state.useThreePass}
                setUseThreePass={setters.setUseThreePass}
                error={state.error}
                videoUrl={state.videoUrl}
              />
            ) : (
              <UniversitySection 
                isAuthenticatedUni={state.isAuthenticatedUni}
                isSyncingUni={state.isSyncingUni}
                selectedUniversity={state.selectedUniversity}
                uniCourses={state.uniCourses}
                uniLessons={state.uniLessons}
                selectedCourse={state.selectedCourse}
                handleUniLogin={handlers.handleUniLogin}
                fetchUniData={handlers.fetchUniData}
                setIsAuthenticatedUni={setters.setIsAuthenticatedUni}
                setSelectedUniversity={setters.setSelectedUniversity}
                setSelectedCourse={setters.setSelectedCourse}
                handleCourseSelect={handlers.handleCourseSelect}
                handleLoadUniLesson={handlers.handleLoadUniLesson}
              />
            )}

            <HistorySidebar 
              history={state.history}
              setHistory={setters.setHistory}
              activeHistoryId={state.activeHistoryId}
              setActiveHistoryId={setters.setActiveHistoryId}
              setResult={setters.setResult}
              storageMode={state.storageMode}
              setStorageMode={setters.setStorageMode}
              diskHandle={state.diskHandle}
              setDiskHandle={setters.setDiskHandle}
              setupDiskStorage={handlers.setupDiskStorage}
              loadFromDiskStorage={handlers.loadFromDiskStorage}
            />
          </div>

          <ResultsSection 
            result={state.result}
            isLongVideo={state.isLongVideo}
            copyToClipboard={copyToClipboard}
            isEditingNotes={state.isEditingNotes}
            setIsEditingNotes={setters.setIsEditingNotes}
            editedNotes={state.editedNotes}
            setEditedNotes={setters.setEditedNotes}
            handleSaveNotes={handlers.handleSaveNotes}
            handleGenerateExtra={handlers.handleGenerateExtra}
            handleExtractFormulas={handlers.handleExtractFormulas}
            loadingExtra={state.loadingExtra}
            subjectType={state.subjectType}
            setShowChat={setters.setShowChat}
            handleGenerateQuiz={handlers.handleGenerateQuiz}
            loadingQuiz={state.loadingQuiz}
            handlePrint={handlers.handlePrint}
            downloadNotes={handlers.downloadNotes}
            error={state.error}
          />

        </div>
      </main>

      <Footer activeApp="lecturelens" />
    </div>
  );
}

export default LectureLensApp;
