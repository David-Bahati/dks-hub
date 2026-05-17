'use server';
/**
 * @fileOverview Flow Genkit pour générer des images de produits hardware.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { imagen3Fast } from '@genkit-ai/google-genai';

const GenerateImageInputSchema = z.object({
  productName: z.string().describe('Le nom du produit'),
  category: z.string().optional().describe('La catégorie'),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const promptText = `A professional studio product photograph of ${input.productName} ${input.category ? `(${input.category})` : ''}, 
    clean dark minimalist background, premium cinematic lighting, 8k resolution, highly detailed hardware textures, centered composition.`;

    try {
      const { media } = await ai.generate({
        model: imagen3Fast,
        prompt: promptText,
      });

      if (!media || !media.url) {
        throw new Error('Aucune image générée');
      }

      return media.url;
    } catch (error: any) {
      console.error('Erreur génération image:', error);
      throw new Error('Échec de la génération : ' + error.message);
    }
  }
);

export async function generateProductImage(input: GenerateImageInput): Promise<string> {
  return generateProductImageFlow(input);
}
