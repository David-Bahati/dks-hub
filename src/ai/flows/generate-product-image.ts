'use server';
/**
 * @fileOverview Flow Genkit pour générer des images de produits hardware.
 * 
 * - generateProductImage - Fonction principale
 * - GenerateImageInput - Type d'entrée
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  productName: z.string().describe('Le nom du produit pour lequel générer une image'),
  category: z.string().optional().describe('La catégorie du produit'),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export async function generateProductImage(input: GenerateImageInput): Promise<string> {
  const prompt = `A professional studio product photograph of ${input.productName} ${input.category ? `(${input.category})` : ''}, 
    clean dark minimalist background, premium cinematic lighting, 8k resolution, highly detailed hardware textures, 
    luxury tech shop style, centered composition.`;

  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: prompt,
    });

    if (!media || !media.url) {
      throw new Error('Aucune image générée');
    }

    return media.url;
  } catch (error) {
    console.error('Erreur génération image:', error);
    throw new Error('Échec de la génération de l\'image par l\'IA');
  }
}
