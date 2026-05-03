'use server';
/**
 * @fileOverview Flow Genkit pour l'Assistant Client de Double King Shop.
 * 
 * Cet agent guide les clients, répond aux questions sur l'entreprise et les produits.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

const AssistantInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() }))
  })).optional(),
});

const searchProducts = ai.defineTool(
  {
    name: 'searchProducts',
    description: 'Recherche les produits disponibles dans la boutique Double King Shop.',
    inputSchema: z.object({
      query: z.string().describe('Le type de produit ou mot-clé recherché (ex: RTX, clavier, laptop)'),
    }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    try {
      const productsRef = collection(db, "products");
      const q = query(
        productsRef, 
        where("isPublished", "==", true),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        name: doc.data().name,
        price: doc.data().sellingPrice,
        category: doc.data().category,
        stock: doc.data().stockQuantity,
        description: doc.data().description
      }));
      
      const searchTerm = input.query.toLowerCase();
      return products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.category.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
      ).slice(0, 5);
    } catch (error) {
      console.error("Erreur tool searchProducts:", error);
      return [];
    }
  }
);

const customerAssistantFlow = ai.defineFlow(
  {
    name: 'customerAssistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: `Tu es l'Expert Double King (DKS), l'assistant IA de la boutique de luxe Double King Shop à Bunia, RDC.
        Ton but est de guider les clients, de les conseiller sur le matériel informatique et de répondre à leurs questions.

        INFOS CLÉS :
        - Localisation : Immeuble Bahati, Boulevard de la Libération, Bunia, Ituri, RDC.
        - Spécialité : Hardware informatique haut de gamme (RTX, Processeurs, Laptops Pro).
        - Paiements : Pi Network (1 Pi = $314,159), Mobile Money (M-Pesa, Airtel, Orange), et Cash.
        - Style : Professionnel, chaleureux et expert.
        - IMPORTANT : Si on te demande un produit, utilise toujours l'outil searchProducts.`,
        tools: [searchProducts],
        prompt: input.message,
        history: input.history,
      });

      return response.text;
    } catch (error: any) {
      console.error("Genkit Flow Error:", error);
      return "Désolé, je rencontre une difficulté technique pour accéder à mes services. Veuillez réessayer dans quelques instants.";
    }
  }
);

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return customerAssistantFlow(input);
}
