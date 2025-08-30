"""Agent相关的Pydantic schemas"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from ..models.agent import AgentStatus, AgentType
from .llm import LLMProvider, LLMConfig

class AgentBase(BaseModel):
    """Agent基础模型"""
    name: str = Field(..., min_length=1, max_length=255, description="Agent名称")
    description: Optional[str] = Field(None, description="Agent描述")
    role: str = Field(..., min_length=1, max_length=100, description="Agent角色")
    goal: str = Field(..., min_length=1, description="Agent目标")
    backstory: Optional[str] = Field(None, description="Agent背景故事")
    agent_type: AgentType = Field(AgentType.CUSTOM, description="Agent类型")
    
    # AI模型配置
    llm_model: str = Field("gpt-3.5-turbo", description="使用的LLM模型")
    temperature: Optional[str] = Field("0.7", description="模型温度参数")
    max_tokens: Optional[str] = Field("1000", description="最大token数")
    
    # 工具和能力配置
    tools: List[str] = Field(default_factory=list, description="可用工具列表")
    capabilities: List[str] = Field(default_factory=list, description="能力列表")
    
    # 执行配置
    max_execution_time: Optional[str] = Field("300", description="最大执行时间（秒）")
    allow_delegation: bool = Field(False, description="是否允许委托")
    verbose: bool = Field(True, description="是否详细输出")
    
    # 系统提示词
    system_prompt: Optional[str] = Field(None, description="系统提示词")
    custom_instructions: Optional[str] = Field(None, description="自定义指令")
    
    # 元数据
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    tags: List[str] = Field(default_factory=list, description="标签")
    
    @field_validator('temperature')
    @classmethod
    def validate_temperature(cls, v):
        if v is not None:
            try:
                temp = float(v)
                if not 0.0 <= temp <= 2.0:
                    raise ValueError('Temperature must be between 0.0 and 2.0')
            except ValueError:
                raise ValueError('Temperature must be a valid number')
        return v
    
    @field_validator('max_tokens')
    @classmethod
    def validate_max_tokens(cls, v):
        if v is not None:
            try:
                tokens = int(v)
                if tokens <= 0:
                    raise ValueError('Max tokens must be positive')
            except ValueError:
                raise ValueError('Max tokens must be a valid positive integer')
        return v

class AgentCreate(AgentBase):
    """创建Agent的请求模型"""
    pass

class AgentUpdate(BaseModel):
    """更新Agent的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Agent名称")
    description: Optional[str] = Field(None, description="Agent描述")
    role: Optional[str] = Field(None, min_length=1, max_length=100, description="Agent角色")
    goal: Optional[str] = Field(None, min_length=1, description="Agent目标")
    backstory: Optional[str] = Field(None, description="Agent背景故事")
    agent_type: Optional[AgentType] = Field(None, description="Agent类型")
    status: Optional[AgentStatus] = Field(None, description="Agent状态")
    
    # AI模型配置
    llm_provider: Optional[LLMProvider] = Field(LLMProvider.OPENAI, description="LLM提供商")
    llm_model: Optional[str] = Field(None, description="使用的LLM模型")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="模型温度参数")
    max_tokens: Optional[int] = Field(1000, gt=0, description="最大token数")
    llm_config: Optional[LLMConfig] = Field(None, description="完整LLM配置")
    
    # 工具和能力配置
    tools: Optional[List[str]] = Field(None, description="可用工具列表")
    capabilities: Optional[List[str]] = Field(None, description="能力列表")
    
    # 执行配置
    max_execution_time: Optional[str] = Field(None, description="最大执行时间（秒）")
    allow_delegation: Optional[bool] = Field(None, description="是否允许委托")
    verbose: Optional[bool] = Field(None, description="是否详细输出")
    is_active: Optional[bool] = Field(None, description="是否激活")
    
    # 系统提示词
    system_prompt: Optional[str] = Field(None, description="系统提示词")
    custom_instructions: Optional[str] = Field(None, description="自定义指令")
    
    # 元数据
    meta_data: Optional[Dict[str, Any]] = Field(None, description="元数据")
    tags: Optional[List[str]] = Field(None, description="标签")

class AgentResponse(AgentBase):
    """Agent响应模型"""
    id: int = Field(..., description="Agent ID")
    status: AgentStatus = Field(..., description="Agent状态")
    is_active: bool = Field(..., description="是否激活")
    
    # 统计信息
    execution_count: str = Field("0", description="执行次数")
    success_count: str = Field("0", description="成功次数")
    error_count: str = Field("0", description="错误次数")
    
    # 时间戳
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    
    class Config:
        from_attributes = True
        use_enum_values = True

class AgentExecuteRequest(BaseModel):
    """Agent执行请求模型"""
    task_description: str = Field(..., min_length=1, description="任务描述")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="输入数据")
    context: Optional[Dict[str, Any]] = Field(None, description="执行上下文")
    
    # 执行配置
    timeout: Optional[int] = Field(None, ge=1, le=3600, description="超时时间（秒）")
    priority: Optional[str] = Field("medium", description="执行优先级")
    async_execution: bool = Field(False, description="是否异步执行")
    
    # 回调配置
    callback_url: Optional[str] = Field(None, description="回调URL")
    webhook_headers: Optional[Dict[str, str]] = Field(None, description="Webhook头部")

class AgentExecuteResponse(BaseModel):
    """Agent执行响应模型"""
    execution_id: str = Field(..., description="执行ID")
    agent_id: int = Field(..., description="Agent ID")
    status: str = Field(..., description="执行状态")
    
    # 执行结果
    result: Optional[Dict[str, Any]] = Field(None, description="执行结果")
    output: Optional[str] = Field(None, description="输出内容")
    
    # 执行信息
    started_at: datetime = Field(..., description="开始时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    execution_time: Optional[float] = Field(None, description="执行时间（秒）")
    
    # 错误信息
    error_message: Optional[str] = Field(None, description="错误消息")
    error_details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    
    # 日志和调试信息
    logs: List[str] = Field(default_factory=list, description="执行日志")
    debug_info: Optional[Dict[str, Any]] = Field(None, description="调试信息")

class AgentStatusResponse(BaseModel):
    """Agent状态响应模型"""
    agent_id: int = Field(..., description="Agent ID")
    status: AgentStatus = Field(..., description="当前状态")
    is_available: bool = Field(..., description="是否可用")
    
    # 当前执行信息
    current_task: Optional[str] = Field(None, description="当前任务")
    current_execution_id: Optional[str] = Field(None, description="当前执行ID")
    
    # 性能指标
    cpu_usage: Optional[float] = Field(None, description="CPU使用率")
    memory_usage: Optional[float] = Field(None, description="内存使用率")
    
    # 统计信息
    total_executions: int = Field(0, description="总执行次数")
    successful_executions: int = Field(0, description="成功执行次数")
    failed_executions: int = Field(0, description="失败执行次数")
    average_execution_time: Optional[float] = Field(None, description="平均执行时间")
    
    # 最后活动时间
    last_activity: Optional[datetime] = Field(None, description="最后活动时间")
    
    class Config:
        use_enum_values = True

class AgentListResponse(BaseModel):
    """Agent列表响应模型"""
    agents: List[AgentResponse] = Field(..., description="Agent列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页")
    size: int = Field(..., description="每页大小")
    pages: int = Field(..., description="总页数")

class AgentSearchRequest(BaseModel):
    """Agent搜索请求模型"""
    query: Optional[str] = Field(None, description="搜索关键词")
    status: Optional[AgentStatus] = Field(None, description="状态过滤")
    agent_type: Optional[AgentType] = Field(None, description="类型过滤")
    tags: Optional[List[str]] = Field(None, description="标签过滤")
    is_active: Optional[bool] = Field(None, description="是否激活过滤")
    
    # 排序
    sort_by: Optional[str] = Field("created_at", description="排序字段")
    sort_order: Optional[str] = Field("desc", description="排序方向")
    
    # 分页
    page: int = Field(1, ge=1, description="页码")
    size: int = Field(20, ge=1, le=100, description="每页大小")