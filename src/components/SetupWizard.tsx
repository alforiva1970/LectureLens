import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  Sparkles, 
  Key, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SetupWizardProps {
  onComplete: (key: string) => void;
  onSkip: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");

  const steps = [
    {
      title: "Benvenuto in LectureLens",
      description: "Questo strumento è stato creato per aiutarti a ottimizzare il tuo tempo. Trasformeremo le tue lezioni video in appunti pronti per lo studio.",
      icon: <Heart className="w-8 h-8 text-rose-500" />
    },
    {
      title: "Il potere di Google Gemini",
      description: "L'app usa l'intelligenza artificiale più avanzata di Google. Per iniziare, hai solo bisogno di una 'chiave' gratuita che permette all'app di parlare con il cervello di Gemini.",
      icon: <Sparkles className="w-8 h-8 text-amber-500" />
    },
    {
      title: "Ottieni la tua chiave API",
      description: "È semplicissimo: clicca il pulsante qui sotto, premi 'Create API key' e copiala. È totalmente gratuito per uso personale.",
      icon: <Key className="w-8 h-8 text-emerald-500" />,
      action: (
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-black/80 transition-all font-medium mt-4"
        >
          Vai a Google AI Studio <ExternalLink className="w-4 h-4" />
        </a>
      )
    },
    {
      title: "Configurazione Finale",
      description: "Incolla qui la tua chiave API. Verrà salvata solo nel tuo browser per permetterti di usare l'app ogni volta che vuoi.",
      icon: <CheckCircle2 className="w-8 h-8 text-blue-500" />,
      input: true
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-2xl rounded-[40px] p-12 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-black/5 dark:bg-white/5">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>

        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl flex items-center justify-center">
            {currentStep.icon}
          </div>
        </div>

        <h2 className="text-3xl font-bold tracking-tight mb-4 dark:text-white">{currentStep.title}</h2>
        <p className="text-black/50 dark:text-white/50 leading-relaxed mb-8 text-lg">
          {currentStep.description}
        </p>

        {currentStep.action && <div className="mb-8">{currentStep.action}</div>}

        {currentStep.input && (
          <div className="mb-8">
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Incolla qui la tua API Key (es. AIza...)"
              className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-center font-mono dark:text-white"
            />
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-4">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-8 py-4 text-black/40 dark:text-white/40 font-medium hover:text-black dark:hover:text-white transition-colors"
              >
                Indietro
              </button>
            )}
            <button 
              onClick={() => {
                if (step === steps.length) {
                  if (apiKey.trim()) onComplete(apiKey.trim());
                } else {
                  setStep(step + 1);
                }
              }}
              disabled={currentStep.input && !apiKey.trim()}
              className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {step === steps.length ? "Inizia a studiare" : "Continua"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={onSkip}
            className="mt-2 text-sm text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white underline underline-offset-4 transition-colors"
          >
            Salta questo passaggio (usa la chiave di sistema se disponibile)
          </button>
        </div>

        <div className="mt-12 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i + 1 === step ? "w-8 bg-emerald-500" : "bg-black/10 dark:bg-white/10"
              )} 
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SetupWizard;
