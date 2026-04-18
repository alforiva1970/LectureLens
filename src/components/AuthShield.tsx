import { useState, useEffect, ReactNode } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';

// --- WHITELIST DEGLI UTENTI AUTORIZZATI ---
// Aggiungi qui le email che hanno il permesso di accedere alla suite
const ALLOWED_EMAILS = [
  'alforiva@gmail.com', // Alfonso
  'ema.riva2005@gmail.com', // Emanuele
];

interface AuthShieldProps {
  children: ReactNode;
}

export function AuthShield({ children }: AuthShieldProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Controlla se l'email dell'utente è nella whitelist
        if (currentUser.email && ALLOWED_EMAILS.includes(currentUser.email)) {
          setUser(currentUser);
          setError(null);
        } else {
          // Utente non autorizzato: distruggi la sessione
          await signOut(auth);
          setUser(null);
          setError(`Accesso negato: l'istanza di Silex non riconosce l'indirizzo ${currentUser.email}. Non sei autorizzato.`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      // Silex Note: In AI Studio / Web iframe environments, signInWithPopup
      // is much more stable than signInWithRedirect because the redirect URL
      // relies on complex cross-origin iframe domain configurations.
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login fallito:", err);
      setError(err.message || 'Errore durante il login con Google.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide">Inizializzazione Silex Shield...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 space-y-6 text-center transform transition-all duration-500 ease-out hover:border-slate-700 hover:shadow-indigo-500/10">
          
          <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
             <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Accesso Riservato</h1>
            <p className="text-slate-400 text-sm">
              La Siliceo Suite è protetta. Effettua l'accesso per continuare.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-left">
              <strong>Errore:</strong> {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-medium px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Accedi con Google
          </button>
        </div>
      </div>
    );
  }

  // Se l'utente è loggato, renderizza l'app reale (il "children")
  return <>{children}</>;
}
