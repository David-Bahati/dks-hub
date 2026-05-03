// src/app/api/pi/approve/route.ts

import { NextResponse } from 'next/server';

/**
 * Endpoint d'API pour approuver une transaction Pi.
 * Utilise la clé d'API configurée pour autoriser le paiement auprès des serveurs Pi.
 */
export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: "Le paymentId est manquant." }, { status: 400 });
    }

    const PI_API_KEY = process.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error("[Pi API Approve] PI_API_KEY non configurée.");
      return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
    }

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error(`[Pi API Approve] Erreur API Pi:`, responseData);
        throw new Error(responseData.message || "Erreur lors de l'approuvement.");
    }

    console.log(`[Pi API Approve] Paiement ${paymentId} approuvé.`);
    return NextResponse.json({ message: "Approuvé" });

  } catch (error: any) {
    console.error(`[Pi API Approve] Erreur:`, error);
    return NextResponse.json({ error: error.message || "Erreur interne." }, { status: 500 });
  }
}
