/**
 * 执行相关的类型定义
 */

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type ExecutionPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Execution {
  id: string;
  jobId: string;
  crewId: string;
  crewName: string;
  status: ExecutionStatus;
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  errorMessage?: string;
}

export interface ExecutionInput {
  variables: Record<string, any>;
  priority: ExecutionPriority;
  timeout?: number;
}

// 组件 Props 类型
export interface ExecutionDialogProps {
  crew: import('./crew').Crew;
  open: boolean;
  onClose: () => void;
  onExecute: (input: ExecutionInput) => void;
}

// 执行统计类型
export interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
}