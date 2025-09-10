"""Crew相关的Pydantic schemas"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID

class CrewBase(BaseModel):
    """Crew基础模型"""
    name: str = Field(..., min_length=1, max_length=255, description="Crew名称")
    description: Optional[str] = Field(None, description="Crew描述")
    workflow_template_id: str = Field(..., description="工作流模板ID")
    agents_config: List[Dict[str, Any]] = Field(..., description="Agent配置列表")
    
    # 执行配置
    max_execution_time: Optional[int] = Field(3600, description="最大执行时间（秒）")
    verbose: bool = Field(True, description="是否详细输出")
    
    # 元数据
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    tags: List[str] = Field(default_factory=list, description="标签")

class CrewCreate(CrewBase):
    """创建Crew的请求模型"""
    pass

class CrewUpdate(BaseModel):
    """更新Crew的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Crew名称")
    description: Optional[str] = Field(None, description="Crew描述")
    workflow_template_id: Optional[str] = Field(None, description="工作流模板ID")
    agents_config: Optional[List[Dict[str, Any]]] = Field(None, description="Agent配置列表")
    status: Optional[str] = Field(None, description="Crew状态")
    
    # 执行配置
    max_execution_time: Optional[int] = Field(None, description="最大执行时间（秒）")
    verbose: Optional[bool] = Field(None, description="是否详细输出")
    is_active: Optional[bool] = Field(None, description="是否激活")
    
    # 元数据
    meta_data: Optional[Dict[str, Any]] = Field(None, description="元数据")
    tags: Optional[List[str]] = Field(None, description="标签")

class CrewResponse(CrewBase):
    """Crew响应模型"""
    id: str = Field(..., description="Crew ID")
    status: str = Field(..., description="Crew状态")
    is_active: bool = Field(..., description="是否激活")
    
    # 执行统计
    execution_count: int = Field(0, description="执行次数")
    success_count: int = Field(0, description="成功次数")
    error_count: int = Field(0, description="错误次数")
    
    # 当前执行信息
    current_execution_id: Optional[str] = Field(None, description="当前执行ID")
    execution_progress: Optional[int] = Field(None, description="执行进度百分比")
    current_agent: Optional[str] = Field(None, description="当前执行的Agent")
    current_task: Optional[str] = Field(None, description="当前执行的任务")
    
    # 任务统计
    total_tasks: Optional[int] = Field(None, description="总任务数")
    completed_tasks: Optional[int] = Field(None, description="已完成任务数")
    failed_tasks: Optional[int] = Field(None, description="失败任务数")
    
    # 时间信息
    execution_time: Optional[int] = Field(None, description="总执行时间（秒）")
    last_execution_at: Optional[datetime] = Field(None, description="最后执行时间")
    
    # 时间戳
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    
    class Config:
        from_attributes = True

class CrewExecuteRequest(BaseModel):
    """Crew执行请求模型"""
    input_data: Dict[str, Any] = Field(default_factory=dict, description="输入数据")
    context: Optional[Dict[str, Any]] = Field(None, description="执行上下文")
    
    # 执行配置
    timeout: Optional[int] = Field(None, ge=1, le=7200, description="超时时间（秒）")
    priority: Optional[str] = Field("medium", description="执行优先级")
    async_execution: bool = Field(True, description="是否异步执行")
    
    # 回调配置
    callback_url: Optional[str] = Field(None, description="回调URL")
    webhook_headers: Optional[Dict[str, str]] = Field(None, description="Webhook头部")

class CrewExecuteResponse(BaseModel):
    """Crew执行响应模型"""
    execution_id: str = Field(..., description="执行ID")
    crew_id: str = Field(..., description="Crew ID")
    status: str = Field(..., description="执行状态")
    
    # 执行结果
    result: Optional[Dict[str, Any]] = Field(None, description="执行结果")
    output: Optional[str] = Field(None, description="输出内容")
    
    # 执行信息
    started_at: datetime = Field(..., description="开始时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    execution_time: Optional[float] = Field(None, description="执行时间（秒）")
    
    # 进度信息
    progress_percentage: int = Field(0, description="进度百分比")
    current_agent: Optional[str] = Field(None, description="当前Agent")
    current_task: Optional[str] = Field(None, description="当前任务")
    
    # 错误信息
    error_message: Optional[str] = Field(None, description="错误消息")
    error_details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    
    # 日志和调试信息
    logs: List[str] = Field(default_factory=list, description="执行日志")
    debug_info: Optional[Dict[str, Any]] = Field(None, description="调试信息")

class CrewStatusResponse(BaseModel):
    """Crew状态响应模型"""
    crew_id: str = Field(..., description="Crew ID")
    status: str = Field(..., description="当前状态")
    is_available: bool = Field(..., description="是否可用")
    
    # 当前执行信息
    current_execution_id: Optional[str] = Field(None, description="当前执行ID")
    progress_percentage: int = Field(0, description="执行进度")
    current_agent: Optional[str] = Field(None, description="当前Agent")
    current_task: Optional[str] = Field(None, description="当前任务")
    
    # 统计信息
    total_executions: int = Field(0, description="总执行次数")
    successful_executions: int = Field(0, description="成功执行次数")
    failed_executions: int = Field(0, description="失败执行次数")
    average_execution_time: Optional[float] = Field(None, description="平均执行时间")
    
    # 最后活动时间
    last_activity: Optional[datetime] = Field(None, description="最后活动时间")

class CrewLogEntry(BaseModel):
    """Crew日志条目模型"""
    id: str = Field(..., description="日志ID")
    crew_id: str = Field(..., description="Crew ID")
    execution_id: Optional[str] = Field(None, description="执行ID")
    level: str = Field(..., description="日志级别")
    message: str = Field(..., description="日志消息")
    timestamp: datetime = Field(..., description="时间戳")
    agent_id: Optional[str] = Field(None, description="Agent ID")
    task_id: Optional[str] = Field(None, description="任务ID")
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="元数据")

class CrewStatsResponse(BaseModel):
    """Crew统计响应模型"""
    total_crews: int = Field(0, description="总Crew数")
    active_crews: int = Field(0, description="活跃Crew数")
    completed_crews: int = Field(0, description="已完成Crew数")
    failed_crews: int = Field(0, description="失败Crew数")
    total_agents: int = Field(0, description="总Agent数")
    total_tasks: int = Field(0, description="总任务数")
    avg_execution_time: float = Field(0.0, description="平均执行时间")
    success_rate: float = Field(0.0, description="成功率")

class CrewListResponse(BaseModel):
    """Crew列表响应模型"""
    crews: List[CrewResponse] = Field(..., description="Crew列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页")
    size: int = Field(..., description="每页大小")
    pages: int = Field(..., description="总页数")

class CrewSearchRequest(BaseModel):
    """Crew搜索请求模型"""
    query: Optional[str] = Field(None, description="搜索关键词")
    status: Optional[str] = Field(None, description="状态过滤")
    workflow_template_id: Optional[str] = Field(None, description="工作流模板ID过滤")
    tags: Optional[List[str]] = Field(None, description="标签过滤")
    is_active: Optional[bool] = Field(None, description="是否激活过滤")
    
    # 排序
    sort_by: Optional[str] = Field("created_at", description="排序字段")
    sort_order: Optional[str] = Field("desc", description="排序方向")
    
    # 分页
    page: int = Field(1, ge=1, description="页码")
    size: int = Field(20, ge=1, le=100, description="每页大小")