"""Task相关的Pydantic schemas"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
from ..models.task import TaskStatus, TaskPriority, TaskType

class TaskBase(BaseModel):
    """Task基础模型"""
    name: str = Field(..., min_length=1, max_length=255, description="任务名称")
    description: str = Field(..., min_length=1, description="任务描述")
    task_type: TaskType = Field(TaskType.CUSTOM, description="任务类型")
    priority: TaskPriority = Field(TaskPriority.MEDIUM, description="任务优先级")
    
    # 任务内容
    input_data: Dict[str, Any] = Field(default_factory=dict, description="输入数据")
    expected_output: Optional[str] = Field(None, description="期望输出描述")
    
    # 执行配置
    max_execution_time: Optional[int] = Field(300, ge=1, le=3600, description="最大执行时间（秒）")
    max_retries: Optional[int] = Field(3, ge=0, le=10, description="最大重试次数")
    
    # Agent关联
    assigned_agent_id: Optional[int] = Field(None, description="分配的Agent ID")
    
    # 任务依赖
    dependencies: List[int] = Field(default_factory=list, description="依赖的任务ID列表")
    
    # 配置选项
    is_template: bool = Field(False, description="是否为模板")
    is_recurring: bool = Field(False, description="是否为循环任务")
    schedule_config: Dict[str, Any] = Field(default_factory=dict, description="调度配置")
    
    # 元数据
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    tags: List[str] = Field(default_factory=list, description="标签")

class TaskCreate(TaskBase):
    """创建Task的请求模型"""
    pass

class TaskUpdate(BaseModel):
    """更新Task的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="任务名称")
    description: Optional[str] = Field(None, min_length=1, description="任务描述")
    task_type: Optional[TaskType] = Field(None, description="任务类型")
    priority: Optional[TaskPriority] = Field(None, description="任务优先级")
    status: Optional[TaskStatus] = Field(None, description="任务状态")
    
    # 任务内容
    input_data: Optional[Dict[str, Any]] = Field(None, description="输入数据")
    expected_output: Optional[str] = Field(None, description="期望输出描述")
    output_data: Optional[Dict[str, Any]] = Field(None, description="输出数据")
    
    # 执行配置
    max_execution_time: Optional[int] = Field(None, ge=1, le=3600, description="最大执行时间（秒）")
    max_retries: Optional[int] = Field(None, ge=0, le=10, description="最大重试次数")
    
    # Agent关联
    assigned_agent_id: Optional[int] = Field(None, description="分配的Agent ID")
    
    # 任务依赖
    dependencies: Optional[List[int]] = Field(None, description="依赖的任务ID列表")
    
    # 进度信息
    progress_percentage: Optional[int] = Field(None, ge=0, le=100, description="进度百分比")
    progress_details: Optional[Dict[str, Any]] = Field(None, description="详细进度信息")
    
    # 结果评估
    quality_score: Optional[str] = Field(None, description="质量评分")
    feedback: Optional[str] = Field(None, description="反馈信息")
    
    # 配置选项
    is_template: Optional[bool] = Field(None, description="是否为模板")
    is_recurring: Optional[bool] = Field(None, description="是否为循环任务")
    schedule_config: Optional[Dict[str, Any]] = Field(None, description="调度配置")
    
    # 元数据
    meta_data: Optional[Dict[str, Any]] = Field(None, description="元数据")
    tags: Optional[List[str]] = Field(None, description="标签")

class TaskResponse(TaskBase):
    """Task响应模型"""
    id: int = Field(..., description="任务ID")
    status: TaskStatus = Field(..., description="任务状态")
    
    # 任务内容
    output_data: Dict[str, Any] = Field(default_factory=dict, description="输出数据")
    
    # 执行信息
    retry_count: int = Field(0, description="重试次数")
    started_at: Optional[str] = Field(None, description="开始执行时间")
    completed_at: Optional[str] = Field(None, description="完成时间")
    execution_duration: Optional[int] = Field(None, description="执行时长（秒）")
    
    # 错误信息
    error_message: Optional[str] = Field(None, description="错误消息")
    error_details: Dict[str, Any] = Field(default_factory=dict, description="错误详情")
    
    # 进度信息
    progress_percentage: int = Field(0, description="进度百分比")
    progress_details: Dict[str, Any] = Field(default_factory=dict, description="详细进度信息")
    
    # 结果评估
    quality_score: Optional[str] = Field(None, description="质量评分")
    feedback: Optional[str] = Field(None, description="反馈信息")
    
    # Agent信息
    assigned_agent_name: Optional[str] = Field(None, description="分配的Agent名称")
    
    # 时间戳
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    
    class Config:
        from_attributes = True
        use_enum_values = True

class TaskExecuteRequest(BaseModel):
    """Task执行请求模型"""
    execution_params: Dict[str, Any] = Field(default_factory=dict, description="执行参数")
    override_agent_id: Optional[int] = Field(None, description="覆盖Agent ID")
    
    # 执行配置
    timeout: Optional[int] = Field(None, ge=1, le=3600, description="超时时间（秒）")
    priority: Optional[TaskPriority] = Field(None, description="执行优先级")
    async_execution: bool = Field(False, description="是否异步执行")
    
    # 回调配置
    callback_url: Optional[str] = Field(None, description="回调URL")
    webhook_headers: Optional[Dict[str, str]] = Field(None, description="Webhook头部")
    
    # 执行选项
    force_execution: bool = Field(False, description="是否强制执行（忽略依赖）")
    skip_validation: bool = Field(False, description="是否跳过验证")

class TaskExecuteResponse(BaseModel):
    """Task执行响应模型"""
    execution_id: str = Field(..., description="执行ID")
    task_id: int = Field(..., description="任务ID")
    agent_id: Optional[int] = Field(None, description="执行的Agent ID")
    status: str = Field(..., description="执行状态")
    
    # 执行结果
    result: Optional[Dict[str, Any]] = Field(None, description="执行结果")
    output: Optional[str] = Field(None, description="输出内容")
    
    # 执行信息
    started_at: datetime = Field(..., description="开始时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    execution_time: Optional[float] = Field(None, description="执行时间（秒）")
    
    # 进度信息
    progress: int = Field(0, description="进度百分比")
    current_step: Optional[str] = Field(None, description="当前步骤")
    
    # 错误信息
    error_message: Optional[str] = Field(None, description="错误消息")
    error_details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    
    # 日志和调试信息
    logs: List[str] = Field(default_factory=list, description="执行日志")
    debug_info: Optional[Dict[str, Any]] = Field(None, description="调试信息")

class TaskStatusResponse(BaseModel):
    """Task状态响应模型"""
    task_id: int = Field(..., description="任务ID")
    status: TaskStatus = Field(..., description="当前状态")
    progress: int = Field(0, description="进度百分比")
    
    # 执行信息
    current_step: Optional[str] = Field(None, description="当前步骤")
    execution_id: Optional[str] = Field(None, description="执行ID")
    assigned_agent_id: Optional[int] = Field(None, description="分配的Agent ID")
    
    # 时间信息
    started_at: Optional[datetime] = Field(None, description="开始时间")
    estimated_completion: Optional[datetime] = Field(None, description="预计完成时间")
    
    # 依赖状态
    dependencies_status: Dict[int, str] = Field(default_factory=dict, description="依赖任务状态")
    can_execute: bool = Field(False, description="是否可以执行")
    
    # 统计信息
    retry_count: int = Field(0, description="重试次数")
    max_retries: int = Field(3, description="最大重试次数")
    
    class Config:
        use_enum_values = True

class TaskListResponse(BaseModel):
    """Task列表响应模型"""
    tasks: List[TaskResponse] = Field(..., description="任务列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页")
    size: int = Field(..., description="每页大小")
    pages: int = Field(..., description="总页数")

class TaskSearchRequest(BaseModel):
    """Task搜索请求模型"""
    query: Optional[str] = Field(None, description="搜索关键词")
    status: Optional[TaskStatus] = Field(None, description="状态过滤")
    task_type: Optional[TaskType] = Field(None, description="类型过滤")
    priority: Optional[TaskPriority] = Field(None, description="优先级过滤")
    assigned_agent_id: Optional[int] = Field(None, description="Agent过滤")
    tags: Optional[List[str]] = Field(None, description="标签过滤")
    
    # 时间过滤
    created_after: Optional[datetime] = Field(None, description="创建时间起")
    created_before: Optional[datetime] = Field(None, description="创建时间止")
    
    # 排序
    sort_by: Optional[str] = Field("created_at", description="排序字段")
    sort_order: Optional[str] = Field("desc", description="排序方向")
    
    # 分页
    page: int = Field(1, ge=1, description="页码")
    size: int = Field(20, ge=1, le=100, description="每页大小")

class TaskBatchRequest(BaseModel):
    """批量任务请求模型"""
    task_ids: List[int] = Field(..., min_items=1, description="任务ID列表")
    action: str = Field(..., description="批量操作类型")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="操作参数")

class TaskBatchResponse(BaseModel):
    """批量任务响应模型"""
    total_requested: int = Field(..., description="请求处理的总数")
    successful: int = Field(..., description="成功处理的数量")
    failed: int = Field(..., description="失败的数量")
    results: List[Dict[str, Any]] = Field(..., description="处理结果")
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="错误详情")

class TaskTemplateRequest(BaseModel):
    """任务模板请求模型"""
    name: str = Field(..., description="模板名称")
    description: str = Field(..., description="模板描述")
    template_data: TaskBase = Field(..., description="模板数据")
    category: Optional[str] = Field(None, description="模板分类")
    is_public: bool = Field(False, description="是否公开")

class TaskTemplateResponse(BaseModel):
    """任务模板响应模型"""
    id: int = Field(..., description="模板ID")
    name: str = Field(..., description="模板名称")
    description: str = Field(..., description="模板描述")
    template_data: Dict[str, Any] = Field(..., description="模板数据")
    category: Optional[str] = Field(None, description="模板分类")
    is_public: bool = Field(False, description="是否公开")
    usage_count: int = Field(0, description="使用次数")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")