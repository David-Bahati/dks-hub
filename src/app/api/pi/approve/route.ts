
// src/app/api/pi/approve/route.ts

import { NextResponse } from 'next/server';

/**
 * Endpoint d'API pour approuver une transaction Pi.
 * -----------------------------------------------------------------------------
 * Cette fonction est appelée depuis le frontend lorsque le callback 
 * `onReadyForServerApproval` est déclenché par le SDK Pi.
 *
 * Elle utilise la clé d'API secrète pour autoriser le paiement, indiquant
 * aux serveurs de Pi que vous êtes prêt à procéder.
 */
export async function POST(request: Request) {
  // 1. Récupérer le paymentId depuis le corps de la requête.
  const { paymentId } = await request.json();

  if (!paymentId) {
    return NextResponse.json({ error: "Le paymentId est manquant." }, { status: 400 });
  }

  // 2. Récupérer la clé d'API depuis les variables d'environnement.
  const PI_API_KEY = process.env.PI_API_KEY;
  if (!PI_API_KEY) {
    console.error("[Pi API Approve] La variable d'environnement PI_API_KEY n'est pas définie.");
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  const PI_API_URL = `https://api.minepi.com/v2/payments/${paymentId}/approve`;
  
  console.log(`[Pi API Approve] Approbation du paiement: ${paymentId}`);

  try {
    // 3. Envoyer la requête d'approbation aux serveurs de Pi.
    const response = await fetch(PI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error(`[Pi API Approve] Erreur de l'API Pi:`, responseData);
        throw new Error(responseData.message || "Erreur lors de l'approbation du paiement.");
    }

    console.log(`[Pi API Approve] Paiement ${paymentId} approuvé avec succès.`);
    
    // 4. Renvoyer une réponse de succès au frontend.
    return NextResponse.json({ message: "Approuvé" });

  } catch (error: any) {
    console.error(`[Pi API Approve] Erreur inattendue:`, error);
    return NextResponse.json({ error: error.message || "Une erreur interne est survenue." }, { status: 500 });
  }
}
