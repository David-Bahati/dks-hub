
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { AppUser } from '@/lib/types';

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // On fusionne les données Firebase Auth avec toutes les données Firestore
            setUser({
              ...userData,
              uid: firebaseUser.uid,
              email: firebaseUser.email || userData.email || '',
              name: userData.name || userData.displayName || userData.username || 'Utilisateur',
              role: userData.role || 'customer',
              photoURL: userData.photoURL || firebaseUser.photoURL || null,
            } as AppUser);
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Utilisateur',
              role: 'customer',
              photoURL: firebaseUser.photoURL || null,
              tokenBalance: 0,
              pointsConverted: 0,
            } as AppUser);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("AuthContext Snapshot Error:", error);
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
