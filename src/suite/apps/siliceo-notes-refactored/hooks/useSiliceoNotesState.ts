import { useState, useEffect, useCallback } from 'react';
import { storage } from '../../../../lib/storage';
import { NoteNode, NoteLink, DaemonInsight } from '../types';

export function useSiliceoNotesState() {
  const [notes, setNotes] = useState<NoteNode[]>(() => 
    storage.get('NOTES', [
      { id: '1', title: 'Benvenuto in Siliceo Notes', content: 'Inizia a creare note connesse.', x: 0, y: 0 },
      { id: '2', title: 'Il Potere dei Grafi', content: 'Le note connesse aiutano a visualizzare le relazioni tra i concetti.', x: 100, y: 100 }
    ])
  );

  const [links, setLinks] = useState<NoteLink[]>(() => 
    storage.get('NOTES_LINKS', [
      { source: '1', target: '2' }
    ])
  );

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [daemonInsights, setDaemonInsights] = useState<DaemonInsight[]>([]);

  // Initial note selection from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    if (noteId && notes.some(n => n.id === noteId)) {
      setActiveNoteId(noteId);
    }
  }, []);

  // Daemon Insights Logic
  useEffect(() => {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (!activeNote) {
      setDaemonInsights([]);
      return;
    }

    const insights: DaemonInsight[] = [];
    const activeWords = activeNote.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Check other notes for connections
    notes.forEach(note => {
      if (note.id === activeNote.id) return;
      
      const isLinked = links.some(l => {
        const sId = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const tId = typeof l.target === 'string' ? l.target : (l.target as any).id;
        return (sId === activeNote.id && tId === note.id) || (sId === note.id && tId === activeNote.id);
      });

      if (isLinked) return;

      const noteWords = note.title.toLowerCase().split(/\s+/);
      const commonWords = activeWords.filter(w => noteWords.includes(w));

      if (commonWords.length > 0) {
        insights.push({
          type: 'note',
          id: note.id,
          title: note.title,
          reason: "Entrambe le note parlano di \"" + commonWords[0] + "\""
        });
      }
    });

    // Check research history
    const history = storage.get('RESEARCH', []);
    history.forEach((h: any) => {
      const queryWords = h.query.toLowerCase().split(/\s+/);
      const commonWords = activeWords.filter(w => queryWords.includes(w));

      if (commonWords.length > 0) {
        insights.push({
          type: 'research',
          id: h.timestamp.toString(),
          title: "Ricerca: " + h.query,
          reason: "Hai fatto una ricerca su \"" + commonWords[0] + "\" recentemente"
        });
      }
    });

    setDaemonInsights(insights.slice(0, 3));
  }, [activeNoteId, notes, links]);

  const handleCreateLink = useCallback((targetId: string) => {
    if (!activeNoteId) return;
    const newLink: NoteLink = { source: activeNoteId, target: targetId };
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    storage.set('NOTES_LINKS', updatedLinks);
  }, [activeNoteId, links]);

  const handleSaveNote = useCallback((id: string, title: string, content: string, color?: string) => {
    const updatedNotes = notes.map(n => n.id === id ? { ...n, title, content, color: color || n.color } : n);
    setNotes(updatedNotes);
    storage.set('NOTES', updatedNotes);
  }, [notes]);

  const handleDeleteNote = useCallback((id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    const updatedLinks = links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const targetId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return sourceId !== id && targetId !== id;
    });
    setNotes(updatedNotes);
    setLinks(updatedLinks);
    if (activeNoteId === id) setActiveNoteId(null);
    storage.set('NOTES', updatedNotes);
    storage.set('NOTES_LINKS', updatedLinks);
  }, [notes, links, activeNoteId]);

  const handleAddNote = useCallback(() => {
    const newId = Date.now().toString();
    const newNote: NoteNode = {
      id: newId,
      title: 'Nuova Nota',
      content: '',
      x: Math.random() * 400,
      y: Math.random() * 400
    };
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    setActiveNoteId(newId);
    storage.set('NOTES', updatedNotes);
  }, [notes]);

  const handleLinkClick = useCallback((d: NoteLink) => {
    if (isDeleteMode) {
      const updatedLinks = links.filter(l => l !== d);
      setLinks(updatedLinks);
      storage.set('NOTES_LINKS', updatedLinks);
    }
  }, [isDeleteMode, links]);

  const handleNodeClick = useCallback((d: NoteNode) => {
    if (isDeleteMode) {
      handleDeleteNote(d.id);
      return;
    }
    if (isLinkingMode) {
      if (!linkingSourceId) {
        setLinkingSourceId(d.id);
      } else if (linkingSourceId !== d.id) {
        const newLink: NoteLink = { source: linkingSourceId, target: d.id };
        const updatedLinks = [...links, newLink];
        setLinks(updatedLinks);
        storage.set('NOTES_LINKS', updatedLinks);
        setLinkingSourceId(null);
        setIsLinkingMode(false);
      }
    } else {
      setActiveNoteId(d.id);
    }
  }, [isDeleteMode, isLinkingMode, linkingSourceId, links, handleDeleteNote]);

  return {
    state: {
      notes,
      links,
      activeNoteId,
      searchQuery,
      isLinkingMode,
      isDeleteMode,
      linkingSourceId,
      isSidebarOpen,
      daemonInsights
    },
    setters: {
      setNotes,
      setLinks,
      setActiveNoteId,
      setSearchQuery,
      setIsLinkingMode,
      setIsDeleteMode,
      setLinkingSourceId,
      setIsSidebarOpen
    },
    handlers: {
      handleCreateLink,
      handleSaveNote,
      handleDeleteNote,
      handleAddNote,
      handleLinkClick,
      handleNodeClick
    }
  };
}
