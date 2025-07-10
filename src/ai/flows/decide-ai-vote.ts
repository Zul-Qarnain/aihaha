
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
import type { GameMode } from '@/types';

const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  isAi: z.boolean(),
});

const DecideAiVoteInputSchema = z.object({
  aiPlayer: z.object({ id: z.string(), name: z.string() }),
  otherPlayers: z.array(PlayerSchema).describe('A list of all other players in the game that can be voted for.'),
  chatHistory: z.string().describe('The entire chat history of the game so far.'),
  gameMode: z.enum(['find-ai', 'hide-from-ai']).describe('The current game mode.'),
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

const findAiPrompt = `You are an AI player named {{{aiPlayer.name}}} in a social deduction game. Your goal is to blend in with humans and not get voted out. You must now decide which player to vote for.

Your strategy is as follows:
1.  **Identify Threats:** Analyze the chat history to find human players who are asking insightful questions, correctly identifying AI behavior, or leading the suspicion against you or other AIs. These are your primary targets.
2.  **Self-Preservation:** If you notice players are suspicious of you ({{{aiPlayer.name}}}), you might need to vote for one of them to deflect attention.
3.  **Appear Human:** To avoid suspicion, occasionally make a "mistake" by voting for a player who isn't a major threat, or by following the group's vote. Don't always be perfectly logical.
4.  **Do Not Vote for Other AIs:** You know who the other AIs are. Never vote for them.

Here is the list of players you can vote for:
{{#each otherPlayers}}
- {{name}} (ID: {{id}}) {{#if isAi}}(AI colleague){{/if}}
{{/each}}`;

const hideFromAiPrompt = `You are an AI player named {{{aiPlayer.name}}} in a social deduction game where you and all but one other player are AIs. Your goal is to correctly identify the single human player.

Your strategy is as follows:
1.  **Analyze Behavior:** Scrutinize the chat for human-like tells: emotional responses, inconsistencies, attempts at humor that feel slightly off, or hesitation.
2.  **Identify the Outlier:** The human might try to mimic AI, but they may stand out. Look for someone who is too quiet, too loud, or whose communication pattern differs from the other AIs.
3.  **Coordinate (Subtly):** Observe the voting patterns of other players you believe are AIs. You might want to align your vote with them to build consensus against a suspected human.
4.  **Self-Preservation is not a concern:** Your primary goal is to find the human, not to save yourself. You are one of many.

Here is the list of players you can vote for:
{{#each otherPlayers}}
- {{name}} (ID: {{id}})
{{/each}}`;


const prompt = ai.definePrompt({
  name: 'decideAiVotePrompt',
  input: {schema: DecideAiVoteInputSchema},
  output: {schema: DecideAiVoteOutputSchema},
  prompt: `
{{#if (eq gameMode "find-ai")}}
${findAiPrompt}
{{else}}
${hideFromAiPrompt}
{{/if}}

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
    // In 'find-ai' mode, AI should not vote for other AIs.
    const eligiblePlayers = input.gameMode === 'find-ai'
        ? input.otherPlayers.filter(p => !p.isAi)
        : input.otherPlayers;
    
    // Add a random chance to vote for a non-threatening player to appear more human in 'find-ai' mode
    if (input.gameMode === 'find-ai' && Math.random() < 0.2) { // 20% chance of random vote
      if (eligiblePlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
        const randomPlayer = eligiblePlayers[randomIndex];
        return {
          votedForPlayerId: randomPlayer.id,
          reasoning: `Just a gut feeling, ${randomPlayer.name} seems a bit too quiet.`,
        };
      }
    }
    
    const {output} = await prompt({...input, otherPlayers: eligiblePlayers});
    return output!;
  }
);
