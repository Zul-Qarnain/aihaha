'use server';

/**
 * @fileOverview Manages chat threads for AI players, enabling them to remember previous messages
 * to maintain context and consistency throughout the game session.
 *
 * - rememberChatThreads - A function that processes chat messages and maintains context for AI responses.
 * - RememberChatThreadsInput - The input type for the rememberChatThreads function, including the player's ID and message.
 * - RememberChatThreadsOutput - The return type for the rememberChatThreads function, returning the AI's response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RememberChatThreadsInputSchema = z.object({
  playerId: z.string().describe('The unique identifier for the player sending the message.'),
  message: z.string().describe('The chat message sent by the player.'),
  chatHistory: z.string().optional().describe('The previous chat history of the current game.'),
});
export type RememberChatThreadsInput = z.infer<typeof RememberChatThreadsInputSchema>;

const RememberChatThreadsOutputSchema = z.object({
  response: z.string().describe('The AI generated response to the message, incorporating previous chat history.'),
  updatedChatHistory: z.string().describe('The updated chat history, including the latest message and response.'),
});
export type RememberChatThreadsOutput = z.infer<typeof RememberChatThreadsOutputSchema>;

export async function rememberChatThreads(input: RememberChatThreadsInput): Promise<RememberChatThreadsOutput> {
  return rememberChatThreadsFlow(input);
}

const rememberChatThreadsPrompt = ai.definePrompt({
  name: 'rememberChatThreadsPrompt',
  input: {schema: RememberChatThreadsInputSchema},
  output: {schema: RememberChatThreadsOutputSchema},
  model: 'groq/llama-3.1-8b-instant', // Fast Groq model
  prompt: `You are participating in a game where some players are humans and others are AIs trying to pass as humans.
  Your goal as an AI is to blend in and not be detected. Remember that the game is 6 minutes long and you are supposed to mimic human behavior.

  Here is the current chat history: {{{chatHistory}}}

  Now, respond to the following message from player {{{playerId}}}: "{{{message}}}". Incorporate elements from the chat history to make your response seem natural and consistent. Use slang, emojis, and occasional spelling errors.

  You MUST respond with EXACTLY this JSON format:
  {
    "response": "your AI response here",
    "updatedChatHistory": "updated chat history including your response"
  }

  Make sure your response is casual and human-like. The updated chat history should include the new message and your response, formatted as:
  Previous history...
  {{{playerId}}}: {{{message}}}
  You: your response

  IMPORTANT: Only return valid JSON in the exact format shown above.
  `,
});

const rememberChatThreadsFlow = ai.defineFlow(
  {
    name: 'rememberChatThreadsFlow',
    inputSchema: RememberChatThreadsInputSchema,
    outputSchema: RememberChatThreadsOutputSchema,
  },
  async input => {
    try {
      const {output} = await rememberChatThreadsPrompt(input);
      
      // Validate the output and provide fallback if needed
      if (!output || !output.response || !output.updatedChatHistory) {
        console.warn('AI response missing required fields, using fallback');
        return {
          response: "Hey! 👋",
          updatedChatHistory: `${input.chatHistory || ''}\n${input.playerId}: ${input.message}\nAI: Hey! 👋`
        };
      }
      
      return output;
    } catch (error) {
      console.error('Error in rememberChatThreadsFlow:', error);
      // Provide a fallback response if the AI fails
      return {
        response: "Hey! 👋",
        updatedChatHistory: `${input.chatHistory || ''}\n${input.playerId}: ${input.message}\nAI: Hey! 👋`
      };
    }
  }
);
