
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Composant modifié pour NE PAS bloquer l'interface.
 * Il enregistre les erreurs dans la console mais ne les "throw" pas,
 * évitant ainsi le crash visuel de NextJS.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // On log l'erreur discrètement dans la console au lieu de faire crasher l'app
      console.warn("[Firestore Debug] Permission refusée ou erreur de requête :", error.message);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On ne retourne rien et on ne throw rien pour laisser l'utilisateur tester
  return null;
}
