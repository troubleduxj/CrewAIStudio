'use server';
/**
 * @fileOverview A research analyst agent that can browse the web, read files, and perform calculations.
 *
 * - research - A function that initiates the research process.
 */

import { ai } from '@/server/ai/genkit';
import { browse } from '../tools/browser';
import { calculate } from '../tools/calculator';
import { readFile } from '../tools/file-reader';
import { ResearchInput, ResearchInputSchema, ResearchOutput, ResearchOutputSchema } from '@/lib/types';

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
