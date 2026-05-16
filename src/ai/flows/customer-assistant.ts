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
      2. Si l'utilisateur envoie une photo, analyse-la pour identifier le matériel hardware.
      
      CONTEXTE :
      - Lieu : Immeuble Bahati, Bunia.
      - Spécialité : Hardware luxe (NVIDIA, Starlink), Formations IA & Blockchain.
      - Paiements : Pi Network (GCV) et DKST.`;

      // Préparation du prompt utilisateur
      const userParts: any[] = [];
      if (input.photoDataUri) {
        userParts.push({ media: { url: input.photoDataUri, contentType: 'image/jpeg' } });
      }
      userParts.push({ text: input.message });

      // Appel au modèle Gemini
      const response = await ai.generate({
        system: systemInstruction,
        prompt: userParts,
        history: input.history || [],
        config: {
            temperature: 0.7,
        }
      });

      return response.text || "Je n'ai pas pu formuler de réponse. Veuillez reformuler votre question.";
    } catch (error: any) {
      console.error("Genkit Flow Error:", error);
      return "Une erreur technique s'est produite lors de la communication avec le cerveau DKS. Veuillez réessayer avec un message plus simple.";
    }
  }
);

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return customerAssistantFlow(input);
}