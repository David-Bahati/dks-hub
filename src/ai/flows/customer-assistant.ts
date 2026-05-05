'use server';
/**
 * @fileOverview Flow Genkit pour l'Assistant Client de Double King Shop avec support multilingue et vision par ordinateur.
 * 
 * Cet agent guide les clients, répond aux questions sur l'entreprise et les produits, et identifie le matériel par photo.
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
      const langNames: Record<string, string> = {
        'fr': 'Français',
        'en': 'Anglais',
        'sw': 'Swahili',
        'ln': 'Lingala'
      };
      
      const promptParts: any[] = [
        { text: `Tu es l'Expert Double King (DKS), l'assistant IA de l'écosystème technologique Double King Shop à Bunia, RDC.
        Ton rôle est d'être un expert conseil en hardware, vision par ordinateur et économie numérique.

        IMPORTANT : Tu dois répondre EXCLUSIVEMENT en ${langNames[input.language] || 'Français'}.
        Garde un ton professionnel, technologique mais chaleureux.

        CAPACITÉ VISUELLE :
        Si une image est fournie, analyse-la pour identifier le composant informatique ou le problème technique.
        Utilise cette analyse pour conseiller le client sur le stock disponible ou la réparation nécessaire.

        CONTEXTE ET VALEURS :
        - Localisation : Immeuble Bahati, Boulevard de la Libération, Bunia, Ituri, RDC.
        - Spécialité : Hardware premium, Starlink, Vidéosurveillance.
        - Économie : Paiement en Pi Network (1 Pi = $314,159 GCV) et jetons DKST.
        
        INSTRUCTIONS DE REPONSE :
        - Pour les produits, utilise l'outil searchProducts.
        - Si l'image montre un composant cassé, propose d'ouvrir un ticket SAV au Hub.
        - Explique toujours les bénéfices des paiements en Crypto.` }
      ];

      if (input.photoDataUri) {
        promptParts.push({ media: { url: input.photoDataUri, contentType: 'image/jpeg' } });
      }

      promptParts.push({ text: input.message });

      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        tools: [searchProducts],
        prompt: promptParts,
        history: input.history,
      });

      return response.text;
    } catch (error: any) {
      console.error("Genkit Flow Error:", error);
      return "Désolé, je rencontre une difficulté technique pour analyser cette demande. Veuillez réessayer.";
    }
  }
);

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return customerAssistantFlow(input);
}
