import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

/**
 * Configuration globale de Genkit pour Double King Shop.
 * Utilise le plugin Google AI avec Gemini 1.5 Flash comme modèle par défaut.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: gemini15Flash,
});
