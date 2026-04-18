import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Silex Note: In AI Studio, we MUST configure Firestore with the correct database ID
// from the auto-provisioned config file to hit the right instance workspace.
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Opzionale: forziamo il prompt account google ogni volta così sei sicuro
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
