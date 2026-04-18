import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { SubjectType } from '../constants/SubjectConfig';

export interface UserProfile {
  email: string;
  displayName?: string;
  academicPath: SubjectType;
  activeSubjects: string[];
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadProfile() {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          if (isMounted) setProfile(data);
        }
      } catch (err: any) {
        if (err?.message?.includes('offline')) {
           console.error("Firebase is offline. Check connection.");
        }
        console.error("Error loading profile:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const saveProfile = async (academicPath: SubjectType, activeSubjects: string[]) => {
    if (!auth.currentUser) return;
    setError(null);
    setIsLoading(true);

    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          academicPath,
          activeSubjects,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(docRef, {
          email: auth.currentUser.email || '',
          displayName: auth.currentUser.displayName || '',
          academicPath,
          activeSubjects,
          updatedAt: serverTimestamp()
        });
      }
      
      setProfile({
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || '',
        academicPath,
        activeSubjects
      });
    } catch (err: any) {
      console.error("Errore salvataggio profilo:", err);
      // Create explicit error as per guidelines
      const errorInfo = {
        error: err.message,
        operationType: 'write',
        path: `users/${auth.currentUser.uid}`,
        authInfo: {
          userId: auth.currentUser.uid,
          email: auth.currentUser.email,
          emailVerified: auth.currentUser.emailVerified,
          isAnonymous: auth.currentUser.isAnonymous,
          providerInfo: auth.currentUser.providerData
        }
      };
      if (err.message.includes('Missing or insufficient permissions')) {
         throw new Error(JSON.stringify(errorInfo));
      }
      setError("Impossibile salvare il profilo: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { profile, isLoading, error, saveProfile };
}
