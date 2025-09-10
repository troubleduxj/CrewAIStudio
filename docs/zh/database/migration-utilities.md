# CrewAI Studio 迁移工具

本文档描述了 CrewAI Studio 中用于数据库管理的迁移工具。

## 概述

迁移工具提供了一套全面的数据库迁移管理工具，包括：

- 迁移状态检查
- 数据库备份创建和验证
- 迁移升级/降级操作
- 迁移历史跟踪
- 常用迁移辅助函数

## 组件

### MigrationUtilities 类

提供所有迁移功能的主要类：

```python
from app.utils.migration import MigrationUtilities

utils = MigrationUtilities()
```

### 便捷函数

用于常见操作的快速访问函数：

```python
from app.utils.migration import (
    get_migration_status,
    create_backup,
    verify_backup,
    upgrade_to_head
)
```

## 使用示例

### 检查迁移状态

```python
from app.utils.migration import get_migration_status

status = get_migration_status()
print(f"当前版本: {status['current_revision']}")
print(f"是否最新: {status['is_up_to_date']}")
print(f"待处理迁移: {len(status['pending_migrations'])}")
```

### 创建和验证数据库备份

```python
from app.utils.migration import create_backup, verify_backup

# 创建备份
backup_path = create_backup()
print(f"备份已创建: {backup_path}")

# 验证备份
verification = verify_backup(backup_path)
if verification['is_valid']:
    print("备份有效！")
else:
    print("备份验证失败！")
    for error in verification['errors']:
        print(f"  - {error}")
```

### 升级数据库

```python
from app.utils.migration import MigrationUtilities

utils = MigrationUtilities()

# 升级到最新版本
result = utils.upgrade_database("head")
print(f"从 {result['pre_upgrade_revision']} 升级到 {result['post_upgrade_revision']}")

# 升级到特定版本
result = utils.upgrade_database("abc123")
```

### 获取迁移历史

```python
from app.utils.migration import MigrationUtilities

utils = MigrationUtilities()
history = utils.get_migration_history()

for revision in history:
    print(f"{revision['revision']}: {revision['doc']}")
```

## 命令行界面

提供了用于常见迁移操作的 CLI 工具：

### 检查状态
```bash
python migration_cli.py status
```

### 创建备份
```bash
# 创建备份
python migration_cli.py backup

# 创建备份并验证
python migration_cli.py backup --verify

# 创建备份到自定义路径
python migration_cli.py backup --path /path/to/backup.db
```

### 验证备份
```bash
python migration_cli.py verify /path/to/backup.db
```

### 升级数据库
```bash
# 升级到最新版本
python migration_cli.py upgrade

# 升级并备份
python migration_cli.py upgrade --backup

# 升级到特定版本
python migration_cli.py upgrade --revision abc123
```

### 降级数据库
```bash
# 降级到特定版本
python migration_cli.py downgrade abc123

# 降级并备份
python migration_cli.py downgrade abc123 --backup
```

### 生成迁移
```bash
# 生成带自动检测的迁移
python migration_cli.py generate "向用户表添加新列"

# 生成空迁移
python migration_cli.py generate "自定义迁移" --no-autogenerate
```

### 查看迁移历史
```bash
python migration_cli.py history
```

## API 参考

### MigrationUtilities 方法

#### `get_current_revision() -> Optional[str]`
返回当前数据库版本 ID。

#### `get_head_revision() -> Optional[str]`
返回迁移脚本中的最新可用版本 ID。

#### `get_migration_history() -> List[Dict[str, Any]]`
返回所有迁移版本及其元数据的列表。

#### `check_migration_status() -> Dict[str, Any]`
返回全面的迁移状态信息，包括：
- `current_revision`: 当前数据库版本
- `head_revision`: 最新可用版本
- `is_up_to_date`: 数据库是否为最新
- `pending_migrations`: 未应用的迁移列表
- `migration_count`: 迁移总数

#### `create_database_backup(backup_path: Optional[str] = None) -> str`
创建数据库备份并返回备份文件路径。

#### `verify_database_backup(backup_path: str) -> Dict[str, Any]`
验证备份完整性并返回验证结果：
- `is_valid`: 备份是否有效
- `file_size`: 备份文件大小（字节）
- `table_count`: 备份中的表数量
- `errors`: 发现的错误列表

#### `upgrade_database(revision: str = "head") -> Dict[str, Any]`
将数据库升级到指定版本并返回操作结果。

#### `downgrade_database(revision: str) -> Dict[str, Any]`
将数据库降级到指定版本并返回操作结果。

#### `generate_migration(message: str, autogenerate: bool = True) -> Dict[str, Any]`
生成新的迁移文件并返回生成结果。

### 便捷函数

#### `get_migration_status() -> Dict[str, Any]`
快速访问迁移状态检查。

#### `create_backup(backup_path: Optional[str] = None) -> str`
快速访问备份创建。

#### `verify_backup(backup_path: str) -> Dict[str, Any]`
快速访问备份验证。

#### `upgrade_to_head() -> Dict[str, Any]`
快速访问升级到最新版本。

## 错误处理

所有函数在遇到迁移相关问题时都会抛出 `MigrationError`。始终在 try-catch 块中包装调用：

```python
from app.utils.migration import MigrationError, get_migration_status

try:
    status = get_migration_status()
    print(status)
except MigrationError as e:
    print(f"迁移错误: {e}")
```

## 数据库支持

工具支持 SQLite 和 PostgreSQL 数据库：

- **SQLite**: 使用文件操作提供完整的备份和验证支持
- **PostgreSQL**: 基本支持（备份功能需要 pg_dump）

## 日志记录

所有操作都使用应用程序的日志系统记录。检查日志以获取详细的操作信息和故障排除。

## 测试

运行测试套件以验证所有工具正常工作：

```bash
python test_migration_utils.py
```

## 需求映射

此实现满足以下需求：

- **4.1**: 常见迁移操作的辅助函数 ✅
- **4.2**: 数据库备份验证工具 ✅  
- **4.3**: 迁移状态检查函数 ✅
- **5.1**: 迁移操作的错误处理和日志记录 ✅

## 最佳实践

1. **重大迁移前始终创建备份**
2. **创建后验证备份**
3. **操作前检查迁移状态**
4. **交互操作使用 CLI**
5. **自动化脚本中优雅处理错误**
6. **监控日志以获取详细操作信息**

## 常用命令速查

### 日常开发
```bash
# 检查状态
python migration_cli.py status

# 生成迁移
python migration_cli.py generate "描述信息"

# 应用迁移
python migration_cli.py upgrade
```

### 生产部署
```bash
# 创建备份
python migration_cli.py backup --verify

# 升级数据库
python migration_cli.py upgrade --backup

# 验证结果
python migration_cli.py status
```

### 故障排除
```bash
# 查看历史
python migration_cli.py history

# 验证备份
python migration_cli.py verify backup_file.db

# 降级（如需要）
python migration_cli.py downgrade previous_revision --backup
```