'use server';

import {
  adjustTaskParameters,
  type AdjustTaskParametersInput,
} from '@/ai/flows/adjust-task-parameters';

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
