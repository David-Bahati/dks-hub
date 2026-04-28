
// src/app/api/pi/complete/route.ts

import { NextResponse } from 'next/server';

/**
 * Endpoint d'API pour finaliser une transaction Pi.
 * -----------------------------------------------------------------------------
 * Cette fonction est appelée depuis le frontend lorsque le callback 
 * `onReadyForServerCompletion` est déclenché par le SDK Pi.
 *
 * Elle reçoit le `txid` (ID de transaction sur la blockchain) et l'envoie
 * aux serveurs de Pi pour vérification finale. C'est la confirmation
 * cryptographique que le paiement a été effectué.
 */
export async function POST(request: Request) {
  // 1. Récupérer le paymentId et le txid depuis le corps de la requête.
  const { paymentId, txid } = await request.json();

  if (!paymentId || !txid) {
    return NextResponse.json({ error: "Le paymentId ou le txid est manquant." }, { status: 400 });
  }

  // 2. Récupérer la clé d'API depuis les variables d'environnement.
  const PI_API_KEY = process.env.PI_API_KEY;
  if (!PI_API_KEY) {
    console.error("[Pi API Complete] La variable d'environnement PI_API_KEY n'est pas définie.");
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  const PI_API_URL = `https://api.minepi.com/v2/payments/${paymentId}/complete`;

  console.log(`[Pi API Complete] Finalisation du paiement: ${paymentId} avec TXID: ${txid}`);

  try {
    // 3. Envoyer la requête de complétion aux serveurs de Pi.
    const response = await fetch(PI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[Pi API Complete] Erreur de l'API Pi:`, responseData);
      throw new Error(responseData.message || "Erreur lors de la finalisation du paiement.");
    }

    console.log(`[Pi API Complete] Paiement ${paymentId} finalisé avec succès.`);

    // 4. Renvoyer une réponse de succès au frontend.
    // C'est à ce moment que vous devriez mettre à jour la commande comme "Payée"
    // dans votre base de données.
    return NextResponse.json({ message: "Transaction terminée avec succès" });

  } catch (error: any) {
    console.error(`[Pi API Complete] Erreur inattendue:`, error);
    return NextResponse.json({ error: error.message || "Une erreur interne est survenue." }, { status: 500 });
  }
}
