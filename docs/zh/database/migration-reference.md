# 迁移命令参考

## 辅助脚本使用

### Python 辅助脚本

```bash
# 检查迁移状态
python -m scripts.migration_helpers status

# 生成新迁移
python -m scripts.migration_helpers generate -m "添加用户偏好"

# 应用所有待处理的迁移
python -m scripts.migration_helpers apply

# 回滚最后一个迁移
python -m scripts.migration_helpers rollback

# 回滚多个迁移
python -m scripts.migration_helpers rollback -s 3

# 显示迁移历史
python -m scripts.migration_helpers history

# 验证迁移
python -m scripts.migration_helpers validate

# 创建手动迁移
python -m scripts.migration_helpers manual -m "自定义操作"

# 重置数据库（警告：销毁数据）
python -m scripts.migration_helpers reset
```

### Windows 批处理脚本

```cmd
REM 检查状态
migrate.bat status

REM 生成迁移
migrate.bat generate "添加用户偏好"

REM 应用迁移
migrate.bat apply

REM 回滚
migrate.bat rollback

REM 显示历史
migrate.bat history

REM 验证
migrate.bat validate

REM 重置数据库
migrate.bat reset
```

### PowerShell 脚本

```powershell
# 检查状态
.\migrate.ps1 status

# 生成迁移
.\migrate.ps1 generate -Message "添加用户偏好"

# 应用迁移
.\migrate.ps1 apply

# 回滚
.\migrate.ps1 rollback

# 显示历史
.\migrate.ps1 history

# 验证
.\migrate.ps1 validate

# 重置数据库
.\migrate.ps1 reset
```

### Unix/Linux/Mac Shell 脚本

```bash
# 检查状态
./migrate.sh status

# 生成迁移
./migrate.sh generate "添加用户偏好"

# 应用迁移
./migrate.sh apply

# 回滚
./migrate.sh rollback

# 显示历史
./migrate.sh history

# 验证
./migrate.sh validate

# 重置数据库
./migrate.sh reset
```

## 直接 Alembic 命令

### 基本操作

```bash
# 检查当前版本
alembic current

# 显示可用头
alembic heads

# 显示迁移历史
alembic history

# 显示详细历史
alembic history --verbose

# 使用自动生成功能生成迁移
alembic revision --autogenerate -m "迁移消息"

# 创建空迁移
alembic revision -m "手动迁移"

# 应用所有迁移
alembic upgrade head

# 应用特定迁移
alembic upgrade abc123

# 回滚一个迁移
alembic downgrade -1

# 回滚到特定版本
alembic downgrade abc123

# 回滚所有迁移
alembic downgrade base
```

### 高级操作

```bash
# 显示 SQL 而不执行
alembic upgrade head --sql

# 显示当前差异而不创建迁移
alembic revision --autogenerate --sql

# 合并迁移分支
alembic merge -m "合并分支" head1 head2

# 显示分支
alembic branches

# 显示当前分支信息
alembic show current
```

## 常用工作流

### 日常开发

1. 修改模型
2. `python -m scripts.migration_helpers generate -m "描述"`
3. 审查生成的迁移
4. `python -m scripts.migration_helpers apply`
5. 测试更改

### 生产部署

1. 备份数据库
2. `python -m scripts.migration_helpers status`
3. `python -m scripts.migration_helpers validate`
4. `python -m scripts.migration_helpers apply`
5. 验证应用程序

### 故障排除

1. `python -m scripts.migration_helpers status`
2. `python -m scripts.migration_helpers history`
3. 检查 `alembic/versions/` 中的迁移文件
4. 审查错误日志
5. 使用 `alembic upgrade --sql` 查看将要执行的内容

## 文件位置

- **迁移文件**：`backend/alembic/versions/`
- **Alembic 配置**：`backend/alembic.ini`
- **环境配置**：`backend/alembic/env.py`
- **辅助脚本**：`backend/scripts/`
- **文档**：`backend/MIGRATION_*.md`

## 环境变量

```bash
# 为迁移覆盖数据库 URL
DATABASE_URL=postgresql://user:pass@host/db alembic upgrade head

# 设置日志级别
ALEMBIC_LOG_LEVEL=INFO alembic upgrade head
```

## 安全检查清单

应用迁移前：

- [ ] 数据库备份已完成
- [ ] 迁移已在开发数据库上测试
- [ ] 迁移已审查正确性
- [ ] 回滚计划已准备
- [ ] 如需要可以停止应用程序
- [ ] 团队已通知维护窗口

## 紧急命令

```bash
# 如果迁移失败，检查状态
alembic current

# 如果数据库损坏，从备份恢复
# 然后运行：
alembic stamp head  # 标记为当前而不运行迁移

# 如果迁移历史损坏
alembic stamp base  # 重置到基础
alembic upgrade head  # 应用所有迁移
```

## 常见错误及解决方案

### 错误：目标数据库不是最新的

```bash
# 解决方案
alembic current
alembic upgrade head
```

### 错误：检测到多个头

```bash
# 解决方案
alembic heads
alembic merge -m "合并分支" head1 head2
alembic upgrade head
```

### 错误：无法定位版本

```bash
# 解决方案
alembic history
alembic upgrade head  # 使用 head 而不是特定 ID
```

### 错误：约束违反

```bash
# 解决方案
# 1. 检查现有数据
# 2. 在迁移中添加数据清理
# 3. 或者先使约束可为空
```

## 性能提示

- 对大表使用批量操作
- 在非高峰时间应用大型迁移
- 监控迁移执行时间
- 考虑为大型更改分阶段迁移

## 备份策略

```bash
# SQLite 备份
cp crewai_studio.db backup_$(date +%Y%m%d_%H%M%S).db

# PostgreSQL 备份
pg_dump -h localhost -U username -d crewai_studio > backup_$(date +%Y%m%d_%H%M%S).sql

# MySQL 备份
mysqldump -u username -p crewai_studio > backup_$(date +%Y%m%d_%H%M%S).sql
```