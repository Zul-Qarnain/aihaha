import {genkit} from 'genkit';
import {groq} from 'genkitx-groq';

export const ai = genkit({
  plugins: [groq({
    apiKey: process.env.GROQ_API_KEY,
  })],
  // Don't set a default model here, we'll specify it in each flow
});

    