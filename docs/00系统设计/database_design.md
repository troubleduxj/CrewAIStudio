# CrewAI Studio 数据库设计文档

## 📋 文档概述

本文档详细描述了 CrewAI Studio 项目的数据库设计，包括数据模型、关系图、索引策略、约束规则和数据迁移方案。

---

## 🏗️ 数据库架构概览

### 技术栈
- **数据库引擎**: PostgreSQL 14+
- **ORM框架**: SQLAlchemy 2.0
- **迁移工具**: Alembic
- **连接池**: SQLAlchemy Pool
- **备份策略**: pg_dump + 定时备份

### 数据库命名规范
- **表名**: 小写字母 + 下划线，复数形式 (如: `agents`, `tasks`)
- **字段名**: 小写字母 + 下划线 (如: `created_at`, `max_execution_time`)
- **索引名**: `idx_{table}_{column(s)}` (如: `idx_agents_status`)
- **外键名**: `fk_{table}_{referenced_table}_{column}` (如: `fk_tasks_agents_agent_id`)
- **约束名**: `ck_{table}_{constraint_desc}` (如: `ck_agents_status_valid`)

---

## 📊 核心数据模型

### 1. 基础模型 (BaseModel)

```sql
-- 所有表的基础字段
CREATE TABLE base_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 主键，使用UUID确保全局唯一性
- `created_at`: 创建时间，带时区信息
- `updated_at`: 更新时间，自动更新

### 2. 代理模型 (Agent)

```sql
CREATE TABLE agents (
    -- 基础字段
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 基本信息
    name VARCHAR(255) NOT NULL,
    description TEXT,
    role VARCHAR(255) NOT NULL,
    goal TEXT NOT NULL,
    backstory TEXT,
    
    -- 类型和状态
    type VARCHAR(50) DEFAULT 'STANDARD',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TRAINING', 'ERROR')),
    
    -- LLM配置
    llm_config JSONB DEFAULT '{}',
    model VARCHAR(100),
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0),
    
    -- 工具和能力
    tools JSONB DEFAULT '[]',
    capabilities JSONB DEFAULT '[]',
    
    -- 执行配置
    max_execution_time INTEGER DEFAULT 300 CHECK (max_execution_time > 0),
    allow_delegation BOOLEAN DEFAULT false,
    verbose BOOLEAN DEFAULT false,
    
    -- 提示词
    system_prompt TEXT,
    custom_prompts JSONB DEFAULT '{}',
    
    -- 性能统计
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time DECIMAL(10,2) DEFAULT 0,
    
    -- 约束
    CONSTRAINT ck_agents_temperature_range CHECK (temperature >= 0 AND temperature <= 2),
    CONSTRAINT ck_agents_execution_stats CHECK (
        total_executions >= 0 AND 
        successful_executions >= 0 AND 
        failed_executions >= 0 AND
        successful_executions + failed_executions <= total_executions
    )
);
```

### 3. 任务模型 (Task)

```sql
CREATE TABLE tasks (
    -- 基础字段
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 基本信息
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'STANDARD',
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED')
    ),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- 数据
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',
    
    -- 执行配置
    max_execution_time INTEGER DEFAULT 300 CHECK (max_execution_time > 0),
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
    max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 0),
    
    -- 关联
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    workflow_id UUID, -- 外键将在workflow表创建后添加
    
    -- 依赖关系
    dependencies JSONB DEFAULT '[]', -- 存储依赖任务的ID数组
    
    -- 执行信息
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time DECIMAL(10,2),
    error_message TEXT,
    logs JSONB DEFAULT '[]',
    
    -- 标签和元数据
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- 约束
    CONSTRAINT ck_tasks_execution_time_positive CHECK (execution_time >= 0),
    CONSTRAINT ck_tasks_completion_logic CHECK (
        (status = 'COMPLETED' AND completed_at IS NOT NULL) OR
        (status != 'COMPLETED' AND (completed_at IS NULL OR completed_at IS NOT NULL))
    ),
    CONSTRAINT ck_tasks_start_complete_order CHECK (
        started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at
    )
);
```

### 4. 工作流模型 (Workflow)

```sql
CREATE TABLE workflows (
    -- 基础字段
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 基本信息
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    
    -- 状态和类型
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')
    ),
    type VARCHAR(50) DEFAULT 'SEQUENTIAL',
    execution_mode VARCHAR(20) DEFAULT 'SYNC' CHECK (
        execution_mode IN ('SYNC', 'ASYNC')
    ),
    
    -- 工作流定义
    workflow_definition JSONB NOT NULL DEFAULT '{}',
    
    -- 配置
    agent_configs JSONB DEFAULT '{}',
    task_configs JSONB DEFAULT '{}',
    
    -- 执行配置
    max_execution_time INTEGER DEFAULT 1800 CHECK (max_execution_time > 0),
    retry_policy JSONB DEFAULT '{"max_retries": 3, "retry_delay": 5}',
    error_handling VARCHAR(20) DEFAULT 'STOP' CHECK (
        error_handling IN ('STOP', 'CONTINUE', 'RETRY')
    ),
    
    -- 调度配置
    scheduling JSONB DEFAULT '{}',
    trigger_conditions JSONB DEFAULT '{}',
    
    -- 执行状态
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    
    -- 统计信息
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time DECIMAL(10,2) DEFAULT 0,
    
    -- 标签和元数据
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- 约束
    CONSTRAINT ck_workflows_step_range CHECK (
        current_step >= 0 AND current_step <= total_steps
    ),
    CONSTRAINT ck_workflows_execution_stats CHECK (
        total_executions >= 0 AND 
        successful_executions >= 0 AND 
        failed_executions >= 0 AND
        successful_executions + failed_executions <= total_executions
    )
);

-- 添加workflow外键到tasks表
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_workflows_workflow_id 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
```

### 5. 执行记录模型 (Execution)

```sql
CREATE TABLE executions (
    -- 基础字段
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 执行类型
    execution_type VARCHAR(20) NOT NULL CHECK (
        execution_type IN ('AGENT', 'TASK', 'WORKFLOW')
    ),
    
    -- 关联实体
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    
    -- 执行状态
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT')
    ),
    
    -- 执行数据
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',
    
    -- 时间信息
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time DECIMAL(10,2),
    timeout_at TIMESTAMP WITH TIME ZONE,
    
    -- 错误信息
    error_code VARCHAR(50),
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    
    -- 执行日志
    logs JSONB DEFAULT '[]',
    
    -- 性能指标
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(10,2),
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    -- 约束
    CONSTRAINT ck_executions_entity_reference CHECK (
        (execution_type = 'AGENT' AND agent_id IS NOT NULL AND task_id IS NULL AND workflow_id IS NULL) OR
        (execution_type = 'TASK' AND task_id IS NOT NULL AND agent_id IS NULL AND workflow_id IS NULL) OR
        (execution_type = 'WORKFLOW' AND workflow_id IS NOT NULL AND agent_id IS NULL AND task_id IS NULL)
    ),
    CONSTRAINT ck_executions_time_logic CHECK (
        started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at
    ),
    CONSTRAINT ck_executions_execution_time_positive CHECK (execution_time >= 0)
);
```

### 6. 任务依赖关系表 (Task Dependencies)

```sql
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 依赖关系
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- 依赖类型
    dependency_type VARCHAR(20) DEFAULT 'FINISH_TO_START' CHECK (
        dependency_type IN ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH')
    ),
    
    -- 约束
    CONSTRAINT ck_task_deps_no_self_reference CHECK (task_id != depends_on_task_id),
    CONSTRAINT uk_task_dependencies UNIQUE (task_id, depends_on_task_id)
);
```

---

## 🔗 实体关系图

```mermaid
erDiagram
    AGENTS {
        uuid id PK
        varchar name
        text description
        varchar role
        text goal
        text backstory
        varchar type
        varchar status
        jsonb llm_config
        varchar model
        decimal temperature
        integer max_tokens
        jsonb tools
        jsonb capabilities
        integer max_execution_time
        boolean allow_delegation
        boolean verbose
        text system_prompt
        jsonb custom_prompts
        timestamp created_at
        timestamp updated_at
    }
    
    TASKS {
        uuid id PK
        varchar name
        text description
        varchar type
        varchar status
        integer priority
        jsonb input_data
        jsonb output_data
        jsonb context
        integer max_execution_time
        integer retry_count
        integer max_retries
        uuid assigned_agent_id FK
        uuid parent_task_id FK
        uuid workflow_id FK
        jsonb dependencies
        timestamp started_at
        timestamp completed_at
        decimal execution_time
        text error_message
        jsonb logs
        jsonb tags
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    WORKFLOWS {
        uuid id PK
        varchar name
        text description
        varchar version
        varchar status
        varchar type
        varchar execution_mode
        jsonb workflow_definition
        jsonb agent_configs
        jsonb task_configs
        integer max_execution_time
        jsonb retry_policy
        varchar error_handling
        jsonb scheduling
        jsonb trigger_conditions
        integer current_step
        integer total_steps
        integer total_executions
        integer successful_executions
        integer failed_executions
        decimal avg_execution_time
        jsonb tags
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    EXECUTIONS {
        uuid id PK
        varchar execution_type
        uuid agent_id FK
        uuid task_id FK
        uuid workflow_id FK
        varchar status
        jsonb input_data
        jsonb output_data
        jsonb context
        timestamp started_at
        timestamp completed_at
        decimal execution_time
        timestamp timeout_at
        varchar error_code
        text error_message
        jsonb error_details
        jsonb logs
        decimal cpu_usage
        decimal memory_usage
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    TASK_DEPENDENCIES {
        uuid id PK
        uuid task_id FK
        uuid depends_on_task_id FK
        varchar dependency_type
        timestamp created_at
    }
    
    AGENTS ||--o{ TASKS : "assigned_to"
    WORKFLOWS ||--o{ TASKS : "contains"
    TASKS ||--o{ TASKS : "parent_child"
    TASKS ||--o{ TASK_DEPENDENCIES : "has_dependencies"
    TASKS ||--o{ TASK_DEPENDENCIES : "depended_by"
    AGENTS ||--o{ EXECUTIONS : "executes"
    TASKS ||--o{ EXECUTIONS : "executes"
    WORKFLOWS ||--o{ EXECUTIONS : "executes"
```

---

## 📈 索引策略

### 1. 主键索引 (自动创建)
```sql
-- 所有表的主键索引自动创建
-- PRIMARY KEY indexes are automatically created
```

### 2. 外键索引
```sql
-- Tasks表外键索引
CREATE INDEX idx_tasks_assigned_agent_id ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_workflow_id ON tasks(workflow_id);

-- Executions表外键索引
CREATE INDEX idx_executions_agent_id ON executions(agent_id);
CREATE INDEX idx_executions_task_id ON executions(task_id);
CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);

-- Task Dependencies表外键索引
CREATE INDEX idx_task_deps_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends_on_task_id ON task_dependencies(depends_on_task_id);
```

### 3. 状态和查询索引
```sql
-- 状态索引
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_executions_status ON executions(status);

-- 时间索引
CREATE INDEX idx_agents_created_at ON agents(created_at);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_workflows_created_at ON workflows(created_at);
CREATE INDEX idx_executions_created_at ON executions(created_at);
CREATE INDEX idx_executions_started_at ON executions(started_at);
CREATE INDEX idx_executions_completed_at ON executions(completed_at);

-- 复合索引
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority DESC);
CREATE INDEX idx_executions_type_status ON executions(execution_type, status);
CREATE INDEX idx_tasks_agent_status ON tasks(assigned_agent_id, status);
```

### 4. JSONB字段索引
```sql
-- JSONB字段的GIN索引
CREATE INDEX idx_agents_tools_gin ON agents USING GIN(tools);
CREATE INDEX idx_agents_capabilities_gin ON agents USING GIN(capabilities);
CREATE INDEX idx_tasks_tags_gin ON tasks USING GIN(tags);
CREATE INDEX idx_workflows_tags_gin ON workflows USING GIN(tags);
CREATE INDEX idx_executions_logs_gin ON executions USING GIN(logs);

-- 特定JSONB路径索引
CREATE INDEX idx_agents_llm_model ON agents((llm_config->>'model'));
CREATE INDEX idx_workflows_execution_mode ON workflows(execution_mode);
```

### 5. 全文搜索索引
```sql
-- 全文搜索索引
CREATE INDEX idx_agents_search ON agents USING GIN(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(role, ''))
);

CREATE INDEX idx_tasks_search ON tasks USING GIN(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

CREATE INDEX idx_workflows_search ON workflows USING GIN(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);
```

---

## 🔒 约束和触发器

### 1. 检查约束
```sql
-- 状态有效性约束已在表定义中包含

-- 额外的业务逻辑约束
ALTER TABLE tasks ADD CONSTRAINT ck_tasks_retry_logic 
    CHECK (retry_count <= max_retries);

ALTER TABLE workflows ADD CONSTRAINT ck_workflows_version_format 
    CHECK (version ~ '^\d+\.\d+\.\d+$');
```

### 2. 触发器函数
```sql
-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建更新时间戳触发器
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executions_updated_at BEFORE UPDATE ON executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. 统计信息更新触发器
```sql
-- Agent执行统计更新函数
CREATE OR REPLACE FUNCTION update_agent_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.execution_type = 'AGENT' THEN
        UPDATE agents SET total_executions = total_executions + 1
        WHERE id = NEW.agent_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.execution_type = 'AGENT' THEN
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'COMPLETED' THEN
                UPDATE agents SET 
                    successful_executions = successful_executions + 1,
                    avg_execution_time = (
                        avg_execution_time * (successful_executions - 1) + NEW.execution_time
                    ) / successful_executions
                WHERE id = NEW.agent_id;
            ELSIF NEW.status = 'FAILED' THEN
                UPDATE agents SET failed_executions = failed_executions + 1
                WHERE id = NEW.agent_id;
            END IF;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_agent_stats
    AFTER INSERT OR UPDATE ON executions
    FOR EACH ROW EXECUTE FUNCTION update_agent_execution_stats();
```

---

## 🔄 数据迁移策略

### 1. Alembic配置
```python
# alembic.ini 配置
[alembic]
script_location = migrations
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = postgresql://user:password@localhost/crewai_studio

[post_write_hooks]
hooks = black
black.type = console_scripts
black.entrypoint = black
black.options = -l 79 REVISION_SCRIPT_FILENAME
```

### 2. 初始迁移脚本
```python
# migrations/versions/001_initial_schema.py
"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 创建agents表
    op.create_table('agents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('name', sa.VARCHAR(255), nullable=False),
        sa.Column('description', sa.TEXT(), nullable=True),
        # ... 其他字段
        sa.PrimaryKeyConstraint('id')
    )
    
    # 创建其他表...
    
    # 创建索引
    op.create_index('idx_agents_status', 'agents', ['status'])
    # ... 其他索引

def downgrade():
    op.drop_table('agents')
    # ... 删除其他表
```

### 3. 数据迁移最佳实践

#### 迁移脚本规范
```python
# 迁移脚本模板
def upgrade():
    # 1. 创建新表
    # 2. 添加新列
    # 3. 数据转换
    # 4. 删除旧列
    # 5. 创建索引
    # 6. 添加约束
    pass

def downgrade():
    # 反向操作
    pass
```

#### 大数据量迁移策略
```python
# 分批处理大表迁移
def upgrade():
    # 添加新列
    op.add_column('large_table', sa.Column('new_column', sa.String(255)))
    
    # 分批更新数据
    connection = op.get_bind()
    batch_size = 10000
    offset = 0
    
    while True:
        result = connection.execute(
            text(f"""
            UPDATE large_table 
            SET new_column = old_column 
            WHERE id IN (
                SELECT id FROM large_table 
                WHERE new_column IS NULL 
                LIMIT {batch_size}
            )
            """)
        )
        if result.rowcount == 0:
            break
        offset += batch_size
    
    # 添加非空约束
    op.alter_column('large_table', 'new_column', nullable=False)
```

---

## 📊 性能优化

### 1. 查询优化
```sql
-- 使用EXPLAIN ANALYZE分析查询性能
EXPLAIN ANALYZE SELECT * FROM tasks 
WHERE status = 'PENDING' AND priority > 5
ORDER BY created_at DESC LIMIT 10;

-- 优化常见查询
-- 1. 分页查询优化
SELECT * FROM tasks 
WHERE created_at < '2024-01-01' 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. 聚合查询优化
SELECT 
    status, 
    COUNT(*) as count,
    AVG(execution_time) as avg_time
FROM executions 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY status;
```

### 2. 连接池配置
```python
# SQLAlchemy连接池配置
engine = create_engine(
    DATABASE_URL,
    pool_size=20,          # 连接池大小
    max_overflow=30,       # 最大溢出连接数
    pool_timeout=30,       # 获取连接超时时间
    pool_recycle=3600,     # 连接回收时间
    pool_pre_ping=True,    # 连接前ping测试
    echo=False             # 生产环境关闭SQL日志
)
```

### 3. 分区策略
```sql
-- 按时间分区executions表
CREATE TABLE executions_partitioned (
    LIKE executions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE executions_2024_01 PARTITION OF executions_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE executions_2024_02 PARTITION OF executions_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

---

## 🔐 安全策略

### 1. 数据库用户权限
```sql
-- 创建应用用户
CREATE USER crewai_app WITH PASSWORD 'secure_password';

-- 授予必要权限
GRANT CONNECT ON DATABASE crewai_studio TO crewai_app;
GRANT USAGE ON SCHEMA public TO crewai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crewai_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO crewai_app;

-- 创建只读用户
CREATE USER crewai_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE crewai_studio TO crewai_readonly;
GRANT USAGE ON SCHEMA public TO crewai_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO crewai_readonly;
```

### 2. 敏感数据处理
```sql
-- 敏感字段加密存储
-- 使用pgcrypto扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 加密存储示例
CREATE TABLE secure_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    encrypted_value BYTEA, -- 加密存储的值
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入加密数据
INSERT INTO secure_configs (name, encrypted_value) 
VALUES ('api_key', pgp_sym_encrypt('secret_api_key', 'encryption_key'));

-- 查询解密数据
SELECT name, pgp_sym_decrypt(encrypted_value, 'encryption_key') as value 
FROM secure_configs WHERE name = 'api_key';
```

---

## 📋 备份和恢复

### 1. 备份策略
```bash
#!/bin/bash
# 数据库备份脚本

DB_NAME="crewai_studio"
BACKUP_DIR="/backups/postgresql"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -h localhost -U postgres -d $DB_NAME > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### 2. 恢复策略
```bash
#!/bin/bash
# 数据库恢复脚本

BACKUP_FILE=$1
DB_NAME="crewai_studio"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# 停止应用服务
sudo systemctl stop crewai-studio

# 删除现有数据库
dropdb -h localhost -U postgres $DB_NAME

# 创建新数据库
createdb -h localhost -U postgres $DB_NAME

# 恢复数据
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql -h localhost -U postgres -d $DB_NAME
else
    psql -h localhost -U postgres -d $DB_NAME < $BACKUP_FILE
fi

# 启动应用服务
sudo systemctl start crewai-studio

echo "Database restored from: $BACKUP_FILE"
```

---

## 📈 监控和维护

### 1. 性能监控查询
```sql
-- 慢查询监控
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- 表大小监控
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### 2. 定期维护任务
```sql
-- 定期清理过期数据
DELETE FROM executions 
WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
AND status IN ('COMPLETED', 'FAILED');

-- 更新表统计信息
ANALYZE;

-- 重建索引（如需要）
REINDEX INDEX CONCURRENTLY idx_executions_created_at;

-- 清理无用的执行日志
UPDATE executions 
SET logs = '[]' 
WHERE created_at < CURRENT_DATE - INTERVAL '30 days'
AND jsonb_array_length(logs) > 100;
```

---

## 📝 总结

本数据库设计文档提供了 CrewAI Studio 项目的完整数据库架构，包括：

1. **完整的数据模型定义** - 涵盖所有核心实体和关系
2. **优化的索引策略** - 提升查询性能
3. **完善的约束和触发器** - 保证数据完整性
4. **灵活的迁移策略** - 支持平滑的版本升级
5. **全面的安全措施** - 保护敏感数据
6. **可靠的备份恢复** - 确保数据安全
7. **持续的监控维护** - 保持系统健康

该设计支持高并发、大数据量的生产环境使用，为 CrewAI Studio 的稳定运行提供了坚实的数据基础。