# 常见问题解决指南

## 🚨 端口权限问题

### 问题描述
```
Error: listen EACCES: permission denied 0.0.0.0:3000
```

### 解决方案

#### 方案1：使用自动端口查找（推荐）
```bash
# 使用智能启动脚本
npm run dev

# 或者使用Node.js脚本
node start-dev.js

# Windows用户可以使用批处理文件
start-dev.bat
```

#### 方案2：手动指定端口
```bash
# 尝试不同端口
npm run dev:3001  # 端口3001
npm run dev:3002  # 端口3002

# 或直接使用npx
npx next dev -p 3001
npx next dev -p 3002
npx next dev -p 8080
```

#### 方案3：检查端口占用情况

**Windows系统**
```cmd
# 查看端口占用
netstat -ano | findstr :3000

# 结束占用进程（替换PID为实际进程ID）
taskkill /PID <PID> /F
```

**Linux/Mac系统**
```bash
# 查看端口占用
lsof -i :3000
netstat -tulpn | grep :3000

# 结束占用进程
kill -9 <PID>
```

## 🐍 Python环境问题

### 虚拟环境配置

项目已完成Python虚拟环境的规范化配置：

- **唯一虚拟环境**: `backend/.venv`
- **Python版本**: 3.10.0rc2
- **依赖状态**: 已完整安装所有必需包

### 快速启动

**方法一：使用启动脚本（推荐）**
```powershell
cd backend
python start.py
```

**方法二：手动激活环境**
```powershell
cd backend
.venv\Scripts\activate.ps1
python main.py
```

### 环境重建

如果需要重新创建虚拟环境：
```powershell
cd backend
python setup_env.py
```

## 🔧 前端组件问题

### Crew编辑路由问题

**问题**：点击crew卡片的编辑按钮，进入了新增crew页面而不是编辑页面。

**解决方案**：
1. 确保CrewWizard组件正确处理编辑模式
2. 检查路由参数传递是否正确
3. 验证initialData是否正确传递

### 工作流模板编辑错误

**问题**：工作流模板卡片点击编辑按钮时出现前端报错。

**解决方案**：
1. 检查类型导入路径是否正确
2. 确保API服务正常工作
3. 验证方法名称匹配

### 搜索功能错误

**问题**：`debouncedSearchQuery.trim is not a function`

**解决方案**：
1. 使用正确的防抖Hook
2. 添加类型检查
3. 确保搜索值为字符串类型

## 🗄️ 数据库问题

### 迁移错误

**常见错误及解决方案**：

1. **"目标数据库不是最新的"**
   ```bash
   alembic current
   alembic upgrade head
   ```

2. **"检测到多个头"**
   ```bash
   alembic heads
   alembic merge -m "合并分支" head1 head2
   ```

3. **约束违反错误**
   - 检查现有数据是否违反新约束
   - 在迁移中添加数据清理步骤

### 连接问题

**检查数据库连接**：
```bash
# 测试连接
python -c "from app.core.database import engine; print(engine.execute('SELECT 1').scalar())"

# 检查环境变量
echo $DATABASE_URL
```

## 🐳 Docker问题

### 常见Docker错误

1. **Docker守护程序未运行**
   - 启动Docker Desktop
   - 检查Docker服务状态

2. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   
   # 修改docker-compose.yml中的端口映射
   ```

3. **构建失败**
   ```bash
   # 清理Docker缓存
   docker system prune -f
   
   # 重新构建
   docker compose build --no-cache
   ```

### Docker部署问题

**使用提供的脚本**：
```bash
# 构建所有服务
.\deploy.ps1 build

# 启动服务
.\deploy.ps1 start

# 检查状态
.\deploy.ps1 status

# 查看日志
.\deploy.ps1 logs
```

## 🌐 网络和API问题

### API连接失败

1. **检查后端服务状态**
   ```bash
   curl http://localhost:8000/health
   ```

2. **检查CORS配置**
   - 确保前端URL在CORS_ORIGINS中
   - 检查环境变量配置

3. **检查防火墙设置**
   - 确保端口未被防火墙阻止
   - 检查安全软件设置

### 前后端通信问题

1. **环境变量配置**
   ```env
   # 前端 .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000
   
   # 后端 .env
   CORS_ORIGINS=["http://localhost:3000"]
   ```

2. **代理配置**
   - 检查next.config.js中的代理设置
   - 确保API路径正确

## 📱 性能问题

### 前端性能优化

1. **使用性能监控**
   ```typescript
   import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
   
   const { measurePerformance } = usePerformanceOptimization();
   ```

2. **启用懒加载**
   ```typescript
   import { LazyPageWrapper } from '@/components/shared/LazyPageWrapper';
   ```

3. **优化打包大小**
   ```bash
   npm run analyze
   ```

### 后端性能优化

1. **数据库查询优化**
   - 使用索引
   - 优化查询语句
   - 使用连接池

2. **缓存策略**
   - 实现Redis缓存
   - 使用内存缓存

## 🔍 调试技巧

### 前端调试

1. **使用浏览器开发者工具**
   - 检查控制台错误
   - 查看网络请求
   - 分析性能

2. **React开发者工具**
   - 检查组件状态
   - 分析渲染性能

### 后端调试

1. **查看日志**
   ```bash
   # 实时查看日志
   tail -f backend/logs/app.log
   ```

2. **使用调试器**
   ```python
   import pdb; pdb.set_trace()
   ```

## 📞 获取帮助

如果问题仍然存在，请提供：

1. **错误信息**：完整的错误日志
2. **环境信息**：操作系统、Node.js版本、Python版本
3. **重现步骤**：详细的操作步骤
4. **配置信息**：相关的配置文件内容

### 有用的命令参考

```bash
# 系统信息
node --version
python --version
docker --version

# 服务状态检查
curl http://localhost:3000
curl http://localhost:8000/health

# 日志查看
docker compose logs -f
systemctl status crewai-backend

# 端口检查
netstat -tulpn | grep :3000
lsof -i :8000
```