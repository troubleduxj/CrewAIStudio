"""Task数据模型"""

from sqlalchemy import Column, String, Text, Boolean, JSON, Enum, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class TaskStatus(enum.Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"

class TaskPriority(enum.Enum):
    """任务优先级枚举"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskType(enum.Enum):
    """任务类型枚举"""
    RESEARCH = "research"
    ANALYSIS = "analysis"
    WRITING = "writing"
    REVIEW = "review"
    CUSTOM = "custom"

class Task(BaseModel):
    """AI任务数据模型"""
    __tablename__ = "tasks"
    
    # 基本信息
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    task_type = Column(Enum(TaskType), default=TaskType.CUSTOM, nullable=False)
    
    # 任务状态和优先级
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    
    # 任务内容
    input_data = Column(JSON, default=dict, nullable=True)  # 输入数据
    expected_output = Column(Text, nullable=True)  # 期望输出描述
    output_data = Column(JSON, default=dict, nullable=True)  # 实际输出数据
    
    # 执行配置
    max_execution_time = Column(Integer, default=300, nullable=True)  # 最大执行时间（秒）
    retry_count = Column(Integer, default=0, nullable=True)  # 重试次数
    max_retries = Column(Integer, default=3, nullable=True)  # 最大重试次数
    
    # Agent关联
    assigned_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    assigned_agent = relationship("Agent", backref="tasks")
    
    # 任务依赖
    dependencies = Column(JSON, default=list, nullable=True)  # 依赖的任务ID列表
    
    # 执行信息
    started_at = Column(String(50), nullable=True)  # 开始执行时间
    completed_at = Column(String(50), nullable=True)  # 完成时间
    execution_duration = Column(Integer, nullable=True)  # 执行时长（秒）
    
    # 错误信息
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, default=dict, nullable=True)
    
    # 进度信息
    progress_percentage = Column(Integer, default=0, nullable=True)  # 进度百分比
    progress_details = Column(JSON, default=dict, nullable=True)  # 详细进度信息
    
    # 结果评估
    quality_score = Column(String(10), nullable=True)  # 质量评分
    feedback = Column(Text, nullable=True)  # 反馈信息
    
    # 元数据
    meta_data = Column(JSON, default=dict, nullable=True)
    tags = Column(JSON, default=list, nullable=True)
    
    # 配置选项
    is_template = Column(Boolean, default=False, nullable=False)  # 是否为模板
    is_recurring = Column(Boolean, default=False, nullable=False)  # 是否为循环任务
    schedule_config = Column(JSON, default=dict, nullable=True)  # 调度配置
    
    def __repr__(self):
        """Task的字符串表示"""
        return f"<Task(id={self.id}, name='{self.name}', status='{self.status.value}', priority='{self.priority.value}')>"
    
    def to_dict(self):
        """将Task转换为字典"""
        data = super().to_dict()
        # 处理枚举类型
        data['status'] = self.status.value if self.status else None
        data['priority'] = self.priority.value if self.priority else None
        data['task_type'] = self.task_type.value if self.task_type else None
        # 处理关联对象
        data['assigned_agent_name'] = self.assigned_agent.name if self.assigned_agent else None
        return data
    
    def is_ready_to_execute(self):
        """检查任务是否准备好执行"""
        return (
            self.status == TaskStatus.PENDING and
            self.assigned_agent_id is not None and
            self.retry_count < self.max_retries
        )
    
    def can_retry(self):
        """检查任务是否可以重试"""
        return (
            self.status == TaskStatus.FAILED and
            self.retry_count < self.max_retries
        )
    
    def update_progress(self, percentage: int, details: dict = None):
        """更新任务进度"""
        self.progress_percentage = max(0, min(100, percentage))
        if details:
            self.progress_details = details
    
    def mark_as_completed(self, output_data: dict = None, quality_score: str = None):
        """标记任务为已完成"""
        self.status = TaskStatus.COMPLETED
        self.progress_percentage = 100
        if output_data:
            self.output_data = output_data
        if quality_score:
            self.quality_score = quality_score
    
    def mark_as_failed(self, error_message: str, error_details: dict = None):
        """标记任务为失败"""
        self.status = TaskStatus.FAILED
        self.error_message = error_message
        if error_details:
            self.error_details = error_details
        self.retry_count += 1