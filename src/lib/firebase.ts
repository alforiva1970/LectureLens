import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fallback logic for local AI Studio preview vs Vercel Production
// Webpack/Vite in AI Studio doesn't like dynamic require, so we import statically 
// but use Vite env vars first.
import aiStudioConfig from '../../firebase-applet-config.json';

let firebaseConfig;
let firestoreDatabaseId;

try {
  // 1. Try to load from secure Env vars first (Production / Vercel logic as requested by Silicea)
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';
  } else {
    // 2. Fallback to AI Studio local config if env vars are missing
    firebaseConfig = aiStudioConfig;
    firestoreDatabaseId = aiStudioConfig.firestoreDatabaseId;
  }
} catch (e) {
  console.error("Firebase config load error:", e);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig!);

// Silex Note: In AI Studio, we MUST configure Firestore with the correct database ID
// from the auto-provisioned config file to hit the right instance workspace.
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Opzionale: forziamo il prompt account google ogni volta così sei sicuro
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
