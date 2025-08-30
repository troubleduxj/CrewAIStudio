# CrewAI Studio API 设计规范文档

## 📋 文档概述

本文档详细描述了 CrewAI Studio 项目的 API 设计规范，包括 RESTful API 标准、接口定义、认证授权、错误处理、版本控制和最佳实践。

---

## 🏗️ API 架构概览

### 技术栈
- **API 框架**: FastAPI 0.104+
- **认证方式**: JWT Token + OAuth2
- **文档生成**: OpenAPI 3.0 (Swagger)
- **数据验证**: Pydantic 2.0
- **异步支持**: asyncio + uvloop
- **限流控制**: slowapi (基于Redis)

### API 设计原则
1. **RESTful 设计** - 遵循 REST 架构风格
2. **资源导向** - 以资源为中心设计 URL
3. **无状态** - 每个请求包含完整信息
4. **统一接口** - 标准化的请求/响应格式
5. **可缓存** - 支持 HTTP 缓存机制
6. **分层系统** - 清晰的架构分层

---

## 🌐 API 基础规范

### 1. URL 设计规范

#### 基础 URL 结构
```
https://api.crewai-studio.com/v1/{resource}
```

#### 资源命名规则
- **使用复数名词**: `/agents`, `/tasks`, `/workflows`
- **小写字母**: 全部使用小写
- **连字符分隔**: 多词使用连字符 `/execution-logs`
- **层级关系**: `/workflows/{id}/tasks`

#### URL 示例
```bash
# 正确示例
GET /v1/agents                    # 获取代理列表
GET /v1/agents/{id}               # 获取特定代理
POST /v1/agents                   # 创建代理
PUT /v1/agents/{id}               # 更新代理
DELETE /v1/agents/{id}            # 删除代理
GET /v1/workflows/{id}/tasks      # 获取工作流的任务
POST /v1/agents/{id}/execute      # 执行代理

# 错误示例
GET /v1/Agent                     # 大写字母
GET /v1/getAgents                 # 动词形式
GET /v1/agent_list                # 下划线
```

### 2. HTTP 方法规范

| 方法 | 用途 | 幂等性 | 安全性 | 示例 |
|------|------|--------|--------|---------|
| GET | 获取资源 | ✅ | ✅ | `GET /agents` |
| POST | 创建资源 | ❌ | ❌ | `POST /agents` |
| PUT | 完整更新 | ✅ | ❌ | `PUT /agents/{id}` |
| PATCH | 部分更新 | ❌ | ❌ | `PATCH /agents/{id}` |
| DELETE | 删除资源 | ✅ | ❌ | `DELETE /agents/{id}` |

### 3. HTTP 状态码规范

#### 成功状态码 (2xx)
- **200 OK**: 请求成功，返回数据
- **201 Created**: 资源创建成功
- **202 Accepted**: 请求已接受，异步处理中
- **204 No Content**: 请求成功，无返回内容

#### 客户端错误 (4xx)
- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 无权限
- **404 Not Found**: 资源不存在
- **409 Conflict**: 资源冲突
- **422 Unprocessable Entity**: 数据验证失败
- **429 Too Many Requests**: 请求频率超限

#### 服务器错误 (5xx)
- **500 Internal Server Error**: 服务器内部错误
- **502 Bad Gateway**: 网关错误
- **503 Service Unavailable**: 服务不可用
- **504 Gateway Timeout**: 网关超时

---

## 📝 请求/响应格式

### 1. 请求格式

#### Content-Type
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {jwt_token}
```

#### 请求体结构
```json
{
  "data": {
    "name": "Agent Name",
    "description": "Agent Description",
    "role": "Assistant"
  },
  "metadata": {
    "client_id": "web-app",
    "request_id": "req-123456"
  }
}
```

### 2. 响应格式

#### 标准响应结构
```json
{
  "success": true,
  "data": {
    "id": "agent-123",
    "name": "Agent Name",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "metadata": {
    "request_id": "req-123456",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "v1"
  }
}
```

#### 分页响应结构
```json
{
  "success": true,
  "data": [
    {
      "id": "agent-1",
      "name": "Agent 1"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "total_items": 100,
    "has_next": true,
    "has_prev": false
  },
  "metadata": {
    "request_id": "req-123456",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### 错误响应结构
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required",
        "code": "REQUIRED_FIELD"
      }
    ]
  },
  "metadata": {
    "request_id": "req-123456",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

## 🔐 认证和授权

### 1. JWT Token 认证

#### Token 结构
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-123",
    "username": "john_doe",
    "roles": ["admin", "user"],
    "permissions": ["agents:read", "agents:write"],
    "exp": 1640995200,
    "iat": 1640908800,
    "iss": "crewai-studio"
  }
}
```

#### 认证流程
```bash
# 1. 登录获取 Token
POST /v1/auth/login
{
  "username": "john_doe",
  "password": "password123"
}

# 响应
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}

# 2. 使用 Token 访问 API
GET /v1/agents
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# 3. 刷新 Token
POST /v1/auth/refresh
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. 权限控制

#### 权限模型
```python
# 权限定义
PERMISSIONS = {
    'agents': ['read', 'write', 'delete', 'execute'],
    'tasks': ['read', 'write', 'delete', 'execute'],
    'workflows': ['read', 'write', 'delete', 'execute'],
    'executions': ['read', 'write', 'delete'],
    'system': ['admin', 'monitor']
}

# 角色定义
ROLES = {
    'admin': ['*:*'],  # 所有权限
    'developer': [
        'agents:*', 'tasks:*', 'workflows:*', 'executions:read'
    ],
    'operator': [
        'agents:read', 'agents:execute',
        'tasks:read', 'tasks:execute',
        'workflows:read', 'workflows:execute',
        'executions:read'
    ],
    'viewer': [
        'agents:read', 'tasks:read', 'workflows:read', 'executions:read'
    ]
}
```

#### 权限检查装饰器
```python
from functools import wraps
from fastapi import HTTPException, Depends

def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not has_permission(current_user, permission):
                raise HTTPException(
                    status_code=403,
                    detail=f"Permission denied: {permission}"
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# 使用示例
@router.post("/agents")
@require_permission("agents:write")
async def create_agent(
    agent_data: AgentCreate,
    current_user: User = Depends(get_current_user)
):
    return await agent_service.create(agent_data)
```

---

## 📚 API 接口定义

### 1. Agent 管理 API

#### 获取代理列表
```http
GET /v1/agents
```

**查询参数**:
```bash
?page=1&page_size=20&status=active&search=assistant&sort=created_at:desc
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "agent-123",
      "name": "Assistant Agent",
      "description": "A helpful assistant",
      "role": "assistant",
      "status": "active",
      "type": "standard",
      "llm_config": {
        "model": "gpt-4",
        "temperature": 0.7
      },
      "tools": ["search", "calculator"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_pages": 1,
    "total_items": 1
  }
}
```

#### 创建代理
```http
POST /v1/agents
```

**请求体**:
```json
{
  "name": "New Agent",
  "description": "Agent description",
  "role": "assistant",
  "goal": "Help users with tasks",
  "backstory": "An experienced assistant",
  "llm_config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 1000
  },
  "tools": ["search", "calculator"],
  "capabilities": ["reasoning", "analysis"]
}
```

#### 执行代理
```http
POST /v1/agents/{agent_id}/execute
```

**请求体**:
```json
{
  "task_description": "Analyze the given data",
  "input_data": {
    "data": [1, 2, 3, 4, 5]
  },
  "context": {
    "user_id": "user-123",
    "session_id": "session-456"
  },
  "options": {
    "timeout": 300,
    "priority": 5,
    "async_execution": true
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "execution_id": "exec-789",
    "status": "running",
    "agent_id": "agent-123",
    "started_at": "2024-01-01T00:00:00Z",
    "estimated_completion": "2024-01-01T00:05:00Z"
  }
}
```

### 2. Task 管理 API

#### 获取任务列表
```http
GET /v1/tasks
```

**查询参数**:
```bash
?status=pending&priority=high&assigned_agent=agent-123&workflow_id=workflow-456
```

#### 创建任务
```http
POST /v1/tasks
```

**请求体**:
```json
{
  "name": "Data Analysis Task",
  "description": "Analyze customer data",
  "type": "analysis",
  "priority": 8,
  "input_data": {
    "dataset": "customers.csv",
    "metrics": ["age", "income", "location"]
  },
  "assigned_agent_id": "agent-123",
  "dependencies": ["task-456"],
  "max_execution_time": 600,
  "tags": ["analysis", "customer-data"]
}
```

#### 执行任务
```http
POST /v1/tasks/{task_id}/execute
```

### 3. Workflow 管理 API

#### 获取工作流列表
```http
GET /v1/workflows
```

#### 创建工作流
```http
POST /v1/workflows
```

**请求体**:
```json
{
  "name": "Data Processing Workflow",
  "description": "Complete data processing pipeline",
  "type": "sequential",
  "execution_mode": "async",
  "workflow_definition": {
    "steps": [
      {
        "id": "step-1",
        "type": "task",
        "task_id": "task-123",
        "dependencies": []
      },
      {
        "id": "step-2",
        "type": "task",
        "task_id": "task-456",
        "dependencies": ["step-1"]
      }
    ]
  },
  "agent_configs": {
    "default_agent": "agent-123"
  },
  "max_execution_time": 1800
}
```

#### 执行工作流
```http
POST /v1/workflows/{workflow_id}/execute
```

### 4. Execution 监控 API

#### 获取执行状态
```http
GET /v1/executions/{execution_id}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "exec-789",
    "execution_type": "agent",
    "status": "completed",
    "agent_id": "agent-123",
    "input_data": {...},
    "output_data": {
      "result": "Analysis completed",
      "insights": [...]
    },
    "started_at": "2024-01-01T00:00:00Z",
    "completed_at": "2024-01-01T00:05:00Z",
    "execution_time": 300.5,
    "logs": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "level": "info",
        "message": "Execution started"
      }
    ]
  }
}
```

#### 获取执行日志
```http
GET /v1/executions/{execution_id}/logs
```

#### 取消执行
```http
POST /v1/executions/{execution_id}/cancel
```

---

## 🔄 版本控制

### 1. API 版本策略

#### URL 版本控制
```bash
# 当前版本
https://api.crewai-studio.com/v1/agents

# 新版本
https://api.crewai-studio.com/v2/agents
```

#### Header 版本控制
```http
GET /agents
API-Version: v1
Accept: application/vnd.crewai.v1+json
```

### 2. 版本兼容性

#### 向后兼容原则
- **添加字段**: 可以添加新的可选字段
- **废弃字段**: 标记为 deprecated，保持一定时间
- **删除字段**: 在新的主版本中删除
- **修改行为**: 需要新的版本号

#### 版本生命周期
```bash
# v1.0 - 当前稳定版本
# v1.1 - 添加新功能，向后兼容
# v2.0 - 破坏性变更，不兼容 v1.x
# v1.x - 维护 12 个月后废弃
```

---

## ⚠️ 错误处理

### 1. 错误代码规范

#### 错误代码结构
```
{CATEGORY}_{SPECIFIC_ERROR}
```

#### 错误类别
```python
ERROR_CODES = {
    # 认证错误 (AUTH_*)
    'AUTH_INVALID_TOKEN': 'Invalid or expired token',
    'AUTH_INSUFFICIENT_PERMISSIONS': 'Insufficient permissions',
    'AUTH_USER_NOT_FOUND': 'User not found',
    
    # 验证错误 (VALIDATION_*)
    'VALIDATION_REQUIRED_FIELD': 'Required field missing',
    'VALIDATION_INVALID_FORMAT': 'Invalid field format',
    'VALIDATION_VALUE_OUT_OF_RANGE': 'Value out of allowed range',
    
    # 资源错误 (RESOURCE_*)
    'RESOURCE_NOT_FOUND': 'Resource not found',
    'RESOURCE_ALREADY_EXISTS': 'Resource already exists',
    'RESOURCE_CONFLICT': 'Resource conflict',
    
    # 执行错误 (EXECUTION_*)
    'EXECUTION_TIMEOUT': 'Execution timeout',
    'EXECUTION_FAILED': 'Execution failed',
    'EXECUTION_CANCELLED': 'Execution cancelled',
    
    # 系统错误 (SYSTEM_*)
    'SYSTEM_INTERNAL_ERROR': 'Internal server error',
    'SYSTEM_SERVICE_UNAVAILABLE': 'Service unavailable',
    'SYSTEM_RATE_LIMIT_EXCEEDED': 'Rate limit exceeded'
}
```

### 2. 错误响应示例

#### 验证错误
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required",
        "code": "VALIDATION_REQUIRED_FIELD"
      },
      {
        "field": "temperature",
        "message": "Temperature must be between 0 and 2",
        "code": "VALIDATION_VALUE_OUT_OF_RANGE",
        "constraints": {
          "min": 0,
          "max": 2
        }
      }
    ]
  },
  "metadata": {
    "request_id": "req-123456",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### 资源不存在错误
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Agent not found",
    "details": {
      "resource_type": "agent",
      "resource_id": "agent-123"
    }
  },
  "metadata": {
    "request_id": "req-123456",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

## 🚀 性能优化

### 1. 缓存策略

#### HTTP 缓存头
```http
# 静态资源缓存
Cache-Control: public, max-age=31536000
ETag: "abc123"

# 动态内容缓存
Cache-Control: private, max-age=300
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT

# 不缓存
Cache-Control: no-cache, no-store, must-revalidate
```

#### Redis 缓存
```python
# 缓存配置
CACHE_CONFIG = {
    'agents_list': {'ttl': 300, 'key_pattern': 'agents:list:{params_hash}'},
    'agent_detail': {'ttl': 600, 'key_pattern': 'agent:{id}'},
    'execution_status': {'ttl': 60, 'key_pattern': 'execution:{id}:status'}
}

# 缓存装饰器
@cache(key='agent:{id}', ttl=600)
async def get_agent(id: str) -> Agent:
    return await agent_repository.get_by_id(id)
```

### 2. 分页优化

#### 游标分页
```bash
# 基于游标的分页（推荐用于大数据集）
GET /v1/agents?cursor=eyJpZCI6ImFnZW50LTEyMyJ9&limit=20

# 响应
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6ImFnZW50LTE0MyJ9",
    "has_next": true,
    "limit": 20
  }
}
```

#### 偏移分页
```bash
# 基于偏移的分页（适用于小数据集）
GET /v1/agents?page=1&page_size=20
```

### 3. 限流控制

#### 限流策略
```python
# 限流配置
RATE_LIMITS = {
    'default': '100/minute',
    'auth': '10/minute',
    'execute': '20/minute',
    'upload': '5/minute'
}

# 限流装饰器
@limiter.limit("20/minute")
@router.post("/agents/{agent_id}/execute")
async def execute_agent(agent_id: str):
    pass
```

#### 限流响应
```json
{
  "success": false,
  "error": {
    "code": "SYSTEM_RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": "20/minute",
      "reset_time": "2024-01-01T00:01:00Z"
    }
  }
}
```

---

## 📊 监控和日志

### 1. API 监控指标

#### 关键指标
```python
METRICS = {
    'request_count': 'Total number of requests',
    'request_duration': 'Request processing time',
    'error_rate': 'Error rate by status code',
    'active_connections': 'Number of active connections',
    'queue_size': 'Background task queue size'
}
```

#### Prometheus 指标
```python
from prometheus_client import Counter, Histogram, Gauge

# 请求计数器
request_count = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

# 请求耗时
request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

# 活跃连接数
active_connections = Gauge(
    'api_active_connections',
    'Number of active connections'
)
```

### 2. 结构化日志

#### 日志格式
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "logger": "api.agents",
  "message": "Agent created successfully",
  "request_id": "req-123456",
  "user_id": "user-789",
  "method": "POST",
  "path": "/v1/agents",
  "status_code": 201,
  "duration_ms": 150,
  "agent_id": "agent-123",
  "extra": {
    "agent_name": "Assistant Agent",
    "agent_type": "standard"
  }
}
```

#### 日志级别
```python
LOG_LEVELS = {
    'DEBUG': 'Detailed diagnostic information',
    'INFO': 'General operational information',
    'WARNING': 'Warning conditions',
    'ERROR': 'Error conditions',
    'CRITICAL': 'Critical error conditions'
}
```

---

## 🧪 测试策略

### 1. API 测试类型

#### 单元测试
```python
import pytest
from fastapi.testclient import TestClient

def test_create_agent(client: TestClient):
    response = client.post(
        "/v1/agents",
        json={
            "name": "Test Agent",
            "role": "assistant",
            "goal": "Help users"
        },
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert "id" in response.json()["data"]
```

#### 集成测试
```python
@pytest.mark.asyncio
async def test_agent_execution_flow():
    # 1. 创建代理
    agent = await create_test_agent()
    
    # 2. 执行代理
    execution = await execute_agent(agent.id, test_task)
    
    # 3. 检查执行状态
    status = await get_execution_status(execution.id)
    assert status.status == "completed"
    
    # 4. 验证结果
    assert status.output_data is not None
```

#### 性能测试
```python
import asyncio
import aiohttp
import time

async def load_test_agents_api():
    async with aiohttp.ClientSession() as session:
        tasks = []
        start_time = time.time()
        
        # 并发 100 个请求
        for i in range(100):
            task = session.get(
                "http://localhost:8000/v1/agents",
                headers={"Authorization": "Bearer token"}
            )
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks)
        end_time = time.time()
        
        # 验证响应
        for response in responses:
            assert response.status == 200
        
        print(f"100 requests completed in {end_time - start_time:.2f}s")
```

### 2. API 文档测试

#### OpenAPI 规范验证
```python
from openapi_spec_validator import validate_spec
import yaml

def test_openapi_spec_valid():
    with open("openapi.yaml", "r") as f:
        spec = yaml.safe_load(f)
    
    # 验证 OpenAPI 规范
    validate_spec(spec)
```

---

## 📖 API 文档

### 1. OpenAPI 配置

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="CrewAI Studio API",
    description="AI Agent Workflow Management Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="CrewAI Studio API",
        version="1.0.0",
        description="Comprehensive API for managing AI agents, tasks, and workflows",
        routes=app.routes,
    )
    
    # 添加安全定义
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

### 2. API 文档示例

#### 端点文档
```python
@router.post(
    "/agents",
    response_model=AgentResponse,
    status_code=201,
    summary="Create a new agent",
    description="Create a new AI agent with specified configuration",
    responses={
        201: {
            "description": "Agent created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "data": {
                            "id": "agent-123",
                            "name": "Assistant Agent",
                            "status": "active"
                        }
                    }
                }
            }
        },
        400: {"description": "Invalid request data"},
        401: {"description": "Authentication required"},
        403: {"description": "Insufficient permissions"}
    },
    tags=["Agents"]
)
async def create_agent(
    agent_data: AgentCreate = Body(
        ...,
        example={
            "name": "Assistant Agent",
            "role": "assistant",
            "goal": "Help users with various tasks",
            "llm_config": {
                "model": "gpt-4",
                "temperature": 0.7
            }
        }
    ),
    current_user: User = Depends(get_current_user)
):
    """Create a new AI agent.
    
    This endpoint allows you to create a new AI agent with custom configuration.
    The agent will be available for task execution once created.
    
    Args:
        agent_data: Agent configuration data
        current_user: Current authenticated user
    
    Returns:
        AgentResponse: Created agent information
    
    Raises:
        HTTPException: If validation fails or user lacks permissions
    """
    return await agent_service.create(agent_data, current_user)
```

---

## 📝 总结

本 API 设计规范文档提供了 CrewAI Studio 项目的完整 API 架构，包括：

1. **标准化的 RESTful 设计** - 统一的 URL 结构和 HTTP 方法使用
2. **完善的认证授权机制** - JWT Token 认证和基于角色的权限控制
3. **详细的接口定义** - 涵盖所有核心功能的 API 端点
4. **灵活的版本控制策略** - 支持 API 平滑升级和向后兼容
5. **全面的错误处理** - 标准化的错误代码和响应格式
6. **高性能优化方案** - 缓存、分页、限流等性能优化策略
7. **完整的监控和日志** - 结构化日志和性能指标监控
8. **系统的测试策略** - 单元测试、集成测试和性能测试
9. **自动化的 API 文档** - OpenAPI 规范和交互式文档

该设计确保了 API 的可扩展性、可维护性和高性能，为 CrewAI Studio 的前后端交互提供了坚实的基础。