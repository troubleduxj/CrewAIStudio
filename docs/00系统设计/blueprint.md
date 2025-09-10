# CrewAI Studio 系统设计蓝图

## 📋 项目概述

**CrewAI Studio** 是一个基于CrewAI框架的可视化AI团队协作平台。它提供从 **工作流模板（Workflow Template）** 设计，到具体 **执行团队（Crew）** 的组建与配置，再到任务的异步执行与监控的全流程功能。

### 核心特性
- 🤖 **可视化编排**: 通过拖拽方式设计工作流模板，定义Agent角色和Task依赖。
- 🧩 **团队实例化**: 基于模板创建和配置具体的Crew，为Agent指定不同的LLM和工具。
- 🚀 **异步执行引擎**: 支持多Crew并发执行，并通过任务队列保证系统稳定性和可扩展性。
- 📊 **实时监控与日志**: 追踪每次执行（Execution）的状态、进度和详细日志。
- 🔌 **开放API**: 提供外部API，将平台强大的Agent能力集成到其他应用中。
- 🛠️ **丰富的工具集**: 内置并支持自定义工具，增强Agent能力。

---

## 🏗️ 系统架构

### 整体架构图 (v1.1)
```
                                 ┌──────────────────────────┐
                                 │ External API Clients     │
                                 └───────────┬──────────────┘
                                             │ (Public API)
┌────────────────────────────────────────────┼───────────────────────────────────────────┐
│                    CrewAI Studio Platform  │                                           │
├────────────────────────────────────────────┴───────────────────────────────────────────┤
│  Frontend (Next.js + React)                                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │ Dashboard     │ │ Workflow      │ │ Crews         │ │ Executions    │             │
│  │ 仪表板        │ │ Templates     │ │ 我的团队      │ │ 执行记录      │             │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘             │
├────────────────────────────────────────────┬───────────────────────────────────────────┤
│  API Gateway (FastAPI)                     │                                           │
│  - Receives requests                       │                                           │
│  - Authentication (Internal & API Key)     │ 2. Enqueue Job                            │
│  - Pushes jobs to queue                    │                                           │
└────────────────────────────────────────────┼───────────────────────────────────────────┘
                                             │
                                             ▼
                                 ┌──────────────────────────┐
                                 │ Job Queue (Redis/Celery) │
                                 └───────────┬──────────────┘
                                             │ 3. Dequeue Job
                                             ▼
                                 ┌──────────────────────────┐
                                 │ Worker(s)                │
                                 │ - Execute crew.kickoff() │
                                 │ - Update DB with status  │
                                 └───────────┬──────────────┘
                                             │ 1. API Call
┌────────────────────────────────────────────┼───────────────────────────────────────────┐
│  Service & Data Layer                      │                                           │
├────────────────────────────────────────────┼───────────────────────────────────────────┤
│  Service Layer                             │ Data Layer                                │
│  ┌───────────────┐ ┌───────────────┐     │ ┌────────────────┐ ┌────────────────┐      │
│  │ Crew Service  │ │ Exec. Service │     │ │ PostgreSQL     │ │ File Storage   │      │
│  └───────────────┘ └───────────────┘     │ └────────────────┘ └────────────────┘      │
├────────────────────────────────────────────┼───────────────────────────────────────────┤
│  External Integrations (Called by Workers) │                                           │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                                 │
│  │ OpenAI API    │ │ Anthropic API │ │ CrewAI Tools  │                                 │
│  └───────────────┘ └───────────────┘ └───────────────┘                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
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
- **异步处理**: Celery + Redis / RabbitMQ
- **API文档**: OpenAPI/Swagger
- **日志**: Loguru

#### 部署技术栈
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx (可选)
- **监控**: 内置健康检查
- **CI/CD**: GitHub Actions (可选)

---

## 📊 数据库设计

### 核心实体关系图 (v1.1)
```
┌───────────────────┐      ┌───────────────────┐
│ Workflow Template │      │      Crew         │
├───────────────────┤      ├───────────────────┤
│ id (PK)           │      │ id (PK)           │
│ name              │      │ name              │
│ description       │      │ description       │
│ definition (JSON) │      │ workflow_id (FK)  │◄──┐
└───────────────────┘      │ agents_config(JSON) │   │
                           │ status            │   │
                           └─────────┬─────────┘   │
                                     │             │
                                     │ 1..N        │ 1..1
                                     ▼             │
                    ┌───────────────────┐          │
                    │    Execution      │          │
                    ├───────────────────┤          │
                    │ id (PK)           │          │
                    │ crew_id (FK)      │──────────┘
                    │ status            │
                    │ input_data        │
                    │ output_data       │
                    │ started_at        │
                    │ completed_at      │
                    └───────────────────┘
```
*说明: `Agent` 和 `Task` 的定义存在于 `Workflow Template` 的 `definition` JSON 中，并在 `Crew` 的 `agents_config` 中被实例化配置。*

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

#### Workflow Template 模型
```python
class WorkflowTemplate(BaseModel):
    # 基本信息
    name: str                    # 模板名称
    description: str             # 描述
    
    # 工作流定义
    definition: Dict             # 工作流结构定义 (包含Agents角色和Tasks流程)
```

#### Crew 模型 (新增)
```python
class Crew(BaseModel):
    # 基本信息
    name: str                    # 团队名称
    description: str             # 描述
    workflow_template_id: int    # 关联的工作流模板ID
    
    # 实例化配置
    agents_config: Dict          # Agent的具体配置 (e.g., LLM模型, API Keys)
    
    # 状态
    status: CrewStatus           # 状态 (READY, RUNNING, DISABLED)
```

#### Execution 模型 (调整)
`Execution` 模型现在与 `Crew` 模型关联，记录一次具体的执行。
```python
class Execution(BaseModel):
    # 基本信息
    crew_id: int                 # 关联的Crew ID
    status: ExecutionStatus      # 状态 (PENDING, RUNNING, COMPLETED, FAILED)
    
    # 数据
    input_data: Dict             # 本次执行的输入
    output_data: Dict            # 最终的输出结果
    
    # 时间
    started_at: datetime
    completed_at: datetime
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

### 3. Workflow Template 管理模块

#### 功能特性
- ✅ 可视化工作流模板设计器
- ✅ 模板版本管理
- ✅ 模板导入/导出
- ✅ 模板库

#### API接口
```
GET    /api/v1/workflow-templates              # 获取模板列表
POST   /api/v1/workflow-templates              # 创建模板
GET    /api/v1/workflow-templates/{id}         # 获取模板详情
PUT    /api/v1/workflow-templates/{id}         # 更新模板
DELETE /api/v1/workflow-templates/{id}         # 删除模板
```

### 4. Crew 管理模块 (新增)

#### 功能特性
- ✅ 基于模板创建Crew
- ✅ 配置Crew（为Agent指定LLM、工具等）
- ✅ 管理Crew的生命周期
- ✅ 查看Crew的执行历史

#### API接口
```
GET    /api/v1/crews                  # 获取Crew列表
POST   /api/v1/crews                  # 创建Crew
GET    /api/v1/crews/{id}             # 获取Crew详情
PUT    /api/v1/crews/{id}             # 更新Crew
DELETE /api/v1/crews/{id}             # 删除Crew
POST   /api/v1/crews/{id}/execute     # 异步执行Crew，返回job_id
GET    /api/v1/executions/{job_id}    # 查询执行状态和结果
```

### 5. 执行引擎模块 (v1.1)

#### 核心组件
- **ExecutionService**: 接收执行请求，创建`Execution`记录，并发布任务到队列。
- **Celery Task**: 定义在后台Worker中执行`crew.kickoff()`的具体逻辑。
- **CrewAIService**: CrewAI框架集成，被Celery Task调用。
- **Job Queue (Redis/RabbitMQ)**: 任务消息代理。
- **Worker (Celery)**: 消费任务并执行的独立进程。

#### 执行流程
```
1. API接收执行请求 (POST /api/v1/crews/{id}/execute)
   ↓
2. ExecutionService: 创建Execution记录 (status: PENDING)，生成job_id
   ↓
3. ExecutionService: 将任务(crew_id, input)推送到Job Queue
   ↓
4. API立即返回job_id给客户端
   ↓
5. Worker从Job Queue获取任务
   ↓
6. Worker更新Execution状态为RUNNING，并执行crew.kickoff()
   ↓
7. Worker执行完毕，将结果和最终状态(COMPLETED/FAILED)更新回数据库
```

### 6. 工具集成模块

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

### 页面结构 (v1.1)
```
/
├── dashboard/              # 仪表板
├── workflow-templates/     # 工作流模板面板
├── crews/                  # 我的团队面板
├── executions/             # 执行记录/追踪
├── agents/                 # (可能被整合进Crews和Templates中)
├── tasks/                  # (可能被整合进Crews和Templates中)
├── tools/                  # 工具面板
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

#### 服务组件 (v1.1)
```yaml
services:
  # 消息队列
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  # 后端API服务
  backend:
    image: crewai-studio-backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=sqlite:///./crewai_studio.db
      - CELERY_BROKER_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - redis
    
  # 后端Worker服务
  worker:
    image: crewai-studio-backend
    command: celery -A app.tasks worker --loglevel=info
    environment:
      - DATABASE_URL=sqlite:///./crewai_studio.db
      - CELERY_BROKER_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - redis
      - backend

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

#### 推荐架构 (v1.1)
```
[Load Balancer] → [Nginx] → [Frontend Container]
                           ↓
                    [Backend API Container(s)] ─► [Job Queue (Redis)] ◄─ [Backend Worker Container(s)]
                           │                                                    │
                           └─────────────────► [PostgreSQL] ◄───────────────────┘
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

**文档版本**: v1.1.0  
**最后更新**: 2025-09-01  
**维护者**: CrewAI Studio Team

> 💡 **提示**: 本文档将随着项目发展持续更新，建议定期查看最新版本。
