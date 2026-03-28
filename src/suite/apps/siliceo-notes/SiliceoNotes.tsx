import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Share2, 
  Plus, 
  Search, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  Maximize2,
  Minimize2,
  Trash2,
  Save,
  ArrowLeft,
  Sparkles,
  Zap,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { cn } from '../../../lib/utils';
import { Footer } from '../../components/Footer';
import { storage } from '../../../lib/storage';

interface NoteNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  content: string;
  color?: string;
}

interface NoteLink extends d3.SimulationLinkDatum<NoteNode> {
  source: string | NoteNode;
  target: string | NoteNode;
}

export default function SiliceoNotes() {
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
  const [daemonInsights, setDaemonInsights] = useState<{ type: 'research' | 'note', id: string, title: string, reason: string }[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<NoteNode, NoteLink> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    if (noteId && notes.some(n => n.id === noteId)) {
      setActiveNoteId(noteId);
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<NoteNode>(notes)
      .force('link', d3.forceLink<NoteNode, NoteLink>(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

    simulationRef.current = simulation;

    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2)
      .attr('cursor', isDeleteMode ? 'pointer' : 'default')
      .on('click', (event, d) => {
        if (isDeleteMode) {
          const updatedLinks = links.filter(l => l !== d);
          setLinks(updatedLinks);
          localStorage.setItem('SILICEO_NOTES_LINKS', JSON.stringify(updatedLinks));
        }
      });

    const node = g.append('g')
      .selectAll('g')
      .data(notes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        if (isDeleteMode) {
          handleDeleteNote(d.id);
          return;
        }
        if (isLinkingMode) {
          if (!linkingSourceId) {
            setLinkingSourceId(d.id);
          } else if (linkingSourceId !== d.id) {
            // Create link
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
      })
      .call(d3.drag<SVGGElement, NoteNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('circle')
      .attr('r', 10)
      .attr('fill', d => {
        if (d.id === linkingSourceId) return '#f59e0b'; // Amber for source
        if (d.id === activeNoteId) return '#10b981'; // Active emerald
        return d.color || '#6366f1'; // Default indigo or custom color
      })
      .attr('stroke', d => d.id === linkingSourceId ? '#fbbf24' : 'none')
      .attr('stroke-width', 3);

    node.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .text(d => d.title)
      .attr('font-size', '12px')
      .attr('fill', '#666');

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [notes, links, activeNoteId, isLinkingMode, linkingSourceId, isDeleteMode]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  useEffect(() => {
    if (!activeNote) {
      setDaemonInsights([]);
      return;
    }

    const insights: { type: 'research' | 'note', id: string, title: string, reason: string }[] = [];
    const activeWords = activeNote.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Check other notes for connections
    notes.forEach(note => {
      if (note.id === activeNote.id) return;
      
      // Check if already linked
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
          reason: `Entrambe le note parlano di "${commonWords[0]}"`
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
          title: `Ricerca: ${h.query}`,
          reason: `Hai fatto una ricerca su "${commonWords[0]}" recentemente`
        });
      }
    });

    setDaemonInsights(insights.slice(0, 3));
  }, [activeNoteId, notes, links]);

  const handleCreateLink = (targetId: string) => {
    if (!activeNoteId) return;
    const newLink: NoteLink = { source: activeNoteId, target: targetId };
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    storage.set('NOTES_LINKS', updatedLinks);
  };

  const handleSaveNote = (id: string, title: string, content: string, color?: string) => {
    const updatedNotes = notes.map(n => n.id === id ? { ...n, title, content, color: color || n.color } : n);
    setNotes(updatedNotes);
    storage.set('NOTES', updatedNotes);
  };

  const handleDeleteNote = (id: string) => {
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
  };

  const handleAddNote = () => {
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
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: isSidebarOpen ? 320 : 0 }}
        className="bg-white dark:bg-zinc-900 border-r border-black/5 dark:border-white/10 flex flex-col overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-bold dark:text-white">Siliceo Notes</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 dark:text-white/60" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
            <input 
              type="text"
              placeholder="Cerca note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/5 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white"
            />
          </div>

          <button 
            onClick={handleAddNote}
            className="w-full mb-6 p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Nuova Nota
          </button>

          <div className="space-y-2">
            {notes
              .filter(n => 
                n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                n.content.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(note => (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all group",
                  activeNoteId === note.id 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60"
                )}
              >
                <div className="font-bold truncate">{note.title || 'Senza titolo'}</div>
                <div className="text-xs opacity-60 truncate">{note.content.substring(0, 40)}...</div>
              </button>
            ))}
          </div>
        </div>
        <Footer activeApp="siliceo-notes" compact className="border-t-0 bg-transparent" />
      </motion.div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="h-16 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 dark:text-white/60" />
              </button>
            )}
            <a href="/suite" className="flex items-center gap-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Suite
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setIsDeleteMode(!isDeleteMode);
                setIsLinkingMode(false);
                setLinkingSourceId(null);
              }}
              className={cn(
                "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold",
                isDeleteMode 
                  ? "bg-red-500 text-white" 
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60"
              )}
              title="Modalità cancellazione"
            >
              <Trash2 className="w-5 h-5" />
              {isDeleteMode && "Clicca nodi o archi"}
            </button>
            <button 
              onClick={() => {
                setIsLinkingMode(!isLinkingMode);
                setIsDeleteMode(false);
                setLinkingSourceId(null);
              }}
              className={cn(
                "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold",
                isLinkingMode 
                  ? "bg-amber-500 text-white" 
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60"
              )}
              title="Collega due note"
            >
              <Share2 className="w-5 h-5" />
              {isLinkingMode && "Seleziona destinazione"}
            </button>
            <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-black/60 dark:text-white/60">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Graph View */}
          <div className="flex-1 relative bg-white dark:bg-zinc-950">
            <svg ref={svgRef} className="w-full h-full" />
            <div className="absolute bottom-6 left-6 flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full text-xs font-bold text-black/40 dark:text-white/40 shadow-sm">
                Visualizzazione Grafo
              </div>
            </div>
          </div>

          {/* Editor View */}
          <AnimatePresence>
            {activeNote && (
              <motion.div 
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="w-[450px] bg-white dark:bg-zinc-900 border-l border-black/5 dark:border-white/10 flex flex-col shadow-2xl z-20"
              >
                <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => handleSaveNote(activeNote.id, e.target.value, activeNote.content)}
                      className="bg-transparent border-none focus:ring-0 font-bold text-xl dark:text-white w-full"
                      placeholder="Titolo della nota..."
                    />
                    <div className="flex gap-2 mt-2">
                      {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                        <button
                          key={color}
                          onClick={() => handleSaveNote(activeNote.id, activeNote.title, activeNote.content, color)}
                          className={cn(
                            "w-4 h-4 rounded-full border border-black/10 dark:border-white/10",
                            activeNote.color === color && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveNoteId(null)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 dark:text-white/60" />
                  </button>
                </div>
                <textarea 
                  value={activeNote.content}
                  onChange={(e) => handleSaveNote(activeNote.id, activeNote.title, e.target.value)}
                  className="flex-1 p-8 bg-transparent border-none focus:ring-0 resize-none text-black/80 dark:text-white/80 leading-relaxed custom-scrollbar"
                  placeholder="Inizia a scrivere..."
                />

                {/* Daemon Insights Panel */}
                {daemonInsights.length > 0 && (
                  <div className="px-8 py-4 bg-indigo-500/5 border-t border-indigo-500/10">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-3">
                      <Zap className="w-3 h-3" />
                      Silex Daemon Insights
                    </div>
                    <div className="space-y-2">
                      {daemonInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-zinc-800 rounded-lg border border-indigo-500/10 group animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold truncate dark:text-white">{insight.title}</div>
                            <div className="text-[9px] text-black/40 dark:text-white/40 truncate">{insight.reason}</div>
                          </div>
                          {insight.type === 'note' ? (
                            <button 
                              onClick={() => handleCreateLink(insight.id)}
                              className="p-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors shadow-sm"
                              title="Crea collegamento"
                            >
                              <LinkIcon className="w-3 h-3" />
                            </button>
                          ) : (
                            <a 
                              href="/siliceo-research"
                              className="p-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors shadow-sm"
                              title="Vedi ricerca"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
                  <button 
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina
                  </button>
                  <div className="flex items-center gap-2 text-xs font-bold text-black/40 dark:text-white/40">
                    <Save className="w-4 h-4" />
                    Salvato automaticamente
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
