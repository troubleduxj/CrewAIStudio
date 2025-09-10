# CrewAI Studio 功能与架构升级方案

**文档版本**: v1.1.0  
**更新日期**: 2025-09-01

## 1. 概述

本文档旨在对 CrewAI Studio 的核心概念和系统架构进行一次重要升级，以提升用户体验、增强系统健壮性，并为未来的平台化服务（SaaS）奠定基础。

**核心变更点:**

1.  **概念重塑**: 明确区分 **`Workflow` (工作流模板)** 和 **`Crew` (执行团队)** 的概念，优化用户心智模型。
2.  **架构升级**: 引入 **异步任务队列** 机制，支持多 `Crew` 的高并发、可扩展执行。
3.  **能力扩展**: 设计并开放 **外部 API**，使 CrewAI Studio 能够作为一项服务被其他应用集成。

---

## 2. 设计更新详情

### 2.1. 概念模型更新: `Workflow` vs `Crew`

-   **`Workflow` (工作流模板)**
    -   **定义**: 一个可复用的 **“蓝图”** 或 **“配方”**。
    -   **职责**: 定义流程结构、所需的 Agent 角色、Task 序列及依赖关系。
    -   **特点**: 不包含具体的执行配置（如 LLM 模型、API Keys），是纯粹的结构模板。

-   **`Crew` (执行团队)**
    -   **定义**: 一个基于 `Workflow` 模板创建的，可执行的 **“AI 团队实例”**。
    -   **职责**: 绑定具体的执行配置，例如为 Agent 角色指定 LLM 模型、为工具配置 API Keys 等。
    -   **特点**: 一个 `Workflow` 模板可以实例化为多个不同配置的 `Crew`。

-   **`Execution` (执行记录)**
    -   **定义**: `Crew` 的一次具体运行实例。
    -   **关联**: 直接与 `Crew` 关联，记录该次运行的输入、输出、状态和日志。

### 2.2. 系统架构升级: 异步任务队列

为了支持多 `Crew` 的稳定、高并发执行，系统将从同步请求模式升级为异步任务队列模式。

-   **技术选型**:
    -   **消息队列**: Redis 或 RabbitMQ
    -   **任务队列框架**: Celery (Python)
-   **执行流程**:
    1.  **API Server**: 接收执行请求后，将任务（`crew_id`, `input_data`）推送到消息队列，并立即返回一个 `job_id`。
    2.  **Worker**: 独立的 Worker 进程从队列中获取任务，在后台执行 `crew.kickoff()`。
    3.  **状态查询**: 客户端可通过 `job_id` 轮询查询任务状态和最终结果。

---

## 3. 实施任务清单 (Task List)

### ✅ 后端 (Backend)

-   [ ] **数据库迁移 (Alembic)**
    -   [ ] 创建新的数据模型 `Crew` (`models/crew.py`)。
    -   [ ] 修改 `Execution` 模型，将其外键从 `workflow_id` 更改为 `crew_id`。
    -   [ ] 新增 `ApiClient` 和 `ApiKey` 模型用于外部 API 认证。
    -   [ ] 生成并应用新的数据库迁移脚本。

-   [ ] **核心服务层 (Services)**
    -   [ ] 创建 `CrewService` (`services/crew_service.py`)，处理 `Crew` 的 CRUD 操作。
    -   [ ] 修改 `ExecutionService`，使其与 `CrewService` 协同工作。
    -   [ ] 更新 `WorkflowService`，明确其只管理模板。

-   [ ] **API 接口 (API)**
    -   [ ] 创建 `/api/v1/crews` 的 CRUD 端点。
    -   [ ] 修改执行端点为 `POST /api/v1/crews/{crew_id}/execute`。
    -   [ ] 创建 `GET /api/v1/executions/{job_id}` 用于状态查询。
    -   [ ] 创建外部 API 端点 (`/public/v1/...`) 并实现 API Key 认证逻辑。

-   [ ] **异步任务队列集成 (Celery)**
    -   [ ] 在项目中集成 Celery，并配置好 Broker (Redis/RabbitMQ)。
    -   [ ] 创建 `backend/tasks.py`，定义 `execute_crew_task` 异步任务。
    -   [ ] 修改 `ExecutionService`，将同步执行 `crew.kickoff()` 的逻辑改为调用 `.delay()` 推送任务到队列。

-   [ ] **配置与环境变量**
    -   [ ] 新增 Celery 相关配置（`CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`）。

### ✅ 前端 (Frontend)

-   [ ] **导航与页面结构**
    -   [ ] 将侧边栏的 `Workflow` 导航项重命名为 `Workflow Templates`。
    -   [ ] 新增 `Crews` 页面，用于展示和管理 `Crew` 实例列表。
    -   [ ] 创建 `Create Crew` 页面/模态框，实现从 `Workflow Template` 创建 `Crew` 的流程。

-   [ ] **API 服务层 (Services)**
    -   [ ] 创建 `crewService.ts`，用于调用后端的 `/crews` 相关接口。
    -   [ ] 修改现有的执行相关调用，以适应异步流程（发送请求 -> 获取 job_id -> 轮询状态）。

-   [ ] **UI 组件 (Components)**
    -   [ ] 开发 `CrewCard` 组件，用于在 `Crews` 页面展示单个 `Crew` 实例。
    -   [ ] 开发 `CrewForm` 组件，用于创建和编辑 `Crew`，包括为 Agent 配置 LLM 和工具。
    -   [ ] 在执行历史页面，增加轮询逻辑，实时更新任务状态。

-   [ ] **状态管理 (State Management)**
    -   [ ] 新增与 `Crews` 相关的全局状态（如使用 Zustand）。
    -   [ ] 使用 React Query 或类似工具来管理异步执行状态的轮询。

### ✅ DevOps & 部署

-   [ ] **Docker 配置**
    -   [ ] 在 `docker-compose.yml` 中新增 `redis` 服务。
    -   [ ] 在 `docker-compose.yml` 中新增 `worker` 服务，用于运行 Celery worker 进程。
    -   [ ] 更新 `backend` 服务的 Dockerfile，确保 Celery 已安装。

-   [ ] **环境变量**
    -   [ ] 在 `.env.example` 文件中添加 `CELERY_BROKER_URL` 等新环境变量。
    -   [ ] 确保部署脚本能够正确传递这些新的环境变量。
