import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration globale de Genkit pour Double King Shop.
 * Utilisation de la version 1.x stable.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
});
