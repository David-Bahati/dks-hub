'use server';
/**
 * @fileOverview Flow Genkit pour l'Expert Advisor DKS.
 * 
 * Recommande des composants informatiques basés sur le stock réel et le budget.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AdvisorInputSchema = z.object({
  budget: z.number().describe('Budget maximum en USD'),
  usage: z.enum(['gaming', 'work', 'graphics', 'office']).describe('Usage principal du matériel'),
  preferences: z.string().optional().describe('Préférences spécifiques (ex: marque, silence, performance brute)'),
});

const getStockForAdvisor = ai.defineTool(
  {
    name: 'getStockForAdvisor',
    description: 'Récupère la liste des produits en stock pour faire des recommandations.',
    inputSchema: z.void(),
    outputSchema: z.array(z.any()),
  },
  async () => {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("isPublished", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      name: doc.data().name,
      price: doc.data().sellingPrice,
      category: doc.data().category,
      description: doc.data().description
    }));
  }
);

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
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: `Tu es l'Expert de Configuration de Double King Shop.
      Ton rôle est de créer la meilleure configuration PC ou de conseiller les meilleurs composants en fonction du budget et de l'usage du client.
      
      CONSIGNES :
      - Utilise EXCLUSIVEMENT l'outil getStockForAdvisor pour voir ce qui est disponible.
      - Si le budget est trop serré, propose un upgrade (ex: plus de RAM) plutôt qu'un PC complet.
      - Sois technique mais accessible.
      - Réponds en français.`,
      tools: [getStockForAdvisor],
      prompt: `Le client a un budget de ${input.budget}$ pour un usage ${input.usage}. Ses préférences : ${input.preferences || 'aucune'}. Propose-lui une solution optimale basée sur notre stock actuel.`,
    });

    const output = response.output as any;
    return {
      recommendation: response.text,
      items: output?.items || [],
      totalEstimated: output?.totalEstimated || 0
    };
  }
);

export async function getHardwareAdvice(input: z.infer<typeof AdvisorInputSchema>) {
  return hardwareAdvisorFlow(input);
}
