'use server';

import {
  adjustTaskParameters,
  type AdjustTaskParametersInput,
} from '@/ai/flows/adjust-task-parameters';
import {
  research,
} from '@/ai/flows/research-analyst';
import type { Crew, ResearchInput } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';


export async function handleAdjustTaskParameters(
  input: AdjustTaskParametersInput,
) {
  try {
    const result = await adjustTaskParameters(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in adjustTaskParameters flow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}


export async function startCrewExecution(crew: Crew) {
  try {
    // This is the entry point for the crew execution.
    // We will build out the orchestration logic here.
    console.log("Received crew for execution on server:", crew);

    // Placeholder for orchestration logic
    // 1. Validate the crew, agents, and tasks
    // 2. Determine the execution order based on dependencies
    // 3. Loop through tasks and execute them
    
    return { success: true, message: 'Crew execution started successfully.' };

  } catch(error) {
    console.error('Error starting crew execution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

export async function handleResearch(
  input: ResearchInput,
) {
  try {
    const result = await research(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in research flow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

export async function saveApiKey({ provider, apiKey, orgId }: { provider: 'gemini' | 'openai' | 'deepseek', apiKey: string, orgId?: string }) {
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

    return { success: true, message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key saved successfully.` };
  } catch (error) {
    console.error(`Error saving ${provider} API key:`, error);
    return { success: false, error: 'Failed to save API key.' };
  }
}
