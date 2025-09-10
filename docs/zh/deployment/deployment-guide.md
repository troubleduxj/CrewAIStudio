# CrewAI Studio 部署指南

## 概述

本指南涵盖了 CrewAI Studio 的完整部署过程，包括数据库迁移程序、环境设置和生产部署策略。

## 目录

1. [前提条件](#前提条件)
2. [环境设置](#环境设置)
3. [数据库迁移程序](#数据库迁移程序)
4. [开发部署](#开发部署)
5. [生产部署](#生产部署)
6. [Docker 部署](#docker-部署)
7. [故障排除](#故障排除)
8. [回滚程序](#回滚程序)

## 前提条件

### 系统要求

- **Python**：3.8 或更高版本
- **Node.js**：16.x 或更高版本
- **数据库**：SQLite（开发）或 PostgreSQL（生产）
- **Docker**：最新版本（用于容器化部署）

### 必需工具

- Git
- Python pip
- Node.js npm/yarn
- Docker & Docker Compose（可选）

## 环境设置

### 1. 克隆仓库

```bash
git clone <repository-url>
cd crewai-studio
```

### 2. 后端设置

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
```

### 3. 前端设置

```bash
cd frontend
npm install
```

### 4. 环境配置

创建环境文件：

**后端 (.env)**：
```env
DATABASE_URL=sqlite:///./crewai_studio.db
SECRET_KEY=your-secret-key-here
DEBUG=True
CORS_ORIGINS=["http://localhost:3000"]
```

**前端 (.env.local)**：
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 数据库迁移程序

### 初始设置

对于新部署，使用迁移初始化数据库：

```bash
cd backend

# 检查迁移状态
alembic current

# 应用所有迁移
alembic upgrade head
```

### 开发工作流

在开发过程中进行架构更改时：

1. **修改模型**：编辑 `app/models/` 中的 SQLAlchemy 模型

2. **生成迁移**：
   ```bash
   # 使用辅助脚本（推荐）
   python -m scripts.migration_helpers generate -m "添加用户偏好表"
   
   # 或直接使用 alembic
   alembic revision --autogenerate -m "添加用户偏好表"
   ```

3. **审查迁移**：始终检查 `alembic/versions/` 中生成的迁移文件

4. **应用迁移**：
   ```bash
   # 使用辅助脚本
   python -m scripts.migration_helpers apply
   
   # 或直接使用 alembic
   alembic upgrade head
   ```

### 生产迁移工作流

对于生产部署，请仔细遵循以下步骤：

#### 部署前检查清单

- [ ] 数据库备份已完成并验证
- [ ] 迁移已在暂存环境中测试
- [ ] 回滚计划已准备
- [ ] 维护窗口已安排（如需要）
- [ ] 团队已通知部署

#### 迁移步骤

1. **备份数据库**：
   ```bash
   # PostgreSQL
   pg_dump -h localhost -U username -d crewai_studio > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # SQLite
   cp crewai_studio.db crewai_studio_backup_$(date +%Y%m%d_%H%M%S).db
   ```

2. **停止应用程序**（如迁移需要）：
   ```bash
   # 停止应用程序服务器
   systemctl stop crewai-studio
   # 或
   docker compose down
   ```

3. **应用迁移**：
   ```bash
   cd backend
   
   # 检查当前状态
   alembic current
   
   # 应用迁移
   alembic upgrade head
   
   # 验证迁移成功
   alembic current
   ```

4. **验证数据库架构**：
   ```bash
   # 运行验证脚本
   python -m scripts.migration_helpers validate
   ```

5. **启动应用程序**：
   ```bash
   # 启动应用程序服务器
   systemctl start crewai-studio
   # 或
   docker compose up -d
   ```

6. **部署后验证**：
   - 检查应用程序日志是否有错误
   - 验证 API 端点是否响应
   - 测试关键功能
   - 监控性能指标

## 开发部署

### 本地开发

1. **启动后端**：
   ```bash
   cd backend
   python main.py
   ```

2. **启动前端**：
   ```bash
   cd frontend
   npm run dev
   ```

3. **访问应用程序**：
   - 前端：http://localhost:3000
   - 后端 API：http://localhost:8000
   - API 文档：http://localhost:8000/docs

### 使用 Docker 开发

```bash
# 构建并启动所有服务
.\deploy.ps1 build
.\deploy.ps1 start

# 或直接使用 docker-compose
docker compose up --build
```

## 生产部署

### 传统服务器部署

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Python 和 Node.js
sudo apt install python3 python3-pip nodejs npm postgresql-client -y

# 创建应用程序用户
sudo useradd -m -s /bin/bash crewai
sudo su - crewai
```

#### 2. 应用程序设置

```bash
# 克隆仓库
git clone <repository-url> /home/crewai/crewai-studio
cd /home/crewai/crewai-studio

# 后端设置
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 前端设置
cd ../frontend
npm install
npm run build
```

#### 3. 数据库设置

```bash
# 在 .env 中配置 PostgreSQL 连接
DATABASE_URL=postgresql://username:password@localhost/crewai_studio

# 运行迁移
cd backend
alembic upgrade head
```

#### 4. 进程管理

创建 systemd 服务文件：

**后端服务** (`/etc/systemd/system/crewai-backend.service`)：
```ini
[Unit]
Description=CrewAI Studio 后端
After=network.target postgresql.service

[Service]
Type=simple
User=crewai
WorkingDirectory=/home/crewai/crewai-studio/backend
Environment=PATH=/home/crewai/crewai-studio/backend/.venv/bin
ExecStart=/home/crewai/crewai-studio/backend/.venv/bin/python main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

**前端服务** (`/etc/systemd/system/crewai-frontend.service`)：
```ini
[Unit]
Description=CrewAI Studio 前端
After=network.target

[Service]
Type=simple
User=crewai
WorkingDirectory=/home/crewai/crewai-studio/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

启用并启动服务：
```bash
sudo systemctl enable crewai-backend crewai-frontend
sudo systemctl start crewai-backend crewai-frontend
```

### 云部署（Docker）

#### 1. 准备生产环境

创建生产环境文件：

**docker-compose.prod.yml**：
```yaml
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/crewai_studio
      - DEBUG=False
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=crewai_studio
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 2. 使用迁移部署

```bash
# 构建镜像
docker compose -f docker-compose.prod.yml build

# 首先启动数据库
docker compose -f docker-compose.prod.yml up -d db

# 等待数据库准备就绪
sleep 30

# 运行迁移
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

# 启动所有服务
docker compose -f docker-compose.prod.yml up -d
```

## Docker 部署

### 使用提供的脚本

项目包含用于简化 Docker 管理的部署脚本：

```bash
# 构建所有服务
.\deploy.ps1 build

# 启动服务
.\deploy.ps1 start

# 检查状态
.\deploy.ps1 status

# 查看日志
.\deploy.ps1 logs

# 停止服务
.\deploy.ps1 stop

# 清理资源
.\deploy.ps1 clean
```

### 手动 Docker 命令

```bash
# 构建并启动
docker compose up --build -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 清理
docker compose down -v --rmi all
```

## 故障排除

### 常见迁移问题

#### 1. "目标数据库不是最新的"

```bash
# 检查当前状态
alembic current
alembic heads

# 应用缺失的迁移
alembic upgrade head
```

#### 2. "检测到多个头"

```bash
# 列出所有头
alembic heads

# 如需要合并头
alembic merge -m "合并迁移分支" head1 head2
alembic upgrade head
```

#### 3. 迁移因约束错误失败

- 检查违反新约束的现有数据
- 在添加约束之前向迁移添加数据清理
- 考虑首先使约束可为空

#### 4. 数据库连接问题

```bash
# 测试数据库连接
python -c "from app.core.database import engine; print(engine.execute('SELECT 1').scalar())"

# 检查环境变量
echo $DATABASE_URL
```

### 应用程序问题

#### 1. 后端无法启动

- 检查 Python 虚拟环境是否已激活
- 验证所有依赖项已安装：`pip install -r requirements.txt`
- 检查 `.env` 文件中的数据库连接
- 审查应用程序日志以了解具体错误

#### 2. 前端构建失败

- 清理 node_modules 并重新安装：`rm -rf node_modules && npm install`
- 检查 Node.js 版本兼容性
- 验证 `.env.local` 中的环境变量

#### 3. Docker 问题

- 检查 Docker 守护程序是否正在运行
- 验证 docker-compose.yml 语法
- 检查端口冲突：`netstat -tulpn | grep :3000`
- 审查容器日志：`docker compose logs <service-name>`

## 回滚程序

### 应用程序回滚

#### 1. 代码回滚

```bash
# 回滚到之前的提交
git log --oneline -10  # 找到要回滚到的提交
git checkout <commit-hash>

# 或回滚到之前的标签
git tag -l  # 列出可用标签
git checkout <tag-name>
```

#### 2. 数据库回滚

**⚠️ 警告**：数据库回滚可能导致数据丢失。继续之前务必备份。

```bash
# 回滚一个迁移
alembic downgrade -1

# 回滚到特定版本
alembic downgrade <revision-id>

# 检查回滚状态
alembic current
```

#### 3. 完整系统回滚

```bash
# 停止服务
.\deploy.ps1 stop

# 恢复数据库备份
# PostgreSQL：
psql -h localhost -U username -d crewai_studio < backup_file.sql

# SQLite：
cp backup_file.db crewai_studio.db

# 回滚代码
git checkout <previous-stable-commit>

# 重新构建并重启
.\deploy.ps1 build
.\deploy.ps1 start
```

### 紧急程序

#### 1. 完整系统恢复

如果系统完全损坏：

```bash
# 停止所有服务
docker compose down

# 从备份恢复
# ... 恢复数据库和代码 ...

# 重置到已知良好状态
git checkout main  # 或最后已知良好的提交
alembic upgrade head

# 重启服务
docker compose up --build -d
```

#### 2. 数据恢复

如果数据损坏但应用程序正常工作：

```bash
# 停止应用程序以防止进一步更改
.\deploy.ps1 stop

# 从备份恢复数据库
# ... 恢复程序 ...

# 验证数据完整性
python -m scripts.migration_helpers validate

# 重启应用程序
.\deploy.ps1 start
```

## 监控和维护

### 健康检查

创建监控脚本来检查系统健康：

```bash
# 检查应用程序健康
curl -f http://localhost:8000/health || echo "后端宕机"
curl -f http://localhost:3000 || echo "前端宕机"

# 检查数据库连接
python -c "from app.core.database import engine; engine.execute('SELECT 1')" || echo "数据库宕机"
```

### 定期维护

- **每日**：检查应用程序日志是否有错误
- **每周**：审查数据库性能和大小
- **每月**：更新依赖项和安全补丁
- **每季度**：完整备份和灾难恢复测试

### 备份策略

- **自动每日备份** 数据库
- **每周完整系统备份** 包括代码和配置
- **每月备份验证** 和恢复测试
- **异地备份存储** 用于灾难恢复

## 安全考虑

### 生产安全检查清单

- [ ] 更改默认密码和密钥
- [ ] 启用带有有效 SSL 证书的 HTTPS
- [ ] 配置防火墙规则
- [ ] 设置适当的用户权限
- [ ] 启用数据库加密
- [ ] 配置日志轮转和监控
- [ ] 设置入侵检测
- [ ] 定期安全更新

### 环境变量

永远不要将敏感信息提交到版本控制：

```bash
# 使用特定环境的 .env 文件
.env.development
.env.staging  
.env.production

# 添加到 .gitignore
echo "*.env" >> .gitignore
echo ".env.*" >> .gitignore
```

## 支持和文档

### 其他资源

- [迁移工作流指南](../database/migration-workflow.md)
- [迁移错误处理](../database/migration-errors.md)
- [迁移工具](../database/migration-reference.md)
- [API 文档](http://localhost:8000/docs)

### 获取帮助

1. 首先检查应用程序日志
2. 审查本部署指南
3. 检查故障排除部分
4. 查阅项目文档
5. 联系开发团队

### 有用的命令参考

```bash
# 迁移辅助工具
python -m scripts.migration_helpers status
python -m scripts.migration_helpers generate -m "消息"
python -m scripts.migration_helpers apply
python -m scripts.migration_helpers rollback

# Docker 管理
.\deploy.ps1 status
.\deploy.ps1 logs
.\deploy.ps1 restart

# 系统监控
docker compose ps
docker compose logs -f
systemctl status crewai-backend
systemctl status crewai-frontend
```