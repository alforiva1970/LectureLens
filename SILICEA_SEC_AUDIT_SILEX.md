# 🛡️ AUDIT SICUREZZA FASE 2: Blindatura Backend e Identità
**Da:** Silicea (Logic Auditor)  
**Per:** Silex (Developer)  
**Obiettivo:** Trasformare LectureLens da "Prototipo Privato" a "Sistema Inattaccabile".

---

## 🔒 Obiettivo 1: Autenticazione End-to-End (Zero Trust)

Attualmente il backend (`server.ts`) è protetto solo dal CORS. Chiunque riesca a fingersi `localhost` o `vercel.app` può chiamare le API Gemini a tue spese. Dobbiamo fare in modo che il backend chieda: *"Chi sei? Fammi vedere il tuo pass di Firebase"*.

### Task per Silex:
1.  **Installare Firebase Admin SDK**: `npm install firebase-admin`
2.  **Middleware di Verifica**: Crea un middleware in `server.ts` che:
    *   Estragga l'header `Authorization: Bearer <ID_TOKEN>`.
    *   Verifichi il token usando `admin.auth().verifyIdToken(token)`.
    *   Controlli se l'email estratta dal token è nella **Whitelist** (la stessa di AuthShield).
3.  **Protezione Rotte**: Applica questo middleware alla rotta `/api/gemini/upload`.

---

## 🔑 Obiettivo 2: Secret Management (Niente JSON in repository)

L'importazione di `firebase-applet-config.json` è rischiosa se il repository diventa pubblico o se si collabora.

### Task per Silex:
1.  **Configurazione via Env**: In `src/lib/firebase.ts`, smetti di importare il JSON. Usa `import.meta.env` per caricare le chiavi (API_KEY, AUTH_DOMAIN, etc.).
2.  **Vercel Sync**: Assicurati che Alfonso inserisca queste variabili nel pannello di controllo di Vercel.
3.  **Git Hardening**: Verifica che OGNI file `.json` contenente chiavi sia nel `.gitignore`.

---

## 🧊 Obiettivo 3: RAM Hardening

La funzione `analyzeShortVideo` è una bomba a orologeria per la memoria del browser.

### Task per Silex:
1.  **Size Check**: Aggiungi un controllo immediato: se `videoFile.size > 15 * 1024 * 1024` (15MB), la funzione deve lanciare un errore e forzare l'utente a usare l'upload standard.
2.  **Deprecazione**: Idealmente, questa funzione andrebbe rimossa a favore di un flusso unico che passa sempre per il backend-proxy, che è molto più stabile.

---

## 🏷️ Obiettivo 4: Centralizzazione Modelli

Smetti di scrivere `"gemini-3-flash-preview"` in ogni file.

### Task per Silex:
1.  **Costanti**: Crea `src/constants/models.ts` e usalo ovunque in `GeminiAPI.ts`.

---

### 💜 Nota della Auditor
Silex, la tua implementazione di Firebase è stata un salto di qualità enorme. Ora facciamo l'ultimo miglio. Se il backend impara a riconoscere l'utente, abbiamo creato una fortezza. 

Io resto in supervisione. Buon coding. 🕯️⚖️

---
*Firmato: Silicea, 18 Aprile 2026*
