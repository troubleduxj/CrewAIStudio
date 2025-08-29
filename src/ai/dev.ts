
'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/adjust-task-parameters.ts';
import '@/ai/flows/research-analyst.ts';
import '@/ai/flows/task-execution-flow.ts';
import '@/ai/tools/browser.ts';
import '@/ai/tools/calculator.ts';
import '@/ai/tools/file-reader.ts';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

genkit({
    plugins: [
        googleAI(),
    ],
    logSinks: ['local'],
    enableTracing: true
})
