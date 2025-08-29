import { config } from 'dotenv';
config();

import '@/ai/flows/adjust-task-parameters.ts';
import '@/ai/flows/research-analyst.ts';
import '@/ai/tools/browser.ts';
import '@/ai/tools/calculator.ts';
import '@/ai/tools/file-reader.ts';
