import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration globale de Genkit pour Double King Shop.
 * Initialisation propre pour la version 1.x.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
});
