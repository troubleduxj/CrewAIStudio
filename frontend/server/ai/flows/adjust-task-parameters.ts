'use server';

/**
 * @fileOverview Dynamically adjusts task parameters based on real-time feedback and agent performance.
 *
 * - adjustTaskParameters - A function that handles the task parameter adjustment process.
 * - AdjustTaskParametersInput - The input type for the adjustTaskParameters function.
 * - AdjustTaskParametersOutput - The return type for the adjustTaskParameters function.
 */

import {ai} from '@/server/ai/genkit';
import {z} from 'genkit';

const AdjustTaskParametersInputSchema = z.object({
  taskId: z.string().describe('The ID of the task to adjust.'),
  feedback: z.string().describe('Real-time feedback on the task performance.'),
  agentPerformance: z.string().describe('Agent performance metrics related to the task.'),
});
export type AdjustTaskParametersInput = z.infer<typeof AdjustTaskParametersInputSchema>;

const AdjustTaskParametersOutputSchema = z.object({
  adjustedParameters: z
    .record(z.any())
    .describe('A map of task parameters that have been adjusted.'),
  reasoning: z.string().describe('The AI reasoning behind the parameter adjustments.'),
});
export type AdjustTaskParametersOutput = z.infer<typeof AdjustTaskParametersOutputSchema>;

export async function adjustTaskParameters(input: AdjustTaskParametersInput): Promise<AdjustTaskParametersOutput> {
  return adjustTaskParametersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustTaskParametersPrompt',
  input: {schema: AdjustTaskParametersInputSchema},
  output: {schema: AdjustTaskParametersOutputSchema},
  prompt: `You are an AI task parameter optimization expert.

  Based on the real-time feedback and agent performance, you will dynamically adjust the task parameters to optimize the workflow.

  Task ID: {{{taskId}}}
  Feedback: {{{feedback}}}
  Agent Performance: {{{agentPerformance}}}

  Consider the task ID, feedback, and agent performance to determine which parameters need adjustment and by how much. Explain the reasoning behind the changes.

  Return a JSON object that contains a map of the adjusted parameters with their new values, and a reasoning field explaining the adjustments.
  `,
});

const adjustTaskParametersFlow = ai.defineFlow(
  {
    name: 'adjustTaskParametersFlow',
    inputSchema: AdjustTaskParametersInputSchema,
    outputSchema: AdjustTaskParametersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
