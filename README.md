# CrewAI Studio

一个用于管理 AI 团队、代理和工作流的综合平台，具有现代化的 Web 界面。

## 🚀 快速开始

### 前端 (端口 3000)
```bash
cd frontend
npm install
npm run dev
```

### 后端 (端口 8000)
```bash
cd backend
.\.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## 🗄️ 数据库迁移

本项目使用 Alembic 进行数据库架构管理。详细的迁移程序请参见：

- **[迁移工作流指南](docs/zh/database/migration-workflow.md)** - 完整的开发者指南
- **[迁移命令参考](docs/zh/database/migration-reference.md)** - 命令速查表
- **[部署指南](docs/zh/deployment/deployment-guide.md)** - 生产环境部署程序

### 快速迁移命令

```bash
# 检查迁移状态
python -m scripts.migration_helpers status

# 生成新迁移
python -m scripts.migration_helpers generate -m "描述信息"

# 应用迁移
python -m scripts.migration_helpers apply
```

## 🐳 Docker 部署

使用提供的部署脚本进行简便的 Docker 管理：

```bash
# 构建并启动所有服务
.\deploy.ps1 build
.\deploy.ps1 start

# 检查状态
.\deploy.ps1 status

# 查看日志
.\deploy.ps1 logs
```

## 📚 文档

### 中文文档
- **[快速开始](docs/zh/quickstart.md)** - 5分钟快速上手
- **[部署指南](docs/zh/deployment/deployment-guide.md)** - 完整的部署流程
- **[数据库迁移](docs/zh/database/migration-workflow.md)** - 数据库迁移指南
- **[项目结构](docs/zh/development/project-structure.md)** - 代码组织结构
- **[常见问题](docs/zh/troubleshooting/common-issues.md)** - 故障排除指南

### English Documentation
- **[Migration Workflow](docs/en/database/migration-workflow.md)** - Database migration guide
- **[Deployment Guide](docs/en/deployment/deployment-guide.md)** - Production deployment procedures
- **[Migration Utilities](docs/en/database/migration-utilities.md)** - Migration tools reference

### 在线文档
- **[API 文档](http://localhost:8000/docs)** - 交互式 API 文档（运行时可用）

## 📁 项目结构

```
crewai-studio/
├── frontend/                 # Next.js 前端应用
│   ├── src/                 # 源代码目录
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── services/       # API 服务
│   │   └── stores/         # 状态管理
│   └── pages/              # 页面路由
├── backend/                 # FastAPI 后端应用
│   ├── app/                # 应用核心代码
│   ├── alembic/           # 数据库迁移文件
│   ├── scripts/           # 迁移辅助脚本
│   └── tests/             # 测试文件
├── docs/                   # 项目文档
│   ├── zh/                # 中文文档
│   └── en/                # 英文文档
└── deploy.ps1             # Docker 部署脚本
```

## 🛠️ 开发环境

### 系统要求
- **Python**: 3.8+
- **Node.js**: 16.x+
- **数据库**: SQLite (开发) / PostgreSQL (生产)

### 推荐工具
- **IDE**: Kiro IDE / VSCode
- **容器**: Docker & Docker Compose
- **包管理**: pip (Python) / npm (Node.js)

## 🔗 相关链接

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

## 📄 许可证

本项目采用 MIT 许可证。详情请参见 LICENSE 文件。