// src/ai/flows/simulate-human-like-response.ts
'use server';

/**
 * @fileOverview Simulates human-like responses for AI players in the game, incorporating slang, emojis,
 * and occasional typos to make them indistinguishable from real human players.
 *
 * - simulateHumanLikeResponse - A function that generates human-like chat responses.
 * - SimulateHumanLikeResponseInput - The input type for the simulateHumanLikeResponse function.
 * - SimulateHumanLikeResponseOutput - The return type for the simulateHumanLikeResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateHumanLikeResponseInputSchema = z.object({
  message: z.string().describe('The message to respond to.'),
  chatHistory: z.string().describe('The current chat history.'),
});
export type SimulateHumanLikeResponseInput = z.infer<typeof SimulateHumanLikeResponseInputSchema>;

const SimulateHumanLikeResponseOutputSchema = z.object({
  response: z.string().describe('The human-like response.'),
});
export type SimulateHumanLikeResponseOutput = z.infer<typeof SimulateHumanLikeResponseOutputSchema>;

export async function simulateHumanLikeResponse(input: SimulateHumanLikeResponseInput): Promise<SimulateHumanLikeResponseOutput> {
  return simulateHumanLikeResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateHumanLikeResponsePrompt',
  input: {schema: SimulateHumanLikeResponseInputSchema},
  output: {schema: SimulateHumanLikeResponseOutputSchema},
  prompt: `You are simulating a human player in a social deduction game. Your goal is to blend in and not be detected as an AI.

  Incorporate slang, emojis, and occasional spelling errors into your responses to mimic human conversation.
  Maintain a casual and informal tone.
  Remember prior messages in the chat history.

  Current chat history: {{{chatHistory}}}

  Respond to the following message: {{{message}}}
  `,
});

const simulateHumanLikeResponseFlow = ai.defineFlow(
  {
    name: 'simulateHumanLikeResponseFlow',
    inputSchema: SimulateHumanLikeResponseInputSchema,
    outputSchema: SimulateHumanLikeResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
