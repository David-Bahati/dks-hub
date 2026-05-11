
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
              ...userData,
              uid: firebaseUser.uid,
              email: firebaseUser.email || userData.email || '',
              name: userData.name || userData.displayName || userData.username || 'Membre DKS',
              role: userData.role || 'customer',
              photoURL: userData.photoURL || firebaseUser.photoURL || null,
              tokenBalance: userData.tokenBalance ?? 0,
              piBalance: userData.piBalance ?? 0,
              usdBalance: userData.usdBalance ?? 0,
              usdtBalance: userData.usdtBalance ?? 0,
              lpBalance: userData.lpBalance ?? 0,
              miningPower: userData.miningPower ?? 1.0,
              points: userData.points ?? 0,
              pointsConverted: userData.pointsConverted ?? 0,
              completedMissionsToday: userData.completedMissionsToday ?? [],
              hasMnemonic: userData.hasMnemonic ?? false,
              mnemonicWords: userData.mnemonicWords ?? [],
              walletPin: userData.walletPin || null,
              isWalletLocked: userData.isWalletLocked ?? false,
            } as AppUser);
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Nouvel Elite',
              role: 'customer',
              photoURL: firebaseUser.photoURL || null,
              tokenBalance: 0,
              piBalance: 0,
              usdBalance: 0,
              usdtBalance: 0,
              lpBalance: 0,
              miningPower: 1.0,
              points: 0,
              pointsConverted: 0,
              hasMnemonic: false,
              mnemonicWords: [],
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
