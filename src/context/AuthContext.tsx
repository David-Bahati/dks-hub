"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
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
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Nettoyer l'ancien écouteur Firestore si l'état auth change
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.username || userData.name || userData.displayName || 'Utilisateur',
              role: userData.role || 'customer',
              createdAt: userData.createdAt || null,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Utilisateur',
              role: 'customer',
            });
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