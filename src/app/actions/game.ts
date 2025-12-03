'use server';

import { calculateScoreChanges, type CalculateScoreChangesInput, type CalculateScoreChangesOutput } from "@/ai/flows/calculate-score-changes";

/**
 * Server action to get an explanation for a score change from the AI model.
 * @param input - The player ID and their current board state.
 * @returns The score change and an explanation.
 */
export async function getScoreChangeExplanation(input: CalculateScoreChangesInput): Promise<CalculateScoreChangesOutput> {
  try {
    const output = await calculateScoreChanges(input);
    return output;
  } catch (error) {
    console.error("Error calling calculateScoreChanges flow:", error);
    // Return a default or error state if the AI call fails
    return {
      scoreChange: 0,
      explanation: "Could not analyze the score change at this time.",
    };
  }
}
