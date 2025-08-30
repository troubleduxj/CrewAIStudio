# CrewAI Studio 后端开发标准

## 1. 项目概述

本文档定义了 CrewAI Studio 后端开发的标准和规范，确保代码质量、可维护性、安全性和团队协作效率。

### 1.1 技术栈

- **框架**: FastAPI 0.100+
- **语言**: Python 3.10+
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: SQLAlchemy 2.0+
- **数据验证**: Pydantic 2.0+
- **AI框架**: CrewAI
- **异步支持**: asyncio
- **数据迁移**: Alembic
- **测试**: pytest + pytest-asyncio
- **代码质量**: black + flake8 + mypy

## 2. 项目结构规范

### 2.1 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── core/                # 核心配置和工具
│   │   ├── __init__.py
│   │   ├── config.py        # 配置管理
│   │   ├── database.py      # 数据库连接
│   │   ├── security.py      # 安全相关
│   │   └── exceptions.py    # 自定义异常
│   ├── api/                 # API 路由
│   │   ├── __init__.py
│   │   ├── deps.py          # 依赖注入
│   │   ├── agents.py        # Agent 相关 API
│   │   ├── tasks.py         # Task 相关 API
│   │   ├── workflows.py     # Workflow 相关 API
│   │   └── auth.py          # 认证相关 API
│   ├── models/              # 数据库模型
│   │   ├── __init__.py
│   │   ├── base.py          # 基础模型
│   │   ├── agent.py         # Agent 模型
│   │   ├── task.py          # Task 模型
│   │   └── workflow.py      # Workflow 模型
│   ├── schemas/             # Pydantic 模式
│   │   ├── __init__.py
│   │   ├── common.py        # 通用模式
│   │   ├── agent.py         # Agent 模式
│   │   ├── task.py          # Task 模式
│   │   └── workflow.py      # Workflow 模式
│   ├── services/            # 业务逻辑服务
│   │   ├── __init__.py
│   │   ├── agent_service.py # Agent 服务
│   │   ├── task_service.py  # Task 服务
│   │   ├── workflow_service.py # Workflow 服务
│   │   └── crewai_service.py # CrewAI 集成服务
│   └── utils/               # 工具函数
│       ├── __init__.py
│       ├── logger.py        # 日志工具
│       └── helpers.py       # 辅助函数
├── alembic/                 # 数据库迁移
├── tests/                   # 测试文件
├── requirements.txt         # 依赖列表
└── .env                     # 环境变量
```

### 2.2 文件命名规范

- **模块文件**: 使用 snake_case，如 `agent_service.py`
- **类名**: 使用 PascalCase，如 `AgentService`
- **函数名**: 使用 snake_case，如 `create_agent`
- **常量**: 使用 UPPER_SNAKE_CASE，如 `DEFAULT_TIMEOUT`
- **私有方法**: 使用下划线前缀，如 `_validate_input`

## 3. 代码规范

### 3.1 Python 代码风格

遵循 PEP 8 标准，使用 black 进行代码格式化：

```python
# 导入顺序
import os
import sys
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentResponse


class AgentService:
    """Agent 业务逻辑服务类"""
    
    def __init__(self, db: Session):
        """初始化服务
        
        Args:
            db: 数据库会话
        """
        self.db = db
    
    async def create_agent(self, agent_data: AgentCreate) -> Agent:
        """创建新的 Agent
        
        Args:
            agent_data: Agent 创建数据
            
        Returns:
            Agent: 创建的 Agent 实例
            
        Raises:
            HTTPException: 当创建失败时
        """
        try:
            agent = Agent(**agent_data.dict())
            self.db.add(agent)
            await self.db.commit()
            await self.db.refresh(agent)
            return agent
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=400, detail=str(e))
```

### 3.2 类型注解

所有函数和方法必须包含类型注解：

```python
from typing import List, Optional, Dict, Any, Union
from uuid import UUID

def get_agent_by_id(agent_id: UUID) -> Optional[Agent]:
    """根据 ID 获取 Agent"""
    pass

async def create_multiple_agents(
    agents_data: List[AgentCreate]
) -> List[Agent]:
    """批量创建 Agents"""
    pass

def process_agent_config(
    config: Dict[str, Any]
) -> Union[Agent, None]:
    """处理 Agent 配置"""
    pass
```

### 3.3 文档字符串

使用 Google 风格的文档字符串：

```python
def complex_function(
    param1: str,
    param2: int,
    param3: Optional[List[str]] = None
) -> Dict[str, Any]:
    """执行复杂的业务逻辑操作
    
    这个函数处理复杂的业务逻辑，包括数据验证、
    转换和存储等操作。
    
    Args:
        param1: 字符串参数，用于标识操作类型
        param2: 整数参数，表示操作的优先级
        param3: 可选的字符串列表，包含额外的配置选项
        
    Returns:
        Dict[str, Any]: 包含操作结果的字典，格式如下：
            {
                'success': bool,
                'data': Any,
                'message': str
            }
            
    Raises:
        ValueError: 当 param1 为空字符串时
        TypeError: 当 param2 不是正整数时
        
    Example:
        >>> result = complex_function("create", 1, ["option1"])
        >>> print(result['success'])
        True
    """
    pass
```

## 4. FastAPI 应用结构

### 4.1 应用初始化

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.api import agents, tasks, workflows


def create_application() -> FastAPI:
    """创建 FastAPI 应用实例
    
    Returns:
        FastAPI: 配置完成的应用实例
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
    )
    
    # 设置中间件
    setup_middleware(app)
    
    # 设置异常处理器
    setup_exception_handlers(app)
    
    # 注册路由
    setup_routes(app)
    
    return app


def setup_middleware(app: FastAPI) -> None:
    """设置中间件"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )


def setup_routes(app: FastAPI) -> None:
    """设置路由"""
    app.include_router(
        agents.router,
        prefix=f"{settings.API_V1_STR}/agents",
        tags=["agents"]
    )
    app.include_router(
        tasks.router,
        prefix=f"{settings.API_V1_STR}/tasks",
        tags=["tasks"]
    )
    app.include_router(
        workflows.router,
        prefix=f"{settings.API_V1_STR}/workflows",
        tags=["workflows"]
    )


app = create_application()
```

### 4.2 路由定义

```python
# app/api/agents.py
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.schemas.common import PaginatedResponse
from app.services.agent_service import AgentService

router = APIRouter()


@router.post(
    "/",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建新的 Agent",
    description="创建一个新的 AI Agent，包含角色、目标、工具等配置"
)
async def create_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db)
) -> AgentResponse:
    """创建新的 Agent
    
    Args:
        agent_data: Agent 创建数据
        db: 数据库会话
        
    Returns:
        AgentResponse: 创建的 Agent 信息
    """
    service = AgentService(db)
    agent = await service.create_agent(agent_data)
    return AgentResponse.from_orm(agent)


@router.get(
    "/",
    response_model=PaginatedResponse[AgentResponse],
    summary="获取 Agent 列表",
    description="分页获取 Agent 列表，支持搜索和过滤"
)
async def get_agents(
    skip: int = 0,
    limit: int = 20,
    search: str = None,
    db: Session = Depends(get_db)
) -> PaginatedResponse[AgentResponse]:
    """获取 Agent 列表"""
    service = AgentService(db)
    agents, total = await service.get_agents(
        skip=skip,
        limit=limit,
        search=search
    )
    return PaginatedResponse(
        items=[AgentResponse.from_orm(agent) for agent in agents],
        total=total,
        page=skip // limit + 1,
        size=limit
    )


@router.get(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="获取单个 Agent",
    description="根据 ID 获取特定的 Agent 详细信息"
)
async def get_agent(
    agent_id: UUID,
    db: Session = Depends(get_db)
) -> AgentResponse:
    """获取单个 Agent"""
    service = AgentService(db)
    agent = await service.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    return AgentResponse.from_orm(agent)
```

## 5. 数据库操作规范

### 5.1 模型定义

```python
# app/models/agent.py
from sqlalchemy import Column, String, Text, DateTime, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.models.base import BaseModel


class AgentStatus(str, enum.Enum):
    """Agent 状态枚举"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    TRAINING = "training"
    ERROR = "error"


class Agent(BaseModel):
    """Agent 数据库模型"""
    
    __tablename__ = "agents"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    role = Column(String(100), nullable=False)
    goal = Column(Text, nullable=False)
    backstory = Column(Text)
    status = Column(
        Enum(AgentStatus),
        default=AgentStatus.ACTIVE,
        nullable=False,
        index=True
    )
    llm_config = Column(JSON)
    tools = Column(JSON, default=list)
    capabilities = Column(JSON, default=list)
    execution_config = Column(JSON)
    system_prompt = Column(Text)
    custom_prompt = Column(Text)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    def __repr__(self) -> str:
        return f"<Agent(id={self.id}, name='{self.name}', role='{self.role}')>"
```

### 5.2 数据库会话管理

```python
# app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.core.config import settings

# 创建数据库引擎
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 声明基类
Base = declarative_base()


def get_db() -> Session:
    """获取数据库会话
    
    Yields:
        Session: 数据库会话实例
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> Session:
    """获取异步数据库会话"""
    # 异步数据库会话实现
    pass
```

### 5.3 数据库操作服务

```python
# app/services/agent_service.py
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.agent import Agent, AgentStatus
from app.schemas.agent import AgentCreate, AgentUpdate


class AgentService:
    """Agent 业务逻辑服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_agent(self, agent_data: AgentCreate) -> Agent:
        """创建新的 Agent"""
        agent = Agent(**agent_data.dict())
        self.db.add(agent)
        await self.db.commit()
        await self.db.refresh(agent)
        return agent
    
    async def get_agent_by_id(self, agent_id: UUID) -> Optional[Agent]:
        """根据 ID 获取 Agent"""
        return self.db.query(Agent).filter(Agent.id == agent_id).first()
    
    async def get_agents(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[AgentStatus] = None
    ) -> Tuple[List[Agent], int]:
        """分页获取 Agents
        
        Args:
            skip: 跳过的记录数
            limit: 限制返回的记录数
            search: 搜索关键词
            status: Agent 状态过滤
            
        Returns:
            Tuple[List[Agent], int]: Agent 列表和总数
        """
        query = self.db.query(Agent)
        
        # 应用过滤条件
        if search:
            search_filter = or_(
                Agent.name.ilike(f"%{search}%"),
                Agent.description.ilike(f"%{search}%"),
                Agent.role.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        if status:
            query = query.filter(Agent.status == status)
        
        # 获取总数
        total = query.count()
        
        # 应用分页
        agents = query.offset(skip).limit(limit).all()
        
        return agents, total
    
    async def update_agent(
        self,
        agent_id: UUID,
        agent_data: AgentUpdate
    ) -> Optional[Agent]:
        """更新 Agent"""
        agent = await self.get_agent_by_id(agent_id)
        if not agent:
            return None
        
        update_data = agent_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(agent, field, value)
        
        await self.db.commit()
        await self.db.refresh(agent)
        return agent
    
    async def delete_agent(self, agent_id: UUID) -> bool:
        """删除 Agent"""
        agent = await self.get_agent_by_id(agent_id)
        if not agent:
            return False
        
        self.db.delete(agent)
        await self.db.commit()
        return True
```

## 6. Pydantic 模式规范

### 6.1 基础模式

```python
# app/schemas/common.py
from typing import Generic, List, TypeVar, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

T = TypeVar('T')


class BaseSchema(BaseModel):
    """基础 Pydantic 模式"""
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }


class PaginatedResponse(BaseSchema, Generic[T]):
    """分页响应模式"""
    items: List[T] = Field(..., description="数据项列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    size: int = Field(..., description="每页大小")
    pages: Optional[int] = Field(None, description="总页数")
    
    def __init__(self, **data):
        super().__init__(**data)
        if self.pages is None and self.size > 0:
            self.pages = (self.total + self.size - 1) // self.size


class ErrorResponse(BaseSchema):
    """错误响应模式"""
    error: str = Field(..., description="错误类型")
    message: str = Field(..., description="错误消息")
    details: Optional[dict] = Field(None, description="错误详情")
```

### 6.2 业务模式

```python
# app/schemas/agent.py
from typing import List, Optional, Dict, Any
from pydantic import Field, validator
from datetime import datetime
from uuid import UUID

from app.schemas.common import BaseSchema
from app.models.agent import AgentStatus


class AgentBase(BaseSchema):
    """Agent 基础模式"""
    name: str = Field(..., min_length=1, max_length=255, description="Agent 名称")
    description: Optional[str] = Field(None, description="Agent 描述")
    role: str = Field(..., min_length=1, max_length=100, description="Agent 角色")
    goal: str = Field(..., min_length=1, description="Agent 目标")
    backstory: Optional[str] = Field(None, description="Agent 背景故事")
    llm_config: Optional[Dict[str, Any]] = Field(None, description="LLM 配置")
    tools: List[str] = Field(default_factory=list, description="工具列表")
    capabilities: List[str] = Field(default_factory=list, description="能力列表")
    execution_config: Optional[Dict[str, Any]] = Field(None, description="执行配置")
    system_prompt: Optional[str] = Field(None, description="系统提示词")
    custom_prompt: Optional[str] = Field(None, description="自定义提示词")
    
    @validator('name')
    def validate_name(cls, v):
        """验证名称"""
        if not v.strip():
            raise ValueError('名称不能为空')
        return v.strip()
    
    @validator('llm_config')
    def validate_llm_config(cls, v):
        """验证 LLM 配置"""
        if v is not None:
            required_fields = ['model', 'temperature']
            for field in required_fields:
                if field not in v:
                    raise ValueError(f'LLM 配置缺少必需字段: {field}')
        return v


class AgentCreate(AgentBase):
    """创建 Agent 的请求模式"""
    pass


class AgentUpdate(BaseSchema):
    """更新 Agent 的请求模式"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    role: Optional[str] = Field(None, min_length=1, max_length=100)
    goal: Optional[str] = Field(None, min_length=1)
    backstory: Optional[str] = None
    status: Optional[AgentStatus] = None
    llm_config: Optional[Dict[str, Any]] = None
    tools: Optional[List[str]] = None
    capabilities: Optional[List[str]] = None
    execution_config: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None
    custom_prompt: Optional[str] = None


class AgentResponse(AgentBase):
    """Agent 响应模式"""
    id: UUID = Field(..., description="Agent ID")
    status: AgentStatus = Field(..., description="Agent 状态")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")


class AgentExecuteRequest(BaseSchema):
    """Agent 执行请求模式"""
    task_description: str = Field(..., min_length=1, description="任务描述")
    input_data: Optional[Dict[str, Any]] = Field(None, description="输入数据")
    context: Optional[Dict[str, Any]] = Field(None, description="执行上下文")
    timeout: Optional[int] = Field(300, ge=1, le=3600, description="超时时间（秒）")
    priority: Optional[int] = Field(1, ge=1, le=10, description="优先级")
    async_execution: bool = Field(False, description="是否异步执行")
    callback_url: Optional[str] = Field(None, description="回调 URL")


class AgentExecuteResponse(BaseSchema):
    """Agent 执行响应模式"""
    execution_id: UUID = Field(..., description="执行 ID")
    status: str = Field(..., description="执行状态")
    result: Optional[Dict[str, Any]] = Field(None, description="执行结果")
    output: Optional[str] = Field(None, description="输出内容")
    started_at: datetime = Field(..., description="开始时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    error_info: Optional[Dict[str, Any]] = Field(None, description="错误信息")
    logs: List[str] = Field(default_factory=list, description="执行日志")
```

## 7. 异常处理规范

### 7.1 自定义异常

```python
# app/core/exceptions.py
from typing import Any, Dict, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class CrewAIStudioException(Exception):
    """CrewAI Studio 基础异常类"""
    
    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class AgentNotFoundError(CrewAIStudioException):
    """Agent 未找到异常"""
    
    def __init__(self, agent_id: str):
        super().__init__(
            message=f"Agent with ID {agent_id} not found",
            error_code="AGENT_NOT_FOUND",
            details={"agent_id": agent_id}
        )


class AgentExecutionError(CrewAIStudioException):
    """Agent 执行异常"""
    
    def __init__(self, message: str, execution_id: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="AGENT_EXECUTION_ERROR",
            details={"execution_id": execution_id} if execution_id else {}
        )


class ValidationError(CrewAIStudioException):
    """数据验证异常"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details={"field": field} if field else {}
        )


def setup_exception_handlers(app):
    """设置异常处理器"""
    
    @app.exception_handler(CrewAIStudioException)
    async def crewai_studio_exception_handler(
        request: Request,
        exc: CrewAIStudioException
    ):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": exc.error_code or "UNKNOWN_ERROR",
                "message": exc.message,
                "details": exc.details
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError
    ):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": exc.errors()
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request,
        exc: StarletteHTTPException
    ):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "HTTP_ERROR",
                "message": exc.detail,
                "details": {}
            }
        )
```

### 7.2 错误处理装饰器

```python
# app/utils/decorators.py
from functools import wraps
from typing import Callable, Any
import logging

from app.core.exceptions import CrewAIStudioException

logger = logging.getLogger(__name__)


def handle_exceptions(func: Callable) -> Callable:
    """异常处理装饰器"""
    
    @wraps(func)
    async def wrapper(*args, **kwargs) -> Any:
        try:
            return await func(*args, **kwargs)
        except CrewAIStudioException:
            # 重新抛出自定义异常
            raise
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
            raise CrewAIStudioException(
                message="An unexpected error occurred",
                error_code="INTERNAL_ERROR",
                details={"function": func.__name__, "error": str(e)}
            )
    
    return wrapper


def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """失败重试装饰器"""
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(
                            f"Attempt {attempt + 1} failed for {func.__name__}: {str(e)}"
                        )
                        await asyncio.sleep(delay)
                    else:
                        logger.error(
                            f"All {max_retries + 1} attempts failed for {func.__name__}"
                        )
            
            raise last_exception
        
        return wrapper
    
    return decorator
```

## 8. 配置管理

### 8.1 配置类

```python
# app/core/config.py
from typing import List, Optional
from pydantic import BaseSettings, validator
import os


class Settings(BaseSettings):
    """应用配置类"""
    
    # 基础配置
    PROJECT_NAME: str = "CrewAI Studio"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI Agent Workflow Management Platform"
    API_V1_STR: str = "/api/v1"
    
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    RELOAD: bool = False
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./crewai_studio.db"
    DATABASE_ECHO: bool = False
    
    # 安全配置
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # CORS 配置
    ALLOWED_HOSTS: List[str] = ["*"]
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # CrewAI 配置
    CREWAI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # 文件上传配置
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    @validator('DATABASE_URL')
    def validate_database_url(cls, v):
        """验证数据库 URL"""
        if not v:
            raise ValueError('DATABASE_URL cannot be empty')
        return v
    
    @validator('SECRET_KEY')
    def validate_secret_key(cls, v):
        """验证密钥"""
        if len(v) < 32:
            raise ValueError('SECRET_KEY must be at least 32 characters long')
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建全局配置实例
settings = Settings()
```

### 8.2 环境变量文件

```bash
# .env
# 基础配置
PROJECT_NAME="CrewAI Studio"
DEBUG=false

# 数据库配置
DATABASE_URL="sqlite:///./crewai_studio.db"
# DATABASE_URL="postgresql://user:password@localhost/crewai_studio"

# 安全配置
SECRET_KEY="your-very-secure-secret-key-here-at-least-32-characters"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API 密钥
OPENAI_API_KEY="your-openai-api-key"
CREWAI_API_KEY="your-crewai-api-key"

# CORS 配置
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"

# 日志配置
LOG_LEVEL="INFO"
```

## 9. 日志规范

### 9.1 日志配置

```python
# app/utils/logger.py
import logging
import sys
from typing import Optional
from pathlib import Path

from app.core.config import settings


def setup_logging(
    level: Optional[str] = None,
    log_file: Optional[str] = None
) -> None:
    """设置日志配置
    
    Args:
        level: 日志级别
        log_file: 日志文件路径
    """
    log_level = level or settings.LOG_LEVEL
    log_format = settings.LOG_FORMAT
    
    # 创建根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # 清除现有处理器
    root_logger.handlers.clear()
    
    # 创建格式化器
    formatter = logging.Formatter(log_format)
    
    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # 文件处理器（如果指定了日志文件）
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # 设置第三方库的日志级别
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """获取日志器
    
    Args:
        name: 日志器名称
        
    Returns:
        logging.Logger: 日志器实例
    """
    return logging.getLogger(name)


# 创建应用日志器
logger = get_logger(__name__)
```

### 9.2 日志使用示例

```python
# 在服务中使用日志
from app.utils.logger import get_logger

logger = get_logger(__name__)

class AgentService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = get_logger(self.__class__.__name__)
    
    async def create_agent(self, agent_data: AgentCreate) -> Agent:
        """创建新的 Agent"""
        self.logger.info(f"Creating new agent: {agent_data.name}")
        
        try:
            agent = Agent(**agent_data.dict())
            self.db.add(agent)
            await self.db.commit()
            await self.db.refresh(agent)
            
            self.logger.info(f"Agent created successfully: {agent.id}")
            return agent
            
        except Exception as e:
            self.logger.error(f"Failed to create agent: {str(e)}")
            await self.db.rollback()
            raise
```

## 10. 测试规范

### 10.1 测试结构

```
tests/
├── __init__.py
├── conftest.py              # pytest 配置和 fixtures
├── test_api/                # API 测试
│   ├── __init__.py
│   ├── test_agents.py
│   ├── test_tasks.py
│   └── test_workflows.py
├── test_services/           # 服务层测试
│   ├── __init__.py
│   ├── test_agent_service.py
│   └── test_crewai_service.py
├── test_models/             # 模型测试
│   ├── __init__.py
│   └── test_agent.py
└── test_utils/              # 工具函数测试
    ├── __init__.py
    └── test_helpers.py
```

### 10.2 测试配置

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.models.agent import Agent

# 测试数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


@pytest.fixture(scope="session")
def db_engine():
    """创建测试数据库引擎"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine):
    """创建测试数据库会话"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """创建测试客户端"""
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_agent_data():
    """示例 Agent 数据"""
    return {
        "name": "Test Agent",
        "description": "A test agent",
        "role": "researcher",
        "goal": "Conduct research",
        "backstory": "An experienced researcher",
        "tools": ["web_search", "file_read"],
        "capabilities": ["research", "analysis"]
    }
```

### 10.3 API 测试示例

```python
# tests/test_api/test_agents.py
import pytest
from fastapi import status


class TestAgentsAPI:
    """Agent API 测试类"""
    
    def test_create_agent(self, client, sample_agent_data):
        """测试创建 Agent"""
        response = client.post("/api/v1/agents/", json=sample_agent_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == sample_agent_data["name"]
        assert data["role"] == sample_agent_data["role"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_agent_invalid_data(self, client):
        """测试创建 Agent 时数据无效"""
        invalid_data = {"name": ""}  # 缺少必需字段
        
        response = client.post("/api/v1/agents/", json=invalid_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_get_agents(self, client, db_session, sample_agent_data):
        """测试获取 Agent 列表"""
        # 创建测试数据
        agent = Agent(**sample_agent_data)
        db_session.add(agent)
        db_session.commit()
        
        response = client.get("/api/v1/agents/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) > 0
    
    def test_get_agent_by_id(self, client, db_session, sample_agent_data):
        """测试根据 ID 获取 Agent"""
        # 创建测试数据
        agent = Agent(**sample_agent_data)
        db_session.add(agent)
        db_session.commit()
        db_session.refresh(agent)
        
        response = client.get(f"/api/v1/agents/{agent.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(agent.id)
        assert data["name"] == agent.name
    
    def test_get_agent_not_found(self, client):
        """测试获取不存在的 Agent"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = client.get(f"/api/v1/agents/{fake_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
```

### 10.4 服务层测试示例

```python
# tests/test_services/test_agent_service.py
import pytest
from uuid import uuid4

from app.services.agent_service import AgentService
from app.schemas.agent import AgentCreate
from app.models.agent import Agent


class TestAgentService:
    """Agent 服务测试类"""
    
    @pytest.fixture
    def agent_service(self, db_session):
        """创建 Agent 服务实例"""
        return AgentService(db_session)
    
    async def test_create_agent(self, agent_service, sample_agent_data):
        """测试创建 Agent"""
        agent_data = AgentCreate(**sample_agent_data)
        
        agent = await agent_service.create_agent(agent_data)
        
        assert agent.id is not None
        assert agent.name == sample_agent_data["name"]
        assert agent.role == sample_agent_data["role"]
        assert agent.created_at is not None
    
    async def test_get_agent_by_id(self, agent_service, db_session, sample_agent_data):
        """测试根据 ID 获取 Agent"""
        # 创建测试数据
        agent = Agent(**sample_agent_data)
        db_session.add(agent)
        db_session.commit()
        db_session.refresh(agent)
        
        result = await agent_service.get_agent_by_id(agent.id)
        
        assert result is not None
        assert result.id == agent.id
        assert result.name == agent.name
    
    async def test_get_agent_by_id_not_found(self, agent_service):
        """测试获取不存在的 Agent"""
        fake_id = uuid4()
        
        result = await agent_service.get_agent_by_id(fake_id)
        
        assert result is None
    
    async def test_get_agents_with_search(self, agent_service, db_session):
        """测试搜索 Agents"""
        # 创建测试数据
        agents_data = [
            {"name": "Research Agent", "role": "researcher", "goal": "Research"},
            {"name": "Analysis Agent", "role": "analyst", "goal": "Analyze"},
            {"name": "Writer Agent", "role": "writer", "goal": "Write"}
        ]
        
        for data in agents_data:
            agent = Agent(**data)
            db_session.add(agent)
        db_session.commit()
        
        # 搜索包含 "Research" 的 Agents
        agents, total = await agent_service.get_agents(search="Research")
        
        assert total == 1
        assert len(agents) == 1
        assert agents[0].name == "Research Agent"
```

## 11. 性能优化

### 11.1 数据库优化

```python
# 使用索引优化查询
class Agent(BaseModel):
    __tablename__ = "agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)  # 添加索引
    status = Column(Enum(AgentStatus), index=True)  # 状态字段索引
    created_at = Column(DateTime(timezone=True), index=True)  # 时间字段索引
    
    # 复合索引
    __table_args__ = (
        Index('idx_agent_status_created', 'status', 'created_at'),
        Index('idx_agent_name_status', 'name', 'status'),
    )

# 使用查询优化
class AgentService:
    async def get_agents_optimized(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[AgentStatus] = None
    ) -> Tuple[List[Agent], int]:
        """优化的 Agent 查询"""
        # 使用 select 指定需要的字段
        query = self.db.query(Agent).options(
            load_only(Agent.id, Agent.name, Agent.status, Agent.created_at)
        )
        
        if status:
            query = query.filter(Agent.status == status)
        
        # 使用 count 子查询优化总数计算
        total_query = query.statement.with_only_columns([func.count()])
        total = self.db.execute(total_query).scalar()
        
        # 应用分页和排序
        agents = query.order_by(Agent.created_at.desc()).offset(skip).limit(limit).all()
        
        return agents, total
```

### 11.2 缓存策略

```python
# app/utils/cache.py
from typing import Any, Optional, Callable
from functools import wraps
import json
import hashlib
from datetime import datetime, timedelta

# 简单内存缓存实现
class MemoryCache:
    def __init__(self):
        self._cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        if key in self._cache:
            value, expiry = self._cache[key]
            if expiry is None or datetime.now() < expiry:
                return value
            else:
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """设置缓存值"""
        expiry = None
        if ttl:
            expiry = datetime.now() + timedelta(seconds=ttl)
        self._cache[key] = (value, expiry)
    
    def delete(self, key: str) -> None:
        """删除缓存值"""
        if key in self._cache:
            del self._cache[key]
    
    def clear(self) -> None:
        """清空缓存"""
        self._cache.clear()

# 全局缓存实例
cache = MemoryCache()


def cached(ttl: int = 300, key_prefix: str = ""):
    """缓存装饰器
    
    Args:
        ttl: 缓存时间（秒）
        key_prefix: 缓存键前缀
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # 生成缓存键
            cache_key = _generate_cache_key(func, args, kwargs, key_prefix)
            
            # 尝试从缓存获取
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # 执行函数并缓存结果
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    
    return decorator


def _generate_cache_key(
    func: Callable,
    args: tuple,
    kwargs: dict,
    prefix: str
) -> str:
    """生成缓存键"""
    # 创建参数的哈希值
    params_str = json.dumps({
        'args': [str(arg) for arg in args],
        'kwargs': {k: str(v) for k, v in kwargs.items()}
    }, sort_keys=True)
    
    params_hash = hashlib.md5(params_str.encode()).hexdigest()
    
    return f"{prefix}:{func.__name__}:{params_hash}"


# 使用缓存的服务方法
class AgentService:
    @cached(ttl=300, key_prefix="agent")
    async def get_agent_by_id(self, agent_id: UUID) -> Optional[Agent]:
        """获取 Agent（带缓存）"""
        return self.db.query(Agent).filter(Agent.id == agent_id).first()
```

### 11.3 异步处理

```python
# app/utils/async_tasks.py
import asyncio
from typing import List, Callable, Any
from concurrent.futures import ThreadPoolExecutor

# 线程池执行器
executor = ThreadPoolExecutor(max_workers=4)


async def run_in_thread(func: Callable, *args, **kwargs) -> Any:
    """在线程池中运行同步函数"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, func, *args, **kwargs)


async def batch_process(
    items: List[Any],
    process_func: Callable,
    batch_size: int = 10,
    max_concurrent: int = 5
) -> List[Any]:
    """批量异步处理
    
    Args:
        items: 要处理的项目列表
        process_func: 处理函数
        batch_size: 批次大小
        max_concurrent: 最大并发数
        
    Returns:
        List[Any]: 处理结果列表
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_batch(batch: List[Any]) -> List[Any]:
        async with semaphore:
            tasks = [process_func(item) for item in batch]
            return await asyncio.gather(*tasks)
    
    # 分批处理
    batches = [items[i:i + batch_size] for i in range(0, len(items), batch_size)]
    batch_tasks = [process_batch(batch) for batch in batches]
    
    results = await asyncio.gather(*batch_tasks)
    
    # 展平结果
    return [item for batch_result in results for item in batch_result]


# 使用示例
class AgentService:
    async def process_multiple_agents(
        self,
        agent_ids: List[UUID]
    ) -> List[Agent]:
        """批量处理多个 Agents"""
        
        async def process_single_agent(agent_id: UUID) -> Agent:
            # 模拟异步处理
            agent = await self.get_agent_by_id(agent_id)
            # 执行一些处理逻辑
            return agent
        
        return await batch_process(
            agent_ids,
            process_single_agent,
            batch_size=5,
            max_concurrent=3
        )
```

## 12. 安全规范

### 12.1 认证和授权

```python
# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer 认证
security = HTTPBearer()


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """创建访问令牌
    
    Args:
        data: 要编码的数据
        expires_delta: 过期时间增量
        
    Returns:
        str: JWT 令牌
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """验证令牌
    
    Args:
        token: JWT 令牌
        
    Returns:
        Optional[dict]: 解码后的数据，验证失败返回 None
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """获取当前用户
    
    Args:
        credentials: HTTP 认证凭据
        
    Returns:
        dict: 用户信息
        
    Raises:
        HTTPException: 认证失败时
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


def hash_password(password: str) -> str:
    """哈希密码"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)
```

### 12.2 输入验证和清理

```python
# app/utils/validators.py
import re
from typing import Any, List, Optional
from pydantic import validator


class SecurityValidators:
    """安全验证器类"""
    
    @staticmethod
    def validate_sql_injection(value: str) -> str:
        """防止 SQL 注入"""
        dangerous_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)",
            r"(--|#|/\*|\*/)",
            r"(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)"
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValueError("Potentially dangerous input detected")
        
        return value
    
    @staticmethod
    def validate_xss(value: str) -> str:
        """防止 XSS 攻击"""
        dangerous_tags = [
            r"<script[^>]*>.*?</script>",
            r"<iframe[^>]*>.*?</iframe>",
            r"javascript:",
            r"on\w+\s*="
        ]
        
        for pattern in dangerous_tags:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValueError("Potentially dangerous HTML content detected")
        
        return value
    
    @staticmethod
    def validate_file_path(value: str) -> str:
        """验证文件路径"""
        dangerous_patterns = [
            r"\.\./",  # 路径遍历
            r"\.\.\\",  # Windows 路径遍历
            r"^/",  # 绝对路径
            r"^[a-zA-Z]:\\",  # Windows 绝对路径
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value):
                raise ValueError("Invalid file path")
        
        return value


# 在 Pydantic 模型中使用验证器
class SecureAgentCreate(AgentBase):
    """安全的 Agent 创建模式"""
    
    @validator('name', 'description', 'role', 'goal', 'backstory')
    def validate_text_fields(cls, v):
        """验证文本字段"""
        if v:
            v = SecurityValidators.validate_sql_injection(v)
            v = SecurityValidators.validate_xss(v)
        return v
```

### 12.3 API 安全中间件

```python
# app/middleware/security.py
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
from collections import defaultdict
from typing import Dict


class RateLimitMiddleware(BaseHTTPMiddleware):
    """速率限制中间件"""
    
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients: Dict[str, List[float]] = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()
        
        # 清理过期的请求记录
        self.clients[client_ip] = [
            req_time for req_time in self.clients[client_ip]
            if now - req_time < self.period
        ]
        
        # 检查是否超过限制
        if len(self.clients[client_ip]) >= self.calls:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests"
                }
            )
        
        # 记录当前请求
        self.clients[client_ip].append(now)
        
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """安全头中间件"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # 添加安全头
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        )
        
        return response
```

## 13. 部署和运维

### 13.1 Docker 配置

```dockerfile
# Dockerfile
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 13.2 生产环境配置

```python
# app/core/config.py (生产环境部分)
class ProductionSettings(Settings):
    """生产环境配置"""
    
    DEBUG: bool = False
    RELOAD: bool = False
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://user:password@localhost/crewai_studio"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30
    
    # 安全配置
    ALLOWED_HOSTS: List[str] = ["yourdomain.com", "api.yourdomain.com"]
    
    # 日志配置
    LOG_LEVEL: str = "WARNING"
    LOG_FILE: str = "/var/log/crewai_studio/app.log"
    
    # 性能配置
    WORKERS: int = 4
    MAX_CONNECTIONS: int = 1000
    KEEPALIVE_TIMEOUT: int = 5
    
    class Config:
        env_file = ".env.production"
```

### 13.3 健康检查

```python
# app/api/health.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.schemas.common import BaseSchema

router = APIRouter()


class HealthResponse(BaseSchema):
    """健康检查响应"""
    status: str
    database: str
    timestamp: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """健康检查端点"""
    try:
        # 检查数据库连接
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )
    
    return HealthResponse(
        status="healthy",
        database=db_status,
        timestamp=datetime.utcnow().isoformat(),
        version=settings.VERSION
    )


@router.get("/ready")
async def readiness_check():
    """就绪检查端点"""
    return {"status": "ready"}


@router.get("/live")
async def liveness_check():
    """存活检查端点"""
    return {"status": "alive"}
```

## 14. 代码质量工具

### 14.1 代码格式化和检查

```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py310']
include = '\.pyi?$'
extend-exclude = '''
(
  /(
      \.eggs
    | \.git
    | \.hg
    | \.mypy_cache
    | \.tox
    | \.venv
    | _build
    | buck-out
    | build
    | dist
  )/
)
'''

[tool.isort]
profile = "black"
line_length = 88
multi_line_output = 3
include_trailing_comma = true
force_grid_wrap = 0
use_parentheses = true
ensure_newline_before_comments = true

[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true

[tool.pytest.ini_options]
minversion = "6.0"
addopts = "-ra -q --strict-markers --strict-config"
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests"
]
```

### 14.2 pre-commit 配置

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict
  
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3.10
  
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        args: ["--profile", "black"]
  
  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: ["--max-line-length=88", "--extend-ignore=E203,W503"]
  
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
```

## 15. 总结

本文档定义了 CrewAI Studio 后端开发的完整标准和规范，涵盖了：

- **项目结构**: 清晰的目录组织和文件命名规范
- **代码规范**: Python 代码风格、类型注解、文档字符串
- **FastAPI 应用**: 应用结构、路由定义、中间件配置
- **数据库操作**: 模型定义、会话管理、查询优化
- **数据验证**: Pydantic 模式设计和验证规则
- **异常处理**: 自定义异常类和统一错误处理
- **配置管理**: 环境配置和参数管理
- **日志规范**: 日志配置和使用标准
- **测试规范**: 测试结构和编写规范
- **性能优化**: 数据库优化、缓存策略、异步处理
- **安全规范**: 认证授权、输入验证、安全中间件
- **部署运维**: Docker 配置、生产环境设置、健康检查
- **代码质量**: 格式化工具和质量检查

遵循这些标准将确保代码的一致性、可维护性、安全性和性能，为团队协作和项目长期发展奠定坚实基础。