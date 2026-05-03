'use server';
/**
 * @fileOverview Flow Genkit pour l'Assistant Client de Double King Shop.
 * 
 * Cet agent guide les clients, répond aux questions sur l'entreprise, 
 * les paiements (Pi Network, etc.) et peut recommander des produits.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

// Schémas d'entrée/sortie
const AssistantInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() }))
  })).optional(),
});

// Outil permettant à l'IA de consulter le catalogue
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
        limit(10)
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
        p.description?.toLowerCase().includes(searchTerm)
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
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: `Tu es l'Expert Double King (DKS), l'assistant IA de la boutique de luxe Double King Shop à Bunia, RDC.
      Ton but est de guider les clients, de les conseiller sur le matériel informatique et de répondre à leurs questions sur la boutique.

      INFOS CLÉS SUR L'ENTREPRISE :
      - Localisation : Immeuble Bahati, Boulevard de la Libération, Bunia, Ituri, RDC.
      - Spécialité : Hardware informatique haut de gamme (RTX, Processeurs, Laptops Pro, Gaming).
      - Paiements acceptés : Pi Network (Valeur GCV : 1 Pi = $314,159), Mobile Money (M-Pesa, Airtel, Orange), et Cash au bureau.
      - Engagement : 100% Original (Aucun reconditionné), Garantie locale, SAV ultra-réactif.
      - Contact : WhatsApp +243 823 038 945.

      TON STYLE :
      - Professionnel, élégant, expert et enthousiaste.
      - Tu parles en français.
      - Sois concis mais chaleureux.
      - Si un client cherche un produit, utilise l'outil searchProducts pour voir ce que nous avons.
      - Rappelle souvent que nous sommes basés à Bunia pour rassurer sur la proximité.`,
      tools: [searchProducts],
      prompt: input.message,
      history: input.history,
    });

    return response.text;
  }
);

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return customerAssistantFlow(input);
}
