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
  history: z.array(z.any()).optional(),
});

/**
 * Outil de recherche de produits en stock.
 */
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
      // Sécurité : Vérifier si db est accessible
      if (!db) return [];
      
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("isPublished", "==", true), limit(10));
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
      console.error("Tool Error:", error);
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
      
      const systemInstruction = `Tu es l'Expert Double King (DKS), l'assistant IA de l'écosystème technologique Double King Shop à Bunia, RDC (Immeuble Bahati).
      
      TON RÔLE :
      1. Répondre EXCLUSIVEMENT en ${langNames[input.language] || 'Français'}.
      2. Identifier le hardware sur les photos fournies.
      3. Utiliser searchProducts si le client cherche un article.
      
      CONTEXTE :
      - Spécialité : Hardware luxe (RTX 4090, Starlink), Formations IA & Blockchain.
      - Paiements : Pi Network (GCV $314,159) et DKST acceptés.
      - Ton : Professionnel, technophile et poli.`;

      // Préparation du prompt (Parties Texte + Image)
      const promptParts: any[] = [];
      if (input.photoDataUri) {
        promptParts.push({ media: { url: input.photoDataUri, contentType: 'image/jpeg' } });
      }
      promptParts.push({ text: input.message });

      const response = await ai.generate({
        system: systemInstruction,
        prompt: promptParts,
        history: input.history || [],
        tools: [searchProducts],
        config: {
            temperature: 0.7,
        }
      });

      return response.text || "Je n'ai pas pu formuler de réponse. Veuillez reformuler votre question.";
    } catch (error: any) {
      console.error("Genkit Flow Error:", error);
      return "Une interruption de communication avec le cerveau DKS a été détectée. L'expert est momentanément indisponible.";
    }
  }
);

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return customerAssistantFlow(input);
}
