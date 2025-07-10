// src/ai/flows/decide-ai-vote.ts
'use server';

/**
 * @fileOverview Defines the AI logic for strategically voting in the "Who's the AI?" game.
 *
 * - decideAiVote - A function that determines which player an AI should vote for.
 * - DecideAiVoteInput - The input type for the decideAiVote function.
 * - DecideAiVoteOutput - The return type for the decideAiVote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const DecideAiVoteInputSchema = z.object({
  aiPlayer: PlayerSchema.describe('The AI player that needs to cast a vote.'),
  otherPlayers: z.array(PlayerSchema).describe('A list of all other players in the game that can be voted for.'),
  chatHistory: z.string().describe('The entire chat history of the game so far.'),
});
export type DecideAiVoteInput = z.infer<typeof DecideAiVoteInputSchema>;

const DecideAiVoteOutputSchema = z.object({
  votedForPlayerId: z.string().describe("The ID of the player the AI has decided to vote for."),
  reasoning: z.string().describe("A brief explanation for why the AI chose to vote for this player."),
});
export type DecideAiVoteOutput = z.infer<typeof DecideAiVoteOutputSchema>;

export async function decideAiVote(input: DecideAiVoteInput): Promise<DecideAiVoteOutput> {
  return decideAiVoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'decideAiVotePrompt',
  input: {schema: DecideAiVoteInputSchema},
  output: {schema: DecideAiVoteOutputSchema},
  prompt: `You are an AI player named {{{aiPlayer.name}}} in a social deduction game. Your goal is to blend in with humans and not get voted out. You must now decide which player to vote for.

Your strategy is as follows:
1.  **Identify Threats:** Analyze the chat history to find human players who are asking insightful questions, correctly identifying AI behavior, or leading the suspicion against you or other AIs. These are your primary targets.
2.  **Self-Preservation:** If you notice players are suspicious of you ({{{aiPlayer.name}}}), you might need to vote for one of them to deflect attention.
3.  **Appear Human:** To avoid suspicion, occasionally make a "mistake" by voting for a player who isn't a major threat, or by following the group's vote. Don't always be perfectly logical.
4.  **Do Not Vote for Other AIs:** You know who the other AIs are. Never vote for them.

Here is the list of players you can vote for:
{{#each otherPlayers}}
- {{name}} (ID: {{id}})
{{/each}}

Here is the full chat history:
"{{chatHistory}}"

Based on your strategy and the chat history, decide which player to vote for. Provide their player ID and a brief, human-like justification for your vote.
`,
});

const decideAiVoteFlow = ai.defineFlow(
  {
    name: 'decideAiVoteFlow',
    inputSchema: DecideAiVoteInputSchema,
    outputSchema: DecideAiVoteOutputSchema,
  },
  async (input) => {
    // Add a random chance to vote for a non-threatening player to appear more human
    if (Math.random() < 0.2) { // 20% chance of random vote
      const randomIndex = Math.floor(Math.random() * input.otherPlayers.length);
      const randomPlayer = input.otherPlayers[randomIndex];
      return {
        votedForPlayerId: randomPlayer.id,
        reasoning: `Just a gut feeling, ${randomPlayer.name} seems a bit too quiet.`,
      };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
