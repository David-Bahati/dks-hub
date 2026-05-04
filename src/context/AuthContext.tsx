
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
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || userData.displayName || userData.username || 'Utilisateur',
              role: userData.role || 'customer',
              createdAt: userData.createdAt || null,
              photoURL: userData.photoURL || null,
              whatsapp: userData.whatsapp || userData.phoneNumber || '',
              address: userData.address || '',
              loyaltyLevel: userData.loyaltyLevel || 'Bronze',
              language: userData.language || 'fr',
              tokenBalance: userData.tokenBalance || 0,
              pointsConverted: userData.pointsConverted || 0,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Utilisateur',
              role: 'customer',
              photoURL: firebaseUser.photoURL || null,
              tokenBalance: 0,
              pointsConverted: 0,
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
