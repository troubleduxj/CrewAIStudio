
'use server';
/**
 * @fileOverview A generic flow for executing a single task with a given agent.
 *
 * - executeTask - A function that handles the task execution process.
 * - TaskExecutionInput - The input type for the executeTask function.
 * - TaskExecutionOutput - The return type for the executeTask function.
 */

import { ai } from '@/ai/genkit';
import {
  TaskExecutionInput,
  TaskExecutionInputSchema,
  TaskExecutionOutput,
  TaskExecutionOutputSchema,
} from '@/lib/types';

export async function executeTask(
  input: TaskExecutionInput
): Promise<TaskExecutionOutput> {
  return taskExecutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'taskExecutionPrompt',
  input: { schema: TaskExecutionInputSchema },
  output: { schema: TaskExecutionOutputSchema },
  prompt: `You are an AI agent. Here is your configuration:
Role: {{{agent.role}}}
Goal: {{{agent.goal}}}
Backstory: {{{agent.backstory}}}

You have been assigned a task. Here are the details:
Task Name: {{{task.name}}}
Instructions: {{{task.instructions}}}

Execute the task based on your configuration and the provided instructions. Provide only the final output or result of the task.
`,
});

const taskExecutionFlow = ai.defineFlow(
  {
    name: 'taskExecutionFlow',
    inputSchema: TaskExecutionInputSchema,
    outputSchema: TaskExecutionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
