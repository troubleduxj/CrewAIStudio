# CrewAI Studio

<p align="center">
  <a href="https://github.com/troubleduxj/CrewAIStudio">
    <img src="https://img.shields.io/github/stars/troubleduxj/CrewAIStudio?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/troubleduxj/CrewAIStudio/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/troubleduxj/CrewAIStudio" alt="License">
  </a>
  <a href="https://github.com/troubleduxj/CrewAIStudio/issues">
    <img src="https://img.shields.io/github/issues/troubleduxj/CrewAIStudio" alt="GitHub Issues">
  </a>
</p>

<p align="center">
  一个用于管理 AI 团队、代理和工作流的综合平台，具有现代化的 Web 界面。
</p>

## ✨ 功能特性

- **可视化工作流编辑器**：通过拖放方式设计和管理复杂的 AI 工作流。
- **AI 代理管理**：轻松创建、配置和监控您的 AI 代理团队。
- **多语言支持**：界面支持中文和英文，方便全球用户使用。
- **实时监控**：跟踪任务执行情况，实时查看日志和结果。
- **灵活的部署选项**：支持 Docker 快速部署和传统手动部署。
- **强大的数据库迁移**：使用 Alembic 管理数据库架构，确保数据一致性。

## 🚀 快速开始

### 1. 环境准备

- **Python**: 3.8+
- **Node.js**: 16.x+
- **Docker**: 最新版本 (推荐)

### 2. 本地开发

#### 前端 (端口 3000)
```bash
cd frontend
npm install
npm run dev
```

#### 后端 (端口 8000)
```bash
cd backend
# 建议创建并激活虚拟环境
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 3. Docker 部署

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
python -m scripts.migration_helpers generate -m "Your migration message"

# 应用迁移
python -m scripts.migration_helpers apply
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
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # React 组件
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── services/         # API 服务
│   │   └── stores/           # 状态管理
│   └── public/               # 静态资源
├── backend/                  # FastAPI 后端应用
│   ├── app/                  # 应用核心代码
│   │   ├── api/              # API 路由
│   │   ├── core/             # 核心配置
│   │   ├── models/           # SQLAlchemy 模型
│   │   ├── schemas/          # Pydantic 模型
│   │   └── services/         # 业务逻辑
│   ├── alembic/              # 数据库迁移文件
│   └── scripts/              # 辅助脚本
├── docs/                     # 项目文档
│   ├── zh/                   # 中文文档
│   └── en/                   # 英文文档
└── deploy.ps1                # Docker 部署脚本
```

## 🔗 相关链接

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

## 🤝 贡献

我们欢迎各种形式的贡献！如果您有任何想法、建议或发现了 bug，请随时提交 [Issues](https://github.com/troubleduxj/CrewAIStudio/issues) 或 [Pull Requests](https://github.com/troubleduxj/CrewAIStudio/pulls)。

## 📄 许可证

本项目采用 MIT 许可证。详情请参见 [LICENSE](LICENSE) 文件。
