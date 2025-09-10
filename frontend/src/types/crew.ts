/**
 * Crew 相关的类型定义
 */

export interface ToolConfig {
  toolId: string;
  toolName: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface AgentConfig {
  agentId: string;
  agentName?: string;
  llmModel: string;
  temperature: number;
  maxTokens: number;
  tools?: ToolConfig[];
  apiKeys?: Record<string, string>;
}

export type CrewStatus = 'READY' | 'RUNNING' | 'DISABLED';

export interface Crew {
  id: string;
  name: string;
  description: string;
  workflowTemplateId: string;
  workflowTemplateName: string;
  agentsConfig: AgentConfig[];
  status: CrewStatus;
  createdAt: string;
  updatedAt: string;
  lastExecutionAt?: string;
  successRate: number;
  totalExecutions: number;
  
  // 后端字段（临时兼容）
  workflow_template_id?: string;
  agents_config?: any[];
  execution_count?: number;
  success_count?: number;
  error_count?: number;
  current_execution_id?: string;
  execution_progress?: number;
  current_agent?: string;
  current_task?: string;
  total_tasks?: number;
  completed_tasks?: number;
  failed_tasks?: number;
  execution_time?: number;
  last_execution_at?: string;
  created_at?: string;
  updated_at?: string;
}

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

// API 请求类型
export interface CreateCrewRequest {
  name: string;
  description: string;
  workflowTemplateId: string;
  agentsConfig: AgentConfig[];
}

export interface UpdateCrewRequest {
  name?: string;
  description?: string;
  agentsConfig?: AgentConfig[];
  status?: CrewStatus;
}

// 组件 Props 类型
export interface CrewListProps {
  crews: Crew[];
  loading: boolean;
  onCreateCrew: () => void;
  onRunCrew: (crewId: string) => void;
  onEditCrew: (crewId: string) => void;
  onViewHistory: (crewId: string) => void;
}

export interface CrewCardProps {
  crew: Crew;
  onRun: (crewId: string) => void;
  onEdit: (crewId: string) => void;
  onViewHistory: (crewId: string) => void;
  showActions?: boolean;
}

export interface CrewWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (crew: CreateCrewRequest | UpdateCrewRequest) => void;
  initialData?: Partial<CreateCrewRequest>;
  mode?: 'create' | 'edit';
  loading?: boolean;
}

export interface ExecutionDialogProps {
  crew: Crew;
  open: boolean;
  onClose: () => void;
  onExecute: (input: ExecutionInput) => void;
}

export interface AgentConfigFormProps {
  agentDefinition: import('./workflow').AgentDefinition;
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
  availableLLMs: string[];
  availableTools: ToolConfig[];
}