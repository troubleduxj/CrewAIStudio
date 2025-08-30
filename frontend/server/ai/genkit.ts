import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// 从环境变量读取API密钥
const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey }),
  ],
  model: 'gemini-1.5-flash-latest',
});
