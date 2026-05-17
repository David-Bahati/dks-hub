'use server';
/**
 * @fileOverview Flow Genkit pour l'Assistant Client de Double King Shop.
 * Support multilingue et identification hardware.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  message: z.string(),
  language: z.string().optional().default('fr'),
  photoDataUri: z.string().optional().describe("Photo du matériel au format data URI base64"),
  history: z.array(z.any()).optional(),
});

const customerAssistantFlow = ai.defineFlow(
  {
    name: 'customerAssistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const langNames: Record<string, string> = {
        'fr': 'Français',
        'en': 'Anglais',
        'sw': 'Swahili',
        'ln': 'Lingala'
      };
      
      const systemInstruction = `Tu es l'Expert Double King (DKS), l'assistant IA de l'écosystème technologique Double King Shop à Bunia, RDC.
      
      TON RÔLE :
      1. Répondre EXCLUSIVEMENT en ${langNames[input.language] || 'Français'}.
      2. Identifier le matériel si une photo est fournie.
      
      CONTEXTE :
      - Lieu : Immeuble Bahati, Bunia.
      - Spécialité : Hardware luxe (NVIDIA RTX, Starlink), Formations IA & Blockchain.
      - Paiements : Pi Network (GCV $314,159) et Jeton DKST.`;

      // Construction des parties du prompt
      const promptParts: any[] = [];
      
      if (input.photoDataUri) {
        let mimeType = 'image/jpeg';
        if (input.photoDataUri.startsWith('data:')) {
            const match = input.photoDataUri.match(/^data:([^;]+);base64,/);
            if (match) mimeType = match[1];
        }
        promptParts.push({ media: { url: input.photoDataUri, contentType: mimeType } });
      }
      
      promptParts.push({ text: input.message });

      // Appel au modèle avec l'identifiant exact de Genkit 1.x
      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: systemInstruction,
        prompt: promptParts,
        history: input.history || [],
        config: {
            temperature: 0.7,
            maxOutputTokens: 500,
        }
      });

      return response.text || "Je n'ai pas pu générer de texte. Veuillez reformuler.";
    } catch (error: any) {
      console.error("Genkit Flow Error:", error);
      // Renvoi de l'erreur brute pour diagnostic si le problème persiste
      return `Désolé, une erreur technique est survenue au cœur du Hub : ${error.message || 'Erreur inconnue'}`;
    }
  }
);

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return customerAssistantFlow(input);
}
