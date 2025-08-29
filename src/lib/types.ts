import { z } from 'zod';

export type Tool = 'browser' | 'calculator' | 'file_reader';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface Task {
  id: string;
  agentId: string;
  name: string;
  instructions: string;
  dependencies: string[];
  status: TaskStatus;
  progress: number;
  startTime?: number;
  endTime?: number;
  logs: string[];
}

export interface Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  tools: Tool[];
}

export type NodeType = 'agent' | 'task';

export interface Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Agent | Task;
}

export interface Crew {
  agents: Agent[];
  tasks: Task[];
}

export const ResearchInputSchema = z.object({
  topic: z.string().describe('The research topic.'),
});
export type ResearchInput = z.infer<typeof ResearchInputSchema>;

export const ResearchOutputSchema = z.object({
  result: z
    .string()
    .describe('The final result of the research, formatted as a markdown string.'),
});
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

export interface TaskExecutionResult {
    taskId: string;
    output: string;
    // You can add more fields here, e.g., logs, tool_usage
}

// Schemas for Task Execution Flow
export const AgentSchema = z.object({
  id: z.string(),
  role: z.string(),
  goal: z.string(),
  backstory: z.string(),
  tools: z.array(z.custom<Tool>()),
});

export const TaskSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  name: z.string(),
  instructions: z.string(),
  dependencies: z.array(z.string()),
  status: z.custom<TaskStatus>(),
  progress: z.number(),
});

export const TaskExecutionInputSchema = z.object({
  agent: AgentSchema,
  task: TaskSchema,
});
export type TaskExecutionInput = z.infer<typeof TaskExecutionInputSchema>;

export const TaskExecutionOutputSchema = z.object({
  output: z.string().describe('The result or output of the task execution.'),
});
export type TaskExecutionOutput = z.infer<typeof TaskExecutionOutputSchema>;


export interface ExecutionEvent {
    type: 'info' | 'task' | 'tool' | 'error';
    timestamp: string;
    event: string;
    details: string;
}
