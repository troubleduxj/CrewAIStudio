'use server';

/**
 * @fileOverview A calculator tool for performing mathematical calculations.
 *
 * - calculate - A function that evaluates a mathematical expression.
 */

import {ai} from '@/ai/genkit';
import {evaluate} from 'mathjs';
import {z} from 'genkit';

export const calculate = ai.defineTool(
  {
    name: 'calculate',
    description: 'Performs mathematical calculations.',
    inputSchema: z.object({
      expression: z.string().describe('The mathematical expression to evaluate.'),
    }),
    outputSchema: z.number().describe('The result of the calculation.'),
  },
  async ({expression}) => {
    try {
      return evaluate(expression);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Calculation failed: ${error.message}`);
      }
      throw new Error('An unknown error occurred during calculation.');
    }
  }
);
