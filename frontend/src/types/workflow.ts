/**
 * 工作流模板相关的类型定义
 */

export interface Position {
  x: number;
  y: number;
}

export interface Tool {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  position: Position;
  requiredTools: Tool[];
  temperature?: number;
  reasoning?: boolean;
  maxReasoningAttempts?: number;
  allowDelegation?: boolean;
  maxIterations?: number;
  maxRpm?: number;
  maxExecutionTime?: number;
}

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  expectedOutput: string;
  assignedAgentId: string | null; // Allow null for unassigned agents
  dependencies: string[];
  position: Position;
  asyncExecution?: boolean;
  markdownOutput?: boolean;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'task-dependency' | 'agent-assignment';
}

export interface WorkflowDefinition {
  agents: AgentDefinition[];
  tasks: TaskDefinition[];
  connections: Connection[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  definition: WorkflowDefinition;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

// API 请求类型
export interface CreateTemplateRequest {
  name: string;
  description: string;
  definition: WorkflowDefinition;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
}

// 组件 Props 类型
export interface TemplateListProps {
  templates: WorkflowTemplate[];
  loading: boolean;
  onCreateTemplate: () => void;
  onEditTemplate: (id: string) => void;
  onCloneTemplate: (id: string) => void;
  onCreateCrew: (templateId: string) => void;
}

export interface VisualEditorProps {
  template: WorkflowTemplate;
  onSave: (template: WorkflowTemplate) => void;
  onCancel: () => void;
}
