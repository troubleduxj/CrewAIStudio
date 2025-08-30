"""Agent数据模型"""

from sqlalchemy import Column, String, Text, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class AgentStatus(enum.Enum):
    """Agent状态枚举"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    TRAINING = "training"
    ERROR = "error"

class AgentType(enum.Enum):
    """Agent类型枚举"""
    RESEARCHER = "researcher"
    WRITER = "writer"
    ANALYST = "analyst"
    MANAGER = "manager"
    CUSTOM = "custom"

class Agent(BaseModel):
    """AI Agent数据模型"""
    __tablename__ = "agents"
    
    # 基本信息
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    role = Column(String(100), nullable=False)
    goal = Column(Text, nullable=False)
    backstory = Column(Text, nullable=True)
    
    # Agent配置
    agent_type = Column(Enum(AgentType), default=AgentType.CUSTOM, nullable=False)
    status = Column(Enum(AgentStatus), default=AgentStatus.INACTIVE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # AI模型配置
    llm_model = Column(String(100), default="gpt-3.5-turbo", nullable=False)
    temperature = Column(String(10), default="0.7", nullable=True)
    max_tokens = Column(String(10), default="1000", nullable=True)
    
    # 工具和能力配置
    tools = Column(JSON, default=list, nullable=True)  # 可用工具列表
    capabilities = Column(JSON, default=list, nullable=True)  # 能力列表
    
    # 执行配置
    max_execution_time = Column(String(10), default="300", nullable=True)  # 最大执行时间（秒）
    allow_delegation = Column(Boolean, default=False, nullable=False)  # 是否允许委托
    verbose = Column(Boolean, default=True, nullable=False)  # 是否详细输出
    
    # 系统提示词
    system_prompt = Column(Text, nullable=True)
    custom_instructions = Column(Text, nullable=True)
    
    # 统计信息
    execution_count = Column(String(10), default="0", nullable=True)
    success_count = Column(String(10), default="0", nullable=True)
    error_count = Column(String(10), default="0", nullable=True)
    
    # 元数据
    meta_data = Column(JSON, default=dict, nullable=True)
    tags = Column(JSON, default=list, nullable=True)
    
    def __repr__(self):
        """Agent的字符串表示"""
        return f"<Agent(id={self.id}, name='{self.name}', role='{self.role}', status='{self.status.value}')>"
    
    def to_dict(self):
        """将Agent转换为字典"""
        data = super().to_dict()
        # 处理枚举类型
        data['status'] = self.status.value if self.status else None
        data['agent_type'] = self.agent_type.value if self.agent_type else None
        return data
    
    def is_available(self):
        """检查Agent是否可用"""
        return self.is_active and self.status == AgentStatus.ACTIVE
    
    def update_execution_stats(self, success: bool = True):
        """更新执行统计信息"""
        self.execution_count = str(int(self.execution_count or "0") + 1)
        if success:
            self.success_count = str(int(self.success_count or "0") + 1)
        else:
            self.error_count = str(int(self.error_count or "0") + 1)