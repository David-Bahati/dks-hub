
'use server';
/**
 * @fileOverview Flow Genkit pour l'Assistant Client de Double King Shop.
 * Support multilingue, vision par ordinateur et recherche de produits.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

const AssistantInputSchema = z.object({
  message: z.string(),
  language: z.string().optional().default('fr'),
  photoDataUri: z.string().optional().describe("Photo du matériel au format data URI base64"),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string().optional() }))
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
      const q = query(productsRef, where("isPublished", "==", true), limit(20));
      const snapshot = await getDocs(q);
      
      const allProducts = snapshot.docs.map(doc => ({
        name: doc.data().name,
        price: doc.data().sellingPrice || doc.data().price,
        category: doc.data().category,
        stock: doc.data().stockQuantity
      }));
      
      const searchTerm = input.query.toLowerCase();
      return allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.category.toLowerCase().includes(searchTerm)
      ).slice(0, 5);
    } catch (error) {
      console.error("Tool searchProducts error:", error);
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
      const langNames: Record<string, string> = {
        'fr': 'Français',
        'en': 'Anglais',
        'sw': 'Swahili',
        'ln': 'Lingala'
      };
      
      const systemInstruction = `Tu es l'Expert Double King (DKS), l'assistant IA de l'écosystème technologique Double King Shop à Bunia, RDC.
      Ton rôle est de conseiller les clients sur le hardware premium et les services de l'Academy.

      IMPORTANT : 
      1. Tu dois répondre EXCLUSIVEMENT en ${langNames[input.language] || 'Français'}.
      2. Si une image est fournie, analyse-la pour identifier le composant.
      3. Utilise l'outil searchProducts si le client cherche un article précis.
      
      CONTEXTE :
      - Lieu : Immeuble Bahati, Boulevard de la Libération, Bunia.
      - Spécialité : Hardware luxe (RTX 4090), Starlink, Formations IA.
      - Paiements : Pi Network (GCV $314,159) et DKST acceptés.`;

      const promptParts: any[] = [];
      if (input.photoDataUri && input.photoDataUri.startsWith('data:')) {
        promptParts.push({ media: { url: input.photoDataUri } });
      }
      promptParts.push({ text: input.message || "Bonjour" });

      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: systemInstruction,
        prompt: promptParts,
        tools: [searchProducts],
        history: input.history || [],
      });

      return response.text || "Je n'ai pas pu formuler de réponse. Pouvez-vous reformuler ?";
    } catch (error: any) {
      console.error("Genkit Flow Error:", error);
      return "Une difficulté technique empêche temporairement la communication avec le cerveau DKS. Veuillez réessayer dans quelques instants.";
    }
  }
);

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return customerAssistantFlow(input);
}
