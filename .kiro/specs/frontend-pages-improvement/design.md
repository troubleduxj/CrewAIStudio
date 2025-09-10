# 前端页面改进设计文档

## 概述

本设计文档详细描述了 CrewAI Studio 前端应用中 Crew 页面和工作流模板页面的改进方案。基于需求文档中定义的 6 个核心需求，我们将重新设计这两个关键页面的架构、组件结构和用户交互流程。

## 架构设计

### 整体架构

```
Frontend Architecture (Updated)
├── Pages Layer
│   ├── /workflow-templates (重构)
│   │   ├── index.tsx (模板列表页)
│   │   ├── [id]/edit.tsx (模板编辑器)
│   │   └── create.tsx (新建模板)
│   └── /crews (新增)
│       ├── index.tsx (Crew 列表页)
│       ├── [id]/detail.tsx (Crew 详情页)
│       └── create.tsx (Crew 创建向导)
├── Components Layer
│   ├── workflow-templates/
│   │   ├── TemplateCard.tsx
│   │   ├── TemplateList.tsx
│   │   ├── VisualEditor.tsx
│   │   └── NodeEditor.tsx
│   ├── crews/
│   │   ├── CrewCard.tsx
│   │   ├── CrewList.tsx
│   │   ├── CrewWizard.tsx
│   │   ├── AgentConfigForm.tsx
│   │   └── ExecutionDialog.tsx
│   └── shared/
│       ├── ResponsiveLayout.tsx
│       ├── LoadingStates.tsx
│       └── StatusIndicator.tsx
├── Services Layer
│   ├── workflowTemplateService.ts
│   ├── crewService.ts
│   └── executionService.ts
└── State Management
    ├── stores/
    │   ├── workflowTemplateStore.ts
    │   ├── crewStore.ts
    │   └── uiStore.ts
    └── hooks/
        ├── useWorkflowTemplates.ts
        ├── useCrews.ts
        └── useExecution.ts
```

## 组件设计

### 1. 工作流模板页面组件

#### 1.1 TemplateList 组件

**职责**: 展示所有工作流模板的列表视图

**接口设计**:
```typescript
interface TemplateListProps {
  templates: WorkflowTemplate[];
  loading: boolean;
  onCreateTemplate: () => void;
  onEditTemplate: (id: string) => void;
  onCloneTemplate: (id: string) => void;
  onCreateCrew: (templateId: string) => void;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  definition: {
    agents: AgentDefinition[];
    tasks: TaskDefinition[];
    connections: Connection[];
  };
  createdAt: string;
  updatedAt: string;
  usageCount: number; // 被用于创建 Crew 的次数
}
```

**UI 布局**:
- 响应式网格布局 (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- 每个模板使用 Card 组件展示
- 支持搜索和筛选功能
- 空状态友好提示

#### 1.2 VisualEditor 组件

**职责**: 提供可视化的工作流编辑器

**技术实现**:
- 基于 React Flow 构建
- 支持拖拽创建 Agent 和 Task 节点
- 节点间连线表示依赖关系
- 侧边栏提供节点库和属性编辑

**接口设计**:
```typescript
interface VisualEditorProps {
  template: WorkflowTemplate;
  onSave: (template: WorkflowTemplate) => void;
  onCancel: () => void;
}

interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  position: { x: number; y: number };
}

interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  expectedOutput: string;
  assignedAgentId: string;
  dependencies: string[];
  position: { x: number; y: number };
}
```

### 2. Crew 管理页面组件

#### 2.1 CrewList 组件

**职责**: 展示所有 Crew 实例的管理界面

**接口设计**:
```typescript
interface CrewListProps {
  crews: Crew[];
  loading: boolean;
  onCreateCrew: () => void;
  onRunCrew: (crewId: string) => void;
  onEditCrew: (crewId: string) => void;
  onViewHistory: (crewId: string) => void;
}

interface Crew {
  id: string;
  name: string;
  description: string;
  workflowTemplateId: string;
  workflowTemplateName: string;
  agentsConfig: AgentConfig[];
  status: 'READY' | 'RUNNING' | 'DISABLED';
  lastExecutionAt?: string;
  successRate: number;
  totalExecutions: number;
}

interface AgentConfig {
  agentId: string;
  llmModel: string;
  temperature: number;
  maxTokens: number;
  tools: ToolConfig[];
  apiKeys: Record<string, string>;
}
```

#### 2.2 CrewWizard 组件

**职责**: 分步引导用户创建新的 Crew

**步骤设计**:
1. **选择模板**: 从可用的工作流模板中选择
2. **配置团队**: 为每个 Agent 配置 LLM 和工具
3. **命名保存**: 为 Crew 命名并保存配置

**接口设计**:
```typescript
interface CrewWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (crew: CreateCrewRequest) => void;
}

interface CreateCrewRequest {
  name: string;
  description: string;
  workflowTemplateId: string;
  agentsConfig: AgentConfig[];
}
```

#### 2.3 ExecutionDialog 组件

**职责**: 收集执行参数并启动 Crew 执行

**接口设计**:
```typescript
interface ExecutionDialogProps {
  crew: Crew;
  open: boolean;
  onClose: () => void;
  onExecute: (input: ExecutionInput) => void;
}

interface ExecutionInput {
  variables: Record<string, any>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  timeout?: number;
}
```

## 数据流设计

### 状态管理架构

使用 Zustand 进行全局状态管理，结合 React Query 处理服务器状态：

```typescript
// workflowTemplateStore.ts
interface WorkflowTemplateStore {
  templates: WorkflowTemplate[];
  currentTemplate: WorkflowTemplate | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchTemplates: () => Promise<void>;
  createTemplate: (template: CreateTemplateRequest) => Promise<void>;
  updateTemplate: (id: string, template: UpdateTemplateRequest) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setCurrentTemplate: (template: WorkflowTemplate | null) => void;
}

// crewStore.ts
interface CrewStore {
  crews: Crew[];
  currentCrew: Crew | null;
  executions: Execution[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCrews: () => Promise<void>;
  createCrew: (crew: CreateCrewRequest) => Promise<void>;
  updateCrew: (id: string, crew: UpdateCrewRequest) => Promise<void>;
  deleteCrew: (id: string) => Promise<void>;
  executeCrew: (crewId: string, input: ExecutionInput) => Promise<string>; // 返回 job_id
  fetchExecutions: (crewId?: string) => Promise<void>;
}
```

### API 服务层

```typescript
// workflowTemplateService.ts
export class WorkflowTemplateService {
  async getTemplates(): Promise<WorkflowTemplate[]> {
    const response = await api.get('/api/v1/workflow-templates');
    return response.data.data;
  }
  
  async createTemplate(template: CreateTemplateRequest): Promise<WorkflowTemplate> {
    const response = await api.post('/api/v1/workflow-templates', template);
    return response.data.data;
  }
  
  async updateTemplate(id: string, template: UpdateTemplateRequest): Promise<WorkflowTemplate> {
    const response = await api.put(`/api/v1/workflow-templates/${id}`, template);
    return response.data.data;
  }
}

// crewService.ts
export class CrewService {
  async getCrews(): Promise<Crew[]> {
    const response = await api.get('/api/v1/crews');
    return response.data.data;
  }
  
  async createCrew(crew: CreateCrewRequest): Promise<Crew> {
    const response = await api.post('/api/v1/crews', crew);
    return response.data.data;
  }
  
  async executeCrew(crewId: string, input: ExecutionInput): Promise<string> {
    const response = await api.post(`/api/v1/crews/${crewId}/execute`, input);
    return response.data.data.jobId;
  }
}

// executionService.ts
export class ExecutionService {
  async getExecutionStatus(jobId: string): Promise<Execution> {
    const response = await api.get(`/api/v1/executions/${jobId}`);
    return response.data.data;
  }
  
  async pollExecutionStatus(jobId: string, onUpdate: (execution: Execution) => void): Promise<void> {
    const poll = async () => {
      try {
        const execution = await this.getExecutionStatus(jobId);
        onUpdate(execution);
        
        if (execution.status === 'RUNNING' || execution.status === 'PENDING') {
          setTimeout(poll, 2000); // 每 2 秒轮询一次
        }
      } catch (error) {
        console.error('Polling error:', error);
        setTimeout(poll, 5000); // 错误时延长轮询间隔
      }
    };
    
    poll();
  }
}
```

## 用户界面设计

### 响应式布局

#### 断点策略
- **移动端** (< 768px): 单栏布局，折叠侧边栏
- **平板端** (768px - 1024px): 双栏布局，可选侧边栏
- **桌面端** (> 1024px): 多栏布局，固定侧边栏

#### 组件适配
```typescript
// ResponsiveLayout.tsx
interface ResponsiveLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  aside?: React.ReactNode;
}

export function ResponsiveLayout({ sidebar, main, aside }: ResponsiveLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* 侧边栏 - 在移动端隐藏 */}
      {sidebar && (
        <div className="hidden lg:flex lg:w-64 lg:flex-col">
          {sidebar}
        </div>
      )}
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {main}
        </main>
      </div>
      
      {/* 右侧面板 - 在小屏幕上隐藏 */}
      {aside && (
        <div className="hidden xl:flex xl:w-80 xl:flex-col">
          {aside}
        </div>
      )}
    </div>
  );
}
```

### 加载状态设计

```typescript
// LoadingStates.tsx
export function SkeletonCard() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </Card>
  );
}

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
    </div>
  );
}
```

### 状态指示器

```typescript
// StatusIndicator.tsx
interface StatusIndicatorProps {
  status: 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DISABLED';
  showText?: boolean;
}

export function StatusIndicator({ status, showText = true }: StatusIndicatorProps) {
  const statusConfig = {
    READY: { color: 'bg-green-500', text: '准备就绪', textColor: 'text-green-700' },
    RUNNING: { color: 'bg-blue-500', text: '执行中', textColor: 'text-blue-700' },
    COMPLETED: { color: 'bg-green-500', text: '已完成', textColor: 'text-green-700' },
    FAILED: { color: 'bg-red-500', text: '执行失败', textColor: 'text-red-700' },
    DISABLED: { color: 'bg-gray-500', text: '已禁用', textColor: 'text-gray-700' }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      {showText && (
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
      )}
    </div>
  );
}
```

## 国际化实现

### 翻译文件结构

```typescript
// locales/zh/common.json
{
  "workflowTemplates": {
    "title": "工作流模板",
    "description": "设计和管理可复用的工作流蓝图",
    "createTemplate": "新建模板",
    "editTemplate": "编辑模板",
    "cloneTemplate": "克隆模板",
    "createCrewFromTemplate": "从模板创建团队",
    "noTemplates": "暂无工作流模板",
    "noTemplatesDescription": "创建您的第一个工作流模板来开始使用"
  },
  "crews": {
    "title": "我的团队",
    "description": "创建、配置并运行您的 AI 执行团队",
    "createCrew": "创建团队",
    "runCrew": "运行团队",
    "editCrew": "编辑配置",
    "viewHistory": "查看历史",
    "noCrews": "暂无执行团队",
    "noCrewsDescription": "基于工作流模板创建您的第一个执行团队"
  }
}

// locales/en/common.json
{
  "workflowTemplates": {
    "title": "Workflow Templates",
    "description": "Design and manage reusable workflow blueprints",
    "createTemplate": "Create Template",
    "editTemplate": "Edit Template",
    "cloneTemplate": "Clone Template",
    "createCrewFromTemplate": "Create Crew from Template",
    "noTemplates": "No workflow templates",
    "noTemplatesDescription": "Create your first workflow template to get started"
  },
  "crews": {
    "title": "My Crews",
    "description": "Create, configure and run your AI execution teams",
    "createCrew": "Create Crew",
    "runCrew": "Run Crew",
    "editCrew": "Edit Configuration",
    "viewHistory": "View History",
    "noCrews": "No crews",
    "noCrewsDescription": "Create your first execution crew based on a workflow template"
  }
}
```

## 错误处理

### 错误边界设计

```typescript
// ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 可以在这里上报错误到监控系统
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">出现了一些问题</h2>
          <p className="text-gray-600 text-center mb-4">
            页面遇到了意外错误，请刷新页面重试
          </p>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## 性能优化策略

### 1. 代码分割
- 页面级别的懒加载
- 大型组件的动态导入
- 第三方库的按需加载

### 2. 渲染优化
- React.memo 防止不必要的重渲染
- useMemo 和 useCallback 缓存计算结果
- 虚拟滚动处理大列表

### 3. 数据获取优化
- React Query 的缓存和后台更新
- 分页和无限滚动
- 预加载关键数据

### 4. 资源优化
- 图片懒加载和 WebP 格式
- CSS 和 JS 的压缩和缓存
- CDN 加速静态资源

## 测试策略

### 单元测试
- 所有组件的渲染测试
- 工具函数的逻辑测试
- 状态管理的行为测试

### 集成测试
- 页面间的导航流程
- API 调用的集成测试
- 用户交互的端到端测试

### 性能测试
- 页面加载时间测试
- 大数据量的渲染性能
- 内存泄漏检测

## 数据模型

### 前端数据类型定义

```typescript
// types/workflow.ts
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  definition: WorkflowDefinition;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface WorkflowDefinition {
  agents: AgentDefinition[];
  tasks: TaskDefinition[];
  connections: Connection[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  position: Position;
  requiredTools: string[];
}

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  expectedOutput: string;
  assignedAgentId: string;
  dependencies: string[];
  position: Position;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'task-dependency' | 'agent-assignment';
}

export interface Position {
  x: number;
  y: number;
}

// types/crew.ts
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
}

export interface AgentConfig {
  agentId: string;
  agentName: string;
  llmModel: string;
  temperature: number;
  maxTokens: number;
  tools: ToolConfig[];
  apiKeys: Record<string, string>;
}

export interface ToolConfig {
  toolId: string;
  toolName: string;
  enabled: boolean;
  config: Record<string, any>;
}

export type CrewStatus = 'READY' | 'RUNNING' | 'DISABLED';

// types/execution.ts
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

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ExecutionInput {
  variables: Record<string, any>;
  priority: ExecutionPriority;
  timeout?: number;
}

export type ExecutionPriority = 'LOW' | 'MEDIUM' | 'HIGH';
```

这个设计文档涵盖了前端页面改进的所有关键方面，包括架构设计、组件设计、数据流、UI/UX、国际化、错误处理、性能优化和测试策略。设计方案完全基于需求文档中定义的 6 个核心需求，确保了需求的完整覆盖和技术实现的可行性。