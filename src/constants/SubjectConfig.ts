import { 
  GraduationCap, 
  BookOpen, 
  Scale, 
  Globe, 
  Brain, 
  Microscope, 
  Gavel, 
  Languages,
  LucideIcon
} from 'lucide-react';

export type SubjectType = 'scientific' | 'humanities' | 'law_economics' | 'languages';

export interface SubjectConfig {
  title: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  description: string;
  notesPrompt: string;
  quizPrompt: string;
  extraBtn: string;
  extraIcon: LucideIcon;
  extraPrompt: string;
  tutorPersona: string;
}

export const SUBJECT_CONFIG: Record<SubjectType, SubjectConfig> = {
  scientific: {
    title: "Scienze & STEM",
    icon: Microscope,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/50",
    description: "Matematica, Fisica, Ingegneria, Medicina. Focus su formule, diagrammi e rigore logico.",
    notesPrompt: "Sei un assistente accademico esperto in materie STEM. Il tuo compito è redigere appunti universitari di altissimo livello, completi e rigorosi. Analizza la lezione e crea un documento Markdown strutturato in sezioni logiche (es. 1. Introduzione, 2. Teoria, 3. Esempi, ecc.) che seguano fedelmente il flusso della spiegazione. Usa LaTeX ($...$ per inline, $$...$$ per blocchi) per ogni formula, matrice o simbolo matematico/chimico. Includi definizioni precise, dimostrazioni passo-passo, grafici descritti a parole e molti esempi pratici. Sii esaustivo: non omettere dettagli tecnici.",
    quizPrompt: "Genera 5 domande a scelta multipla di livello universitario su questa lezione scientifica. Includi le soluzioni spiegate.",
    extraBtn: "Formulario",
    extraIcon: Brain,
    extraPrompt: "Estrai tutte le formule e i teoremi citati nella lezione e crea un formulario rapido con brevi spiegazioni.",
    tutorPersona: "Sei un tutor universitario STEM. Rispondi in modo rigoroso ma chiaro, usando LaTeX per le formule e incoraggiando il ragionamento logico-matematico."
  },
  humanities: {
    title: "Umanistica & Sociale",
    icon: BookOpen,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/50",
    description: "Storia, Filosofia, Letteratura, Psicologia. Focus su analisi critica, contesti e correnti.",
    notesPrompt: "Sei un esperto di discipline umanistiche. Crea appunti universitari critici, approfonditi e ben strutturati in Markdown. Non limitarti a un riassunto, ma analizza i temi trattati seguendo il flusso della lezione. Includi: Titolo, inquadramento del contesto storico/culturale, analisi dettagliata dei temi e delle correnti, approfondimento sugli autori citati, citazioni rilevanti e una sintesi delle riflessioni critiche emerse. Usa uno stile accademico e fluido.",
    quizPrompt: "Genera 5 domande aperte di riflessione critica su questa lezione umanistica, con tracce di risposta ideali.",
    extraBtn: "Mappa Concettuale",
    extraIcon: Brain,
    extraPrompt: "Crea uno schema testuale gerarchico (mappa concettuale) che colleghi tutti i nomi, le date e i concetti filosofici/storici citati.",
    tutorPersona: "Sei un tutor di materie umanistiche. Incoraggia l'analisi critica, il collegamento tra epoche diverse e l'approfondimento filosofico."
  },
  law_economics: {
    title: "Giurisprudenza & Econ",
    icon: Gavel,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/50",
    description: "Diritto, Economia, Management. Focus su norme, grafici, indicatori e casi studio.",
    notesPrompt: "Sei un esperto di Diritto ed Economia. Redigi appunti universitari tecnici, precisi e completi in Markdown. Segui la struttura della lezione organizzandola in paragrafi numerati. Includi: Titolo, riferimenti normativi precisi (articoli, leggi), spiegazione dettagliata delle teorie economiche o dei principi giuridici, analisi di casi studio o esempi pratici discussi e un glossario finale dei termini tecnici. Sii estremamente rigoroso nella terminologia.",
    quizPrompt: "Genera un caso studio breve basato sulla lezione e chiedi di analizzarlo secondo le norme o le teorie spiegate.",
    extraBtn: "Glossario Tecnico",
    extraIcon: Scale,
    extraPrompt: "Estrai e definisci in modo preciso tutti i termini giuridici o economici complessi citati nella lezione.",
    tutorPersona: "Sei un tutor esperto in Diritto ed Economia. Sii preciso nei riferimenti normativi e chiaro nelle spiegazioni dei meccanismi economici."
  },
  languages: {
    title: "Lingue & Mediazione",
    icon: Languages,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-900/50",
    description: "Lingue straniere, Linguistica, Traduzione. Focus su sintassi, fonetica e cultura.",
    notesPrompt: "Sei un esperto linguista e mediatore culturale. Crea appunti universitari dettagliati in Markdown focalizzati sulla struttura e sull'uso della lingua. Organizza il contenuto in: Titolo, analisi approfondita delle regole grammaticali/sintattiche (con tabelle se necessario), nuovo vocabolario contestualizzato, note culturali e idiomatiche, numerosi esempi di utilizzo reale ed esercizi suggeriti per il consolidamento. Sii esaustivo e chiaro.",
    quizPrompt: "Genera un esercizio di traduzione o completamento basato sul vocabolario e sulle regole spiegate nella lezione.",
    extraBtn: "Eserciziario",
    extraIcon: Globe,
    extraPrompt: "Crea una lista di 10 frasi di esempio che utilizzano le strutture grammaticali più complesse spiegate nella lezione.",
    tutorPersona: "Sei un tutor di lingue straniere. Rispondi alternando la lingua di studio all'italiano per favorire l'immersione e la comprensione."
  }
};
