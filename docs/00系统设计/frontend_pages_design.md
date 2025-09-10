# CrewAI Studio 前端功能页面设计文档

## 📋 文档概述

本文档详细描述了 CrewAI Studio 前端应用的功能页面设计，包括页面结构、UI组件、交互逻辑、路由设计和用户体验规范。

---

## 🏗️ 整体架构设计

### 应用架构
```
┌─────────────────────────────────────────────────────────────┐
│                    CrewAI Studio Frontend                   │
├─────────────────────────────────────────────────────────────┤
│                      路由层 (Pages Router)                  │
├─────────────────────────────────────────────────────────────┤
│                      布局层 (Layout)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Header    │ │  Sidebar    │ │ Main Content│ │ Footer  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      组件层 (Components)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Dashboard   │ │ Workflow    │ │ Agent/Task  │ │ Tools   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      UI层 (shadcn/ui)                       │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈
- **框架**: Next.js 13+ (Pages Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui + Radix UI
- **状态管理**: React Hook Form + Context API
- **图标**: Lucide React
- **国际化**: next-i18next
- **工作流可视化**: React Flow

---

## 🗺️ 路由设计

### 路由结构 (v1.1)
```
/                     # 首页 (重定向到 /dashboard)
├── /dashboard        # 仪表板页面
├── /workflow-templates # 工作流模板设计器
├── /crews            # Crew (执行团队) 管理面板
├── /tools            # 工具管理面板
├── /traces           # 执行轨迹查看
├── /llm-connections  # LLM 连接管理
├── /resources        # 资源管理
└── /settings         # 系统设置
```

### 路由配置
- **国际化支持**: 支持中文(zh)和英文(en)
- **静态生成**: 使用 `getStaticProps` 进行服务端渲染
- **动态路由**: 支持参数化路由 (如 `/workflow/[id]`)

---

## 📱 页面详细设计

### 1. 首页 (`/index.tsx`)

#### 功能描述
- 应用入口页面
- 自动重定向到仪表板

#### 页面结构
```typescript
export default function HomePage() {
  // 重定向逻辑
  useEffect(() => {
    router.push('/dashboard');
  }, []);
  
  return <div>Loading...</div>;
}
```

---

### 2. 仪表板页面 (`/dashboard`)

#### 功能描述
- 系统概览和快速访问
- 显示研究分析师演示组件
- 提供系统状态监控

#### 页面结构
```typescript
interface DashboardPageProps {
  // 页面属性定义
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <div>
        <h1>{t('dashboard')}</h1>
        <ResearchAnalystDemo />
      </div>
    </MainLayout>
  );
}
```

#### 核心组件
- **ResearchAnalystDemo**: 研究分析师演示组件
- **StatusMonitor**: 系统状态监控组件

#### UI设计要点
- 响应式网格布局
- 卡片式信息展示
- 实时数据更新

---

### 3. 工作流模板页面 (`/workflow-templates`)

#### 功能描述
- **设计和管理可复用的工作流“蓝图” (Blueprint)**
- 可视化设计工作流结构，定义 Agent 角色和 Task 依赖
- 不涉及具体的执行，仅作为创建 Crew 的模板

#### 页面结构
```typescript
interface WorkflowPageState {
  workflowName: string;
  isExecuting: boolean;
  executionLogs: string[];
  isToolsPanelOpen: boolean;
  currentView: 'visual-editor' | 'execution';
  agents: Agent[];
  tasks: Task[];
  tools: Tool[];
  nodes: Node[];
  selectedNode: Node | null;
}

export default function WorkflowPage() {
  // 状态管理
  // 事件处理
  // 渲染逻辑
}
```

#### 核心组件
- **WorkflowVisualizer**: React Flow 可视化编辑器
- **WorkflowToolPanel**: 工具面板
- **WorkflowNodeEditor**: 节点编辑器
- **WorkflowExecutionEvents**: 执行事件监控

#### 核心操作
- **新建模板**: 进入全屏的可视化编辑器。
- **编辑模板**: 修改现有模板结构。
- **克隆模板**: 快速复制一个模板。
- **从模板创建 Crew**: 关键操作，链接到 Crew 创建流程。

#### UI设计要点
- **卡片式/列表式布局** 展示所有模板。
- **可视化编辑器**: 以 React Flow 为核心，侧边栏提供 Agent 和 Task 节点用于拖拽。
- **节点配置**: 在编辑器中，Agent 节点只定义 **角色 (Role)** 和 **目标 (Goal)**，不涉及具体 LLM。

---

### 4. Crews 页面 (`/crews`)

#### 功能描述
- **配置、管理和运行具体的 AI 执行团队 (Crew 实例)**
- 用户在此页面扮演 **“运营者”** 的角色，将模板实例化为可执行的团队。

#### 页面结构
```typescript
export default function CrewsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1>我的团队 (Crews)</h1>
            <p>创建、配置并运行您的 AI 执行团队</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            创建团队
          </Button>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 活跃团队 */}
          {/* 团队总数 */}
          {/* 任务成功率 */}
        </div>
        
        {/* Crew 列表 */}
        <CrewList />
      </div>
    </MainLayout>
  );
}
```

#### 核心组件
- **CrewList**: 展示所有 Crew 实例的列表。
- **CrewCard**: 单个 Crew 实例的卡片，显示名称、所用模板、状态等。
- **CrewCreationWizard**: 一个分步模态框或页面，用于创建新的 Crew。

#### 功能模块

##### 4.1 Crew 创建流程 (Wizard)
1.  **第一步: 选择蓝图**: 从 `Workflow Templates` 列表中选择一个模板。
2.  **第二步: 配置团队**: 核心步骤。界面列出模板中定义的所有 Agent 角色，用户需要为 **每个角色** 配置具体的执行参数：
    -   **LLM 选择**: 从下拉列表中选择已连接的 LLM (e.g., `openai-gpt4o`)。
    -   **工具配置**: 为需要使用工具的 Agent 填入 API Key 等。
    -   **参数微调**: 调整 `temperature` 等高级参数。
3.  **第三步: 命名并保存**: 为 Crew 实例命名。

##### 4.2 Crew 管理
- **运行 (Run)**: 弹出一个简洁的输入框，让用户输入本次任务的变量，然后异步启动执行。
- **编辑配置**: 修改 Crew 的 LLM 或工具配置。
- **查看执行历史**: 跳转到 `Traces` 页面并筛选出该 Crew 的所有历史记录。
- **状态监控**: 在卡片上实时显示 Crew 的状态（如 `准备就绪`, `执行中`）。

---

### 5. 工具管理面板 (`/tools`)

#### 功能描述
- 工具的管理和配置
- 工具库浏览
- 自定义工具创建

#### 页面结构
```typescript
export default function ToolsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1>工具面板</h1>
            <p>管理和配置您的工具集合</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            添加工具
          </Button>
        </div>
        
        {/* 工具统计 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 活跃工具 */}
          {/* 工具类别 */}
          {/* 使用频率 */}
        </div>
        
        {/* 工具面板 */}
        <WorkflowToolPanel />
      </div>
    </MainLayout>
  );
}
```

#### 核心组件
- **WorkflowToolPanel**: 工作流工具面板
- **ToolConfig**: 工具配置组件
- **ToolLibrary**: 工具库组件

#### 功能模块

##### 6.1 工具分类
- System 工具
- Network 工具
- Files 工具
- 自定义工具

##### 6.2 工具管理
- 工具安装和卸载
- 配置管理
- 版本控制

---

### 6. 执行轨迹页面 (`/traces`)

#### 功能描述
- 系统执行轨迹的查看和分析
- 日志管理和搜索
- 性能监控

#### 页面结构
```typescript
export default function TracesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Traces</h1>
            <p>查看和分析系统执行轨迹</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
          </div>
        </div>
        
        {/* 轨迹统计 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 今日轨迹 */}
          {/* 成功率 */}
          {/* 平均耗时 */}
          {/* 错误数量 */}
        </div>
        
        {/* 日志查看器 */}
        <LogViewer />
      </div>
    </MainLayout>
  );
}
```

#### 核心组件
- **LogViewer**: 日志查看器
- **TraceAnalyzer**: 轨迹分析器
- **PerformanceMonitor**: 性能监控器

---

### 7. LLM 连接管理 (`/llm-connections`)

#### 功能描述
- 大语言模型连接配置
- API密钥管理
- 连接状态监控

#### 页面结构
- 连接列表和状态
- 配置表单
- 测试连接功能

---

### 8. 资源管理 (`/resources`)

#### 功能描述
- 系统资源监控
- 文件管理
- 存储空间管理

#### 页面结构
- 资源使用统计
- 文件浏览器
- 清理工具

---

### 9. 系统设置 (`/settings`)

#### 功能描述
- 系统配置管理
- 用户偏好设置
- 主题和语言切换

#### 页面结构
```typescript
export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1>设置面板</h1>
          <p>管理您的账户设置和应用偏好</p>
        </div>
        
        <div className="grid gap-6">
          {/* 用户设置 */}
          <Card>
            <CardHeader>
              <CardTitle>用户设置</CardTitle>
              <CardDescription>管理您的个人信息和账户设置</CardDescription>
            </CardHeader>
            <CardContent>
              {/* 用户信息表单 */}
            </CardContent>
          </Card>
          
          {/* 系统设置 */}
          {/* 外观设置 */}
          {/* 通知设置 */}
        </div>
      </div>
    </MainLayout>
  );
}
```

#### 功能模块
- 用户信息管理
- 系统配置
- 主题切换
- 语言设置
- 通知配置

---

## 🎨 UI/UX 设计规范

### 设计原则
1. **一致性**: 统一的视觉语言和交互模式
2. **简洁性**: 清晰的信息层次和简洁的界面
3. **响应性**: 适配不同屏幕尺寸和设备
4. **可访问性**: 支持键盘导航和屏幕阅读器

### 布局规范

#### 主布局 (MainLayout)
```typescript
interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>{/* Logo 和标题 */}</SidebarHeader>
        <SidebarContent>{/* 导航菜单 */}</SidebarContent>
        <SidebarFooter>{/* 用户信息 */}</SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

#### 页面布局模式
1. **单栏布局**: 简单页面 (设置、关于)
2. **双栏布局**: 列表+详情 (Agent、Task 管理)
3. **三栏布局**: 工具面板+编辑器+属性面板 (工作流编辑器)

### 组件规范

#### 卡片组件
- 使用 `Card` 组件包装内容块
- 统一的圆角和阴影
- 响应式间距

#### 按钮组件
- 主要操作使用 `Button` (default)
- 次要操作使用 `Button variant="outline"`
- 危险操作使用 `Button variant="destructive"`

#### 表单组件
- 使用 `react-hook-form` 进行表单管理
- 统一的验证和错误提示
- 响应式表单布局

### 色彩规范
- **主色调**: 基于 CSS 变量的主题色
- **语义色彩**: 成功(绿)、警告(黄)、错误(红)、信息(蓝)
- **中性色彩**: 文本、边框、背景的灰度色阶

### 字体规范
- **标题**: font-bold, 不同级别的 text-size
- **正文**: font-normal, text-sm/text-base
- **辅助文本**: text-muted-foreground, text-xs/text-sm

---

## 🔄 交互设计

### 导航交互
- **侧边栏**: 可折叠，支持图标模式
- **面包屑**: 显示当前位置和层级
- **标签页**: 用于同一页面内的内容切换

### 数据交互
- **加载状态**: 使用 Skeleton 和 Spinner
- **空状态**: 友好的空数据提示
- **错误状态**: 清晰的错误信息和恢复建议

### 操作反馈
- **Toast 通知**: 操作成功/失败提示
- **确认对话框**: 危险操作确认
- **进度指示**: 长时间操作的进度显示

### 拖拽交互
- **工作流编辑器**: 支持节点拖拽和连接
- **工具面板**: 工具拖拽到画布
- **列表排序**: 支持拖拽排序

---

## 📱 响应式设计

### 断点设计
```css
/* Tailwind CSS 断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
2xl: 1536px /* 超超大屏幕 */
```

### 布局适配
- **移动端**: 单栏布局，折叠侧边栏
- **平板端**: 双栏布局，可选侧边栏
- **桌面端**: 多栏布局，固定侧边栏

### 组件适配
- **网格系统**: 响应式列数调整
- **表格组件**: 水平滚动和列隐藏
- **对话框**: 全屏显示 (移动端)

---

## 🌐 国际化设计

### 语言支持
- **中文 (zh)**: 默认语言
- **英文 (en)**: 国际化支持

### 实现方式
```typescript
// 使用 next-i18next
import { useTranslation } from 'next-i18next';

export default function Component() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('dashboard')}</h1>
      <p>{t('welcome_message')}</p>
    </div>
  );
}
```

### 文本处理
- **静态文本**: 翻译文件管理
- **动态文本**: 支持参数插值
- **日期时间**: 本地化格式

---

## 🔧 状态管理

### 状态分类
1. **组件状态**: useState, useReducer
2. **表单状态**: react-hook-form
3. **全局状态**: Context API
4. **服务器状态**: SWR/React Query (未来)

### Context 设计
```typescript
// 主题上下文
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: string) => void;
}

// 用户上下文
interface UserContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

// 工作流上下文
interface WorkflowContextType {
  currentWorkflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];
  updateNode: (id: string, data: Partial<Node>) => void;
}
```

---

## 🚀 性能优化

### 代码分割
- **页面级分割**: 自动路由分割
- **组件级分割**: React.lazy + Suspense
- **第三方库分割**: 动态导入

### 渲染优化
- **React.memo**: 防止不必要的重渲染
- **useMemo/useCallback**: 缓存计算结果和函数
- **虚拟滚动**: 大列表性能优化

### 资源优化
- **图片优化**: Next.js Image 组件
- **字体优化**: 字体预加载和子集化
- **CSS优化**: Tailwind CSS 的 purge

---

## 🧪 测试策略

### 测试类型
1. **单元测试**: 组件和工具函数
2. **集成测试**: 页面和用户流程
3. **E2E测试**: 关键业务流程

### 测试工具
- **Jest**: 单元测试框架
- **React Testing Library**: 组件测试
- **Cypress**: E2E 测试

### 测试覆盖
- **组件测试**: 所有 UI 组件
- **页面测试**: 主要页面渲染
- **交互测试**: 用户操作流程

---

## 📚 开发指南

### 新页面开发流程
1. **创建页面文件**: `pages/new-page.tsx`
2. **添加路由配置**: 更新导航菜单
3. **实现页面组件**: 遵循设计规范
4. **添加国际化**: 更新翻译文件
5. **编写测试**: 单元测试和集成测试
6. **文档更新**: 更新设计文档

### 组件开发规范
1. **组件分类**: UI组件、业务组件、页面组件
2. **命名规范**: PascalCase 组件名
3. **文件结构**: 组件文件 + 样式文件 + 测试文件
4. **Props 设计**: TypeScript 接口定义
5. **文档注释**: JSDoc 格式注释

### 代码质量
- **ESLint**: 代码规范检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型安全
- **Husky**: Git hooks

---

## 🔮 未来规划

### 功能扩展
1. **实时协作**: 多用户同时编辑工作流
2. **版本控制**: 工作流版本管理
3. **模板市场**: 工作流模板分享
4. **插件系统**: 第三方插件支持

### 技术升级
1. **App Router**: 迁移到 Next.js App Router
2. **React 18**: 并发特性和 Suspense
3. **PWA**: 渐进式 Web 应用
4. **WebAssembly**: 性能关键模块

### 用户体验
1. **无障碍访问**: WCAG 2.1 AA 标准
2. **离线支持**: Service Worker
3. **快捷键**: 键盘操作支持
4. **个性化**: 用户偏好和自定义

---

## 📖 总结

本文档详细描述了 CrewAI Studio 前端应用的功能页面设计，涵盖了从整体架构到具体实现的各个方面。通过统一的设计规范和开发标准，确保应用的一致性、可维护性和用户体验。

### 关键特性
- **模块化设计**: 清晰的组件分层和职责分离
- **响应式布局**: 适配多种设备和屏幕尺寸
- **国际化支持**: 多语言用户界面
- **可访问性**: 符合 Web 可访问性标准
- **性能优化**: 代码分割和渲染优化
- **类型安全**: 完整的 TypeScript 支持

### 开发原则
1. **用户优先**: 以用户体验为中心的设计
2. **性能第一**: 优化加载速度和运行性能
3. **可维护性**: 清晰的代码结构和文档
4. **可扩展性**: 支持功能扩展和技术升级
5. **标准化**: 遵循行业最佳实践和标准

---

*本文档将随着项目的发展持续更新，确保设计规范与实际实现保持同步。*
