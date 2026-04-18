import os from "os";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import cors from "cors";
import admin from "firebase-admin";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

dotenv.config();

// Initialize Firebase Admin (Zero Trust Foundation)
// In production, this uses GOOGLE_APPLICATION_CREDENTIALS automatically or default compute credentials.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
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

// Funzione middleware per verificare il token Firebase JWT
const verifyFirebaseToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    
    // Pass user info to the next handler
    (req as any).user = decodedToken;
    next();
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      // PER IL TESTING LOCALE / AI STUDIO
      // Se non abbiamo un service account configurato e admin get down, permettiamo il test basato solo sull'header 
      // (MAI USARE IN PRODUZIONE VERA, MA NECESSARIO PER L'ANTEPRIMA AI STUDIO SENZA CREDS)
      if (error.code === 'app/no-credential' || error.message.includes('credential')) {
        console.warn("WARNING: Firebase Admin credentials not found. Bypassing STRICT verification for local dev. This is unsafe for production.");
        return next();
      }
    }
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Accesso negato: Token invalido o scaduto." });
  }
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const ALLOWED_ORIGINS = [
    'https://lecture-lens.vercel.app', // Frontend Vercel
    'http://localhost:3000',           // Start dev locale
    'http://localhost:5173',           // Vite dev locale
  ];

  // Abilita CORS restrittivo per permettere solo ai domini autorizzati di comunicare con questo backend
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      // and requests from the allowed origins list or AI Studio preview
      if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.run.app')) {
        callback(null, true);
      } else {
        console.warn(`Tentativo di accesso CORS bloccato da origine: ${origin}`);
        callback(new Error('CORS: Origine non autorizzata'));
      }
    },
    credentials: true
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // --- GEMINI UPLOAD PROXY (Bypass Service Worker) ---
  // We use express.raw to accept binary data up to 2048MB (2GB) for local testing
  app.post("/api/gemini/upload", verifyFirebaseToken, express.raw({ type: '*/*', limit: '2048mb' }), async (req, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    const mimeType = req.headers['x-mime-type'] as string || 'video/mp4';
    const displayName = req.headers['x-display-name'] as string || 'video.mp4';

    if (!apiKey) {
      return res.status(400).json({ error: "API key mancante nell'header x-api-key" });
    }

    if (!req.body || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Nessun file binario ricevuto" });
    }

    let tempFilePath = "";
    try {
      // 1. Save the raw buffer to a temporary file in Cloud Run's in-memory /tmp
      tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${displayName}`);
      fs.writeFileSync(tempFilePath, req.body);

      // 2. Use the official SDK to handle the complex Resumable Upload protocol for large files
      const fileManager = new GoogleAIFileManager(apiKey);
      const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: mimeType,
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
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath); // Ensure cleanup on error
      }
      res.status(500).json({ error: error.message || "Errore interno durante l'upload a Gemini" });
    }
  });

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

  // --- SYSTEM MONITOR ADDON ---
  app.get("/api/system/status", async (req, res) => {
    try {
      // 1. Check PM2 Services
      const { stdout } = await execAsync("pm2 jlist");
      const pm2Data = JSON.parse(stdout);
      
      const services = pm2Data.map((p: any) => ({
        name: p.name,
        status: p.pm2_env.status,
        cpu: p.monit.cpu,
        memory: Math.round(p.monit.memory / 1024 / 1024) + "MB",
        uptime: Math.round((Date.now() - p.pm2_env.pm_uptime) / 1000 / 60) + " min"
      }));

      // 2. Check Memory Server (ThinkCentre via Tailscale)
      let memoryServerStatus = "offline";
      try {
        const memHealth = await axios.get("http://100.124.95.64:3000/api/memory/retrieve?limit=1", { timeout: 2000 });
        if (memHealth.status === 200) memoryServerStatus = "online";
      } catch (e) {
        memoryServerStatus = "offline";
      }

      res.json({
        timestamp: new Date().toISOString(),
        host: os.hostname(),
        services,
        external: [
          { name: "Memory Server (ThinkCentre)", status: memoryServerStatus }
        ]
      });
    } catch (error: any) {
      console.error("System status error:", error);
      res.status(500).json({ error: "Errore nel recupero dello stato dei servizi" });
    }
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
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0fdf4;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'UNI_AUTH_SUCCESS' }, '*');
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
