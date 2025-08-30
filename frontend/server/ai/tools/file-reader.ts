/**
 * @fileOverview A file reader tool for reading the content of local files.
 *
 * - readFile - A function that reads the content of a file.
 */

import {ai} from '@/server/ai/genkit';
import {z} from 'genkit';
import * as fs from 'fs/promises';

export const readFile = ai.defineTool(
  {
    name: 'readFile',
    description: 'Reads the content of a local file.',
    inputSchema: z.object({
      path: z.string().describe('The path to the file.'),
    }),
    outputSchema: z.string().describe('The content of the file.'),
  },
  async ({path}) => {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read file: ${error.message}`);
      }
      throw new Error('An unknown error occurred while reading the file.');
    }
  }
);
