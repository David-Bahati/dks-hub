import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuration globale de Genkit pour Double King Shop.
 * Utilise le plugin Google AI avec Gemini 1.5 Flash comme modèle par défaut.
 * L'identifiant sous forme de chaîne 'googleai/gemini-1.5-flash' est utilisé pour une stabilité maximale.
 */
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: 'googleai/gemini-1.5-flash',
});
