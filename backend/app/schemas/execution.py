#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Execution Schemas
执行记录相关的Pydantic模式定义
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from enum import Enum


class ExecutionType(str, Enum):
    """执行类型枚举"""
    WORKFLOW = "workflow"
    TASK = "task"
    AGENT = "agent"


class ExecutionStatus(str, Enum):
    """执行状态枚举"""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


class ExecutionPriority(str, Enum):
    """执行优先级枚举"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class LogLevel(str, Enum):
    """日志级别枚举"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class ExecutionLogEntry(BaseModel):
    """执行日志条目"""
    timestamp: datetime = Field(..., description="日志时间戳")
    level: LogLevel = Field(..., description="日志级别")
    message: str = Field(..., description="日志消息")
    source: Optional[str] = Field(None, description="日志来源")
    meta_data: Optional[Dict[str, Any]] = Field(None, description="日志元数据")


class ExecutionCreate(BaseModel):
    """创建执行记录的请求模式"""
    execution_type: ExecutionType = Field(..., description="执行类型")
    entity_id: int = Field(..., description="关联实体ID")
    entity_name: Optional[str] = Field(None, description="关联实体名称")
    priority: ExecutionPriority = Field(ExecutionPriority.MEDIUM, description="执行优先级")
    input_data: Optional[Dict[str, Any]] = Field(None, description="输入数据")
    context: Optional[Dict[str, Any]] = Field(None, description="执行上下文")
    meta_data: Optional[Dict[str, Any]] = Field(None, description="元数据")
    options: Optional[Dict[str, Any]] = Field(None, description="执行选项")
    timeout_seconds: Optional[int] = Field(None, description="超时时间（秒）")
    max_retries: int = Field(0, description="最大重试次数")
    user_id: Optional[str] = Field(None, description="执行用户ID")
    user_name: Optional[str] = Field(None, description="执行用户名")
    parent_execution_id: Optional[str] = Field(None, description="父执行ID")


class ExecutionUpdate(BaseModel):
    """更新执行记录的请求模式"""
    status: Optional[ExecutionStatus] = Field(None, description="执行状态")
    priority: Optional[ExecutionPriority] = Field(None, description="执行优先级")
    progress: Optional[float] = Field(None, ge=0, le=100, description="执行进度")
    current_step: Optional[str] = Field(None, description="当前执行步骤")
    output_data: Optional[Dict[str, Any]] = Field(None, description="输出数据")
    result: Optional[Dict[str, Any]] = Field(None, description="执行结果")
    error_message: Optional[str] = Field(None, description="错误消息")
    error_details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    memory_usage: Optional[float] = Field(None, description="内存使用量")
    cpu_usage: Optional[float] = Field(None, description="CPU使用率")
    debug_info: Optional[Dict[str, Any]] = Field(None, description="调试信息")
    
    @validator('progress')
    def validate_progress(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Progress must be between 0 and 100')
        return v


class ExecutionResponse(BaseModel):
    """执行记录响应模式"""
    id: str = Field(..., description="执行ID")
    execution_type: ExecutionType = Field(..., description="执行类型")
    entity_id: int = Field(..., description="关联实体ID")
    entity_name: Optional[str] = Field(None, description="关联实体名称")
    status: ExecutionStatus = Field(..., description="执行状态")
    priority: ExecutionPriority = Field(..., description="执行优先级")
    progress: float = Field(..., description="执行进度")
    current_step: Optional[str] = Field(None, description="当前执行步骤")
    created_at: datetime = Field(..., description="创建时间")
    started_at: Optional[datetime] = Field(None, description="开始时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    execution_time: Optional[float] = Field(None, description="执行耗时")
    timeout_seconds: Optional[int] = Field(None, description="超时时间")
    user_id: Optional[str] = Field(None, description="执行用户ID")
    user_name: Optional[str] = Field(None, description="执行用户名")
    input_data: Optional[Dict[str, Any]] = Field(None, description="输入数据")
    output_data: Optional[Dict[str, Any]] = Field(None, description="输出数据")
    context: Optional[Dict[str, Any]] = Field(None, description="执行上下文")
    meta_data: Optional[Dict[str, Any]] = Field(None, description="元数据")
    result: Optional[Dict[str, Any]] = Field(None, description="执行结果")
    error_message: Optional[str] = Field(None, description="错误消息")
    error_details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    logs: Optional[List[ExecutionLogEntry]] = Field(None, description="执行日志")
    debug_info: Optional[Dict[str, Any]] = Field(None, description="调试信息")
    memory_usage: Optional[float] = Field(None, description="内存使用量")
    cpu_usage: Optional[float] = Field(None, description="CPU使用率")
    options: Optional[Dict[str, Any]] = Field(None, description="执行选项")
    retry_count: int = Field(..., description="重试次数")
    max_retries: int = Field(..., description="最大重试次数")
    parent_execution_id: Optional[str] = Field(None, description="父执行ID")
    is_running: bool = Field(..., description="是否正在执行")
    is_completed: bool = Field(..., description="是否已完成")
    is_successful: bool = Field(..., description="是否成功完成")
    duration: Optional[float] = Field(None, description="执行持续时间")
    
    class Config:
        from_attributes = True


class ExecutionListResponse(BaseModel):
    """执行记录列表响应模式"""
    executions: List[ExecutionResponse] = Field(..., description="执行记录列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页码")
    size: int = Field(..., description="每页大小")
    pages: int = Field(..., description="总页数")


class ExecutionLogRequest(BaseModel):
    """添加执行日志的请求模式"""
    message: str = Field(..., description="日志消息")
    level: LogLevel = Field(LogLevel.INFO, description="日志级别")
    source: Optional[str] = Field(None, description="日志来源")
    meta_data: Optional[Dict[str, Any]] = Field(None, description="日志元数据")


class ExecutionProgressUpdate(BaseModel):
    """执行进度更新请求模式"""
    progress: float = Field(..., ge=0, le=100, description="执行进度")
    current_step: Optional[str] = Field(None, description="当前执行步骤")
    message: Optional[str] = Field(None, description="进度消息")
    
    @validator('progress')
    def validate_progress(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Progress must be between 0 and 100')
        return v


class ExecutionStatsResponse(BaseModel):
    """执行统计响应模式"""
    total_executions: int = Field(..., description="总执行数")
    running_executions: int = Field(..., description="正在执行数")
    completed_executions: int = Field(..., description="已完成数")
    failed_executions: int = Field(..., description="失败数")
    success_rate: float = Field(..., description="成功率")
    average_execution_time: Optional[float] = Field(None, description="平均执行时间")
    executions_by_type: Dict[str, int] = Field(..., description="按类型分组的执行数")
    executions_by_status: Dict[str, int] = Field(..., description="按状态分组的执行数")


class ExecutionFilterParams(BaseModel):
    """执行记录过滤参数"""
    execution_type: Optional[ExecutionType] = Field(None, description="执行类型")
    status: Optional[ExecutionStatus] = Field(None, description="执行状态")
    priority: Optional[ExecutionPriority] = Field(None, description="执行优先级")
    entity_id: Optional[int] = Field(None, description="关联实体ID")
    user_id: Optional[str] = Field(None, description="执行用户ID")
    parent_execution_id: Optional[str] = Field(None, description="父执行ID")
    created_after: Optional[datetime] = Field(None, description="创建时间之后")
    created_before: Optional[datetime] = Field(None, description="创建时间之前")
    started_after: Optional[datetime] = Field(None, description="开始时间之后")
    started_before: Optional[datetime] = Field(None, description="开始时间之前")
    completed_after: Optional[datetime] = Field(None, description="完成时间之后")
    completed_before: Optional[datetime] = Field(None, description="完成时间之前")
    min_execution_time: Optional[float] = Field(None, description="最小执行时间")
    max_execution_time: Optional[float] = Field(None, description="最大执行时间")
    search: Optional[str] = Field(None, description="搜索关键词")
    page: int = Field(1, ge=1, description="页码")
    size: int = Field(20, ge=1, le=100, description="每页大小")
    sort_by: Optional[str] = Field("created_at", description="排序字段")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="排序顺序")


class ExecutionActionRequest(BaseModel):
    """执行操作请求模式"""
    action: str = Field(..., description="操作类型 (start, stop, cancel, retry)")
    reason: Optional[str] = Field(None, description="操作原因")
    options: Optional[Dict[str, Any]] = Field(None, description="操作选项")


class ExecutionActionResponse(BaseModel):
    """执行操作响应模式"""
    success: bool = Field(..., description="操作是否成功")
    message: str = Field(..., description="操作消息")
    execution_id: str = Field(..., description="执行ID")
    new_status: Optional[ExecutionStatus] = Field(None, description="新状态")
    details: Optional[Dict[str, Any]] = Field(None, description="操作详情")