import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fallback logic for local AI Studio preview vs Vercel Production
let firebaseConfig: any = null;
let firestoreDatabaseId: string = '(default)';

// 1. Try to load from secure Env vars first (Production / Vercel logic)
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
  // 2. Fallback to AI Studio local config only if env vars are missing
  // We use a try-catch for the import to avoid build errors on Vercel
  try {
    // Note: This is mainly for the AI Studio preview environment
    // @ts-ignore
    const aiStudioConfig = await import('../../firebase-applet-config.json');
    firebaseConfig = aiStudioConfig.default || aiStudioConfig;
    firestoreDatabaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  } catch (e) {
    console.warn("Configurazione Firebase locale non trovata. Assicurati di aver impostato le Variabili d'Ambiente su Vercel.");
  }
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
