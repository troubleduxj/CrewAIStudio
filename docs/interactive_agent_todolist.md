# 交互式 Agent 功能开发任务清单

本文档根据《Agent 交互式 UI 设计方案》制定，旨在提供一个清晰、可执行的开发路线图。

## Phase 1: 基础架构搭建 (MVP)

此阶段的目标是搭建一个可以跑通基本流程的最小可行产品。

### 后端 (Backend)

-   [x] **1.1: 创建 WebSocket 端点**
    -   [x] 在 FastAPI 中添加一个新的路由文件用于处理 WebSocket 连接。
    -   [x] 实现 `/api/v1/interactive_session` 端点。
    -   [x] 实现基本的连接管理逻辑（接受连接、处理断开）。

-   [x] **1.2: 实现基础 Agent 执行逻辑**
    -   [x] 创建一个新的服务 `interactive_session_service.py`。
    -   [x] 实现一个函数，该函数接收用户输入文本，并能启动一个简单的 CrewAI Agent/Task。
    -   [x] 将 Agent 的最终执行结果通过 WebSocket 发送回客户端。此时无需关心流式输出。

### 前端 (Frontend)

-   [x] **1.3: 创建 Playground 页面和路由**
    -   [x] 在 `frontend/src/app/[locale]/` 目录下创建 `playground/page.tsx`。
    -   [x] 在 `main-layout.tsx` 的侧边栏中添加指向 `/playground` 的导航链接。

-   [x] **1.4: 搭建页面布局**
    -   [x] 使用 `react-resizable-panels` 实现可调整的双栏布局。
    -   [x] 创建 `ChatPanel` 和 `ResultPanel` 的基本组件骨架。

-   [x] **1.5: 实现 WebSocket 连接**
    -   [x] 在 `playground` 页面加载时，建立到后端的 WebSocket 连接。
    -   [x] 实现基本的事件监听（`onopen`, `onmessage`, `onerror`, `onclose`）。

-   [x] **1.6: 实现基础聊天功能**
    -   [x] 创建 `ChatInput` 组件，允许用户输入并发送消息。
    -   [x] 创建 `MessageList` 和 `Message` 组件，用于展示用户消息和 Agent 的最终回复。
    -   [x] 将用户输入通过 WebSocket 发送给后端。

## Phase 2: 核心功能增强

此阶段的目标是实现设计的核心功能，特别是流式响应和多模态结果展示。

### 后端 (Backend)

-   [ ] **2.1: 实现流式响应**
    -   [ ] 修改 Agent 执行逻辑，通过回调或事件监听器捕获 Agent 的中间步骤（思考、工具使用）。
    -   [ ] 定义并实现 `thought`, `tool_usage`, `partial_result` 等流式消息类型。
    -   [ ] 将这些中间步骤实时通过 WebSocket 发送给前端。

### 前端 (Frontend)

-   [ ] **2.2: 增强聊天界面**
    -   [ ] 扩展 `Message` 组件，使其能够根据不同的消息类型（`thought`, `tool_usage`）展示不同的样式。
    -   [ ] 实现 Agent 状态指示器（例如，“正在思考中...”）。
    -   [ ] 处理并展示从后端接收到的流式消息。

-   [ ] **2.3: 实现结果展示面板 (Tabs)**
    -   [ ] 在 `ResultPanel` 中添加标签页切换功能。
    -   [ ] **CodeTab:** 集成 Monaco Editor，并能接收和显示 `code` 类型的结果。
    -   [ ] **DocumentTab:** 集成 `react-markdown`，并能接收和显示 `document` 类型的结果。
    -   [ ] **PreviewTab:** 实现一个基础的 `iframe`，并能接收和显示 `preview` 类型的结果（HTML 字符串）。

## Phase 3: 功能联动与优化

此阶段的目标是将新功能与现有平台深度集成，并进行体验优化。

### 前端 (Frontend)

-   [ ] **3.1: 实现功能联动**
    -   [ ] **(从模板到交互):** 在 `Workflow Templates` 页面，为 Agent 节点添加“在 Playground 中测试”的按钮，点击后能携带 Agent 配置跳转到 `/playground`。
    -   [ ] **(从交互到模板):** 在 `/playground` 页面，添加“保存为 Agent 模板”的功能，可以将当前会话的 Agent 配置保存到数据库。

-   [ ] **3.2: 完善 `ChatInput`**
    -   [ ] 增加文件上传功能。
    -   [ ] 优化多行文本输入的体验。

-   [ ] **3.3: 状态管理优化**
    -   [ ] 创建并集成 `agentSessionStore` (Zustand)，统一管理页面状态。
    -   [ ] 将组件内的本地状态迁移到全局 Store。

### 后端 (Backend)

-   [ ] **3.4: 实现功能联动 API**
    -   [ ] 创建 API 端点来支持“保存为 Agent 模板”功能。
    -   [ ] 修改 WebSocket 逻辑，使其能够接收并加载传入的 Agent 配置。

-   [ ] **3.5: 错误处理与健壮性**
    -   [ ] 完善 WebSocket 连接中的错误处理逻辑。
    -   [ ] 增加对 Agent 执行超时的处理。

## Phase 4: 测试与部署

-   [ ] **4.1: 编写单元测试和集成测试**
-   [ ] **4.2: 进行端到端的功能测试**
-   [ ] **4.3: 更新项目文档**
-   [ ] **4.4: 准备部署**
