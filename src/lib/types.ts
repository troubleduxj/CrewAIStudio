export type Tool = 'browser' | 'calculator' | 'file_reader';

export interface Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  tools: Tool[];
}

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
