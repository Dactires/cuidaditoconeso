'use server';

/**
 * @fileOverview This file defines a Genkit flow to calculate score changes
 * after a card is revealed in the Board Bombers game.
 *
 * - calculateScoreChanges - Calculates the score changes after revealing a card.
 * - CalculateScoreChangesInput - Input type for the calculateScoreChanges function.
 * - CalculateScoreChangesOutput - Output type for the calculateScoreChanges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateScoreChangesInputSchema = z.object({
  playerId: z.number().describe('The ID of the player whose score needs to be calculated.'),
  board: z.array(z.array(z.object({
    type: z.string(),
    color: z.string().nullable(),
    value: z.number().nullable(),
    is_face_up: z.boolean()
  }).nullable())).describe('The current state of the player\'s board.'),
});
export type CalculateScoreChangesInput = z.infer<typeof CalculateScoreChangesInputSchema>;

const CalculateScoreChangesOutputSchema = z.object({
  scoreChange: z.number().describe('The change in score after revealing the card.'),
  explanation: z.string().describe('The explanation for the score change, including card values and bomb explosions.'),
});
export type CalculateScoreChangesOutput = z.infer<typeof CalculateScoreChangesOutputSchema>;

export async function calculateScoreChanges(input: CalculateScoreChangesInput): Promise<CalculateScoreChangesOutput> {
  return calculateScoreChangesFlow(input);
}

const calculateScoreChangesPrompt = ai.definePrompt({
  name: 'calculateScoreChangesPrompt',
  input: {schema: CalculateScoreChangesInputSchema},
  output: {schema: CalculateScoreChangesOutputSchema},
  prompt: `You are an expert game analyst for the board game \"Cuidadito Con Eso\" (aka Board Bombers).

  Given the player's board state, determine the change in their score after revealing a card.
  Consider the values of revealed character cards and the effects of any bomb explosions.
  Explain the score change in detail, including which cards contributed to the score and how bomb explosions affected the score.

  Board State:
  {{#each board}}
    {{#each this}}
      {{#if this}}
        [{{this.type}} {{this.color}} {{this.value}} FaceUp: {{this.is_face_up}}] 
      {{else}}
        [EMPTY]
      {{/if}}
    {{/each}}
  {{/each}}

  Player ID: {{playerId}}
  
  Provide the scoreChange (integer) and explanation (string) in the output.
  `,
});

const calculateScoreChangesFlow = ai.defineFlow(
  {
    name: 'calculateScoreChangesFlow',
    inputSchema: CalculateScoreChangesInputSchema,
    outputSchema: CalculateScoreChangesOutputSchema,
  },
  async input => {
    const {output} = await calculateScoreChangesPrompt(input);
    return output!;
  }
);
