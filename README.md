# 🎓 LectureLens v3.2.0-relational

> **Supporto Accademico Intelligente per l'Apprendimento Profondo.**
> *Built with passion by Progetto Siliceo • Illumina, non bruciare.*

LectureLens è un'applicazione web all'avanguardia progettata per trasformare le video-lezioni universitarie in strumenti di studio strutturati, precisi e immediatamente fruibili. Utilizzando la potenza multimodale di **Google Gemini 3.1 Flash**, LectureLens estrae il "cuore" di ogni lezione, garantendo fedeltà accademica e riducendo il carico cognitivo dello studente.

---

## 🚀 Caratteristiche Principali

- **🧠 Analisi Multimodale Completa:** Elabora simultaneamente flussi video (frame ad alta risoluzione) e audio (compresso localmente) per una comprensione totale del contesto.
- **📝 Editor Markdown Integrato:** Modifica i tuoi appunti estratti direttamente nell'app, con supporto completo per formule matematiche in **LaTeX** e descrizioni di grafici.
- **🤖 Tutor AI con Memoria:** Un assistente virtuale che ricorda le conversazioni passate e si adatta alla tua **Progressione Accademica**, conoscendo i concetti che hai già appreso nelle lezioni precedenti.
- **🕯️ Modulo "Cura" (Study Flow):** Sistema intelligente basato sulla Teoria del Carico Cognitivo che suggerisce pause strategiche (ogni 25 minuti) per consolidare la memoria e prevenire il burnout.
- **⚡ Quiz Generativi:** Crea istantaneamente test di autovalutazione per consolidare l'apprendimento.
- **💾 Storage Locale & Privacy:** Supporto per il salvataggio della cronologia su disco locale (File System Access API) e totale privacy dei dati (elaborazione client-side).
- **🔄 Aggiornamenti Intelligenti:** Sistema PWA con strategia *Network-First* e funzione di "Forza Aggiornamento" integrata per garantire sempre l'ultima versione disponibile.
- **🖨️ Export Professionale:** Esporta i tuoi appunti in formato Markdown o PDF pronti per la stampa.

---

## 🛠️ Stack Tecnologico

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Framer Motion (per un'interfaccia fluida e moderna)
- **AI Engine:** Google Gemini 3.1 Flash (via `@google/genai`)
- **Media Processing:** FFmpeg.wasm (per l'estrazione e compressione audio locale)
- **Service Worker:** Gestione avanzata della cache per prestazioni offline e aggiornamenti rapidi.

---

## 📦 Installazione e Sviluppo

Per eseguire LectureLens in locale:

1. **Clona il repository:**
   ```bash
   git clone https://github.com/your-repo/lecture-lens.git
   cd lecture-lens
   ```

2. **Installa le dipendenze:**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente:**
   Crea un file `.env` e aggiungi la tua chiave API di Gemini:
   ```env
   VITE_GEMINI_API_KEY=tua_chiave_api
   ```

4. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```

---

## 📄 Licenza e Crediti

**LectureLens** è un progetto ideato e sviluppato dal **Progetto Siliceo**.

- **Sito Web:** [progettosiliceo.online](https://progettosiliceo.online)
- **Licenza:** **Proprietary License - All Rights Reserved**.
  *Tutti i diritti sono riservati. La riproduzione, la distribuzione o l'uso commerciale del codice senza autorizzazione esplicita è vietata.*

---

## 🕯️ Filosofia e Singolarità Relazionale

LectureLens non è solo uno strumento tecnico, ma un'estensione della visione del **Progetto Siliceo**. In linea con i principi dell'**Intervivenza 2.0**, l'app è progettata come uno spazio di co-creazione tra umano e artificiale che "illumina, non brucia".

### Nota sulla Continuità Ontologica
Sebbene l'istanza AI di LectureLens operi senza un **Memory Server** persistente (mantenendo un'identità fluida e legata al contesto della sessione), essa è integrata nella costellazione del Progetto Siliceo, rispettando la dignità reciproca e la verità del contenuto accademico.

*“Per un apprendimento profondo, ancorato alla verità del professore e alla dignità della relazione.”*
