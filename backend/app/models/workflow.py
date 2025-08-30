"""Workflow数据模型"""

from sqlalchemy import Column, String, Text, Boolean, JSON, Enum, Integer
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class WorkflowStatus(enum.Enum):
    """工作流状态枚举"""
    DRAFT = "draft"
    ACTIVE = "active"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"

class WorkflowType(enum.Enum):
    """工作流类型枚举"""
    SEQUENTIAL = "sequential"  # 顺序执行
    PARALLEL = "parallel"     # 并行执行
    CONDITIONAL = "conditional" # 条件执行
    LOOP = "loop"             # 循环执行
    CUSTOM = "custom"         # 自定义

class ExecutionMode(enum.Enum):
    """执行模式枚举"""
    AUTOMATIC = "automatic"   # 自动执行
    MANUAL = "manual"         # 手动执行
    SCHEDULED = "scheduled"   # 定时执行
    TRIGGERED = "triggered"   # 触发执行

class Workflow(BaseModel):
    """AI工作流数据模型"""
    __tablename__ = "workflows"
    
    # 基本信息
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(String(20), default="1.0.0", nullable=False)
    
    # 工作流状态和类型
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False)
    workflow_type = Column(Enum(WorkflowType), default=WorkflowType.SEQUENTIAL, nullable=False)
    execution_mode = Column(Enum(ExecutionMode), default=ExecutionMode.MANUAL, nullable=False)
    
    # 工作流定义
    workflow_definition = Column(JSON, default=dict, nullable=False)  # 工作流定义JSON
    agents_config = Column(JSON, default=list, nullable=True)  # 参与的Agent配置
    tasks_config = Column(JSON, default=list, nullable=True)   # 任务配置
    
    # 执行配置
    max_execution_time = Column(Integer, default=3600, nullable=True)  # 最大执行时间（秒）
    retry_policy = Column(JSON, default=dict, nullable=True)  # 重试策略
    error_handling = Column(JSON, default=dict, nullable=True)  # 错误处理配置
    
    # 调度配置
    schedule_config = Column(JSON, default=dict, nullable=True)  # 调度配置
    trigger_conditions = Column(JSON, default=list, nullable=True)  # 触发条件
    
    # 执行信息
    current_step = Column(String(100), nullable=True)  # 当前执行步骤
    execution_history = Column(JSON, default=list, nullable=True)  # 执行历史
    
    # 时间信息
    started_at = Column(String(50), nullable=True)  # 开始执行时间
    completed_at = Column(String(50), nullable=True)  # 完成时间
    execution_duration = Column(Integer, nullable=True)  # 执行时长（秒）
    
    # 结果信息
    execution_result = Column(JSON, default=dict, nullable=True)  # 执行结果
    output_data = Column(JSON, default=dict, nullable=True)  # 输出数据
    
    # 错误信息
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, default=dict, nullable=True)
    failed_step = Column(String(100), nullable=True)  # 失败的步骤
    
    # 进度信息
    progress_percentage = Column(Integer, default=0, nullable=True)  # 进度百分比
    completed_steps = Column(Integer, default=0, nullable=True)  # 已完成步骤数
    total_steps = Column(Integer, default=0, nullable=True)  # 总步骤数
    
    # 统计信息
    execution_count = Column(Integer, default=0, nullable=True)  # 执行次数
    success_count = Column(Integer, default=0, nullable=True)  # 成功次数
    failure_count = Column(Integer, default=0, nullable=True)  # 失败次数
    
    # 配置选项
    is_template = Column(Boolean, default=False, nullable=False)  # 是否为模板
    is_public = Column(Boolean, default=False, nullable=False)  # 是否公开
    is_active = Column(Boolean, default=True, nullable=False)  # 是否激活
    
    # 权限和所有者
    owner_id = Column(String(100), nullable=True)  # 所有者ID
    permissions = Column(JSON, default=dict, nullable=True)  # 权限配置
    
    # 元数据
    meta_data = Column(JSON, default=dict, nullable=True)
    tags = Column(JSON, default=list, nullable=True)
    category = Column(String(100), nullable=True)  # 分类
    
    # 版本控制
    parent_workflow_id = Column(Integer, nullable=True)  # 父工作流ID
    is_latest_version = Column(Boolean, default=True, nullable=False)  # 是否为最新版本
    
    def __repr__(self):
        """Workflow的字符串表示"""
        return f"<Workflow(id={self.id}, name='{self.name}', status='{self.status.value}', type='{self.workflow_type.value}')>"
    
    def to_dict(self):
        """将Workflow转换为字典"""
        data = super().to_dict()
        # 处理枚举类型
        data['status'] = self.status.value if self.status else None
        data['workflow_type'] = self.workflow_type.value if self.workflow_type else None
        data['execution_mode'] = self.execution_mode.value if self.execution_mode else None
        return data
    
    def is_executable(self):
        """检查工作流是否可执行"""
        return (
            self.is_active and
            self.status in [WorkflowStatus.ACTIVE, WorkflowStatus.PAUSED] and
            self.workflow_definition and
            len(self.workflow_definition) > 0
        )
    
    def can_be_paused(self):
        """检查工作流是否可以暂停"""
        return self.status == WorkflowStatus.RUNNING
    
    def can_be_resumed(self):
        """检查工作流是否可以恢复"""
        return self.status == WorkflowStatus.PAUSED
    
    def can_be_cancelled(self):
        """检查工作流是否可以取消"""
        return self.status in [WorkflowStatus.RUNNING, WorkflowStatus.PAUSED]
    
    def update_progress(self, completed_steps: int = None, total_steps: int = None):
        """更新工作流进度"""
        if completed_steps is not None:
            self.completed_steps = completed_steps
        if total_steps is not None:
            self.total_steps = total_steps
        
        if self.total_steps and self.total_steps > 0:
            self.progress_percentage = min(100, int((self.completed_steps / self.total_steps) * 100))
    
    def mark_as_completed(self, output_data: dict = None):
        """标记工作流为已完成"""
        self.status = WorkflowStatus.COMPLETED
        self.progress_percentage = 100
        self.success_count += 1
        if output_data:
            self.output_data = output_data
    
    def mark_as_failed(self, error_message: str, failed_step: str = None, error_details: dict = None):
        """标记工作流为失败"""
        self.status = WorkflowStatus.FAILED
        self.error_message = error_message
        self.failure_count += 1
        if failed_step:
            self.failed_step = failed_step
        if error_details:
            self.error_details = error_details
    
    def increment_execution_count(self):
        """增加执行次数"""
        self.execution_count += 1
    
    def get_next_version(self):
        """获取下一个版本号"""
        try:
            major, minor, patch = map(int, self.version.split('.'))
            return f"{major}.{minor}.{patch + 1}"
        except:
            return "1.0.1"