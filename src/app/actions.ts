
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
// The openai and deepseek imports are removed as the packages are not available.

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

    let testAi;
    try {
        if (provider === 'gemini') {
            testAi = genkit({ plugins: [googleAI({ apiKey })] });
        } else if (provider === 'openai') {
            // Cannot test OpenAI without the plugin
            return { success: false, error: 'Testing for OpenAI is not supported at this time.' };
        } else if (provider === 'deepseek') {
            // Cannot test Deepseek without the plugin
            return { success: false, error: 'Testing for Deepseek is not supported at this time.' };
        } else {
            return { success: false, error: 'Unsupported provider.' };
        }
    
        // A simple operation to test the key, like listing models.
        await testAi.listModels();
        return { success: true, message: 'API key is valid and connection is successful.' };

    } catch (e) {
        const error = e as GenkitError;
        let errorMessage = error.message || 'An unknown error occurred.';
        if (error.cause) {
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
