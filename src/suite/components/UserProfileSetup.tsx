import React, { useState, useEffect } from 'react';
import { SubjectType } from '../../constants/SubjectConfig';
import { useUserProfile } from '../../lib/useUserProfile';
import { Settings, Save, X, BookOpen, Microscope, Gavel, Languages, Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function UserProfileSetup({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { profile, saveProfile, isLoading, error } = useUserProfile();
  
  const [academicPath, setAcademicPath] = useState<SubjectType | ''>('');
  const [subjectInput, setSubjectInput] = useState('');
  const [activeSubjects, setActiveSubjects] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setAcademicPath(profile.academicPath);
      setActiveSubjects(profile.activeSubjects || []);
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleAddSubject = () => {
    if (subjectInput.trim() && !activeSubjects.includes(subjectInput.trim())) {
      setActiveSubjects([...activeSubjects, subjectInput.trim()]);
      setSubjectInput('');
    }
  };

  const handleSave = async () => {
    if (!academicPath) return;
    setIsSaving(true);
    await saveProfile(academicPath as SubjectType, activeSubjects);
    setIsSaving(false);
    onClose();
  };

  const getPathIcon = (path: SubjectType) => {
    switch (path) {
      case 'scientific': return <Microscope className="w-5 h-5 text-emerald-500" />;
      case 'humanities': return <BookOpen className="w-5 h-5 text-amber-500" />;
      case 'law_economics': return <Gavel className="w-5 h-5 text-blue-500" />;
      case 'languages': return <Languages className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <Settings className="w-5 h-5 text-indigo-500" />
            Configurazione Profilo Accademico
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          {/* Academic Path Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Il tuo Indirizzo (Facoltà)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Scegli il tuo percorso principale. Questa scelta calibra il motore di base dell'IA.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['scientific', 'humanities', 'law_economics', 'languages'] as SubjectType[]).map((path) => (
                <button
                  key={path}
                  onClick={() => setAcademicPath(path)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all",
                    academicPath === path 
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20" 
                      : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-center gap-2 font-bold dark:text-white">
                    {getPathIcon(path)}
                    <span className="capitalize">{path.replace('_', ' ')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Subjects */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/10">
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Materie Attive (Piano Studi)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Quali materie stai seguendo ora? Verranno proposte automaticamente in LectureLens e History Buddy.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                placeholder="es. Analisi Matematica 1..."
                className="flex-grow px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <button 
                onClick={handleAddSubject}
                disabled={!subjectInput.trim()}
                className="px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {activeSubjects.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-sm border border-indigo-100 dark:border-indigo-500/20">
                  {sub}
                  <button onClick={() => setActiveSubjects(activeSubjects.filter((_, i) => i !== idx))} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {activeSubjects.length === 0 && (
                <p className="text-sm text-slate-400 italic">Nessuna materia selezionata.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/50 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!academicPath || isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? 'Salvataggio...' : 'Salva Profilo'}
          </button>
        </div>
      </div>
    </div>
  );
}
