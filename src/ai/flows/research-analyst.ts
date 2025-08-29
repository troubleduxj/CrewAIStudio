'use server';
/**
 * @fileOverview A research analyst agent that can browse the web, read files, and perform calculations.
 *
 * - research - A function that initiates the research process.
 * - ResearchInput - The input type for the research function.
 * - ResearchOutput - The return type for the research function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { browse } from '../tools/browser';
import { calculate } from '../tools/calculator';
import { readFile } from '../tools/file-reader';

export const ResearchInputSchema = z.object({
  topic: z.string().describe('The research topic.'),
});
export type ResearchInput = z.infer<typeof ResearchInputSchema>;

export const ResearchOutputSchema = z.object({
  result: z
    .string()
    .describe('The final result of the research, formatted as a markdown string.'),
});
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

export async function research(input: ResearchInput): Promise<ResearchOutput> {
  return researchFlow(input);
}

const researchFlow = ai.defineFlow(
  {
    name: 'researchFlow',
    inputSchema: ResearchInputSchema,
    outputSchema: ResearchOutputSchema,
  },
  async ({ topic }) => {
    const researchPrompt = ai.definePrompt({
      name: 'researchPrompt',
      tools: [browse, readFile, calculate],
      prompt: `You are a helpful research analyst. Your goal is to provide a detailed and accurate answer to the user's topic.

      Topic: ${topic}
      
      Use the available tools to find, read, and analyze information. Synthesize the information into a comprehensive answer.
      
      Provide the final answer as a markdown string.
      `,
    });

    const { output } = await researchPrompt();
    return output!;
  }
);
