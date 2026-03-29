import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useSiliceoResearchState } from './hooks/useSiliceoResearchState';
import { Header } from './components/Header';
import { SearchHero } from './components/SearchHero';
import { SearchBar } from './components/SearchBar';
import { LoadingState } from './components/LoadingState';
import { ResearchResultView } from './components/ResearchResultView';
import { HistorySuggestions } from './components/HistorySuggestions';
import { Footer } from '../../components/Footer';

export default function SiliceoResearchApp() {
  const { state, setters, handlers } = useSiliceoResearchState();

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#1a1a1a] font-serif selection:bg-indigo-100">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {!state.result && !state.isSearching && <SearchHero />}

        <SearchBar 
          query={state.query}
          setQuery={setters.setQuery}
          isSearching={state.isSearching}
          handleSearch={handlers.handleSearch}
          hasResult={!!state.result}
        />

        <AnimatePresence mode="wait">
          {state.isSearching ? (
            <LoadingState />
          ) : state.result ? (
            <ResearchResultView 
              result={state.result}
              isSaving={state.isSaving}
              lastSavedNoteId={state.lastSavedNoteId}
              handleSaveToNotes={handlers.handleSaveToNotes}
            />
          ) : null}
        </AnimatePresence>

        {!state.result && !state.isSearching && (
          <HistorySuggestions 
            history={state.history}
            onSelect={handlers.selectFromHistory}
          />
        )}
      </main>

      <Footer activeApp="siliceo-research" />
    </div>
  );
}
