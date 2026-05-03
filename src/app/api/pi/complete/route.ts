// src/app/api/pi/complete/route.ts

import { NextResponse } from 'next/server';

/**
 * Endpoint d'API pour finaliser une transaction Pi.
 * Reçoit le txid et confirme la transaction auprès de Pi Network.
 */
export async function POST(request: Request) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId || !txid) {
      return NextResponse.json({ error: "Données de transaction manquantes." }, { status: 400 });
    }

    const PI_API_KEY = process.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error("[Pi API Complete] PI_API_KEY non configurée.");
      return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
    }

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[Pi API Complete] Erreur API Pi:`, responseData);
      throw new Error(responseData.message || "Erreur lors de la complétion.");
    }

    console.log(`[Pi API Complete] Paiement ${paymentId} finalisé.`);
    return NextResponse.json({ message: "Transaction terminée avec succès" });

  } catch (error: any) {
    console.error(`[Pi API Complete] Erreur:`, error);
    return NextResponse.json({ error: error.message || "Erreur interne." }, { status: 500 });
  }
}
