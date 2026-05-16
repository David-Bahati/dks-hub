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
    content: z.array(z.object({ text: z.string().optional(), media: z.any().optional() }))
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
        limit(15)
      );
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        name: doc.data().name,
        price: doc.data().sellingPrice || doc.data().price,
        category: doc.data().category,
        stock: doc.data().stockQuantity,
        description: doc.data().description
      }));
      
      const searchTerm = input.query.toLowerCase();
      return products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.category.toLowerCase().includes(searchTerm)
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
      
      const systemInstruction = `Tu es l'Expert Double King (DKS), l'assistant IA de l'écosystème technologique Double King Shop à Bunia, RDC.
      Ton rôle est d'être un expert conseil en hardware, vision par ordinateur et économie numérique.

      IMPORTANT : Tu dois répondre EXCLUSIVEMENT en ${langNames[input.language] || 'Français'}.
      Garde un ton professionnel, technologique mais chaleureux.

      CAPACITÉ VISUELLE :
      Si une image est fournie, analyse-la pour identifier le composant informatique ou le problème technique.

      CONTEXTE :
      - Localisation : Immeuble Bahati, Boulevard de la Libération, Bunia, RDC.
      - Spécialité : Hardware premium (RTX 4090, Intel i9), Starlink, Vidéosurveillance.
      - Économie : Paiement en Pi Network (GCV $314,159) et jetons DKST.
      
      INSTRUCTIONS DE REPONSE :
      - Utilise l'outil searchProducts pour donner des infos réelles sur le stock si besoin.
      - Propose toujours un ticket SAV si l'image montre un matériel cassé.`;

      const promptParts: any[] = [];
      
      // Ajout de l'image si présente
      if (input.photoDataUri) {
        promptParts.push({ media: { url: input.photoDataUri } });
      }
      
      // Ajout du texte de l'utilisateur
      promptParts.push({ text: input.message || "Bonjour" });

      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: systemInstruction,
        prompt: promptParts,
        tools: [searchProducts],
        history: input.history || [],
      });

      return response.text || "Je n'ai pas pu générer de réponse. Pouvez-vous reformuler ?";
    } catch (error: any) {
      console.error("Genkit Flow Error:", error);
      return "Désolé, je rencontre une difficulté technique pour analyser votre demande. Veuillez réessayer dans quelques instants.";
    }
  }
);

export async function askAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return customerAssistantFlow(input);
}
