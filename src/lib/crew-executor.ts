import { executeTask } from '@/app/actions';
import type { Crew, ExecutionEvent, Task } from '@/lib/types';
import crypto from 'crypto';

function generateCacheKey(task: Task, context: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(task.instructions + context);
  return hash.digest('hex');
}

// This is a client-side utility that orchestrates server actions.
// This allows us to stream events back to the UI.
export async function startCrewExecution(
  crew: Crew,
  onEvent: (event: ExecutionEvent) => void
) {
  onEvent({
    type: 'info',
    timestamp: new Date().toLocaleTimeString(),
    event: 'Workflow Started',
    details: 'Crew execution initialized.',
  });

  const taskOutputs: { [taskId: string]: string } = {};
  const cache: { [key: string]: string } = {};
  let overallContextHistory = '';

  for (const task of crew.tasks) {
    const agent = crew.agents.find(a => a.id === task.agentId);
    if (!agent) {
      const errorDetails = `Agent with ID ${task.agentId} not found for task ${task.id}`;
      onEvent({
        type: 'error',
        timestamp: new Date().toLocaleTimeString(),
        event: 'Error',
        details: errorDetails,
      });
      throw new Error(errorDetails);
    }

    let context = '';
    // Memory: If agent has memory, use the full history. Otherwise, use only direct dependencies.
    if (agent.memory) {
      context = overallContextHistory;
    } else if (task.dependencies && task.dependencies.length > 0) {
      let depContext = '';
      for (const depId of task.dependencies) {
        if (taskOutputs[depId]) {
          depContext += `\n\nContext from task "${depId}":\n${taskOutputs[depId]}`;
        }
      }
      context = depContext;
    }

    // Check dependencies are met before proceeding
    if (task.dependencies && task.dependencies.length > 0) {
      const dependenciesMet = task.dependencies.every(depId => taskOutputs[depId]);
      if (!dependenciesMet) {
        const errorDetails = `Task "${task.name}" skipped because its dependencies are not met.`;
        onEvent({
          type: 'error',
          timestamp: new Date().toLocaleTimeString(),
          event: 'Task Skipped',
          details: errorDetails,
        });
        continue; // Skip this task
      }
    }
    
    const hydratedInstructions = task.instructions + context;

    // Cache: Check if result for this task exists
    const cacheKey = generateCacheKey(task, context);
    if (task.cache && cache[cacheKey]) {
      const cachedOutput = cache[cacheKey];
      taskOutputs[task.id] = cachedOutput;
      overallContextHistory += `\n\nContext from task "${task.name}":\n${cachedOutput}`;
      
      if (task.verbose) {
        onEvent({
          type: 'info',
          timestamp: new Date().toLocaleTimeString(),
          event: 'Task Result from Cache',
          details: `Task: ${task.name}, Output: ${cachedOutput.substring(0,100)}...`,
        });
      }
      continue; // Move to the next task
    }

    if (task.verbose) {
      onEvent({
        type: 'task',
        timestamp: new Date().toLocaleTimeString(),
        event: 'Task Started',
        details: `Agent: ${agent.role}, Task: ${task.name}`,
      });
    }


    try {
      const result = await executeTask({
        agent,
        task: { ...task, instructions: hydratedInstructions },
      });
      const taskOutput = result.output;
      taskOutputs[task.id] = taskOutput;
      overallContextHistory += `\n\nContext from task "${task.name}":\n${taskOutput}`;
      
      // Cache: Store the result
      if (task.cache) {
        cache[cacheKey] = taskOutput;
      }

      if (task.verbose) {
        onEvent({
          type: 'task',
          timestamp: new Date().toLocaleTimeString(),
          event: 'Task Completed',
          details: `Agent: ${agent.role}, Task: ${task.name}`,
        });

        onEvent({
          type: 'tool', // Simulating tool output as a separate event
          timestamp: new Date().toLocaleTimeString(),
          event: 'Task Output',
          details: taskOutput,
        });
      }
    } catch (error) {
      const errorDetails = `Task "${
        task.name
      }" failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      onEvent({
        type: 'error',
        timestamp: new Date().toLocaleTimeString(),
        event: 'Task Error',
        details: errorDetails,
      });
      throw new Error(errorDetails); // Stop the entire workflow on task failure
    }
  }
  onEvent({
    type: 'info',
    timestamp: new Date().toLocaleTimeString(),
    event: 'Workflow Finished',
    details: 'All tasks have been processed.',
  });
}
