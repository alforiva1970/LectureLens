import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useSiliceoNotesState } from './hooks/useSiliceoNotesState';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GraphView } from './components/GraphView';
import { EditorView } from './components/EditorView';

export default function SiliceoNotesApp() {
  const { state, setters, handlers } = useSiliceoNotesState();

  const activeNote = state.notes.find(n => n.id === state.activeNoteId);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      <Sidebar 
        isSidebarOpen={state.isSidebarOpen}
        setIsSidebarOpen={setters.setIsSidebarOpen}
        searchQuery={state.searchQuery}
        setSearchQuery={setters.setSearchQuery}
        handleAddNote={handlers.handleAddNote}
        notes={state.notes}
        activeNoteId={state.activeNoteId}
        setActiveNoteId={setters.setActiveNoteId}
      />

      <div className="flex-1 flex flex-col relative">
        <Header 
          isSidebarOpen={state.isSidebarOpen}
          setIsSidebarOpen={setters.setIsSidebarOpen}
          isDeleteMode={state.isDeleteMode}
          setIsDeleteMode={setters.setIsDeleteMode}
          isLinkingMode={state.isLinkingMode}
          setIsLinkingMode={setters.setIsLinkingMode}
          setLinkingSourceId={setters.setLinkingSourceId}
        />

        <div className="flex-1 flex overflow-hidden">
          <GraphView 
            notes={state.notes}
            links={state.links}
            activeNoteId={state.activeNoteId}
            isLinkingMode={state.isLinkingMode}
            linkingSourceId={state.linkingSourceId}
            isDeleteMode={state.isDeleteMode}
            onNodeClick={handlers.handleNodeClick}
            onLinkClick={handlers.handleLinkClick}
          />

          <AnimatePresence>
            {activeNote && (
              <EditorView 
                activeNote={activeNote}
                setActiveNoteId={setters.setActiveNoteId}
                handleSaveNote={handlers.handleSaveNote}
                handleDeleteNote={handlers.handleDeleteNote}
                daemonInsights={state.daemonInsights}
                handleCreateLink={handlers.handleCreateLink}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
