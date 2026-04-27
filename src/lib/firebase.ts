import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fallback logic for local AI Studio preview vs Vercel Production
// Webpack/Vite in AI Studio doesn't like dynamic require, so we import statically 
// but use Vite env vars first.
let firebaseConfig;
let firestoreDatabaseId;

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
  // 2. Fallback to local config (only for local dev where the file exists)
  // We use a dynamic approach to avoid build errors on Vercel
  try {
    // Note: This matches the local development setup
    firebaseConfig = {
      apiKey: "AIzaSyC-dhTuo0UMhXaM8VcV9R8WrqlEz7ZwB1g",
      authDomain: "riva-alfonso-1548860444538.firebaseapp.com",
      projectId: "riva-alfonso-1548860444538",
      storageBucket: "riva-alfonso-1548860444538.firebasestorage.app",
      messagingSenderId: "644000092289",
      appId: "1:644000092289:web:a088c23c9d82d842f9bd80",
    };
    firestoreDatabaseId = "ai-studio-79e1bbb1-687f-4b6e-8828-58d2894226fd";
  } catch (e) {
    console.error("Firebase config fallback error:", e);
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
