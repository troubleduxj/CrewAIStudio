# 数据库迁移工作流指南

## 概述

本指南涵盖了使用 Alembic 进行 CrewAI Studio 数据库迁移的完整工作流程。遵循这些程序可确保安全且一致的数据库架构管理。

## 前提条件

- 已安装所有依赖的 Python 环境
- 在 `.env` 文件中配置的数据库连接
- 正确配置的 Alembic（参见 `alembic/env.py`）

## 日常开发工作流

### 1. 修改模型

当您需要修改数据库架构时：

1. **编辑 SQLAlchemy 模型**：在 `app/models/` 中修改模型文件
2. **生成迁移**：创建新的迁移文件
3. **审查迁移**：检查生成的迁移是否准确
4. **应用迁移**：运行迁移以更新数据库
5. **测试更改**：验证应用程序是否与新架构正常工作

### 2. 生成迁移

```bash
# 导航到后端目录
cd backend

# 使用描述性消息生成新迁移
alembic revision --autogenerate -m "添加用户偏好表"

# 对于手动迁移（当自动生成不足时）
alembic revision -m "添加性能优化索引"
```

**迁移消息最佳实践：**
- 使用现在时：「添加」、「删除」、「修改」
- 具体说明：「向用户表添加 email_verified 列」而不是「更新用户」
- 在不明显时包含原因：「为性能添加 created_at 索引」

### 3. 审查生成的迁移

在应用之前始终审查自动生成的迁移：

```bash
# 检查 alembic/versions/ 中的最新迁移文件
# 查找：
# - 正确的表名和列名
# - 适当的数据类型
# - 缺失的索引或约束
# - 不必要的操作
```

**需要检查的常见问题：**
- 重命名的列可能显示为删除+添加而不是重命名
- 索引名称可能是自动生成的且不清楚
- 外键约束可能缺失
- 可能未检测到数据迁移需求

### 4. 应用迁移

```bash
# 应用所有待处理的迁移
alembic upgrade head

# 应用迁移到特定版本
alembic upgrade abc123

# 检查当前迁移状态
alembic current

# 查看迁移历史
alembic history --verbose
```

### 5. 回滚迁移

```bash
# 回滚一个迁移
alembic downgrade -1

# 回滚到特定版本
alembic downgrade abc123

# 回滚所有迁移（谨慎使用！）
alembic downgrade base
```

**⚠️ 回滚限制：**
- SQLite 对 ALTER TABLE 的支持有限
- 某些操作无法逆转（数据丢失操作）
- 重大回滚前务必备份数据库

## 高级工作流

### 处理迁移冲突

当多个开发者同时创建迁移时：

1. **拉取最新更改**：获取最新的迁移
2. **检查冲突**：查找重复的版本号
3. **解决冲突**：如需要使用 `alembic merge`
4. **测试合并的迁移**：首先在测试数据库上应用

```bash
# 合并冲突的迁移头
alembic merge -m "合并迁移分支" head1 head2
```

### 数据迁移

对于需要数据转换的迁移：

1. **创建空迁移**：使用 `alembic revision`（不是 autogenerate）
2. **添加数据迁移代码**：使用 `op.execute()` 进行 SQL 或批量操作
3. **彻底测试**：验证迁移后的数据完整性

数据迁移示例：
```python
def upgrade():
    # 首先进行架构更改
    op.add_column('users', sa.Column('full_name', sa.String(255)))
    
    # 数据迁移
    connection = op.get_bind()
    connection.execute(
        "UPDATE users SET full_name = first_name || ' ' || last_name"
    )
    
    # 如需要删除旧列
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'last_name')

def downgrade():
    # 逆向操作（如果可能）
    op.add_column('users', sa.Column('first_name', sa.String(100)))
    op.add_column('users', sa.Column('last_name', sa.String(100)))
    
    # 拆分 full_name（示例 - 可能需要更健壮的逻辑）
    connection = op.get_bind()
    connection.execute("""
        UPDATE users 
        SET first_name = SUBSTR(full_name, 1, INSTR(full_name, ' ') - 1),
            last_name = SUBSTR(full_name, INSTR(full_name, ' ') + 1)
    """)
    
    op.drop_column('users', 'full_name')
```

### 使用多个数据库

如果需要支持不同的数据库类型：

```bash
# 在 SQLite 上测试迁移（开发）
DATABASE_URL=sqlite:///./test.db alembic upgrade head

# 在 PostgreSQL 上测试迁移（类生产环境）
DATABASE_URL=postgresql://user:pass@localhost/testdb alembic upgrade head
```

## 故障排除

### 常见问题

**1. "目标数据库不是最新的"**
```bash
# 检查当前状态
alembic current
alembic history

# 应用缺失的迁移
alembic upgrade head
```

**2. "检测到多个头"**
```bash
# 列出所有头
alembic heads

# 如需要合并头
alembic merge -m "合并分支" head1 head2
```

**3. "无法定位由 'abc123' 标识的版本"**
```bash
# 检查可用版本
alembic history

# 使用正确的版本 ID 或 'head' 表示最新
alembic upgrade head
```

**4. 迁移因约束错误失败**
- 检查违反新约束的现有数据
- 在添加约束之前向迁移添加数据清理
- 考虑首先使约束可为空，然后再收紧

### 获取帮助

1. **检查迁移状态**：`alembic current` 和 `alembic history`
2. **审查迁移文件**：查看 `alembic/versions/` 中生成的 SQL
3. **在副本上测试**：始终先在数据库副本上测试迁移
4. **使用详细模式**：添加 `--verbose` 标志查看详细输出
5. **检查日志**：审查应用程序日志以了解数据库连接问题

## 最佳实践总结

✅ **应该做的：**
- 始终审查自动生成的迁移
- 使用描述性的迁移消息
- 在生产数据副本上测试迁移
- 重大迁移前备份数据库
- 保持迁移小而专注
- 包含升级和降级操作

❌ **不应该做的：**
- 在应用后编辑现有迁移文件
- 跳过审查自动生成的迁移
- 将未测试的迁移应用到生产环境
- 创建无法回滚的迁移
- 以复杂方式混合架构和数据更改
- 忽略迁移冲突

## 与开发工具集成

### IDE 集成
- 大多数 IDE 可以通过终端集成运行 Alembic 命令
- 考虑为常用命令创建运行配置

### CI/CD 集成
- 在 CI 管道中包含迁移检查
- 确保在应用程序部署前应用迁移
- 考虑为失败的部署制定自动回滚程序

### 数据库备份集成
- 在生产环境中应用迁移前始终备份
- 考虑自动备份验证
- 记录恢复程序