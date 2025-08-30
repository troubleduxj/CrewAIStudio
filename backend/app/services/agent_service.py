"""Agent服务层 - 处理Agent相关的业务逻辑"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
import json
import logging

from ..models.agent import Agent, AgentStatus
from ..schemas.agent import AgentCreate, AgentUpdate, AgentSearchRequest
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class AgentService:
    """Agent服务类"""
    
    def __init__(self, db: Session):
        """
        初始化Agent服务
        
        Args:
            db: 数据库会话
        """
        self.db = db
    
    def create_agent(self, agent_data: AgentCreate) -> Agent:
        """
        创建新的Agent
        
        Args:
            agent_data: Agent创建数据
            
        Returns:
            Agent: 创建的Agent实例
            
        Raises:
            ValueError: 当Agent名称已存在时
        """
        # 检查名称是否已存在
        existing_agent = self.db.query(Agent).filter(Agent.name == agent_data.name).first()
        if existing_agent:
            raise ValueError(f"Agent with name '{agent_data.name}' already exists")
        
        # 创建新Agent
        agent = Agent(
            name=agent_data.name,
            description=agent_data.description,
            role=agent_data.role,
            goal=agent_data.goal,
            backstory=agent_data.backstory,
            
            # AI模型配置
            model_name=agent_data.model_name,
            model_provider=agent_data.model_provider,
            temperature=agent_data.temperature,
            max_tokens=agent_data.max_tokens,
            
            # 工具和能力
            tools=agent_data.tools,
            capabilities=agent_data.capabilities,
            
            # 执行参数
            max_execution_time=agent_data.max_execution_time,
            max_iterations=agent_data.max_iterations,
            allow_delegation=agent_data.allow_delegation,
            verbose=agent_data.verbose,
            
            # 系统提示
            system_prompt=agent_data.system_prompt,
            custom_instructions=agent_data.custom_instructions,
            
            # 配置选项
            is_active=agent_data.is_active,
            is_public=agent_data.is_public,
            
            # 元数据
            metadata=agent_data.meta_data,
            tags=agent_data.tags,
            category=agent_data.category,
            
            status=AgentStatus.IDLE
        )
        
        try:
            self.db.add(agent)
            self.db.commit()
            self.db.refresh(agent)
            
            logger.info(f"Created new agent: {agent.name} (ID: {agent.id})")
            return agent
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create agent: {str(e)}")
            raise
    
    def get_agent(self, agent_id: int) -> Optional[Agent]:
        """
        根据ID获取Agent
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Optional[Agent]: Agent实例或None
        """
        return self.db.query(Agent).filter(Agent.id == agent_id).first()
    
    def get_agent_by_name(self, name: str) -> Optional[Agent]:
        """
        根据名称获取Agent
        
        Args:
            name: Agent名称
            
        Returns:
            Optional[Agent]: Agent实例或None
        """
        return self.db.query(Agent).filter(Agent.name == name).first()
    
    def list_agents(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[AgentStatus] = None,
        is_active: Optional[bool] = None,
        category: Optional[str] = None
    ) -> List[Agent]:
        """
        获取Agent列表
        
        Args:
            skip: 跳过的记录数
            limit: 限制返回的记录数
            status: 状态过滤
            is_active: 是否激活过滤
            category: 分类过滤
            
        Returns:
            List[Agent]: Agent列表
        """
        query = self.db.query(Agent)
        
        # 应用过滤条件
        if status is not None:
            query = query.filter(Agent.status == status)
        if is_active is not None:
            query = query.filter(Agent.is_active == is_active)
        if category:
            query = query.filter(Agent.category == category)
        
        return query.offset(skip).limit(limit).all()
    
    def search_agents(self, search_request: AgentSearchRequest) -> List[Agent]:
        """
        搜索Agent
        
        Args:
            search_request: 搜索请求参数
            
        Returns:
            List[Agent]: 匹配的Agent列表
        """
        query = self.db.query(Agent)
        
        # 关键词搜索
        if search_request.query:
            search_term = f"%{search_request.query}%"
            query = query.filter(
                or_(
                    Agent.name.ilike(search_term),
                    Agent.description.ilike(search_term),
                    Agent.role.ilike(search_term),
                    Agent.goal.ilike(search_term)
                )
            )
        
        # 状态过滤
        if search_request.status:
            query = query.filter(Agent.status == search_request.status)
        
        # 分类过滤
        if search_request.category:
            query = query.filter(Agent.category == search_request.category)
        
        # 模型提供商过滤
        if search_request.model_provider:
            query = query.filter(Agent.model_provider == search_request.model_provider)
        
        # 标签过滤
        if search_request.tags:
            for tag in search_request.tags:
                query = query.filter(Agent.tags.contains([tag]))
        
        # 激活状态过滤
        if search_request.is_active is not None:
            query = query.filter(Agent.is_active == search_request.is_active)
        
        # 公开状态过滤
        if search_request.is_public is not None:
            query = query.filter(Agent.is_public == search_request.is_public)
        
        # 时间过滤
        if search_request.created_after:
            query = query.filter(Agent.created_at >= search_request.created_after)
        if search_request.created_before:
            query = query.filter(Agent.created_at <= search_request.created_before)
        
        # 排序
        if search_request.sort_by:
            sort_column = getattr(Agent, search_request.sort_by, None)
            if sort_column:
                if search_request.sort_order == "desc":
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column.asc())
        
        # 分页
        offset = (search_request.page - 1) * search_request.size
        return query.offset(offset).limit(search_request.size).all()
    
    def update_agent(self, agent_id: int, agent_data: AgentUpdate) -> Optional[Agent]:
        """
        更新Agent
        
        Args:
            agent_id: Agent ID
            agent_data: 更新数据
            
        Returns:
            Optional[Agent]: 更新后的Agent实例或None
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return None
        
        # 更新字段
        update_data = agent_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(agent, field):
                setattr(agent, field, value)
        
        agent.updated_at = datetime.utcnow()
        
        try:
            self.db.commit()
            self.db.refresh(agent)
            
            logger.info(f"Updated agent: {agent.name} (ID: {agent.id})")
            return agent
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update agent {agent_id}: {str(e)}")
            raise
    
    def delete_agent(self, agent_id: int) -> bool:
        """
        删除Agent
        
        Args:
            agent_id: Agent ID
            
        Returns:
            bool: 是否删除成功
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return False
        
        try:
            self.db.delete(agent)
            self.db.commit()
            
            logger.info(f"Deleted agent: {agent.name} (ID: {agent.id})")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete agent {agent_id}: {str(e)}")
            raise
    
    def update_agent_status(self, agent_id: int, status: AgentStatus) -> Optional[Agent]:
        """
        更新Agent状态
        
        Args:
            agent_id: Agent ID
            status: 新状态
            
        Returns:
            Optional[Agent]: 更新后的Agent实例或None
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return None
        
        old_status = agent.status
        agent.status = status
        agent.updated_at = datetime.utcnow()
        
        try:
            self.db.commit()
            self.db.refresh(agent)
            
            logger.info(f"Updated agent {agent.name} status: {old_status} -> {status}")
            return agent
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update agent {agent_id} status: {str(e)}")
            raise
    
    def update_execution_stats(self, agent_id: int, success: bool, execution_time: float) -> Optional[Agent]:
        """
        更新Agent执行统计
        
        Args:
            agent_id: Agent ID
            success: 是否执行成功
            execution_time: 执行时间（秒）
            
        Returns:
            Optional[Agent]: 更新后的Agent实例或None
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return None
        
        agent.update_execution_stats(success, execution_time)
        agent.updated_at = datetime.utcnow()
        
        try:
            self.db.commit()
            self.db.refresh(agent)
            return agent
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update agent {agent_id} execution stats: {str(e)}")
            raise
    
    def get_available_agents(self) -> List[Agent]:
        """
        获取可用的Agent列表
        
        Returns:
            List[Agent]: 可用的Agent列表
        """
        return self.db.query(Agent).filter(
            and_(
                Agent.is_active == True,
                Agent.status.in_([AgentStatus.IDLE, AgentStatus.READY])
            )
        ).all()
    
    def get_agent_statistics(self, agent_id: int) -> Optional[Dict[str, Any]]:
        """
        获取Agent统计信息
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Optional[Dict[str, Any]]: 统计信息或None
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return None
        
        return {
            "id": agent.id,
            "name": agent.name,
            "status": agent.status.value,
            "total_executions": agent.total_executions,
            "successful_executions": agent.successful_executions,
            "failed_executions": agent.failed_executions,
            "average_execution_time": agent.average_execution_time,
            "last_execution_at": agent.last_execution_at.isoformat() if agent.last_execution_at else None,
            "created_at": agent.created_at.isoformat(),
            "updated_at": agent.updated_at.isoformat(),
            "is_available": agent.is_available()
        }
    
    def validate_agent_config(self, agent_data: AgentCreate) -> Dict[str, Any]:
        """
        验证Agent配置
        
        Args:
            agent_data: Agent配置数据
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        errors = []
        warnings = []
        suggestions = []
        
        # 验证必填字段
        if not agent_data.name or len(agent_data.name.strip()) == 0:
            errors.append("Agent name is required")
        
        if not agent_data.role or len(agent_data.role.strip()) == 0:
            errors.append("Agent role is required")
        
        if not agent_data.goal or len(agent_data.goal.strip()) == 0:
            errors.append("Agent goal is required")
        
        # 验证模型配置
        if agent_data.temperature < 0 or agent_data.temperature > 2:
            warnings.append("Temperature should be between 0 and 2")
        
        if agent_data.max_tokens and agent_data.max_tokens < 1:
            errors.append("Max tokens must be positive")
        
        # 验证执行参数
        if agent_data.max_execution_time and agent_data.max_execution_time < 1:
            errors.append("Max execution time must be positive")
        
        if agent_data.max_iterations and agent_data.max_iterations < 1:
            errors.append("Max iterations must be positive")
        
        # 提供建议
        if not agent_data.backstory:
            suggestions.append("Consider adding a backstory to improve agent performance")
        
        if not agent_data.tools:
            suggestions.append("Consider adding tools to enhance agent capabilities")
        
        if not agent_data.system_prompt:
            suggestions.append("Consider adding a system prompt for better control")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions
        }
    
    def clone_agent(self, agent_id: int, new_name: str, new_description: Optional[str] = None) -> Optional[Agent]:
        """
        克隆Agent
        
        Args:
            agent_id: 源Agent ID
            new_name: 新Agent名称
            new_description: 新Agent描述
            
        Returns:
            Optional[Agent]: 克隆的Agent实例或None
        """
        source_agent = self.get_agent(agent_id)
        if not source_agent:
            return None
        
        # 检查新名称是否已存在
        if self.get_agent_by_name(new_name):
            raise ValueError(f"Agent with name '{new_name}' already exists")
        
        # 创建克隆数据
        clone_data = AgentCreate(
            name=new_name,
            description=new_description or f"Clone of {source_agent.name}",
            role=source_agent.role,
            goal=source_agent.goal,
            backstory=source_agent.backstory,
            
            model_name=source_agent.model_name,
            model_provider=source_agent.model_provider,
            temperature=source_agent.temperature,
            max_tokens=source_agent.max_tokens,
            
            tools=source_agent.tools.copy() if source_agent.tools else [],
            capabilities=source_agent.capabilities.copy() if source_agent.capabilities else [],
            
            max_execution_time=source_agent.max_execution_time,
            max_iterations=source_agent.max_iterations,
            allow_delegation=source_agent.allow_delegation,
            verbose=source_agent.verbose,
            
            system_prompt=source_agent.system_prompt,
            custom_instructions=source_agent.custom_instructions,
            
            is_active=True,  # 新克隆的Agent默认激活
            is_public=False,  # 新克隆的Agent默认私有
            
            metadata=source_agent.meta_data.copy() if source_agent.meta_data else {},
            tags=source_agent.tags.copy() if source_agent.tags else [],
            category=source_agent.category
        )
        
        return self.create_agent(clone_data)
    
    def get_agents_count(self, status: Optional[AgentStatus] = None) -> int:
        """
        获取Agent数量
        
        Args:
            status: 状态过滤
            
        Returns:
            int: Agent数量
        """
        query = self.db.query(Agent)
        if status:
            query = query.filter(Agent.status == status)
        return query.count()