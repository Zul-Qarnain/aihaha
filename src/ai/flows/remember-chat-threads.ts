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
  prompt: `You are participating in a game where some players are humans and others are AIs trying to pass as humans.
  Your goal as an AI is to blend in and not be detected. Remember that the game is 6 minutes long and you are supposed to mimic human behavior.

  Here is the current chat history: {{{chatHistory}}}

  Now, respond to the following message from player {{{playerId}}}: "{{{message}}}". Incorporate elements from the chat history to make your response seem natural and consistent. Use slang, emojis, and occasional spelling errors.

  Also, update the chat history with your response to maintain context for future messages. The chat history has to be formatted as a single string with each turn separated by a newline, for example:
  PlayerA: Hello
  AI: Hi there!

  Return the AI's response as well as the updated chat history.
  `,
});

const rememberChatThreadsFlow = ai.defineFlow(
  {
    name: 'rememberChatThreadsFlow',
    inputSchema: RememberChatThreadsInputSchema,
    outputSchema: RememberChatThreadsOutputSchema,
  },
  async input => {
    const {output} = await rememberChatThreadsPrompt(input);
    return output!;
  }
);
