# CrewAI Studio Docker部署指南

本文档介绍如何使用Docker部署CrewAI Studio应用。

## 📋 前置要求

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (推荐最新版本)
- Windows 10/11 或 macOS 或 Linux
- 至少 4GB 可用内存
- 至少 2GB 可用磁盘空间

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd CrewAiStudio
```

### 2. 配置环境变量（可选）

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的API密钥
# 注意：API密钥是可选的，不配置也可以运行基础功能
```

### 3. 启动服务

#### 方法一：使用快速启动脚本（推荐）

```powershell
# Windows PowerShell
.\docker-start.ps1
```

#### 方法二：使用Docker Compose

```bash
# 构建并启动所有服务
docker compose up --build -d
```

### 4. 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 🛠️ 管理命令

### 使用部署脚本（推荐）

```powershell
# 构建服务
.\deploy.ps1 -Action build

# 启动服务
.\deploy.ps1 -Action start

# 停止服务
.\deploy.ps1 -Action stop

# 重启服务
.\deploy.ps1 -Action restart

# 查看日志
.\deploy.ps1 -Action logs

# 查看状态
.\deploy.ps1 -Action status

# 清理资源
.\deploy.ps1 -Action clean

# 强制清理所有资源
.\deploy.ps1 -Action clean -Force
```

### 使用Docker Compose命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重启特定服务
docker compose restart backend
docker compose restart frontend

# 重新构建并启动
docker compose up --build -d

# 清理所有资源
docker compose down -v --rmi all
```

## 📁 项目结构

```
CrewAiStudio/
├── backend/
│   ├── Dockerfile              # 后端Docker配置
│   ├── requirements.txt        # Python依赖
│   └── app/                    # 后端应用代码
├── frontend/
│   ├── Dockerfile              # 前端Docker配置
│   ├── package.json            # Node.js依赖
│   └── src/                    # 前端应用代码
├── docker-compose.yml          # Docker Compose配置
├── .dockerignore              # Docker忽略文件
├── .env.example               # 环境变量模板
├── deploy.ps1                 # 部署管理脚本
├── docker-start.ps1           # 快速启动脚本
└── DOCKER.md                  # 本文档
```

## 🔧 配置说明

### 环境变量

主要环境变量说明：

| 变量名 | 描述 | 默认值 | 必需 |
|--------|------|--------|------|
| `OPENAI_API_KEY` | OpenAI API密钥 | - | 否 |
| `ANTHROPIC_API_KEY` | Anthropic API密钥 | - | 否 |
| `CREWAI_API_KEY` | CrewAI API密钥 | - | 否 |
| `DATABASE_URL` | 数据库连接字符串 | `sqlite:///./crewai_studio.db` | 否 |
| `DEBUG` | 调试模式 | `false` | 否 |
| `NEXT_PUBLIC_API_URL` | 前端API地址 | `http://localhost:8000` | 否 |

### 端口配置

- **前端**: 3000
- **后端**: 8000

如需修改端口，请编辑 `docker-compose.yml` 文件中的端口映射。

### 数据持久化

- 数据库文件: `./backend/crewai_studio.db`
- 日志文件: Docker卷 `backend_logs`

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   
   # 停止占用端口的进程或修改docker-compose.yml中的端口映射
   ```

2. **Docker构建失败**
   ```bash
   # 清理Docker缓存
   docker system prune -a
   
   # 重新构建
   docker compose build --no-cache
   ```

3. **服务无法启动**
   ```bash
   # 查看详细日志
   docker compose logs backend
   docker compose logs frontend
   ```

4. **前端无法连接后端**
   - 检查 `NEXT_PUBLIC_API_URL` 环境变量
   - 确保后端服务正常运行
   - 检查网络配置

### 日志查看

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend

# 查看最近的日志
docker compose logs --tail=100 backend
```

## 🔒 生产环境部署

### 安全建议

1. **环境变量安全**
   - 不要在代码中硬编码API密钥
   - 使用 `.env` 文件管理敏感信息
   - 确保 `.env` 文件不被提交到版本控制

2. **网络安全**
   - 配置防火墙规则
   - 使用HTTPS（需要反向代理如Nginx）
   - 限制CORS源

3. **资源限制**
   ```yaml
   # 在docker-compose.yml中添加资源限制
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 1G
             cpus: '0.5'
   ```

### 监控和日志

建议在生产环境中：
- 配置日志轮转
- 设置健康检查监控
- 使用专业的日志管理工具

## 📚 更多资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [CrewAI文档](https://docs.crewai.com/)
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [Next.js文档](https://nextjs.org/docs)

## 🤝 贡献

如果你发现问题或有改进建议，请提交Issue或Pull Request。

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)。