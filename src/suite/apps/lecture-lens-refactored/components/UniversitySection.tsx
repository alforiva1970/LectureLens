import React from 'react';
import { Globe, Loader2, LogIn, GraduationCap, RefreshCw, X, ArrowRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { UniCourse, UniLesson } from '../../../../services/UniversityService';

interface UniversitySectionProps {
  isAuthenticatedUni: boolean;
  isSyncingUni: boolean;
  selectedUniversity: string | null;
  uniCourses: UniCourse[];
  uniLessons: UniLesson[];
  selectedCourse: UniCourse | null;
  handleUniLogin: () => void;
  fetchUniData: () => void;
  setIsAuthenticatedUni: (val: boolean) => void;
  setSelectedUniversity: (val: string | null) => void;
  setSelectedCourse: (course: UniCourse | null) => void;
  handleCourseSelect: (course: UniCourse) => void;
  handleLoadUniLesson: (lessonName: string, fileUrl?: string) => void;
}

export function UniversitySection({
  isAuthenticatedUni, isSyncingUni, selectedUniversity, uniCourses, uniLessons, selectedCourse,
  handleUniLogin, fetchUniData, setIsAuthenticatedUni, setSelectedUniversity, setSelectedCourse,
  handleCourseSelect, handleLoadUniLesson
}: UniversitySectionProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-3xl font-medium tracking-tight leading-tight dark:text-white">
          Il tuo <span className="italic font-serif">Ateneo Digitale</span>.
        </h2>
        <p className="text-black/60 dark:text-white/60 leading-relaxed">
          Accedi direttamente alle lezioni del tuo corso di studi sincronizzando il tuo piano di studi universitario.
        </p>
      </section>

      {!isAuthenticatedUni ? (
        <div className="text-center py-12 bg-black/[0.02] dark:bg-white/[0.02] rounded-[32px] border border-black/5 dark:border-white/10">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
            <Globe className="w-10 h-10" />
          </div>
          <button 
            onClick={handleUniLogin}
            disabled={isSyncingUni}
            className="mx-auto px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {isSyncingUni ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Connetti al Portale Ateneo
          </button>
          <p className="mt-4 text-[10px] text-black/30 dark:text-white/30 uppercase tracking-widest font-medium">
            Supporto Moodle, Esse3, Blackboard
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold dark:text-white">{selectedUniversity}</p>
                <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 font-medium uppercase tracking-tighter">Studente: alforiva@gmail.com</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchUniData} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                <RefreshCw className={cn("w-4 h-4 text-black/20 dark:text-white/20", isSyncingUni && "animate-spin")} />
              </button>
              <button onClick={() => { setIsAuthenticatedUni(false); setSelectedUniversity(null); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4 text-black/20 dark:text-white/20" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">
              {selectedCourse ? `Lezioni: ${selectedCourse.fullname}` : "I Tuoi Corsi"}
            </h3>
            
            {selectedCourse && (
              <button 
                onClick={() => setSelectedCourse(null)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1 mb-2"
              >
                <ArrowRight className="w-3 h-3 rotate-180" /> Torna ai corsi
              </button>
            )}

            {isSyncingUni ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-black/20 dark:text-white/20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-xs font-medium uppercase tracking-widest">Sincronizzazione...</p>
              </div>
            ) : selectedCourse ? (
              <div className="space-y-1">
                {uniLessons.length > 0 ? uniLessons.flatMap(section => section.modules).filter(m => m.modname === 'resource' || m.modname === 'video').map((module, j) => (
                  <button 
                    key={j}
                    onClick={() => handleLoadUniLesson(module.name, module.fileurl)}
                    className="w-full p-3 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl text-xs text-left transition-all border border-transparent hover:border-emerald-500/30 flex items-center justify-between group dark:text-white/80"
                  >
                    {module.name}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                )) : (
                  <p className="text-center py-8 text-xs text-black/40 italic">Nessuna lezione trovata in questo corso.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {uniCourses.length > 0 ? uniCourses.map((course, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleCourseSelect(course)}
                    className="group p-4 bg-white dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold dark:text-white group-hover:text-emerald-500 transition-colors">{course.fullname}</p>
                      <ArrowRight className="w-3 h-3 text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[10px] text-black/40 dark:text-white/40 font-medium uppercase tracking-tighter">{course.shortname}</p>
                  </div>
                )) : (
                  <p className="text-center py-8 text-xs text-black/40 italic">Nessun corso trovato.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
