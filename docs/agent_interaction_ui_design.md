# Agent 交互式 UI 设计方案

## 1. 概述

本文档旨在设计一个用于与 AI Agent 进行实时交互的前端界面。该界面的核心特征是左侧的聊天窗口和右侧可实时展示 Agent 工作成果（如代码、文档、网页预览）的多功能面板，旨在提供一个类似于 OpenCanvas 的沉浸式人机协作体验。

## 2. 核心功能需求

- **实时双向通信:** 用户可以与 Agent 进行对话，Agent 在执行任务时能流式地反馈其思考过程和中间结果。
- **多模态结果展示:** 能够根据 Agent 生成内容的类型，以最合适的形式进行展示（例如，渲染网页、高亮代码、预览文档）。
- **可调整的布局:** 用户可以根据需要自由调整聊天窗口和结果面板的相对宽度。
- **清晰的状态反馈:** 在 Agent 工作时，界面需要提供明确的状态指示（如“正在思考中”）。

## 3. 架构设计

### 3.1. 前端架构

#### 3.1.1. 整体布局

- **主组件:** `InteractiveAgentPage`
- **布局:** 采用 `react-resizable-panels` 实现的可调整双栏布局。
  - **左栏:** `ChatPanel` 组件。
  - **右栏:** `ResultPanel` 组件。
- **顶部:** `Header` 组件，包含会话标题和控制按钮。

#### 3.1.2. 组件设计

- **`ChatPanel` (聊天面板)**
  - `MessageList`: 负责渲染消息流。
  - `Message`: 单条消息组件。应支持多种消息类型，并有不同的视觉样式：
    - `user`: 用户输入。
    - `agent_thought`: Agent 的思考过程或内心独白。
    - `agent_tool`: Agent 使用工具的记录。
    - `agent_response`: Agent 的最终文字回复。
    - `error`: 错误信息。
  - `ChatInput`: 用户输入组件，支持多行文本和文件上传。

- **`ResultPanel` (结果展示面板)**
  - `Tabs`: 标签页切换组件，允许用户在不同视图间切换。
  - `PreviewTab`:
    - 使用 `<iframe>` 来安全地沙箱化和渲染 Agent 生成的前端代码 (HTML/CSS/JS)。
    - 需要一个机制来将代码动态注入到 `iframe` 中。
  - `CodeTab`:
    - 集成 Monaco Editor 或 CodeMirror，提供语法高亮、代码折叠、行号等功能。
    - 应包含语言选择器和一键复制按钮。
  - `DocumentTab`:
    - 使用 `react-markdown` 及其插件（如 `remark-gfm`）来渲染 Markdown 格式的文档。
    - 需要处理代码块、表格、列表等 Markdown 元素。

#### 3.1.3. 状态管理

- **库:** Zustand。
- **核心 Store (`agentSessionStore`):**
  - `messages: Message[]`: 聊天消息列表。
  - `agentStatus: 'idle' | 'thinking' | 'executing'`: Agent 的当前状态。
  - `results: { preview: string; code: string; document: string; }`: 按类型分类的 Agent 输出结果。
  - `activeTab: 'preview' | 'code' | 'document'`: 右侧面板当前激活的标签页。

### 3.2. 后端架构

#### 3.2.1. 通信协议

- **WebSocket:** 用于实现客户端与服务器之间的全双工实时通信。
- **端点 (Endpoint):** `/api/v1/interactive_session`。

#### 3.2.2. 消息格式 (JSON)

- **客户端 -> 服务器:**
  ```json
  {
    "type": "user_input",
    "payload": {
      "text": "你好，请帮我创建一个登录表单。",
      "files": [
        { "name": "style.css", "content": "..." }
      ]
    }
  }
  ```

- **服务器 -> 客户端:**
  ```json
  // Agent 思考过程
  { "type": "thought", "payload": "我需要先创建一个 HTML 结构..." }

  // Agent 使用工具
  { "type": "tool_usage", "payload": { "name": "file_writer", "input": "..." } }

  // Agent 生成的部分结果（流式更新）
  { "type": "partial_result", "payload": { "resultType": "code", "content": "<div..." } }

  // Agent 完成任务
  { "type": "final_result", "payload": { "resultType": "code", "content": "<html>...</html>" } }

  // 错误信息
  { "type": "error", "payload": { "message": "工具执行失败" } }
  ```

#### 3.2.3. Agent 执行逻辑

- 后端服务在收到 `user_input` 消息后，启动一个 CrewAI 的执行实例。
- 通过重写 Agent 的回调方法或使用事件监听器，捕获 Agent 执行过程中的各个事件（如思考、工具调用）。
- 将这些事件实时地通过 WebSocket 发送给前端。
- 对于代码或文档生成任务，Agent 应配置为流式输出，以便后端可以捕reinterpret_cast<char*>(this)将 `partial_result` 消息发送给前端，实现打字机效果或实时预览。

## 4. 技术选型

- **前端:**
  - **框架:** Next.js (React)
  - **UI 组件:** Shadcn UI / Radix UI
  - **布局:** `react-resizable-panels`
  - **代码编辑器:** Monaco Editor
  - **Markdown 渲染:** `react-markdown`
  - **状态管理:** Zustand
- **后端:**
  - **框架:** FastAPI
  - **WebSocket 支持:** FastAPI 内置
- **核心逻辑:** CrewAI

## 5. 集成策略：融入现有平台 vs. 单独应用

这是一个关键的战略决策。**强烈建议将此交互式 Agent 功能作为 CrewAI Studio 平台的一个新模块进行集成，而不是创建一个全新的、独立的前端应用。**

### 5.1. 评价与建议

- **复用基础设施:** CrewAI Studio 已具备完善的前后端架构，包括用户认证、数据库、API 路由、UI 组件库和布局。重新开发这些基础设施将耗费大量不必要的时间和精力。
- **统一用户体验:** 集成可以提供无缝的用户体验。用户可以在同一平台完成工作流设计、团队运行和 Agent 单独测试，避免了在不同应用之间切换的割裂感。
- **数据与逻辑共享:** 集成使得数据和业务逻辑的共享变得简单。例如，在交互式会话中调试好的 Agent 配置可以一键保存为平台中的一个标准 Agent 模板，反之亦然。
- **降低开发与维护成本:** 在现有项目中增加一个新页面和 API 端点，远比维护一个独立的代码库要高效得多。

### 5.2. 建设性意见（集成方案）

1.  **创建新页面:**
    - 在 `frontend/src/app/[locale]/` 目录下创建一个新的路由，例如 `playground/page.tsx`。
    - 此页面将实现本文档中设计的 `InteractiveAgentPage` 布局和功能。

2.  **添加入口点:**
    - 在 `frontend/src/components/layout/main-layout.tsx` 的侧边栏菜单中，可以在 `Build` 或 `Operate` 分组下增加一个新的导航项，如 "Playground" 或 "交互测试"，链接到 `/playground`。

3.  **扩展后端 API:**
    - 在现有的 FastAPI 应用中，添加一个新的 WebSocket 端点 `/api/v1/interactive_session`。
    - 该端点的逻辑将负责处理实时的 Agent 交互。

4.  **功能联动:**
    - **从交互到模板:** 在交互式会话结束后，提供“保存为 Agent 模板”的功能，将当前 Agent 的配置（角色、目标、工具等）保存到数据库中，使其可以在工作流编辑器中使用。
    - **从模板到交互:** 在工作流模板编辑器或 Crew 管理页面中，为每个 Agent 节点增加一个“在 Playground 中测试”的按钮。点击后，将用户导航到 `/playground` 页面，并预加载该 Agent 的配置。

通过这种集成方式，新的交互式功能不仅能独立使用，还能与平台的核心功能（工作流和 Crew 管理）深度融合，形成一个功能强大且体验一致的 Agent 开发与编排平台。

## 6. 开发步骤建议

1.  **前端:**
    1.  搭建基本的双栏可调整布局。
    2.  实现 `ChatPanel` 组件的基本结构和消息展示。
    3.  实现 `ResultPanel` 的标签页结构。
    4.  集成 Monaco Editor 到 `CodeTab`。
    5.  集成 `react-markdown` 到 `DocumentTab`。
    6.  设置 WebSocket 客户端连接逻辑。
2.  **后端:**
    1.  创建 WebSocket 端点。
    2.  实现基本的 Agent 执行逻辑，并能将 Agent 的最终输出返回。
    3.  实现流式输出，将 Agent 的中间步骤通过 WebSocket 发送。
3.  **联调:**
    1.  对接前后端 WebSocket 消息，确保数据格式正确。
    2.  调试实时更新逻辑，确保前端能够正确处理和展示来自后端的流式数据。
