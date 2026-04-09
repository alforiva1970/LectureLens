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
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Abilita CORS per permettere al frontend su Vercel di comunicare con questo backend su Railway
  app.use(cors({
    origin: true, // Permette qualsiasi origine temporaneamente, in produzione andrebbe ristretto al dominio Vercel
    credentials: true
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // --- GEMINI UPLOAD PROXY (Bypass Service Worker) ---
  // We use express.raw to accept binary data up to 500MB
  app.post("/api/gemini/upload", express.raw({ type: '*/*', limit: '500mb' }), async (req, res) => {
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
      const ai = new GoogleGenAI({ apiKey });
      const uploadResult = await ai.files.upload({
        file: tempFilePath,
        mimeType: mimeType,
        displayName: displayName,
      });

      // 3. Clean up the temp file to free memory
      fs.unlinkSync(tempFilePath);

      res.json({
        fileUri: uploadResult.uri || uploadResult.name,
        name: uploadResult.name,
        mimeType: uploadResult.mimeType
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
