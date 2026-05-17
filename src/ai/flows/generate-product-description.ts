'use server';
/**
 * @fileOverview Flow Genkit pour générer des descriptions de produits informatiques.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/google-genai';

const GenerateDescriptionInputSchema = z.object({
  productName: z.string().describe('Le nom du produit informatique (ex: RTX 4090, Clavier Logitech G Pro)'),
  category: z.string().optional().describe('La catégorie du produit'),
});

export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  model: gemini15Flash,
  input: { schema: GenerateDescriptionInputSchema },
  output: { schema: z.string() },
  prompt: `Tu es un expert en marketing hardware pour la boutique de luxe "Double King Shop" à Bunia.
Rédige une description technique et vendeuse pour le produit suivant : {{{productName}}}.
{{#if category}}Catégorie : {{{category}}}{{/if}}

La description doit être :
1. Professionnelle et enthousiasmante.
2. Mettre en avant la performance et la fiabilité.
3. Courte (maximum 3 phrases).
4. En français.
Ne commence pas par "Voici une description", va droit au but.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateDescriptionInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await productDescriptionPrompt(input);
    return output || "Description non générée.";
  }
);

export async function generateProductDescription(input: GenerateDescriptionInput): Promise<string> {
  return generateProductDescriptionFlow(input);
}
