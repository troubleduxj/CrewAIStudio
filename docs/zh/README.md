# CrewAI Studio 中文文档

欢迎使用 CrewAI Studio！这是一个用于管理 AI 团队、代理和工作流的综合平台，具有现代化的 Web 界面。

## 文档目录

### 🚀 快速开始
- [安装指南](installation.md) - 环境设置和依赖安装
- [快速开始](quickstart.md) - 5分钟快速上手

### 🗄️ 数据库管理
- [数据库迁移工作流](database/migration-workflow.md) - 完整的开发者指南
- [迁移命令参考](database/migration-reference.md) - 常用命令速查
- [迁移错误处理](database/migration-errors.md) - 常见问题解决

### 🚢 部署指南
- [部署文档](deployment/deployment-guide.md) - 完整的部署流程
- [Docker 部署](deployment/docker-deployment.md) - 容器化部署
- [生产环境配置](deployment/production-setup.md) - 生产环境最佳实践

### 🔧 开发指南
- [项目结构](development/project-structure.md) - 代码组织结构
- [开发环境设置](development/dev-environment.md) - 本地开发配置
- [API 文档](development/api-docs.md) - 后端 API 接口

### 📋 故障排除
- [常见问题](troubleshooting/common-issues.md) - 常见问题及解决方案
- [性能优化](troubleshooting/performance.md) - 性能调优指南

## 项目结构

```
crewai-studio/
├── frontend/          # Next.js 前端应用
├── backend/           # FastAPI 后端应用
│   ├── alembic/      # 数据库迁移文件
│   ├── scripts/      # 迁移辅助脚本
│   └── app/          # 应用代码
├── docs/             # 项目文档
│   ├── zh/          # 中文文档
│   └── en/          # 英文文档
└── deploy.ps1       # Docker 部署脚本
```

## 快速命令

### 启动开发环境

```bash
# 前端 (端口 3000)
cd frontend
npm install
npm run dev

# 后端 (端口 8000)
cd backend
.\.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 数据库迁移

```bash
# 检查迁移状态
python -m scripts.migration_helpers status

# 生成新迁移
python -m scripts.migration_helpers generate -m "描述信息"

# 应用迁移
python -m scripts.migration_helpers apply
```

### Docker 部署

```bash
# 构建并启动所有服务
.\deploy.ps1 build
.\deploy.ps1 start

# 查看状态
.\deploy.ps1 status

# 查看日志
.\deploy.ps1 logs
```

## 获取帮助

- 📖 查看详细文档
- 🐛 检查故障排除部分
- 💬 联系开发团队

## 版本信息

当前版本：1.0.0  
最后更新：2025年1月