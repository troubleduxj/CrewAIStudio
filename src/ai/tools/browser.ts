'use server';

/**
 * @fileOverview A browser tool that allows an agent to read the content of a webpage.
 *
 * - browse - A function that fetches the content of a URL.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {JSDOM} from 'jsdom';

export const browse = ai.defineTool(
  {
    name: 'browse',
    description: 'Fetches the content of a URL.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch.'),
    }),
    outputSchema: z.string().describe('The text content of the page.'),
  },
  async ({url}) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();
    const dom = new JSDOM(html);
    const reader = new dom.window.DOMParser();
    const doc = reader.parseFromString(dom.window.document.body.innerHTML, 'text/html');
    return doc.body.textContent || '';
  }
);
