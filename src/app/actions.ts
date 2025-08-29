
'use server';

import {
  adjustTaskParameters,
  type AdjustTaskParametersInput,
} from '@/ai/flows/adjust-task-parameters';
import { research } from '@/ai/flows/research-analyst';
import { executeTask } from '@/ai/flows/task-execution-flow';
import type { ResearchInput } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export async function getApiKeys() {
  const envFilePath = path.join(process.cwd(), '.env.local');
  try {
    const envFileContent = await fs.readFile(envFilePath, 'utf-8');
    const envConfig: Record<string, string> = {};
    envFileContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split(/=(.*)/s);
        if (key) {
          envConfig[key.trim()] = value?.trim() || '';
        }
      }
    });

    return {
      success: true,
      keys: {
        gemini: envConfig['GOOGLE_GENAI_API_KEY'] || '',
        openai: envConfig['OPENAI_API_KEY'] || '',
        openaiOrgId: envConfig['OPENAI_ORG_ID'] || '',
        deepseek: envConfig['DEEPSEEK_API_KEY'] || '',
      },
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // .env.local file doesn't exist, return empty keys
      return {
        success: true,
        keys: { gemini: '', openai: '', openaiOrgId: '', deepseek: '' },
      };
    }
    console.error('Error reading API keys:', error);
    return { success: false, error: 'Failed to read API keys.' };
  }
}

export async function saveApiKey({
  provider,
  apiKey,
  orgId,
}: {
  provider: 'gemini' | 'openai' | 'deepseek';
  apiKey: string;
  orgId?: string;
}) {
  const envFileName = '.env.local';
  const envFilePath = path.join(process.cwd(), envFileName);

  try {
    let envFileContent = '';
    try {
      envFileContent = await fs.readFile(envFilePath, 'utf-8');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, will be created.
    }

    const envConfig: Record<string, string> = {};
    envFileContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split(/=(.*)/s);
        if (key) {
          envConfig[key.trim()] = value?.trim() || '';
        }
      }
    });

    // Update keys for the specific provider
    if (provider === 'gemini') {
      if (apiKey) envConfig['GOOGLE_GENAI_API_KEY'] = apiKey;
      else delete envConfig['GOOGLE_GENAI_API_KEY'];
    } else if (provider === 'openai') {
      if (apiKey) envConfig['OPENAI_API_KEY'] = apiKey;
      else delete envConfig['OPENAI_API_KEY'];

      if (orgId) envConfig['OPENAI_ORG_ID'] = orgId;
      else delete envConfig['OPENAI_ORG_ID'];
    } else if (provider === 'deepseek') {
      if (apiKey) envConfig['DEEPSEEK_API_KEY'] = apiKey;
      else delete envConfig['DEEPSEEK_API_KEY'];
    }

    const newEnvFileContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await fs.writeFile(envFilePath, newEnvFileContent);

    // Create the file if it doesn't exist for the message
    try {
      await fs.access(envFilePath);
    } catch (error) {
      await fs.writeFile(envFilePath, newEnvFileContent);
    }

    return {
      success: true,
      message: `${
        provider.charAt(0).toUpperCase() + provider.slice(1)
      } API Key saved successfully.`,
    };
  } catch (error) {
    console.error(`Error saving ${provider} API key:`, error);
    return { success: false, error: 'Failed to save API key.' };
  }
}

export async function testApiKey({
    provider,
    apiKey,
    orgId,
  }: {
    provider: 'gemini' | 'openai' | 'deepseek';
    apiKey: string;
    orgId?: string;
  }) {

    try {
        if (provider === 'gemini') {
            const testAi = genkit({ plugins: [googleAI({ apiKey })] });
            await testAi.listModels();
            return { success: true, message: 'API key is valid and connection is successful.' };
        } else if (provider === 'openai') {
            return { success: false, error: 'Testing for OpenAI is not supported at this time.' };
        } else if (provider === 'deepseek') {
             const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1,
                }),
            });

            if (response.ok) {
                 return { success: true, message: 'API key is valid and connection is successful.' };
            } else {
                const errorData = await response.json();
                return { success: false, error: `Connection failed: ${errorData.error.message}` };
            }
        } else {
            return { success: false, error: 'Unsupported provider.' };
        }
    } catch (e) {
        const error = e as GenkitError | Error;
        let errorMessage = error.message || 'An unknown error occurred.';
        if ('cause' in error && error.cause) {
            const cause = error.cause as any;
            errorMessage = cause.message || errorMessage;
        }
        
        return { success: false, error: `Connection failed: ${errorMessage}` };
    }
}

export async function handleAdjustTaskParameters(
  input: AdjustTaskParametersInput
) {
  try {
    const result = await adjustTaskParameters(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in adjustTaskParameters flow:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

export async function handleResearch(input: ResearchInput) {
  try {
    const result = await research(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in research flow:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

// Export the server-side task execution function
export { executeTask };
