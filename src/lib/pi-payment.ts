
// src/lib/pi-payment.ts

// Déclare une variable globale `Pi` pour que TypeScript ne lève pas d'erreur.
// Cet objet est rendu disponible par le script que nous avons ajouté dans `layout.tsx`.
declare const Pi: any;

/**
 * -----------------------------------------------------------------------------
 * Service d'Intégration de Paiement Pi Network
 * -----------------------------------------------------------------------------
 * Ce fichier contient la logique pour interagir avec le SDK Pi Network.
 * Le SDK est initialisé dans `src/app/layout.tsx`.
 * -----------------------------------------------------------------------------
 */

/**
 * Authentifie un utilisateur via l'application Pi.
 * Cette fonction ouvre la boîte de dialogue d'authentification Pi et demande les permissions spécifiées.
 * 
 * @returns {Promise<any>} L'objet utilisateur retourné par Pi après une authentification réussie.
 * @throws {Error} Si l'authentification échoue ou est annulée par l'utilisateur.
 */
export const authenticateWithPi = async () => {
  console.log("[Pi Service] Lancement de l'authentification Pi...");
  try {
    const scopes = ['username', 'payments'];
    
    const onIncompletePaymentFound = (payment: any) => {
      console.log("[Pi Service] Paiement incomplet détecté :", payment);
      // **ACTION REQUISE** :
      // Vous devez envoyer l'identifiant de ce paiement (`payment.identifier`)
      // à votre serveur backend pour qu'il vérifie le statut de la transaction
      // et la complète si nécessaire. C'est une mesure de sécurité cruciale.
    };

    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    console.log(`[Pi Service] Utilisateur authentifié avec succès : ${auth.user.username}`);
    return auth.user;

  } catch (error) {
    console.error("[Pi Service] L'authentification Pi a échoué :", error);
    throw new Error("L'authentification a été annulée ou a échoué.");
  }
};


/**
 * Enveloppe l'appel `Pi.createPayment` du SDK Pi.
 * Cette fonction ouvre l'interface de paiement Pi et utilise des callbacks
 * pour communiquer le statut de la transaction.
 *
 * @param {object} paymentData - Les données de la transaction (amount, memo, metadata).
 * @param {object} callbacks - Les fonctions de rappel (onReadyForServerApproval, etc.).
 * @returns {Promise<void>}
 * @throws {Error} Si la création du paiement échoue.
 */
export const createPiPayment = async (paymentData: any, callbacks: any) => {
  console.log("[Pi Service] Lancement de Pi.createPayment avec :", { paymentData });
  try {
    await Pi.createPayment(paymentData, callbacks);
  } catch (error) {
    console.error("[Pi Service] Erreur lors de l'appel à Pi.createPayment:", error);
    // Le callback `onError` fourni dans l'objet callbacks devrait gérer l'erreur côté UI.
    // Nous propageons l'erreur au cas où l'appelant voudrait la gérer également.
    throw error;
  }
};
