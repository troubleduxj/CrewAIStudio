'use server';

import {
  adjustTaskParameters,
  type AdjustTaskParametersInput,
} from '@/ai/flows/adjust-task-parameters';
import {
  research,
} from '@/ai/flows/research-analyst';
import type { Crew, ResearchInput } from '@/lib/types';


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
