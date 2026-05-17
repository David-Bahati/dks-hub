import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration globale de Genkit pour Double King Shop.
 * Utilise le plugin Google AI (Gemini 1.5 Flash).
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
});
