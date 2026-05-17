'use server';
/**
 * @fileOverview Flow Genkit pour l'Expert Advisor DKS.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/google-genai';

const AdvisorInputSchema = z.object({
  budget: z.number().describe('Budget maximum en USD'),
  usage: z.enum(['gaming', 'work', 'graphics', 'office']).describe('Usage principal du matériel'),
  preferences: z.string().optional().describe('Préférences spécifiques'),
});

const hardwareAdvisorFlow = ai.defineFlow(
  {
    name: 'hardwareAdvisorFlow',
    inputSchema: AdvisorInputSchema,
    outputSchema: z.object({
      recommendation: z.string(),
      items: z.array(z.string()),
      totalEstimated: z.number()
    }),
  },
  async (input) => {
    try {
      const response = await ai.generate({
        model: gemini15Flash,
        system: `Tu es l'Expert de Configuration de Double King Shop. 
        Ton rôle est de créer la meilleure configuration PC ou de conseiller les meilleurs composants en fonction du budget et de l'usage du client.
        Réponds en français.`,
        prompt: `Budget: ${input.budget}$, Usage: ${input.usage}, Préférences: ${input.preferences || 'aucune'}.`,
      });

      return {
        recommendation: response.text || "Aucune recommandation générée.",
        items: [],
        totalEstimated: input.budget
      };
    } catch (error: any) {
      console.error("Advisor Flow Error:", error);
      throw new Error("Échec de la recommandation : " + error.message);
    }
  }
);

export async function getHardwareAdvice(input: z.infer<typeof AdvisorInputSchema>) {
  return hardwareAdvisorFlow(input);
}
