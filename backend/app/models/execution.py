#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Execution Model
执行记录数据模型 - 用于跟踪工作流、任务和Agent的执行状态
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List

from .base import Base


class ExecutionType(str, Enum):
    """执行类型枚举"""
    WORKFLOW = "workflow"
    TASK = "task"
    AGENT = "agent"


class ExecutionStatus(str, Enum):
    """执行状态枚举"""
    PENDING = "pending"      # 等待执行
    QUEUED = "queued"        # 已排队
    RUNNING = "running"      # 执行中
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"        # 执行失败
    CANCELLED = "cancelled"  # 已取消
    TIMEOUT = "timeout"      # 超时


class ExecutionPriority(str, Enum):
    """执行优先级枚举"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Execution(Base):
    """
    执行记录模型
    
    用于跟踪工作流、任务和Agent的执行状态、日志和结果
    """
    __tablename__ = "executions"
    
    # 基本信息
    id = Column(String(36), primary_key=True, index=True, comment="执行ID (UUID)")
    execution_type = Column(SQLEnum(ExecutionType), nullable=False, comment="执行类型")
    entity_id = Column(Integer, nullable=False, comment="关联实体ID (workflow_id/task_id/agent_id)")
    entity_name = Column(String(255), comment="关联实体名称")
    
    # 执行状态
    status = Column(SQLEnum(ExecutionStatus), default=ExecutionStatus.PENDING, comment="执行状态")
    priority = Column(SQLEnum(ExecutionPriority), default=ExecutionPriority.MEDIUM, comment="执行优先级")
    progress = Column(Float, default=0.0, comment="执行进度 (0-100)")
    current_step = Column(String(255), comment="当前执行步骤")
    
    # 时间信息
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    started_at = Column(DateTime, comment="开始执行时间")
    completed_at = Column(DateTime, comment="完成时间")
    execution_time = Column(Float, comment="执行耗时（秒）")
    timeout_seconds = Column(Integer, comment="超时时间（秒）")
    
    # 用户信息
    user_id = Column(String(36), comment="执行用户ID")
    user_name = Column(String(100), comment="执行用户名")
    
    # 输入输出
    input_data = Column(JSON, comment="输入数据")
    output_data = Column(JSON, comment="输出数据")
    context = Column(JSON, comment="执行上下文")
    meta_data = Column(JSON, comment="元数据")
    
    # 执行结果
    result = Column(JSON, comment="执行结果")
    error_message = Column(Text, comment="错误消息")
    error_details = Column(JSON, comment="错误详情")
    
    # 日志和调试
    logs = Column(JSON, comment="执行日志列表")
    debug_info = Column(JSON, comment="调试信息")
    
    # 性能指标
    memory_usage = Column(Float, comment="内存使用量 (MB)")
    cpu_usage = Column(Float, comment="CPU使用率 (%)")
    
    # 配置选项
    options = Column(JSON, comment="执行选项配置")
    retry_count = Column(Integer, default=0, comment="重试次数")
    max_retries = Column(Integer, default=0, comment="最大重试次数")
    
    # 关联关系
    parent_execution_id = Column(String(36), ForeignKey('executions.id'), comment="父执行ID")
    parent_execution = relationship("Execution", remote_side=[id], backref="child_executions")
    
    def __repr__(self):
        return f"<Execution(id='{self.id}', type='{self.execution_type}', status='{self.status}')>"
    
    @property
    def is_running(self) -> bool:
        """检查是否正在执行"""
        return self.status in [ExecutionStatus.RUNNING, ExecutionStatus.QUEUED]
    
    @property
    def is_completed(self) -> bool:
        """检查是否已完成"""
        return self.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED, ExecutionStatus.TIMEOUT]
    
    @property
    def is_successful(self) -> bool:
        """检查是否成功完成"""
        return self.status == ExecutionStatus.COMPLETED
    
    @property
    def duration(self) -> Optional[float]:
        """获取执行持续时间"""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None
    
    def add_log(self, message: str, level: str = "info", timestamp: Optional[datetime] = None) -> None:
        """
        添加执行日志
        
        Args:
            message: 日志消息
            level: 日志级别 (debug, info, warning, error)
            timestamp: 时间戳，默认为当前时间
        """
        if self.logs is None:
            self.logs = []
        
        log_entry = {
            "timestamp": (timestamp or datetime.utcnow()).isoformat(),
            "level": level,
            "message": message
        }
        
        self.logs.append(log_entry)
    
    def update_progress(self, progress: float, step: Optional[str] = None) -> None:
        """
        更新执行进度
        
        Args:
            progress: 进度百分比 (0-100)
            step: 当前步骤描述
        """
        self.progress = max(0, min(100, progress))
        if step:
            self.current_step = step
    
    def mark_started(self, timestamp: Optional[datetime] = None) -> None:
        """
        标记执行开始
        
        Args:
            timestamp: 开始时间，默认为当前时间
        """
        self.status = ExecutionStatus.RUNNING
        self.started_at = timestamp or datetime.utcnow()
        self.add_log("Execution started", "info")
    
    def mark_completed(self, result: Optional[Dict[str, Any]] = None, timestamp: Optional[datetime] = None) -> None:
        """
        标记执行完成
        
        Args:
            result: 执行结果
            timestamp: 完成时间，默认为当前时间
        """
        self.status = ExecutionStatus.COMPLETED
        self.completed_at = timestamp or datetime.utcnow()
        self.progress = 100.0
        
        if result:
            self.result = result
        
        if self.started_at and self.completed_at:
            self.execution_time = (self.completed_at - self.started_at).total_seconds()
        
        self.add_log("Execution completed successfully", "info")
    
    def mark_failed(self, error: str, error_details: Optional[Dict[str, Any]] = None, timestamp: Optional[datetime] = None) -> None:
        """
        标记执行失败
        
        Args:
            error: 错误消息
            error_details: 错误详情
            timestamp: 失败时间，默认为当前时间
        """
        self.status = ExecutionStatus.FAILED
        self.completed_at = timestamp or datetime.utcnow()
        self.error_message = error
        
        if error_details:
            self.error_details = error_details
        
        if self.started_at and self.completed_at:
            self.execution_time = (self.completed_at - self.started_at).total_seconds()
        
        self.add_log(f"Execution failed: {error}", "error")
    
    def mark_cancelled(self, reason: Optional[str] = None, timestamp: Optional[datetime] = None) -> None:
        """
        标记执行取消
        
        Args:
            reason: 取消原因
            timestamp: 取消时间，默认为当前时间
        """
        self.status = ExecutionStatus.CANCELLED
        self.completed_at = timestamp or datetime.utcnow()
        
        if self.started_at and self.completed_at:
            self.execution_time = (self.completed_at - self.started_at).total_seconds()
        
        message = f"Execution cancelled{': ' + reason if reason else ''}"
        self.add_log(message, "warning")
    
    def to_dict(self) -> Dict[str, Any]:
        """
        转换为字典格式
        
        Returns:
            Dict[str, Any]: 执行记录字典
        """
        return {
            "id": self.id,
            "execution_type": self.execution_type,
            "entity_id": self.entity_id,
            "entity_name": self.entity_name,
            "status": self.status,
            "priority": self.priority,
            "progress": self.progress,
            "current_step": self.current_step,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "execution_time": self.execution_time,
            "timeout_seconds": self.timeout_seconds,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "context": self.context,
            "meta_data": self.meta_data,
            "result": self.result,
            "error_message": self.error_message,
            "error_details": self.error_details,
            "logs": self.logs,
            "debug_info": self.debug_info,
            "memory_usage": self.memory_usage,
            "cpu_usage": self.cpu_usage,
            "options": self.options,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "parent_execution_id": self.parent_execution_id,
            "is_running": self.is_running,
            "is_completed": self.is_completed,
            "is_successful": self.is_successful,
            "duration": self.duration
        }