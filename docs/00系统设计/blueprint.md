# CrewAI Studio 系统设计蓝图

## 📋 项目概述

**CrewAI Studio** 是一个基于CrewAI框架的AI代理工作流管理平台，提供可视化的AI代理创建、任务编排和工作流执行功能。

### 核心特性
- 🤖 AI代理可视化创建和管理
- 📋 任务编排和依赖管理
- 🔄 工作流可视化设计和执行
- 🛠️ 丰富的工具集成
- 📊 实时执行监控和日志
- 🔌 多种LLM模型支持

---

## 🏗️ 系统架构

### 整体架构图
```
┌─────────────────────────────────────────────────────────────┐
│                    CrewAI Studio Platform                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js + React)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Dashboard   │ │ Workflow    │ │ Agent       │           │
│  │ 仪表板      │ │ 工作流面板  │ │ 代理面板    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Task Panel  │ │ Tools       │ │ Settings    │           │
│  │ 任务面板    │ │ 工具面板    │ │ 设置面板    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  API Gateway (FastAPI)                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ /agents     │ │ /tasks      │ │ /workflows  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ /crewai     │ │ /health     │ │ /executions │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Agent       │ │ Task        │ │ Workflow    │           │
│  │ Service     │ │ Service     │ │ Service     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Execution   │ │ CrewAI      │ │ LLM         │           │
│  │ Service     │ │ Service     │ │ Service     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ SQLite/     │ │ File        │ │ Cache       │           │
│  │ PostgreSQL  │ │ Storage     │ │ (Redis)     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  External Integrations                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ OpenAI      │ │ Anthropic   │ │ CrewAI      │           │
│  │ API         │ │ API         │ │ Tools       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

#### 前端技术栈
- **框架**: Next.js 15.3.3 (React 18.3.1)
- **UI组件**: Radix UI + Tailwind CSS
- **状态管理**: React Hook Form + Zustand
- **图形库**: React Flow (工作流可视化)
- **图表库**: Recharts
- **国际化**: next-i18next
- **构建工具**: TypeScript + ESLint

#### 后端技术栈
- **框架**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **AI框架**: CrewAI + LangChain
- **异步处理**: asyncio + ThreadPoolExecutor
- **API文档**: OpenAPI/Swagger
- **日志**: Loguru

#### 部署技术栈
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx (可选)
- **监控**: 内置健康检查
- **CI/CD**: GitHub Actions (可选)

---

## 📊 数据库设计

### 核心实体关系图
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Agent       │     │      Task       │     │    Workflow     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ name            │     │ name            │     │ name            │
│ description     │     │ description     │     │ description     │
│ role            │     │ task_type       │     │ version         │
│ goal            │     │ status          │     │ status          │
│ backstory       │     │ priority        │     │ workflow_type   │
│ agent_type      │     │ input_data      │     │ execution_mode  │
│ status          │     │ expected_output │     │ definition      │
│ llm_model       │     │ output_data     │     │ agents_config   │
│ temperature     │     │ assigned_agent  │◄────┤ tasks_config    │
│ tools           │     │ dependencies    │     │ schedule_config │
│ capabilities    │     │ started_at      │     │ current_step    │
│ system_prompt   │     │ completed_at    │     │ progress        │
│ created_at      │     │ created_at      │     │ created_at      │
│ updated_at      │     │ updated_at      │     │ updated_at      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────────┐
                    │   Execution     │
                    ├─────────────────┤
                    │ id (PK)         │
                    │ execution_type  │
                    │ target_id       │
                    │ status          │
                    │ progress        │
                    │ result          │
                    │ error_message   │
                    │ logs            │
                    │ metadata        │
                    │ started_at      │
                    │ completed_at    │
                    │ created_at      │
                    │ updated_at      │
                    └─────────────────┘
```

### 数据模型详细设计

#### Agent 模型
```python
class Agent(BaseModel):
    # 基本信息
    name: str                    # Agent名称
    description: str             # 描述
    role: str                    # 角色定义
    goal: str                    # 目标
    backstory: str               # 背景故事
    
    # 配置信息
    agent_type: AgentType        # 类型 (RESEARCHER, WRITER, ANALYST, etc.)
    status: AgentStatus          # 状态 (ACTIVE, INACTIVE, TRAINING, ERROR)
    is_active: bool              # 是否激活
    
    # AI模型配置
    llm_model: str               # LLM模型名称
    temperature: str             # 温度参数
    max_tokens: str              # 最大token数
    
    # 工具和能力
    tools: List[str]             # 可用工具列表
    capabilities: List[str]      # 能力列表
    
    # 执行配置
    max_execution_time: str      # 最大执行时间
    allow_delegation: bool       # 是否允许委托
    verbose: bool                # 详细输出
    
    # 提示词配置
    system_prompt: str           # 系统提示词
    custom_instructions: str     # 自定义指令
```

#### Task 模型
```python
class Task(BaseModel):
    # 基本信息
    name: str                    # 任务名称
    description: str             # 任务描述
    task_type: TaskType          # 任务类型
    
    # 状态和优先级
    status: TaskStatus           # 状态 (PENDING, RUNNING, COMPLETED, etc.)
    priority: TaskPriority       # 优先级 (LOW, MEDIUM, HIGH, URGENT)
    
    # 任务内容
    input_data: Dict             # 输入数据
    expected_output: str         # 期望输出描述
    output_data: Dict            # 实际输出数据
    
    # 执行配置
    max_execution_time: int      # 最大执行时间（秒）
    retry_count: int             # 重试次数
    max_retries: int             # 最大重试次数
    
    # 关联关系
    assigned_agent_id: int       # 分配的Agent ID
    dependencies: List[int]      # 依赖的任务ID列表
    
    # 时间信息
    started_at: datetime         # 开始执行时间
    completed_at: datetime       # 完成时间
```

#### Workflow 模型
```python
class Workflow(BaseModel):
    # 基本信息
    name: str                    # 工作流名称
    description: str             # 描述
    version: str                 # 版本号
    
    # 状态和类型
    status: WorkflowStatus       # 状态 (DRAFT, ACTIVE, PAUSED, etc.)
    workflow_type: WorkflowType  # 类型 (SEQUENTIAL, PARALLEL, CONDITIONAL)
    execution_mode: ExecutionMode # 执行模式 (MANUAL, SCHEDULED, TRIGGERED)
    
    # 工作流定义
    workflow_definition: Dict    # 工作流定义JSON
    agents_config: List[Dict]    # 参与的Agent配置
    tasks_config: List[Dict]     # 任务配置
    
    # 执行配置
    max_execution_time: int      # 最大执行时间
    retry_policy: Dict           # 重试策略
    error_handling: Dict         # 错误处理配置
    
    # 调度配置
    schedule_config: Dict        # 调度配置
    trigger_conditions: List     # 触发条件
    
    # 执行状态
    current_step: str            # 当前执行步骤
    progress: float              # 执行进度 (0-100)
    last_execution_id: str       # 最后执行ID
```

---

## 🔧 功能模块设计

### 1. Agent管理模块

#### 功能特性
- ✅ Agent创建、编辑、删除
- ✅ Agent配置管理（LLM模型、工具、提示词）
- ✅ Agent状态监控
- ✅ Agent执行历史
- ✅ Agent模板管理

#### API接口
```
GET    /api/v1/agents              # 获取Agent列表
POST   /api/v1/agents              # 创建Agent
GET    /api/v1/agents/{id}         # 获取Agent详情
PUT    /api/v1/agents/{id}         # 更新Agent
DELETE /api/v1/agents/{id}         # 删除Agent
POST   /api/v1/agents/{id}/execute # 执行Agent任务
GET    /api/v1/agents/{id}/status  # 获取Agent状态
```

### 2. Task管理模块

#### 功能特性
- ✅ Task创建、编辑、删除
- ✅ Task依赖关系管理
- ✅ Task执行监控
- ✅ Task批量操作
- ✅ Task模板管理

#### API接口
```
GET    /api/v1/tasks               # 获取Task列表
POST   /api/v1/tasks               # 创建Task
GET    /api/v1/tasks/{id}          # 获取Task详情
PUT    /api/v1/tasks/{id}          # 更新Task
DELETE /api/v1/tasks/{id}          # 删除Task
POST   /api/v1/tasks/{id}/execute  # 执行Task
GET    /api/v1/tasks/{id}/status   # 获取Task状态
POST   /api/v1/tasks/batch         # 批量操作
```

### 3. Workflow管理模块

#### 功能特性
- ✅ 可视化工作流设计器
- ✅ 工作流版本管理
- ✅ 工作流执行引擎
- ✅ 实时执行监控
- ✅ 工作流模板库

#### API接口
```
GET    /api/v1/workflows              # 获取Workflow列表
POST   /api/v1/workflows              # 创建Workflow
GET    /api/v1/workflows/{id}         # 获取Workflow详情
PUT    /api/v1/workflows/{id}         # 更新Workflow
DELETE /api/v1/workflows/{id}         # 删除Workflow
POST   /api/v1/workflows/{id}/execute # 执行Workflow
GET    /api/v1/workflows/{id}/status  # 获取执行状态
POST   /api/v1/workflows/{id}/stop    # 停止执行
```

### 4. 执行引擎模块

#### 核心组件
- **ExecutionService**: 执行管理服务
- **CrewAIService**: CrewAI框架集成
- **TaskQueue**: 任务队列管理
- **ConcurrencyManager**: 并发控制
- **ProgressTracker**: 进度跟踪

#### 执行流程
```
1. 接收执行请求
   ↓
2. 验证工作流/任务状态
   ↓
3. 创建执行上下文
   ↓
4. 检查并发限制
   ↓
5. 提交到执行队列 / 立即执行
   ↓
6. 实时状态更新
   ↓
7. 结果处理和存储
```

### 5. 工具集成模块

#### 内置工具
- 🔍 **WebsiteSearchTool**: 网站搜索
- 📁 **FileReadTool**: 文件读取
- ✏️ **FileWriterTool**: 文件写入
- 📂 **DirectoryReadTool**: 目录读取
- 🔍 **CodeDocsSearchTool**: 代码文档搜索
- 🌐 **SerperDevTool**: 搜索引擎工具

#### 工具管理
- 工具注册和发现
- 工具配置管理
- 工具权限控制
- 自定义工具支持

---

## 🎨 前端架构设计

### 页面结构
```
/
├── dashboard/              # 仪表板
├── workflow/               # 工作流面板
├── agents/                 # Agent面板
├── tasks/                  # Task面板
├── tools/                  # 工具面板
├── traces/                 # 执行追踪
├── llm-connections/        # LLM连接管理
├── settings/               # 设置面板
└── resources/              # 资源监控
```

### 组件架构
```
src/
├── components/
│   ├── ui/                 # 基础UI组件 (Radix UI)
│   ├── layout/             # 布局组件
│   ├── workflow/           # 工作流相关组件
│   ├── agent/              # Agent相关组件
│   └── task/               # Task相关组件
├── lib/
│   ├── api.ts              # API客户端
│   ├── utils.ts            # 工具函数
│   └── types.ts            # 类型定义
├── hooks/                  # 自定义Hooks
├── stores/                 # 状态管理
└── pages/                  # 页面组件
```

### 状态管理
- **React Hook Form**: 表单状态管理
- **Zustand**: 全局状态管理
- **React Query**: 服务端状态管理
- **Local Storage**: 本地持久化

---

## 🔄 API设计规范

### RESTful API设计

#### 统一响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 错误响应格式
```json
{
  "success": false,
  "error_code": "VALIDATION_ERROR",
  "error_message": "参数验证失败",
  "error_details": {
    "field": "name",
    "message": "名称不能为空"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 分页响应格式
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "size": 20,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

### API版本控制
- 使用URL路径版本控制: `/api/v1/`
- 向后兼容原则
- 废弃API的渐进式迁移

---

## 🚀 部署架构

### Docker容器化部署

#### 服务组件
```yaml
services:
  # 后端服务
  backend:
    image: crewai-studio-backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=sqlite:///./crewai_studio.db
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./backend/crewai_studio.db:/app/crewai_studio.db
      - backend_logs:/app/logs
    
  # 前端服务
  frontend:
    image: crewai-studio-frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
```

#### 健康检查
- 后端: `GET /api/v1/health`
- 前端: `GET /`
- 数据库连接检查
- CrewAI框架状态检查

### 生产环境部署

#### 推荐架构
```
[Load Balancer] → [Nginx] → [Frontend Container]
                           ↓
                    [Backend Container] → [PostgreSQL]
                           ↓
                    [Redis Cache] (可选)
```

#### 环境配置
- **开发环境**: SQLite + 本地文件存储
- **测试环境**: PostgreSQL + 文件存储
- **生产环境**: PostgreSQL + 对象存储 + Redis缓存

---

## 🔒 安全设计

### 认证授权
- JWT Token认证
- RBAC权限控制
- API密钥管理
- 会话管理

### 数据安全
- 敏感数据加密存储
- API密钥安全管理
- 输入验证和过滤
- SQL注入防护

### 网络安全
- HTTPS强制使用
- CORS配置
- 请求频率限制
- 防火墙配置

---

## 📈 性能优化

### 后端优化
- 数据库查询优化
- 异步处理
- 连接池管理
- 缓存策略

### 前端优化
- 代码分割
- 懒加载
- 图片优化
- CDN加速

### 系统监控
- 性能指标监控
- 错误日志收集
- 资源使用监控
- 用户行为分析

---

## 🧪 测试策略

### 测试类型
- **单元测试**: 核心业务逻辑
- **集成测试**: API接口测试
- **端到端测试**: 完整流程测试
- **性能测试**: 负载和压力测试

### 测试工具
- **后端**: pytest + FastAPI TestClient
- **前端**: Jest + React Testing Library
- **E2E**: Playwright
- **API**: Postman/Newman

---

## 📋 开发规范

### 代码规范
- **Python**: PEP8 + Black格式化
- **TypeScript**: ESLint + Prettier
- **Git**: Conventional Commits
- **文档**: Markdown + 中英双语

### 开发流程
1. 需求分析和设计
2. 功能开发和自测
3. 代码审查
4. 集成测试
5. 部署和监控

---

## 🔮 未来规划

### 短期目标 (1-3个月)
- ✅ 完善核心功能
- 🔄 优化用户体验
- 📊 增强监控能力
- 🔧 工具生态扩展

### 中期目标 (3-6个月)
- 🤖 AI能力增强
- 🔌 第三方集成
- 📱 移动端支持
- ☁️ 云原生部署

### 长期目标 (6-12个月)
- 🌐 多租户支持
- 🔄 工作流市场
- 🤝 协作功能
- 🎯 智能推荐

---

## 📚 参考资源

### 技术文档
- [CrewAI官方文档](https://docs.crewai.com/)
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [Next.js文档](https://nextjs.org/docs)
- [React Flow文档](https://reactflow.dev/)

### 开源项目
- [CrewAI GitHub](https://github.com/joaomdmoura/crewAI)
- [LangChain](https://github.com/langchain-ai/langchain)
- [Radix UI](https://github.com/radix-ui/primitives)

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-20  
**维护者**: CrewAI Studio Team

> 💡 **提示**: 本文档将随着项目发展持续更新，建议定期查看最新版本。