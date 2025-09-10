# 项目维护指南

## 概述

本指南介绍了 CrewAI Studio 项目的日常维护任务，包括清理临时文件、更新依赖、性能监控等。

## 🧹 项目清理

### 自动清理脚本

项目提供了多种清理脚本来清理临时文件和缓存：

#### Python 清理脚本（推荐）

```bash
cd backend

# 清理所有类型的文件
python -m scripts.cleanup --all

# 只清理特定类型的文件
python -m scripts.cleanup --python    # Python缓存
python -m scripts.cleanup --test      # 测试缓存
python -m scripts.cleanup --db        # 备份数据库
python -m scripts.cleanup --logs      # 日志文件
python -m scripts.cleanup --temp      # 临时文件
python -m scripts.cleanup --build     # 构建产物

# 预览模式（不实际删除）
python -m scripts.cleanup --all --dry-run
```

#### Windows 批处理脚本

```cmd
cd backend

# 清理所有文件
scripts\cleanup.bat all

# 清理特定类型
scripts\cleanup.bat python
scripts\cleanup.bat test
scripts\cleanup.bat db
scripts\cleanup.bat logs
scripts\cleanup.bat temp
```

### 清理的文件类型

#### Python 缓存文件
- `__pycache__/` 目录
- `*.pyc` 编译文件
- `*.pyo` 优化文件

#### 测试缓存
- `.pytest_cache/` 目录
- `.coverage` 覆盖率文件
- `htmlcov/` 覆盖率报告

#### 备份数据库
- `*_backup_*.db` 备份文件
- `test_*.db` 测试数据库
- `temp_*.db` 临时数据库

#### 日志文件
- `*.log` 日志文件
- `logs/` 目录中的日志

#### 临时文件
- `*.tmp`, `*.temp` 临时文件
- `*~` 编辑器备份文件
- `.DS_Store`, `Thumbs.db` 系统文件

#### 构建产物
- `build/` 构建目录
- `dist/` 分发目录
- `*.egg-info/` 包信息

### 手动清理

如果需要手动清理特定文件：

```bash
# 清理Python缓存
find . -type d -name "__pycache__" -not -path "./.venv/*" -exec rm -rf {} +
find . -name "*.pyc" -not -path "./.venv/*" -delete

# 清理测试缓存
rm -rf .pytest_cache
rm -f .coverage
rm -rf htmlcov

# 清理备份数据库
rm -f *_backup_*.db
rm -f test_*.db
```

## 📦 依赖管理

### 更新Python依赖

```bash
cd backend

# 激活虚拟环境
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Unix/Linux/Mac

# 查看过期的包
pip list --outdated

# 更新特定包
pip install --upgrade package_name

# 更新所有包（谨慎使用）
pip install --upgrade -r requirements.txt

# 生成新的requirements.txt
pip freeze > requirements.txt
```

### 更新前端依赖

```bash
cd frontend

# 查看过期的包
npm outdated

# 更新特定包
npm update package_name

# 更新所有包
npm update

# 检查安全漏洞
npm audit
npm audit fix
```

### 依赖安全检查

```bash
# Python安全检查
cd backend
pip install safety
safety check

# Node.js安全检查
cd frontend
npm audit
```

## 🗄️ 数据库维护

### 数据库备份

```bash
cd backend

# 使用迁移工具创建备份
python -m scripts.migration_helpers backup --verify

# 手动备份SQLite
cp crewai_studio.db backup_$(date +%Y%m%d_%H%M%S).db

# 手动备份PostgreSQL
pg_dump -h localhost -U username -d crewai_studio > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 数据库优化

```bash
# SQLite优化
sqlite3 crewai_studio.db "VACUUM;"
sqlite3 crewai_studio.db "ANALYZE;"

# 检查数据库完整性
sqlite3 crewai_studio.db "PRAGMA integrity_check;"
```

### 迁移维护

```bash
# 检查迁移状态
python -m scripts.migration_helpers status

# 验证迁移
python -m scripts.migration_helpers validate

# 查看迁移历史
python -m scripts.migration_helpers history
```

## 📊 性能监控

### 应用性能

```bash
# 检查应用启动时间
time python main.py

# 内存使用监控
python -m memory_profiler main.py

# CPU使用监控
python -m cProfile -o profile.stats main.py
```

### 数据库性能

```bash
# 查看数据库大小
ls -lh *.db

# 分析查询性能
sqlite3 crewai_studio.db ".timer on" "SELECT * FROM crews;"

# 查看表统计信息
sqlite3 crewai_studio.db "SELECT name, COUNT(*) FROM sqlite_master WHERE type='table';"
```

### 前端性能

```bash
cd frontend

# 分析打包大小
npm run analyze

# 构建性能分析
npm run build -- --profile

# 运行性能测试
npm run test:performance
```

## 🔍 日志管理

### 日志轮转

创建日志轮转配置：

```bash
# 创建logrotate配置
sudo tee /etc/logrotate.d/crewai-studio << EOF
/path/to/crewai-studio/backend/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 crewai crewai
}
EOF
```

### 日志分析

```bash
# 查看错误日志
grep -i error *.log

# 统计日志级别
awk '{print $3}' app.log | sort | uniq -c

# 查看最近的日志
tail -f app.log
```

## 🔄 定期维护任务

### 每日任务

- [ ] 检查应用日志是否有错误
- [ ] 监控磁盘空间使用
- [ ] 验证备份是否正常

### 每周任务

- [ ] 清理临时文件和缓存
- [ ] 检查依赖更新
- [ ] 审查数据库性能

### 每月任务

- [ ] 更新依赖包
- [ ] 完整数据库备份
- [ ] 安全漏洞扫描
- [ ] 性能基准测试

### 每季度任务

- [ ] 主要版本依赖更新
- [ ] 数据库优化和重建索引
- [ ] 灾难恢复测试
- [ ] 安全审计

## 🚨 故障排除

### 常见维护问题

#### 磁盘空间不足

```bash
# 查找大文件
find . -type f -size +100M -not -path "./.venv/*"

# 清理日志文件
find . -name "*.log" -mtime +30 -delete

# 清理备份文件
find . -name "*backup*.db" -mtime +7 -delete
```

#### 内存使用过高

```bash
# 查看进程内存使用
ps aux | grep python | head -10

# 重启应用服务
systemctl restart crewai-studio

# 检查内存泄漏
python -m memory_profiler main.py
```

#### 数据库锁定

```bash
# 检查数据库连接
lsof crewai_studio.db

# 强制解锁（谨慎使用）
fuser -k crewai_studio.db
```

## 📋 维护检查清单

### 部署前检查

- [ ] 运行所有测试
- [ ] 检查代码质量
- [ ] 验证迁移脚本
- [ ] 创建数据库备份
- [ ] 检查依赖兼容性

### 部署后检查

- [ ] 验证应用启动
- [ ] 检查API端点
- [ ] 验证数据库连接
- [ ] 监控错误日志
- [ ] 测试关键功能

### 定期健康检查

- [ ] 应用响应时间
- [ ] 数据库查询性能
- [ ] 磁盘空间使用
- [ ] 内存使用情况
- [ ] 错误率统计

## 🛠️ 维护工具

### 推荐工具

- **htop**: 系统资源监控
- **iotop**: 磁盘I/O监控
- **netstat**: 网络连接监控
- **sqlite3**: SQLite数据库管理
- **pgAdmin**: PostgreSQL管理（如使用PostgreSQL）

### 自动化脚本

项目提供的维护脚本：

- `scripts/cleanup.py` - 项目清理
- `scripts/migration_helpers.py` - 迁移管理
- `scripts/migrate.bat` - Windows迁移脚本
- `scripts/migrate.ps1` - PowerShell迁移脚本

## 📞 获取帮助

如果遇到维护问题：

1. 查看应用日志
2. 检查系统资源
3. 参考故障排除文档
4. 联系开发团队

维护是确保应用稳定运行的关键，建议制定定期维护计划并严格执行。