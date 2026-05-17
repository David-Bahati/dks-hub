'use server';
/**
 * @fileOverview Flow Genkit pour l'Expert Advisor DKS.
 * 
 * Recommande des composants informatiques basés sur le budget et l'usage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/google-genai';

const AdvisorInputSchema = z.object({
  budget: z.number().describe('Budget maximum en USD'),
  usage: z.enum(['gaming', 'work', 'graphics', 'office']).describe('Usage principal du matériel'),
  preferences: z.string().optional().describe('Préférences spécifiques (ex: marque, silence, performance brute)'),
});

const hardwareAdvisorFlow = ai.defineFlow(
  {
    name: 'hardwareAdvisorFlow',
    inputSchema: AdvisorInputSchema,
    outputSchema: z.object({
      recommendation: z.string(),
      items: z.array(z.string()).describe('Liste des noms de produits recommandés'),
      totalEstimated: z.number()
    }),
  },
  async (input) => {
    try {
      const response = await ai.generate({
        model: gemini15Flash,
        system: `Tu es l'Expert de Configuration de Double King Shop.
        Ton rôle est de créer la meilleure configuration PC ou de conseiller les meilleurs composants en fonction du budget et de l'usage du client.
        
        CONSIGNES :
        - Sois technique mais accessible.
        - Réponds en français.`,
        prompt: `Le client a un budget de ${input.budget}$ pour un usage ${input.usage}. Ses préférences : ${input.preferences || 'aucune'}. Propose-lui une solution optimale.`,
      });

      return {
        recommendation: response.text || "Aucune recommandation générée.",
        items: [],
        totalEstimated: input.budget
      };
    } catch (error: any) {
      console.error("Advisor Flow Error:", error);
      throw new Error("Échec de la recommandation technique : " + error.message);
    }
  }
);

export async function getHardwareAdvice(input: z.infer<typeof AdvisorInputSchema>) {
  return hardwareAdvisorFlow(input);
}
