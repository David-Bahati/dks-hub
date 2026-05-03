
// src/lib/pi-payment.ts

// Déclare une variable globale `Pi` pour que TypeScript ne lève pas d'erreur.
declare const Pi: any;

/**
 * -----------------------------------------------------------------------------
 * Service d'Intégration de Paiement Pi Network (Mode Sandbox)
 * -----------------------------------------------------------------------------
 */

export const authenticateWithPi = async () => {
  console.log("[Pi Service] Tentative d'authentification Pi...");
  
  if (typeof window === 'undefined' || !Pi) {
    throw new Error("L'objet Pi n'est pas disponible. Utilisez le Pi Browser.");
  }

  try {
    const scopes = ['username', 'payments'];
    
    const onIncompletePaymentFound = (payment: any) => {
      console.warn("[Pi Service] Paiement incomplet trouvé :", payment.identifier);
      // Optionnel : Envoyer au serveur pour tenter une résolution automatique
    };

    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    console.log(`[Pi Service] Succès: ${auth.user.username}`);
    return auth.user;

  } catch (error: any) {
    console.error("[Pi Service] Échec de l'authentification :", error);
    throw new Error(error.message || "Authentification Pi refusée.");
  }
};

export const createPiPayment = async (paymentData: any, callbacks: any) => {
  console.log("[Pi Service] Lancement de Pi.createPayment", paymentData);
  
  if (!Pi) throw new Error("Pi SDK non disponible.");

  try {
    // Appel natif au SDK Pi
    await Pi.createPayment({
      amount: parseFloat(paymentData.amount.toFixed(6)), // Formatage précis pour la blockchain
      memo: paymentData.memo,
      metadata: paymentData.metadata
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        console.log("[Pi SDK Callback] onReadyForServerApproval:", paymentId);
        return callbacks.onReadyForServerApproval(paymentId);
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log("[Pi SDK Callback] onReadyForServerCompletion:", paymentId, txid);
        return callbacks.onReadyForServerCompletion(paymentId, txid);
      },
      onCancel: (paymentId: string) => {
        console.log("[Pi SDK Callback] onCancel:", paymentId);
        if (callbacks.onCancel) callbacks.onCancel(paymentId);
      },
      onError: (error: any, payment?: any) => {
        console.error("[Pi SDK Callback] onError:", error, payment);
        if (callbacks.onError) callbacks.onError(error, payment);
      }
    });
  } catch (error) {
    console.error("[Pi Service] Erreur lors de l'appel createPayment:", error);
    throw error;
  }
};
