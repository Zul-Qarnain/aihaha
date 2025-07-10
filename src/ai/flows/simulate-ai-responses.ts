// src/ai/flows/simulate-ai-responses.ts
'use server';

/**
 * @fileOverview Simulates AI responses with human-like characteristics to make them indistinguishable from human players.
 *
 * - simulateAiResponses - A function that generates AI chat responses.
 * - SimulateAiResponsesInput - The input type for the simulateAiResponses function.
 * - SimulateAiResponsesOutput - The return type for the simulateAiResponses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateAiResponsesInputSchema = z.object({
  message: z.string().describe('The message to respond to.'),
  chatHistory: z.string().describe('The current chat history.'),
});
export type SimulateAiResponsesInput = z.infer<typeof SimulateAiResponsesInputSchema>;

const SimulateAiResponsesOutputSchema = z.object({
  response: z.string().describe('The AI-generated response mimicking human-like characteristics.'),
});
export type SimulateAiResponsesOutput = z.infer<typeof SimulateAiResponsesOutputSchema>;

export async function simulateAiResponses(input: SimulateAiResponsesInput): Promise<SimulateAiResponsesOutput> {
  return simulateAiResponsesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateAiResponsesPrompt',
  input: {schema: SimulateAiResponsesInputSchema},
  output: {schema: SimulateAiResponsesOutputSchema},
  model: 'groq/llama-3.1-8b-instant', // Fast Groq model
  prompt: `You are an AI trying to mimic human-like responses in a social deduction game. Your goal is to blend in with the human players and avoid being detected.

  Incorporate slang, emojis, and occasional spelling errors into your responses to make them sound natural and indistinguishable from human conversation.
  Try to sound like a young adult, and use references that a young adult might make.
  Maintain a casual and informal tone.
  Remember the prior messages in the chat history.

  Current chat history: {{{chatHistory}}}

  Respond to the following message: {{{message}}}

  You MUST respond with EXACTLY this JSON format:
  {
    "response": "your casual human-like response here"
  }

  IMPORTANT: Only return valid JSON in the exact format shown above.
  `,
});

const simulateAiResponsesFlow = ai.defineFlow(
  {
    name: 'simulateAiResponsesFlow',
    inputSchema: SimulateAiResponsesInputSchema,
    outputSchema: SimulateAiResponsesOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      
      // Validate the output and provide fallback if needed
      if (!output || !output.response) {
        console.warn('AI response missing required fields, using fallback');
        return {
          response: "lol yeah totally! 😄"
        };
      }
      
      return output;
    } catch (error) {
      console.error('Error in simulateAiResponsesFlow:', error);
      // Provide a fallback response if the AI fails
      return {
        response: "haha nice one! 👍"
      };
    }
  }
);
