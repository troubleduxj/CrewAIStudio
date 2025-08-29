
import { executeTask } from '@/app/actions';
import type { Crew, ExecutionEvent } from '@/lib/types';

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

  let taskOutputs: { [taskId: string]: string } = {};

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

    // Check dependencies
    let hydratedInstructions = task.instructions;
    if (task.dependencies && task.dependencies.length > 0) {
      let allDependenciesMet = true;
      let context = '';
      for (const depId of task.dependencies) {
        if (!taskOutputs[depId]) {
          allDependenciesMet = false;
          break;
        }
        context += `\n\nContext from task "${depId}":\n${taskOutputs[depId]}`;
      }

      if (!allDependenciesMet) {
        const errorDetails = `Task "${task.name}" skipped because its dependencies are not met.`;
        onEvent({
          type: 'error',
          timestamp: new Date().toLocaleTimeString(),
          event: 'Task Skipped',
          details: errorDetails,
        });
        continue;
      }

      hydratedInstructions += context;
    }

    onEvent({
      type: 'task',
      timestamp: new Date().toLocaleTimeString(),
      event: 'Task Started',
      details: `Agent: ${agent.role}, Task: ${task.name}`,
    });

    try {
      const result = await executeTask({
        agent,
        task: { ...task, instructions: hydratedInstructions },
      });
      taskOutputs[task.id] = result.output;

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
        details: result.output,
      });
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
