# 快速开始指南

本指南将帮助您在 5 分钟内快速启动 CrewAI Studio。

## 前提条件

确保您的系统已安装以下软件：

- **Python 3.8+**
- **Node.js 16.x+**
- **Git**

## 第一步：克隆项目

```bash
git clone <repository-url>
cd crewai-studio
```

## 第二步：设置后端

```bash
cd backend

# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows:
.venv\Scripts\activate
# Unix/Linux/Mac:
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
alembic upgrade head
```

## 第三步：设置前端

```bash
cd frontend
npm install
```

## 第四步：配置环境变量

创建环境配置文件：

**后端 (.env)**:
```env
DATABASE_URL=sqlite:///./crewai_studio.db
SECRET_KEY=your-secret-key-here
DEBUG=True
CORS_ORIGINS=["http://localhost:3000"]
```

**前端 (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 第五步：启动应用

### 启动后端服务

```bash
cd backend
python main.py
```

后端将在 http://localhost:8000 启动

### 启动前端服务

```bash
cd frontend
npm run dev
```

前端将在 http://localhost:3000 启动

## 验证安装

1. **访问前端**: 打开浏览器访问 http://localhost:3000
2. **查看API文档**: 访问 http://localhost:8000/docs
3. **测试API连接**: 前端应该能够正常加载数据

## 下一步

- 📖 阅读 [数据库迁移工作流](database/migration-workflow.md)
- 🚢 了解 [部署指南](deployment/deployment-guide.md)
- 🔧 查看 [开发指南](development/project-structure.md)

## 常见问题

### 端口冲突

如果端口被占用，可以修改配置：

```bash
# 前端使用其他端口
npm run dev -- -p 3001

# 后端修改 main.py 中的端口配置
```

### 数据库连接问题

检查数据库文件权限和路径：

```bash
# 检查数据库文件
ls -la backend/crewai_studio.db

# 重新初始化数据库
cd backend
alembic downgrade base
alembic upgrade head
```

### 依赖安装失败

确保使用正确的 Python 和 Node.js 版本：

```bash
# 检查版本
python --version
node --version
npm --version

# 清理并重新安装
pip cache purge
pip install -r requirements.txt

npm cache clean --force
npm install
```