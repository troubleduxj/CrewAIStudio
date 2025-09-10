"""Crew服务层 - 处理Crew相关的业务逻辑"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
import json
import logging
import uuid

from ..models.crew import Crew
from ..schemas.crew import CrewCreate, CrewUpdate, CrewResponse, CrewExecuteRequest, CrewStatsResponse, CrewLogEntry
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class CrewService:
    """Crew服务类"""
    
    def __init__(self, db: Session):
        """
        初始化Crew服务
        
        Args:
            db: 数据库会话
        """
        self.db = db
        # 执行日志仍使用内存存储（可以后续改为数据库）
        self._execution_logs = {}
        
        # 确保有示例数据
        self._ensure_sample_data()
    
    async def create_crew(self, crew_data: CrewCreate) -> CrewResponse:
        """
        创建新的Crew
        
        Args:
            crew_data: Crew创建数据
            
        Returns:
            CrewResponse: 创建的Crew信息
            
        Raises:
            ValueError: 当Crew名称已存在时
        """
        # 检查名称是否已存在
        existing_crew = self.db.query(Crew).filter(Crew.name == crew_data.name).first()
        if existing_crew:
            raise ValueError(f"Crew with name '{crew_data.name}' already exists")
        
        # 创建新Crew
        crew = Crew(
            name=crew_data.name,
            description=crew_data.description,
            workflow_template_id=crew_data.workflow_template_id,
            agents_config=crew_data.agents_config,
            status="idle",
            is_active=True,
            max_execution_time=crew_data.max_execution_time,
            verbose=crew_data.verbose,
            total_tasks=len(crew_data.agents_config),
            meta_data=crew_data.meta_data or {},
            tags=crew_data.tags or []
        )
        
        self.db.add(crew)
        self.db.commit()
        self.db.refresh(crew)
        
        logger.info(f"Created new crew: {crew_data.name} (ID: {crew.id})")
        return CrewResponse(**crew.to_dict())
    
    async def get_crew_by_id(self, crew_id: str) -> Optional[CrewResponse]:
        """
        根据ID获取Crew
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Optional[CrewResponse]: Crew信息或None
        """
        try:
            # 尝试将字符串转换为UUID对象进行比较
            from uuid import UUID
            try:
                # 如果crew_id是标准UUID格式，转换为UUID对象
                uuid_obj = UUID(crew_id)
                crew = self.db.query(Crew).filter(Crew.id == uuid_obj).first()
            except ValueError:
                # 如果不是标准UUID格式，直接用字符串比较
                crew = self.db.query(Crew).filter(Crew.id == crew_id).first()
            
            if crew:
                return CrewResponse(**crew.to_dict())
            return None
        except Exception as e:
            logger.error(f"Error fetching crew {crew_id}: {e}")
            return None
    
    async def list_crews(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[CrewResponse]:
        """
        获取Crew列表
        
        Args:
            skip: 跳过的记录数
            limit: 限制返回的记录数
            search: 搜索关键词
            status_filter: 状态过滤
            
        Returns:
            List[CrewResponse]: Crew列表
        """
        query = self.db.query(Crew)
        
        # 应用搜索过滤
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Crew.name.ilike(search_pattern),
                    Crew.description.ilike(search_pattern)
                )
            )
        
        # 应用状态过滤
        if status_filter:
            query = query.filter(Crew.status == status_filter)
        
        # 排序（按创建时间倒序）
        query = query.order_by(desc(Crew.created_at))
        
        # 分页
        crews = query.offset(skip).limit(limit).all()
        
        return [CrewResponse(**crew.to_dict()) for crew in crews]
    
    async def update_crew(self, crew_id: str, crew_data: CrewUpdate) -> Optional[CrewResponse]:
        """
        更新Crew
        
        Args:
            crew_id: Crew ID
            crew_data: 更新数据
            
        Returns:
            Optional[CrewResponse]: 更新后的Crew信息或None
        """
        crew = self.db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            return None
        
        # 更新字段
        update_data = crew_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(crew, field):
                setattr(crew, field, value)
        
        crew.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(crew)
        
        logger.info(f"Updated crew: {crew.name} (ID: {crew_id})")
        return CrewResponse(**crew.to_dict())
    
    async def delete_crew(self, crew_id: str) -> bool:
        """
        删除Crew
        
        Args:
            crew_id: Crew ID
            
        Returns:
            bool: 是否删除成功
        """
        crew = self.db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            return False
        
        crew_name = crew.name
        self.db.delete(crew)
        self.db.commit()
        
        logger.info(f"Deleted crew: {crew_name} (ID: {crew_id})")
        return True
    
    async def execute_crew(self, crew_id: str, execution_input: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        执行Crew
        
        Args:
            crew_id: Crew ID
            execution_input: 执行输入数据
            
        Returns:
            Optional[Dict[str, Any]]: 执行结果或None
        """
        crew = self.db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            return None
        
        execution_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # 更新Crew状态
        crew.status = 'running'
        crew.current_execution_id = execution_id
        crew.execution_progress = 0
        crew.current_agent = crew.agents_config[0].get('agentId') if crew.agents_config else None
        crew.current_task = 'Starting execution...'
        crew.execution_count += 1
        crew.last_execution_at = now
        crew.updated_at = now
        
        self.db.commit()
        
        # 记录执行日志
        self._add_execution_log(crew_id, execution_id, 'info', 'Crew execution started')
        
        logger.info(f"Started execution for crew: {crew.name} (ID: {crew_id}, Execution: {execution_id})")
        
        return {
            "execution_id": execution_id,
            "crew_id": crew_id,
            "status": "started",
            "message": "Crew execution started successfully"
        }
    
    async def stop_crew(self, crew_id: str) -> Optional[Dict[str, Any]]:
        """
        停止Crew执行
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Optional[Dict[str, Any]]: 停止结果或None
        """
        crew = self.db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            return None
        
        if crew.status != 'running':
            return {
                "crew_id": crew_id,
                "status": "not_running",
                "message": "Crew is not currently running"
            }
        
        # 记录执行日志
        if crew.current_execution_id:
            self._add_execution_log(crew_id, crew.current_execution_id, 'warning', 'Crew execution stopped by user')
        
        # 更新Crew状态
        crew.status = 'stopped'
        crew.current_execution_id = None
        crew.execution_progress = None
        crew.current_agent = None
        crew.current_task = None
        crew.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        logger.info(f"Stopped execution for crew: {crew.name} (ID: {crew_id})")
        
        return {
            "crew_id": crew_id,
            "status": "stopped",
            "message": "Crew execution stopped successfully"
        }
    
    async def get_crew_status(self, crew_id: str) -> Optional[Dict[str, Any]]:
        """
        获取Crew状态
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Optional[Dict[str, Any]]: Crew状态信息或None
        """
        crew = self.db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            return None
        
        return {
            "crew_id": crew_id,
            "status": crew.status,
            "is_available": crew.status in ['idle', 'completed', 'failed'],
            "current_execution_id": crew.current_execution_id,
            "progress_percentage": crew.execution_progress or 0,
            "current_agent": crew.current_agent,
            "current_task": crew.current_task,
            "total_executions": crew.execution_count,
            "successful_executions": crew.success_count,
            "failed_executions": crew.error_count,
            "average_execution_time": crew.execution_time,
            "last_activity": crew.last_execution_at
        }
    
    async def get_crew_logs(self, crew_id: str, limit: int = 50) -> Optional[List[Dict[str, Any]]]:
        """
        获取Crew执行日志
        
        Args:
            crew_id: Crew ID
            limit: 返回的最大日志数
            
        Returns:
            Optional[List[Dict[str, Any]]]: 执行日志列表或None
        """
        # 检查crew是否存在
        crew = self.db.query(Crew).filter(Crew.id == crew_id).first()
        if not crew:
            return None
        
        logs = self._execution_logs.get(crew_id, [])
        # 按时间倒序排列，返回最新的日志
        logs.sort(key=lambda x: x['timestamp'], reverse=True)
        return logs[:limit]
    
    async def get_crew_stats(self) -> CrewStatsResponse:
        """
        获取Crew统计信息
        
        Returns:
            CrewStatsResponse: 统计信息
        """
        crews = self.db.query(Crew).all()
        
        total_crews = len(crews)
        active_crews = len([c for c in crews if c.status == 'running'])
        completed_crews = len([c for c in crews if c.status == 'completed'])
        failed_crews = len([c for c in crews if c.status == 'failed'])
        
        total_agents = sum(len(c.agents_config or []) for c in crews)
        total_tasks = sum(c.total_tasks or 0 for c in crews)
        
        # 计算平均执行时间
        execution_times = [c.execution_time for c in crews if c.execution_time]
        avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0
        
        # 计算成功率
        total_executions = sum(c.execution_count for c in crews)
        total_successes = sum(c.success_count for c in crews)
        success_rate = (total_successes / total_executions * 100) if total_executions > 0 else 0
        
        return CrewStatsResponse(
            total_crews=total_crews,
            active_crews=active_crews,
            completed_crews=completed_crews,
            failed_crews=failed_crews,
            total_agents=total_agents,
            total_tasks=total_tasks,
            avg_execution_time=avg_execution_time,
            success_rate=success_rate
        )
    
    def _add_execution_log(self, crew_id: str, execution_id: str, level: str, message: str, 
                          agent_id: Optional[str] = None, task_id: Optional[str] = None):
        """
        添加执行日志
        
        Args:
            crew_id: Crew ID
            execution_id: 执行ID
            level: 日志级别
            message: 日志消息
            agent_id: Agent ID（可选）
            task_id: 任务ID（可选）
        """
        if crew_id not in self._execution_logs:
            self._execution_logs[crew_id] = []
        
        log_entry = {
            "id": str(uuid.uuid4()),
            "crew_id": crew_id,
            "execution_id": execution_id,
            "level": level,
            "message": message,
            "timestamp": datetime.utcnow(),
            "agent_id": agent_id,
            "task_id": task_id,
            "meta_data": {}
        }
        
        self._execution_logs[crew_id].append(log_entry)
        
        # 限制日志数量，保留最新的1000条
        if len(self._execution_logs[crew_id]) > 1000:
            self._execution_logs[crew_id] = self._execution_logs[crew_id][-1000:]
    
    def _ensure_sample_data(self):
        """确保有示例数据"""
        # 检查数据库中是否已有crew数据
        existing_crews = self.db.query(Crew).count()
        if existing_crews > 0:
            logger.info(f"Found {existing_crews} existing crews in database")
            return
        
        logger.info("No crews found, creating sample data...")
        
        # 创建示例数据
        sample_crews = [
            {
                "name": "研究分析团队",
                "description": "专门用于市场研究和数据分析的AI团队",
                "workflow_template_id": "template_001",
                "agents_config": [
                    {"agentId": "agent_001", "llmModel": "gpt-4", "temperature": 0.7, "maxTokens": 2000},
                    {"agentId": "agent_002", "llmModel": "gpt-3.5-turbo", "temperature": 0.5, "maxTokens": 1500}
                ],
                "status": "idle",
                "execution_count": 5,
                "success_count": 4,
                "error_count": 1,
                "total_tasks": 2,
                "execution_time": 1200.0,
                "meta_data": {"category": "research", "priority": "high"},
                "tags": ["research", "analysis", "market"]
            },
            {
                "name": "内容创作团队",
                "description": "负责生成和优化各类内容的AI团队",
                "workflow_template_id": "template_002",
                "agents_config": [
                    {"agentId": "agent_003", "llmModel": "gpt-4", "temperature": 0.8, "maxTokens": 3000},
                    {"agentId": "agent_004", "llmModel": "claude-3", "temperature": 0.6, "maxTokens": 2500},
                    {"agentId": "agent_005", "llmModel": "gpt-3.5-turbo", "temperature": 0.7, "maxTokens": 2000}
                ],
                "status": "running",
                "execution_count": 12,
                "success_count": 10,
                "error_count": 2,
                "current_execution_id": str(uuid.uuid4()),
                "execution_progress": 65,
                "current_agent": "agent_004",
                "current_task": "正在生成产品描述...",
                "total_tasks": 3,
                "completed_tasks": 2,
                "execution_time": 800.0,
                "meta_data": {"category": "content", "priority": "medium"},
                "tags": ["content", "writing", "creative"]
            },
            {
                "name": "代码审查团队",
                "description": "专门进行代码审查和质量检测的AI团队",
                "workflow_template_id": "template_003",
                "agents_config": [
                    {"agentId": "agent_006", "llmModel": "gpt-4", "temperature": 0.3, "maxTokens": 4000}
                ],
                "status": "completed",
                "execution_count": 8,
                "success_count": 7,
                "error_count": 1,
                "total_tasks": 1,
                "completed_tasks": 1,
                "execution_time": 450.0,
                "meta_data": {"category": "development", "priority": "high"},
                "tags": ["code", "review", "quality"]
            }
        ]
        
        for crew_data in sample_crews:
            crew = Crew(**crew_data)
            self.db.add(crew)
        
        self.db.commit()
        logger.info("Sample crew data created successfully")