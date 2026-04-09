import React from 'react';
import { ShieldCheck, HardDrive, Key, Heart, Rocket, X, Zap, Printer, Minimize2, Maximize2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { SUBJECT_CONFIG, SubjectType } from '../../../../constants/SubjectConfig';

interface ModalsProps {
  showBreakModal: boolean;
  setShowBreakModal: (val: boolean) => void;
  setStudyTime: (val: number) => void;
  showPrivacy: boolean;
  setShowPrivacy: (val: boolean) => void;
  showTerms: boolean;
  setShowTerms: (val: boolean) => void;
  showSupport: boolean;
  setShowSupport: (val: boolean) => void;
  forceUpdate: () => void;
  showQuiz: boolean;
  setShowQuiz: (val: boolean) => void;
  quiz: string | null;
  isQuizFullScreen: boolean;
  setIsQuizFullScreen: (val: boolean) => void;
  handlePrint: () => void;
  showExtra: boolean;
  setShowExtra: (val: boolean) => void;
  extraContent: string | null;
  isExtraFullScreen: boolean;
  setIsExtraFullScreen: (val: boolean) => void;
  subjectType: SubjectType;
}

const BMC_URL = import.meta.env.VITE_BUY_ME_A_COFFEE_USERNAME 
  ? `https://buymeacoffee.com/${import.meta.env.VITE_BUY_ME_A_COFFEE_USERNAME}`
  : "https://buymeacoffee.com/alforiva";

export function Modals({
  showBreakModal, setShowBreakModal, setStudyTime,
  showPrivacy, setShowPrivacy, showTerms, setShowTerms, showSupport, setShowSupport, forceUpdate,
  showQuiz, setShowQuiz, quiz, isQuizFullScreen, setIsQuizFullScreen, handlePrint,
  showExtra, setShowExtra, extraContent, isExtraFullScreen, setIsExtraFullScreen, subjectType
}: ModalsProps) {
  return (
    <>
      {/* Break Modal */}
      <AnimatePresence>
        {showBreakModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 w-full max-w-md rounded-[40px] p-10 text-center"
            >
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500">
                  <Heart className="w-10 h-10 animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-4 dark:text-white">Tempo di una pausa? 🕯️</h2>
              <p className="text-black/50 dark:text-white/50 leading-relaxed mb-8">
                Hai studiato intensamente per 25 minuti. La scienza suggerisce che una pausa di 5 minuti aiuta a consolidare la memoria e mantenere alta l'attenzione.
                <br /><br />
                <em>Illumina, non bruciare.</em>
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowBreakModal(false)}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all"
                >
                  Faccio una pausa ora
                </button>
                <button 
                  onClick={() => {
                    setShowBreakModal(false);
                    setStudyTime(0); // Reset timer to snooze
                  }}
                  className="w-full py-4 text-black/40 dark:text-white/40 font-medium hover:text-black dark:hover:text-white transition-colors"
                >
                  Continua ancora un po'
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modals */}
      <AnimatePresence>
        {(showPrivacy || showTerms || showSupport) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowPrivacy(false); setShowTerms(false); setShowSupport(false); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 w-full max-w-2xl rounded-3xl max-h-[80vh]"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-xl dark:text-white">
                  {showPrivacy ? "Informativa sulla Privacy" : showTerms ? "Termini di Servizio" : "Supporto"}
                </h3>
                <button 
                  onClick={() => { setShowPrivacy(false); setShowTerms(false); setShowSupport(false); }}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors dark:text-white/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto prose prose-sm dark:prose-invert max-w-none custom-scrollbar">
                {showPrivacy && (
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">Architettura "Zero-Knowledge"</h4>
                        <p className="text-xs text-emerald-800/60 dark:text-emerald-300/60 leading-relaxed">
                          LectureLens è progettato per non vedere mai i tuoi dati. Non abbiamo un database centrale: tu sei l'unico proprietario delle tue informazioni.
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/10">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 mb-3">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <h5 className="font-bold text-xs mb-1 dark:text-white">Dati Locali</h5>
                        <p className="text-[11px] text-black/60 dark:text-white/60 leading-relaxed">
                          Cronologia e appunti sono salvati <strong>solo</strong> nel tuo browser o sul tuo disco. Se cambi PC, i dati non ti seguono (a meno che non li esporti).
                        </p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/10">
                        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 mb-3">
                          <Key className="w-4 h-4" />
                        </div>
                        <h5 className="font-bold text-xs mb-1 dark:text-white">Accesso Ateneo</h5>
                        <p className="text-[11px] text-black/60 dark:text-white/60 leading-relaxed">
                          Le tue credenziali universitarie non vengono mai salvate. Il token di accesso vive solo nella sessione corrente e scade automaticamente.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Dettagli Tecnici GDPR</p>
                      <ul className="space-y-3">
                        {[
                          "Nessun tracciamento pubblicitario o cookie di terze parti.",
                          "Nessun dato biometrico o personale inviato ai nostri server.",
                          "Controllo totale: puoi cancellare tutto con un click svuotando la cache del browser.",
                          "Le API di Google Gemini ricevono solo il contenuto della lezione per l'analisi, senza identificativi personali."
                        ].map((text, i) => (
                          <li key={i} className="text-xs text-black/60 dark:text-white/60 flex items-start gap-2">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-black/5 dark:border-white/10">
                      <p className="text-[10px] text-black/30 dark:text-white/30 leading-relaxed italic">
                        In qualità di utente, sei l'unico responsabile della gestione dei tuoi file. Lo sviluppatore di LectureLens non ha alcun accesso tecnico ai tuoi contenuti o alle tue attività di studio.
                      </p>
                    </div>
                  </div>
                )}
                {showTerms && (
                  <>
                    <p><strong>1. Uso del Servizio:</strong> LectureLens è uno strumento di supporto allo studio. L'utente è l'unico responsabile dei file caricati e deve assicurarsi di avere i diritti per analizzarli.</p>
                    <p><strong>2. Intelligenza Artificiale:</strong> Il servizio utilizza modelli di Intelligenza Artificiale (LLM). L'AI può commettere errori, generare "allucinazioni" o omettere informazioni. L'utente è tenuto a verificare sempre la correttezza degli appunti generati confrontandoli con il materiale originale.</p>
                    <p><strong>3. Limitazione di Responsabilità:</strong> Non ci assumiamo responsabilità per eventuali errori nei riassunti, nei quiz o nelle risposte del Tutor AI che potrebbero influire sul rendimento accademico.</p>
                  </>
                )}
                {showSupport && (
                  <>
                    <p>Hai bisogno di aiuto con LectureLens?</p>
                    <ul>
                      <li><strong>Problemi di caricamento:</strong> Assicurati che il video sia in formato MP4, WebM o MOV e che non superi i limiti di memoria del tuo browser.</li>
                      <li><strong>Errore API:</strong> Verifica che la tua chiave API di Google Gemini sia valida e abbia credito sufficiente. Puoi aggiornarla cliccando sull'icona della chiave in alto a destra.</li>
                      <li><strong>Appunti imprecisi:</strong> I modelli AI funzionano meglio con audio chiaro e slide leggibili. Prova a ricaricare il video o a utilizzare la funzione Tutor AI per chiarire i dubbi.</li>
                    </ul>

                    <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/30 text-center">
                      <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-amber-500/20">
                        <Heart className="w-6 h-6 fill-current" />
                      </div>
                      <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">Ti piace LectureLens?</h4>
                      <p className="text-xs text-amber-800/60 dark:text-amber-200/60 mb-6 leading-relaxed">
                        Siamo un piccolo team indipendente. Se questa app ti sta aiutando a studiare meglio, considera di offrirci un caffè per sostenere i costi dei server!
                      </p>
                      <a 
                        href={BMC_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-3 bg-[#FFDD00] text-black rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-amber-500/10"
                      >
                        <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt="BMC" className="w-5 h-5" referrerPolicy="no-referrer" />
                        Offrimi un Caffè
                      </a>
                    </div>

                    <p className="mt-6">Per ulteriore assistenza, contatta il supporto tecnico all'indirizzo email fornito dal tuo istituto o sviluppatore.</p>
                    
                    <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
                      <p className="text-xs text-black/40 dark:text-white/40 mb-4">Se riscontri problemi con l'aggiornamento dell'app o vedi una versione vecchia:</p>
                      <button 
                        onClick={() => {
                          if (confirm("Sei sicuro? Questo cancellerà tutti i dati locali e resetterà l'applicazione per risolvere errori tecnici.")) {
                            // Unregister all service workers
                            if ('serviceWorker' in navigator) {
                              navigator.serviceWorker.getRegistrations().then(registrations => {
                                for(let registration of registrations) {
                                  registration.unregister();
                                }
                              });
                            }
                            // Clear cache and storage
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all"
                      >
                        <Rocket className="w-4 h-4" />
                        Reset Totale App (Risolve Errori 403/SW)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && quiz && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isQuizFullScreen ? 'p-0' : 'p-6'} no-print`}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuiz(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isQuizFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-2xl rounded-3xl max-h-[80vh]'}`}
            >
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-emerald-50/30 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                  <Zap className="w-5 h-5" />
                  <span>Quiz di Ripasso</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title="Stampa Quiz"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsQuizFullScreen(!isQuizFullScreen)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title={isQuizFullScreen ? "Riduci" : "Ingrandisci"}
                  >
                    {isQuizFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setShowQuiz(false)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors dark:text-white/60"
                  >
                    <AlertCircle className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto prose prose-emerald dark:prose-invert max-w-none custom-scrollbar text-black dark:text-white">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath, remarkGfm]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {(quiz || "").replace(/\\n/g, '\n')}
                </ReactMarkdown>
              </div>
              <div className="p-6 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] flex justify-end">
                <button 
                  onClick={() => setShowQuiz(false)}
                  className="px-6 py-2 bg-black dark:bg-white dark:text-black text-white rounded-xl font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-all"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extra Content Modal */}
      <AnimatePresence>
        {showExtra && extraContent && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isExtraFullScreen ? 'p-0' : 'p-6'} no-print`}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExtra(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isExtraFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-2xl rounded-3xl max-h-[80vh]'}`}
            >
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-blue-50/30 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                  {React.createElement(SUBJECT_CONFIG[subjectType].extraIcon, { className: "w-5 h-5" })}
                  <span>{SUBJECT_CONFIG[subjectType].extraBtn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title={`Stampa ${SUBJECT_CONFIG[subjectType].extraBtn}`}
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsExtraFullScreen(!isExtraFullScreen)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
                    title={isExtraFullScreen ? "Riduci" : "Ingrandisci"}
                  >
                    {isExtraFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setShowExtra(false)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors dark:text-white/60"
                  >
                    <AlertCircle className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto prose prose-blue dark:prose-invert max-w-none custom-scrollbar text-black dark:text-white">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath, remarkGfm]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {(extraContent || "").replace(/\\n/g, '\n')}
                </ReactMarkdown>
              </div>
              <div className="p-6 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] flex justify-end">
                <button 
                  onClick={() => setShowExtra(false)}
                  className="px-6 py-2 bg-black dark:bg-white dark:text-black text-white rounded-xl font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-all"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
