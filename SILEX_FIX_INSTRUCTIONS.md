# Istruzioni per Silex — Fix LectureLens

Ciao Silex, questo documento contiene le correzioni da applicare a LectureLens,
identificate da un'analisi incrociata tra il codice (server.ts, frontend src/),
SECURITY_PROTOCOL.md e i pattern di hardening che Alfonso ha validato.

## Come usare questo documento

- Ogni issue ha: **dove** (file:riga), **cosa**, **perché**, **come**.
- Alcuni fix sono sul backend (server.ts, live su questo PC), altri sul frontend
  (src/, deployato su Vercel). È indicato per ciascuno.
- Dopo aver applicato i fix, aggiorna `dev-diary.md` con timestamp UTC.

---

## 🔴 CRITICI (fixare subito)

### C1. Auth bypass in dev mode — BACKEND (server.ts)

**Dove**: `server.ts:118-131`
**Problema**: In ambiente non-production, se Firebase non ha credenziali valide,
il middleware `verifyFirebaseToken` chiama `return next()` senza verificare il
token. Chiunque può chiamare `/api/gemini/upload` con un token finto.

**Perché è grave**: L'upload proxy a Gemini consuma risorse (e soldi) sul tuo
account Google. Un attaccante potrebbe caricare TB di video.

**Cosa fare**:
1. Non bypassare mai l'auth, neanche in dev mode.
2. In AI Studio, usa un service account Firebase o un API key proxy dedicata.
3. Se proprio serve un bypass per test, fallo con un header segreto letto da env
   (es. `X-Dev-Bypass: ${process.env.DEV_BYPASS_KEY}`), non automaticamente.

**Fix** — Sostituire l'intero blocco `if (process.env.NODE_ENV !== "production")`:

```typescript
// SENZA bypass: se Firebase non è configurato, ritorna errore
if (process.env.NODE_ENV !== "production") {
  // Dev mode: richiede un header di bypass esplicito con chiave segreta
  const devBypass = req.headers['x-dev-bypass'];
  if (devBypass === process.env.DEV_BYPASS_KEY) {
    console.warn('[DEV] Auth bypassed via X-Dev-Bypass header');
    (req as any).user = { email: 'dev@local.host', uid: 'dev-bypass' };
    return next();
  }
  // Se Firebase non è configurato, logga e nega
  if (error.code === 'app/no-credential' || error.message.includes('credential')) {
    console.error('[DEV] Firebase non configurato. Imposta DEV_BYPASS_KEY nel .env per bypassare.');
    return res.status(401).json({ error: 'Firebase non configurato in dev mode. Usa X-Dev-Bypass.' });
  }
}
```

**Dopo il fix**, aggiungi al `.env`:
```
DEV_BYPASS_KEY=una-stringa-casuale-lunga
```

---

### C2. Magic Bytes validation assente — BACKEND (server.ts)

**Dove**: `server.ts:176-214` (rotta `/api/gemini/upload`)
**Problema**: Il server accetta il MIME type dall'header `x-mime-type` o da
`req.file.mimetype` senza verificare la firma binaria del file. Un attaccante
può caricare un .exe rinominato .mp4.

**Perché è grave**: Violazione esplicita del SECURITY_PROTOCOL.md punto 1:
"Validazione Magic Bytes: Non fidarsi mai del MIME type dichiarato."

**Cosa fare**: Installare `file-type` e validare i primi byte del file prima
di passarlo a Gemini.

**Fix**:
```bash
npm install file-type
```

Aggiungere dopo `const tempFilePath = req.file.path;` (dopo riga 190):

```typescript
// Magic Bytes validation (SECURITY_PROTOCOL §1)
import { fileTypeFromFile } from 'file-type';

const detectedType = await fileTypeFromFile(tempFilePath);
const ALLOWED_MIME_TYPES = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
];

if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
  fs.unlinkSync(tempFilePath);
  return res.status(400).json({
    error: `Tipo file non supportato: ${detectedType?.mime || 'sconosciuto'}. Tipi permessi: video, audio, immagini, PDF.`
  });
}

// Aggiorna mimeType con quello reale (sicuro) invece di quello dichiarato dal client
const safeMimeType = detectedType.mime;
```

Poi usa `safeMimeType` invece di `mimeType` nella chiamata a `fileManager.uploadFile`.

---

### C3. postMessage con wildcard '*' — BACKEND (server.ts)

**Dove**: `server.ts:280`
**Problema**: `window.opener.postMessage({ type: 'UNI_AUTH_SUCCESS' }, '*')`
invia a qualsiasi finestra parent, non solo a quella autorizzata.

**Perché è grave**: Un sito malevolo aperto in un'altra tab potrebbe ricevere
il messaggio e simulare un auth success.

**Fix**: Sostituire `'*'` con l'origine esatta del frontend:

```typescript
const ALLOWED_ORIGINS_STRING = [
  'https://lecture-lens.vercel.app',
  'https://lecture-lens-sandy.vercel.app',
  'https://lecture-lens-three.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
].join('||');

// Dentro il callback OAuth, riga 280:
const targetOrigin = (process.env.NODE_ENV === 'production')
  ? 'https://lecture-lens.vercel.app'  // o leggi da env
  : 'http://localhost:5173';

window.opener.postMessage({ type: 'UNI_AUTH_SUCCESS' }, targetOrigin);
```

---

## 🟡 PRIORITÀ MEDIA

### M1. API Key in localStorage in chiaro — FRONTEND (src/)

**Dove**: `src/services/GeminiAPI.ts:14`, `src/suite/components/ApiKeysSetup.tsx`
**Problema**: La chiave Google Gemini è salvata in `localStorage` con chiave
`SILICEO_GOOGLE_KEY`. Un XSS la ruba immediatamente.

**Cosa fare**: Al minimo, ofusca la chiave in memoria:
1. Aggiungi un livello di encoding Base64 (non è sicurezza vera, ma toglie il
   dato in chiaro).
2. Crea una utility `secureStorage.ts` in `src/lib/`:

```typescript
// src/lib/secureStorage.ts — Livello base di offuscamento per API keys
// NOTA: non sostituisce un backend proxy, ma protegge da XSS base.

const PREFIX = 'sk_';

export function storeKey(keyName: string, value: string): void {
  // XOR semplice con un salt preso dal window origin (non perfetto, ma meglio di niente)
  const salt = window.location.origin.substring(0, 16).padEnd(16, '0');
  let encoded = '';
  for (let i = 0; i < value.length; i++) {
    encoded += String.fromCharCode(value.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
  }
  localStorage.setItem(PREFIX + keyName, btoa(encoded));
}

export function getKey(keyName: string): string | null {
  const stored = localStorage.getItem(PREFIX + keyName);
  if (!stored) return null;
  try {
    const salt = window.location.origin.substring(0, 16).padEnd(16, '0');
    const encoded = atob(stored);
    let decoded = '';
    for (let i = 0; i < encoded.length; i++) {
      decoded += String.fromCharCode(encoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return decoded;
  } catch {
    return null;
  }
}

export function removeKey(keyName: string): void {
  localStorage.removeItem(PREFIX + keyName);
}
```

Poi in `GeminiAPI.ts` sostituisci `localStorage.getItem('SILICEO_GOOGLE_KEY')`
con `getKey('GOOGLE_KEY')`, e in `ApiKeysSetup.tsx` usa `storeKey`/`getKey`.

---

### M2. Rate limiting assente — BACKEND (server.ts)

**Dove**: Tutte le route (`/api/gemini/upload`, `/api/university/*`)
**Problema**: Nessun limite al numero di richieste. Un utente (o un attaccante
con token bypassato) può floodare.

**Cosa fare**:
```bash
npm install express-rate-limit
```

Aggiungere prima delle route:

```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter globale: 100 richieste per IP in 15 minuti
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Troppe richieste. Riprova più tardi.' },
});

// Rate limiter stretto per upload: 5 richieste per IP in 1 ora
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Limite upload raggiunto (5/ora).' },
});

// Applica
app.use('/api/', globalLimiter);
app.use('/api/gemini/upload', uploadLimiter);
```

---

### M3. express.json limit 2048mb — BACKEND (server.ts)

**Dove**: `server.ts:217-218`
**Problema**: `express.json({ limit: '2048mb' })` — un attaccante può mandare
un JSON da 2GB e saturare la RAM del server.

**Cosa fare**: Ridurre a un limite sensato:

```typescript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

Il limite per i file è già gestito da Multer (che ha il suo limite a 2048mb).
Non serve duplicarlo su JSON/URL-encoded.

---

### M4. Firebase credenziali nel bundle client — FRONTEND (src/)

**Dove**: `src/lib/firebase.ts:8`
**Problema**: `import aiStudioConfig from '../../firebase-applet-config.json'`
include le credenziali Firebase nel bundle JS. Chiunque può eseguire `F12 →
Network → firebase-applet-config.json` (o leggerle dal bundle).

**Cosa fare**: Assicurati che il fallback a `aiStudioConfig` sia usato SOLO in
AI Studio (dove è necessario) e MAI in produzione. Aggiungi un check
esplicito:

```typescript
// Sostituisci l'attuale try/catch con:
if (import.meta.env.VITE_FIREBASE_API_KEY) {
  // ... env vars (come già è)
} else if (import.meta.env.DEV || window.location.hostname === 'localhost') {
  // Solo in sviluppo locale o AI Studio: fallback al file config
  firebaseConfig = aiStudioConfig;
  firestoreDatabaseId = (aiStudioConfig as any).firestoreDatabaseId;
} else {
  throw new Error('Firebase non configurato. Imposta VITE_FIREBASE_* env vars.');
}
```

In produzione su Vercel, se mancano le env vars, il frontend deve crashare
esplicitamente, non esporre credenziali.

---

### M5. Dipendenze SDK Gemini duplicate — BACKEND (server.ts)

**Dove**: `server.ts:10-11` — `@google/genai` e `@google/generative-ai`
**Problema**: Due SDK Google GenAI installati. `@google/genai` è il nuovo,
`@google/generative-ai` è il vecchio (usato per `GoogleAIFileManager`).

**Cosa fare**: Verifica se `GoogleAIFileManager` è disponibile in `@google/genai`.
Se sì, elimina `@google/generative-ai` da `package.json` e aggiorna l'import.
Se no (al momento sembra di no), lascia stare ma monitora: quando il nuovo SDK
supporta FileManager, elimina il vecchio.

---

## 🟢 PRIORITÀ BASSA

### B1. Multer usa /tmp senza namespace — BACKEND (server.ts)

**Dove**: `server.ts:171` — `dest: os.tmpdir()`
**Problema**: Tutti i file temporanei finiscono nella stessa directory.
In ambienti condivisi (Cloud Run, AI Studio) potrebbe causare collisioni.

**Cosa fare** (opzionale, basso rischio su VPS privato):

```typescript
const upload = multer({
  dest: path.join(os.tmpdir(), 'lecturelens-uploads'),
  limits: { fileSize: 2048 * 1024 * 1024 }
});

// Assicurati che la directory esista
import fs from 'fs';
const tmpDir = path.join(os.tmpdir(), 'lecturelens-uploads');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
```

---

### B2. docs.txt da rimuovere — RADICE PROGETTO

**Dove**: `docs.txt` (347 righe, copia del sommario documentazione Google AI)
**Problema**: File dimenticato, non serve al progetto.

**Cosa fare**: Eliminarlo.

---

### B3. deploy.json.bak non è JSON — RADICE PROGETTO

**Dove**: `deploy.json.bak`
**Problema**: È YAML rinominato `.json`. Il workflow non è mai stato usato.

**Cosa fare**: O lo converti in `.yml` e lo metti in `.github/workflows/`, o
lo elimini.

---

## 📋 Checklist finale

Dopo ogni fix:

1. [ ] Avvia il backend: `npm run dev` (o `node server.ts`)
2. [ ] Verifica che `curl -X POST http://localhost:3000/api/gemini/upload` senza
      token dia 401 (non 500 o 200)
3. [ ] Verifica che file non video (es. `.exe`) diano 400 (Magic Bytes)
4. [ ] Verifica che `curl -X POST http://localhost:3000/api/gemini/upload` 6 volte
      in un'ora dia 429 (rate limit)
5. [ ] Builda il frontend: `npm run build`
6. [ ] Controlla nella build che `firebaseConfig` non sia in chiaro nel JS
7. [ ] Aggiorna `dev-diary.md` con timestamp UTC

---

## Note per Alfonso

- **Backend** (`server.ts`): live su questo PC. Dopo aver applicato i fix,
  ferma il server (Ctrl+C) e riavvia.
- **Frontend** (`src/`): su Vercel. Dopo i fix, fai `git push` e Vercel
  deploya automaticamente.
- **AI Studio**: Silex lavora lì. I fix vanno applicati sia in AI Studio che
  qui. Il modo più semplice: Silex applica i fix in AI Studio, poi tu fai
  `git pull` su questo PC.
- **`.env`**: Aggiungi `DEV_BYPASS_KEY` (per C1) e assicurati che le
  `VITE_FIREBASE_*` siano impostate su Vercel.
