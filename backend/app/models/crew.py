#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Crew Model
Crew数据模型定义
"""

from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from .base import Base


class Crew(Base):
    """
    Crew模型
    表示一个AI团队配置
    """
    __tablename__ = "crews"

    # 基本信息
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), nullable=False, index=True, comment="团队名称")
    description = Column(Text, nullable=True, comment="团队描述")
    
    # 工作流配置
    workflow_template_id = Column(String(100), nullable=False, comment="工作流模板ID")
    agents_config = Column(JSON, nullable=False, default=list, comment="Agent配置列表")
    
    # 状态信息
    status = Column(String(20), nullable=False, default="idle", comment="当前状态")
    is_active = Column(Boolean, nullable=False, default=True, comment="是否激活")
    
    # 执行配置
    max_execution_time = Column(Integer, nullable=True, default=3600, comment="最大执行时间(秒)")
    verbose = Column(Boolean, nullable=False, default=True, comment="是否详细输出")
    
    # 统计信息
    execution_count = Column(Integer, nullable=False, default=0, comment="执行次数")
    success_count = Column(Integer, nullable=False, default=0, comment="成功次数")
    error_count = Column(Integer, nullable=False, default=0, comment="错误次数")
    
    # 当前执行信息
    current_execution_id = Column(String(100), nullable=True, comment="当前执行ID")
    execution_progress = Column(Integer, nullable=True, comment="执行进度百分比")
    current_agent = Column(String(100), nullable=True, comment="当前执行的Agent")
    current_task = Column(String(200), nullable=True, comment="当前执行的任务")
    
    # 任务统计
    total_tasks = Column(Integer, nullable=False, default=0, comment="总任务数")
    completed_tasks = Column(Integer, nullable=False, default=0, comment="已完成任务数")
    failed_tasks = Column(Integer, nullable=False, default=0, comment="失败任务数")
    
    # 时间信息
    execution_time = Column(Float, nullable=True, comment="平均执行时间(秒)")
    last_execution_at = Column(DateTime(timezone=True), nullable=True, comment="最后执行时间")
    
    # 元数据
    meta_data = Column(JSON, nullable=True, default=dict, comment="元数据")
    tags = Column(JSON, nullable=True, default=list, comment="标签列表")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")

    def __repr__(self):
        return f"<Crew(id={self.id}, name='{self.name}', status='{self.status}')>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "workflow_template_id": self.workflow_template_id,
            "agents_config": self.agents_config,
            "status": self.status,
            "is_active": self.is_active,
            "max_execution_time": self.max_execution_time,
            "verbose": self.verbose,
            "execution_count": self.execution_count,
            "success_count": self.success_count,
            "error_count": self.error_count,
            "current_execution_id": self.current_execution_id,
            "execution_progress": self.execution_progress,
            "current_agent": self.current_agent,
            "current_task": self.current_task,
            "total_tasks": self.total_tasks,
            "completed_tasks": self.completed_tasks,
            "failed_tasks": self.failed_tasks,
            "execution_time": self.execution_time,
            "last_execution_at": self.last_execution_at.isoformat() if self.last_execution_at else None,
            "meta_data": self.meta_data,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @property
    def success_rate(self) -> float:
        """计算成功率"""
        if self.execution_count == 0:
            return 0.0
        return round((self.success_count / self.execution_count) * 100, 2)

    def update_execution_stats(self, success: bool, execution_time: float = None):
        """更新执行统计信息"""
        self.execution_count += 1
        if success:
            self.success_count += 1
        else:
            self.error_count += 1
        
        if execution_time:
            if self.execution_time:
                # 计算平均执行时间
                self.execution_time = (self.execution_time + execution_time) / 2
            else:
                self.execution_time = execution_time
        
        self.last_execution_at = datetime.utcnow()