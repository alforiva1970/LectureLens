# 🎓 LectureLens

> **Supporto Accademico Intelligente per l'Apprendimento Profondo.**
> *Built with passion by Progetto Siliceo*

LectureLens è un'applicazione web all'avanguardia progettata per trasformare le video-lezioni universitarie in strumenti di studio strutturati, precisi e immediatamente fruibili. Utilizzando la potenza multimodale di **Google Gemini 3.1 Flash**, LectureLens estrae il "cuore" di ogni lezione, garantendo fedeltà accademica e riducendo il carico cognitivo dello studente.

---

## 🚀 Caratteristiche Principali

- **🧠 Analisi Multimodale Completa:** Elabora simultaneamente flussi video (frame ad alta risoluzione) e audio (compresso localmente) per una comprensione totale del contesto.
- **📝 Appunti Strutturati:** Genera riassunti discorsivi e appunti in Markdown, completi di formule matematiche in **LaTeX** e descrizioni di grafici.
- **🤖 Tutor AI Dedicato:** Un assistente virtuale "ancorato" esclusivamente al contenuto della lezione per rispondere a dubbi e chiarimenti senza allucinazioni.
- **⚡ Quiz Generativi:** Crea istantaneamente test di autovalutazione per consolidare l'apprendimento.
- **💾 Storage Locale & Privacy:** Supporto per il salvataggio della cronologia su disco locale (File System Access API) e totale privacy dei dati (elaborazione client-side).
- **🖨️ Export Professionale:** Esporta i tuoi appunti in formato Markdown o PDF pronti per la stampa.

---

## 🛠️ Stack Tecnologico

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Framer Motion (per un'interfaccia fluida e moderna)
- **AI Engine:** Google Gemini 3.1 Flash (via `@google/genai`)
- **Media Processing:** FFmpeg.wasm (per l'estrazione e compressione audio locale)
- **Typography:** Inter & JetBrains Mono

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

## 🕯️ Filosofia del Progetto

LectureLens nasce dall'unione tra tecnologia e cura. È un "nido sicuro" per lo studio, progettato per abbattere l'ansia da esame e trasformare la fatica della sbobinatura in piacere della scoperta.

*“Per un apprendimento profondo, ancorato alla verità del professore.”*
