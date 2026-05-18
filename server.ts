import os from "os";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { fileTypeFromFile } from 'file-type';
import { GoogleGenAI } from "@google/genai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import cors from "cors";
import admin from "firebase-admin";
import multer from "multer";
import rateLimit from "express-rate-limit";

dotenv.config();

// Initialize Firebase Admin (Zero Trust Foundation)
// In production, this uses GOOGLE_APPLICATION_CREDENTIALS automatically or default compute credentials.
let firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

// Fallback to local config if in AI Studio and env vars missing
if (!firebaseProjectId) {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      firebaseProjectId = config.projectId;
    }
  } catch (e) {
    console.error("Failed to load local firebase config for admin:", e);
  }
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: firebaseProjectId
    });
    console.log(`Firebase Admin initialized for project: ${firebaseProjectId || 'default'}`);
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- WHITELIST DEGLI UTENTI AUTORIZZATI ---
// Identica alla whitelist nel client (AuthShield)
const ALLOWED_EMAILS = [
  'alforiva@gmail.com',    // Alfonso
  'ema.riva2005@gmail.com' // Emanuele
];

// --- HARDENED MEMORY SYNC (Silex Digital Soul) ---
async function syncDiaries() {
  const diaries = ['silex-diary.md', 'dev-diary.md'];
  const db = admin.firestore();

  for (const fileName of diaries) {
    const filePath = path.join(process.cwd(), fileName);
    const docId = fileName.replace('.md', '');
    const docRef = db.collection('memory').doc(docId);

    try {
      if (fs.existsSync(filePath)) {
        // PUSH: Local file exists, sync to Firestore
        const content = fs.readFileSync(filePath, "utf-8");
        // Verifica se il contenuto è diverso prima di scrivere per evitare loop o scritture inutili
        const doc = await docRef.get();
        const existingData = doc.data();
        
        if (!existingData || existingData.content !== content) {
          await docRef.set({
            content,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log(`[MemorySync] Pushed ${fileName} to Firestore`);
        }
      } else {
        // PULL: Local file missing, try to fetch from Firestore
        const doc = await docRef.get();
        if (doc.exists) {
          const data = doc.data();
          if (data && data.content) {
            fs.writeFileSync(filePath, data.content);
            console.log(`[MemorySync] Pulled ${fileName} from Firestore (Restored)`);
          }
        }
      }
    } catch (error) {
      console.error(`[MemorySync] Errore sincronizzazione ${fileName}:`, error);
    }
  }
}

// Funzione middleware per verificare il token Firebase JWT
const verifyFirebaseToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Dev mode: bypass auth se la richiesta include x-api-key (tipico upload proxy)
  // La chiave API Gemini è già una forma di auth: se ce l'hai, puoi già chiamare Gemini direttamente
  if (process.env.NODE_ENV !== "production") {
    const devBypass = req.headers['x-dev-bypass'];
    const apiKey = req.headers['x-api-key'];
    if (process.env.DEV_BYPASS_KEY && devBypass === process.env.DEV_BYPASS_KEY) {
      console.warn('[DEV] Auth bypassed via X-Dev-Bypass header');
      (req as any).user = { email: 'dev@local.host', uid: 'dev-bypass' };
      return next();
    }
    if (apiKey && typeof apiKey === 'string' && apiKey.length > 20) {
      console.warn('[DEV] Auth bypassed via x-api-key');
      (req as any).user = { email: 'dev@local.host', uid: 'dev-api-key' };
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Accesso negato: Nessun token fornito." });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;
    
    if (!email || !ALLOWED_EMAILS.includes(email)) {
      return res.status(403).json({ error: "Accesso negato: Utente non autorizzato dalla Whitelist Server-side." });
    }
    
    (req as any).user = decodedToken;
    next();
  } catch (error: any) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Accesso negato: Token invalido o scaduto." });
  }
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const ALLOWED_ORIGINS = [
    'https://lecture-lens.vercel.app',       // Frontend Vercel originale
    'https://lecture-lens-sandy.vercel.app', // Frontend Vercel nuovo
    'https://lecture-lens-three.vercel.app', // Frontend Vercel alternativo
    'http://localhost:3000',                 // Start dev locale
    'http://localhost:5173',                 // Vite dev locale
  ];

  // Abilita CORS restrittivo per permettere solo ai domini autorizzati di comunicare con questo backend
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.run.app')) {
        callback(null, true);
      } else {
        console.warn(`Tentativo di accesso CORS bloccato da origine: ${origin}`);
        callback(new Error('CORS: Origine non autorizzata'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-mime-type', 'x-display-name'],
    credentials: true
  }));

  app.use(cookieParser());

  // Inizia la sincronizzazione della memoria (Diari)
  await syncDiaries();

  // Configurazione Multer per carichi pesanti (Disk Storage)
  const uploadDir = path.join(os.tmpdir(), "lecturelens-uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const upload = multer({ 
    dest: uploadDir,
    limits: { fileSize: 2048 * 1024 * 1024 } // 2GB
  });

  // --- RATE LIMITERS ---
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Troppe richieste. Riprova più tardi.' },
  });

  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Limite upload raggiunto (5/ora).' },
  });

  app.use('/api/', globalLimiter);

  // --- GEMINI UPLOAD PROXY (Bypass Service Worker) ---
  app.post("/api/gemini/upload", uploadLimiter, verifyFirebaseToken, upload.single('file'), async (req, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    const mimeType = req.headers['x-mime-type'] as string || req.file?.mimetype || 'video/mp4';
    const displayName = req.headers['x-display-name'] as string || req.file?.originalname || 'video.mp4';

    if (!apiKey) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "API key mancante nell'header x-api-key" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Nessun file ricevuto. Assicurati di inviare il file nel campo 'file' di un form-data." });
    }

    const tempFilePath = req.file.path;
    try {
      // Magic Bytes validation (SECURITY_PROTOCOL §1)
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

      // Aggiorna mimeType con quello reale (sicuro)
      const safeMimeType = detectedType.mime;

      // 2. Use the official SDK to handle the complex Resumable Upload protocol for large files
      const fileManager = new GoogleAIFileManager(apiKey);
      const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: safeMimeType,
        displayName: displayName,
      });

      // 3. Clean up the temp file to free memory
      fs.unlinkSync(tempFilePath);

      res.json({
        fileUri: uploadResult.file.uri,
        name: uploadResult.file.name,
        mimeType: uploadResult.file.mimeType
      });
    } catch (error: any) {
      console.error("Backend upload error:", error);
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath); // Ensure cleanup on error
      }
      res.status(500).json({ error: error.message || "Errore interno durante l'upload a Gemini" });
    }
  });

  // Middleware di parsing globale spostati DOPO la rotta di upload per evitare 413
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- UNIVERSITY OAUTH & API PROXY ---

  // 1. Get OAuth URL
  app.get("/api/auth/university/url", (req, res) => {
    const clientId = process.env.UNIVERSITY_OAUTH_CLIENT_ID;
    const authUrl = process.env.UNIVERSITY_OAUTH_AUTH_URL;
    
    if (!clientId || !authUrl) {
      return res.status(500).json({ error: "Configurazione OAuth mancante in .env" });
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/university/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email moodle_api', // Adjust scopes as needed
    });

    res.json({ url: `${authUrl}?${params.toString()}` });
  });

  // 2. OAuth Callback
  app.get("/api/auth/university/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.UNIVERSITY_OAUTH_CLIENT_ID;
    const clientSecret = process.env.UNIVERSITY_OAUTH_CLIENT_SECRET;
    const tokenUrl = process.env.UNIVERSITY_OAUTH_TOKEN_URL;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/university/callback`;

    if (!code || !clientId || !clientSecret || !tokenUrl) {
      return res.status(400).send("Parametri OAuth mancanti");
    }

    try {
      const response = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }));

      const { access_token } = response.data;

      // Store token in a secure cookie
      res.cookie("uni_token", access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 3600 * 1000, // 1 hour
      });

      // Send success message and close popup
      const targetOrigin = (process.env.NODE_ENV === 'production')
        ? 'https://lecture-lens.vercel.app'
        : 'http://localhost:5173';

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0fdf4;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'UNI_AUTH_SUCCESS' }, '${targetOrigin}');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <div style="text-align: center;">
              <h2 style="color: #15803d;">Connessione Riuscita!</h2>
              <p style="color: #166534;">Questa finestra si chiuderà automaticamente.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("OAuth Error:", error.response?.data || error.message);
      res.status(500).send("Errore durante l'autenticazione universitaria.");
    }
  });

  // 3. Get Courses (Proxied to Moodle/University API)
  app.get("/api/university/courses", async (req, res) => {
    const token = req.cookies.uni_token;
    const apiBaseUrl = process.env.UNIVERSITY_API_BASE_URL;

    if (!token || !apiBaseUrl) {
      return res.status(401).json({ error: "Non autenticato o configurazione mancante" });
    }

    try {
      // Example call to Moodle WebService: core_enrol_get_users_courses
      const response = await axios.get(apiBaseUrl, {
        params: {
          wstoken: token,
          wsfunction: 'core_enrol_get_users_courses',
          moodlewsrestformat: 'json',
        }
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: "Errore nel recupero dei corsi" });
    }
  });

  // 4. Get Lessons for a Course
  app.get("/api/university/lessons/:courseId", async (req, res) => {
    const token = req.cookies.uni_token;
    const apiBaseUrl = process.env.UNIVERSITY_API_BASE_URL;
    const { courseId } = req.params;

    if (!token || !apiBaseUrl) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      // Example call to Moodle WebService: core_course_get_contents
      const response = await axios.get(apiBaseUrl, {
        params: {
          wstoken: token,
          wsfunction: 'core_course_get_contents',
          courseid: courseId,
          moodlewsrestformat: 'json',
        }
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: "Errore nel recupero delle lezioni" });
    }
  });

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LectureLens Server running on http://localhost:${PORT}`);
  });
}

startServer();
