# 项目结构说明

## 📁 整体项目结构

```
crewai-studio/
├── frontend/                 # Next.js 前端应用
│   ├── src/                 # 源代码目录
│   │   ├── app/            # App Router 页面
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── lib/            # 工具库
│   │   ├── services/       # API 服务
│   │   ├── stores/         # 状态管理
│   │   └── types/          # TypeScript 类型定义
│   ├── public/             # 静态资源
│   ├── pages/              # Pages Router 页面（备用）
│   └── package.json        # 前端依赖配置
├── backend/                 # FastAPI 后端应用
│   ├── app/                # 应用核心代码
│   │   ├── api/           # API 路由
│   │   ├── core/          # 核心配置
│   │   ├── models/        # 数据模型
│   │   ├── schemas/       # Pydantic 模式
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   ├── alembic/           # 数据库迁移
│   ├── scripts/           # 辅助脚本
│   ├── tests/             # 测试文件
│   └── requirements.txt   # Python 依赖
├── docs/                   # 项目文档
│   ├── zh/                # 中文文档
│   └── en/                # 英文文档
├── .kiro/                  # Kiro IDE 配置
└── docker-compose.yml      # Docker 编排配置
```

## 🎨 前端架构

### 技术栈
- **框架**: Next.js 14 (App Router + Pages Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: Shadcn/ui
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **可视化**: React Flow
- **国际化**: next-intl

### 核心目录详解

#### `/src/app` - App Router 页面
```
src/app/
├── [locale]/               # 国际化路由
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
└── globals.css            # 全局样式
```

#### `/src/components` - 组件库
```
src/components/
├── crews/                 # Crew 相关组件
│   ├── CrewCard.tsx      # Crew 卡片
│   ├── CrewWizard.tsx    # Crew 创建向导
│   └── ExecutionDialog.tsx # 执行对话框
├── workflow-templates/    # 工作流模板组件
│   ├── TemplateList.tsx  # 模板列表
│   ├── VisualEditor.tsx  # 可视化编辑器
│   └── NodeEditor.tsx    # 节点编辑器
├── shared/               # 共享组件
│   ├── LazyImage.tsx     # 懒加载图片
│   ├── LoadingStates.tsx # 加载状态
│   └── ErrorBoundary.tsx # 错误边界
├── layout/               # 布局组件
│   ├── header.tsx        # 页头
│   └── main-layout.tsx   # 主布局
└── providers/            # 上下文提供者
    ├── ClientProviders.tsx # 客户端提供者
    └── QueryProvider.tsx   # 查询提供者
```

#### `/src/hooks` - 自定义 Hooks
```
src/hooks/
├── useCrews.ts           # Crew 数据管理
├── useWorkflowTemplates.ts # 工作流模板管理
├── useI18n.ts            # 国际化
├── usePerformanceOptimization.ts # 性能优化
└── useKeyboardShortcuts.ts # 键盘快捷键
```

#### `/src/services` - API 服务
```
src/services/
├── crewService.ts        # Crew API 服务
├── workflowTemplateService.ts # 工作流模板服务
└── executionService.ts   # 执行服务
```

#### `/src/stores` - 状态管理
```
src/stores/
├── crewStore.ts          # Crew 状态
├── workflowTemplateStore.ts # 工作流模板状态
└── uiStore.ts            # UI 状态
```

#### `/src/types` - 类型定义
```
src/types/
├── crew.ts               # Crew 相关类型
├── workflow.ts           # 工作流相关类型
└── common.ts             # 通用类型
```

### 路由结构

#### App Router (主要)
- `/` - 首页
- `/crews` - Crew 列表
- `/crews/create` - 创建 Crew
- `/crews/[id]/edit` - 编辑 Crew
- `/workflow-templates` - 工作流模板列表
- `/workflow-templates/create` - 创建模板
- `/workflow-templates/[id]/edit` - 编辑模板

#### Pages Router (备用)
- `/pages/crews/` - Crew 相关页面组件
- `/pages/workflow-templates/` - 工作流模板页面组件

## 🔧 后端架构

### 技术栈
- **框架**: FastAPI
- **语言**: Python 3.10+
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: SQLAlchemy
- **迁移**: Alembic
- **AI框架**: CrewAI
- **日志**: Loguru

### 核心目录详解

#### `/app` - 应用核心
```
app/
├── api/                  # API 路由
│   └── v1/
│       └── endpoints/    # API 端点
│           ├── crews.py  # Crew API
│           └── workflow_templates.py # 工作流模板 API
├── core/                 # 核心配置
│   ├── config.py        # 应用配置
│   ├── database.py      # 数据库配置
│   └── security.py      # 安全配置
├── models/              # SQLAlchemy 模型
│   ├── crew.py         # Crew 模型
│   └── workflow_template.py # 工作流模板模型
├── schemas/             # Pydantic 模式
│   ├── crew.py         # Crew 模式
│   └── workflow_template.py # 工作流模板模式
├── services/            # 业务逻辑
│   ├── crew_service.py # Crew 服务
│   └── workflow_template_service.py # 工作流模板服务
└── utils/               # 工具函数
    ├── migration.py     # 迁移工具
    └── migration_validator.py # 迁移验证
```

#### `/alembic` - 数据库迁移
```
alembic/
├── versions/            # 迁移版本文件
├── env.py              # 迁移环境配置
└── script.py.mako      # 迁移脚本模板
```

#### `/scripts` - 辅助脚本
```
scripts/
├── migration_helpers.py # 迁移辅助工具
├── migrate.bat         # Windows 批处理脚本
├── migrate.sh          # Unix/Linux 脚本
└── migrate.ps1         # PowerShell 脚本
```

#### `/tests` - 测试文件
```
tests/
├── conftest.py         # 测试配置
├── test_alembic_configuration.py # Alembic 配置测试
└── test_migration_workflow.py # 迁移工作流测试
```

## 📚 文档结构

### 中文文档 (`/docs/zh`)
```
docs/zh/
├── README.md           # 中文主文档
├── quickstart.md       # 快速开始
├── database/           # 数据库相关
│   ├── migration-workflow.md # 迁移工作流
│   ├── migration-reference.md # 迁移命令参考
│   └── migration-errors.md # 迁移错误处理
├── deployment/         # 部署相关
│   └── deployment-guide.md # 部署指南
├── development/        # 开发相关
│   └── project-structure.md # 项目结构
└── troubleshooting/    # 故障排除
    └── common-issues.md # 常见问题
```

### 英文文档 (`/docs/en`)
```
docs/en/
└── (待添加英文文档)
```

## 🔄 数据流

### 前端数据流
```
用户交互 → 组件 → Hooks → Services → API → 后端
                ↓
              Stores (状态管理)
                ↓
              组件重新渲染
```

### 后端数据流
```
API请求 → 路由 → 服务层 → 数据模型 → 数据库
                ↓
              响应 → JSON序列化 → 前端
```

## 🛠️ 开发工具配置

### IDE 配置
- **Kiro IDE**: `.kiro/` 目录包含IDE特定配置
- **VSCode**: 推荐的扩展和设置
- **TypeScript**: 严格模式配置

### 代码质量
- **ESLint**: 前端代码检查
- **Prettier**: 代码格式化
- **Black**: Python代码格式化
- **mypy**: Python类型检查

### 构建工具
- **Next.js**: 前端构建和开发服务器
- **Tailwind CSS**: 样式构建
- **TypeScript**: 类型检查和编译

## 🚀 部署架构

### 开发环境
```
前端 (localhost:3000) ←→ 后端 (localhost:8000) ←→ SQLite
```

### 生产环境
```
Nginx ←→ 前端容器 ←→ 后端容器 ←→ PostgreSQL
```

### Docker 容器
- **frontend**: Next.js 应用容器
- **backend**: FastAPI 应用容器
- **database**: PostgreSQL 数据库容器
- **nginx**: 反向代理容器

## 📋 最佳实践

### 代码组织
1. **单一职责**: 每个组件/服务只负责一个功能
2. **类型安全**: 使用 TypeScript 确保类型安全
3. **错误处理**: 统一的错误处理机制
4. **性能优化**: 懒加载、缓存、防抖等

### 文件命名
- **组件**: PascalCase (如 `CrewCard.tsx`)
- **Hooks**: camelCase with use prefix (如 `useCrews.ts`)
- **服务**: camelCase with Service suffix (如 `crewService.ts`)
- **类型**: PascalCase (如 `CrewType`)

### 导入顺序
1. React/Next.js 相关
2. 第三方库
3. 内部组件
4. 内部工具/类型
5. 相对路径导入

这个项目结构设计支持快速开发、易于维护，并且具有良好的可扩展性。