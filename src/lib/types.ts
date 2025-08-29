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
