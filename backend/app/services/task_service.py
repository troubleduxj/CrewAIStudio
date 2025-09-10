"""Task服务层 - 处理Task相关的业务逻辑"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
import json
import logging
import uuid

def _ensure_datetime(dt_value):
    """确保值是datetime对象，如果是字符串则转换为datetime"""
    if isinstance(dt_value, str):
        try:
            return datetime.fromisoformat(dt_value.replace('Z', '+00:00'))
        except ValueError:
            logger.warning(f"Failed to parse datetime string: {dt_value}")
            return None
    return dt_value

from ..models.task import Task, TaskStatus, TaskPriority
from ..models.agent import Agent
from ..schemas.task import TaskCreate, TaskUpdate, TaskSearchRequest
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class TaskService:
    """Task服务类"""
    
    def __init__(self, db: Session):
        """
        初始化Task服务
        
        Args:
            db: 数据库会话
        """
        self.db = db
    
    def create_task(self, task_data: TaskCreate) -> Task:
        """
        创建新的Task
        
        Args:
            task_data: Task创建数据
            
        Returns:
            Task: 创建的Task实例
            
        Raises:
            ValueError: 当关联的Agent不存在时
        """
        # 验证关联的Agent是否存在
        if task_data.agent_id:
            agent = self.db.query(Agent).filter(Agent.id == task_data.agent_id).first()
            if not agent:
                raise ValueError(f"Agent with ID {task_data.agent_id} not found")
        
        # 创建新Task
        task = Task(
            title=task_data.title,
            description=task_data.description,
            status=TaskStatus.PENDING,
            priority=task_data.priority,
            
            # 内容
            input_data=task_data.input_data,
            expected_output=task_data.expected_output,
            
            # 执行配置
            agent_id=task_data.agent_id,
            timeout=task_data.timeout,
            max_retries=task_data.max_retries,
            retry_delay=task_data.retry_delay,
            
            # 依赖关系
            dependencies=task_data.dependencies,
            
            # 配置选项
            async_execution=task_data.async_execution,
            auto_retry=task_data.auto_retry,
            save_output=task_data.save_output,
            
            # 元数据
            metadata=task_data.meta_data,
            tags=task_data.tags,
            category=task_data.category,
            
            # 生成执行ID
            execution_id=str(uuid.uuid4())
        )
        
        try:
            self.db.add(task)
            self.db.commit()
            self.db.refresh(task)
            
            logger.info(f"Created new task: {task.title} (ID: {task.id})")
            return task
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create task: {str(e)}")
            raise
    
    def get_task(self, task_id: int) -> Optional[Task]:
        """
        根据ID获取Task
        
        Args:
            task_id: Task ID
            
        Returns:
            Optional[Task]: Task实例或None
        """
        return self.db.query(Task).filter(Task.id == task_id).first()
    
    def get_task_by_execution_id(self, execution_id: str) -> Optional[Task]:
        """
        根据执行ID获取Task
        
        Args:
            execution_id: 执行ID
            
        Returns:
            Optional[Task]: Task实例或None
        """
        return self.db.query(Task).filter(Task.execution_id == execution_id).first()
    
    def list_tasks(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        agent_id: Optional[int] = None,
        category: Optional[str] = None
    ) -> List[Task]:
        """
        获取Task列表
        
        Args:
            skip: 跳过的记录数
            limit: 限制返回的记录数
            status: 状态过滤
            priority: 优先级过滤
            agent_id: Agent ID过滤
            category: 分类过滤
            
        Returns:
            List[Task]: Task列表
        """
        query = self.db.query(Task)
        
        # 应用过滤条件
        if status is not None:
            query = query.filter(Task.status == status)
        if priority is not None:
            query = query.filter(Task.priority == priority)
        if agent_id is not None:
            query = query.filter(Task.agent_id == agent_id)
        if category:
            query = query.filter(Task.category == category)
        
        return query.offset(skip).limit(limit).all()
    
    def search_tasks(self, search_request: TaskSearchRequest) -> List[Task]:
        """
        搜索Task
        
        Args:
            search_request: 搜索请求参数
            
        Returns:
            List[Task]: 匹配的Task列表
        """
        query = self.db.query(Task)
        
        # 关键词搜索
        if search_request.query:
            search_term = f"%{search_request.query}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term)
                )
            )
        
        # 状态过滤
        if search_request.status:
            query = query.filter(Task.status == search_request.status)
        
        # 优先级过滤
        if search_request.priority:
            query = query.filter(Task.priority == search_request.priority)
        
        # Agent过滤
        if search_request.agent_id:
            query = query.filter(Task.agent_id == search_request.agent_id)
        
        # 分类过滤
        if search_request.category:
            query = query.filter(Task.category == search_request.category)
        
        # 标签过滤
        if search_request.tags:
            for tag in search_request.tags:
                query = query.filter(Task.tags.contains([tag]))
        
        # 时间过滤
        if search_request.created_after:
            query = query.filter(Task.created_at >= search_request.created_after)
        if search_request.created_before:
            query = query.filter(Task.created_at <= search_request.created_before)
        
        # 排序
        if search_request.sort_by:
            sort_column = getattr(Task, search_request.sort_by, None)
            if sort_column:
                if search_request.sort_order == "desc":
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column.asc())
        
        # 分页
        offset = (search_request.page - 1) * search_request.size
        return query.offset(offset).limit(search_request.size).all()
    
    def update_task(self, task_id: int, task_data: TaskUpdate) -> Optional[Task]:
        """
        更新Task
        
        Args:
            task_id: Task ID
            task_data: 更新数据
            
        Returns:
            Optional[Task]: 更新后的Task实例或None
        """
        task = self.get_task(task_id)
        if not task:
            return None
        
        # 验证Agent ID（如果提供）
        if task_data.agent_id is not None:
            agent = self.db.query(Agent).filter(Agent.id == task_data.agent_id).first()
            if not agent:
                raise ValueError(f"Agent with ID {task_data.agent_id} not found")
        
        # 更新字段
        update_data = task_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(task, field):
                setattr(task, field, value)
        
        task.updated_at = datetime.utcnow()
        
        try:
            self.db.commit()
            self.db.refresh(task)
            
            logger.info(f"Updated task: {task.title} (ID: {task.id})")
            return task
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update task {task_id}: {str(e)}")
            raise
    
    def delete_task(self, task_id: int) -> bool:
        """
        删除Task
        
        Args:
            task_id: Task ID
            
        Returns:
            bool: 是否删除成功
        """
        task = self.get_task(task_id)
        if not task:
            return False
        
        try:
            self.db.delete(task)
            self.db.commit()
            
            logger.info(f"Deleted task: {task.title} (ID: {task.id})")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete task {task_id}: {str(e)}")
            raise
    
    def update_task_status(self, task_id: int, status: TaskStatus, result: Optional[Dict[str, Any]] = None) -> Optional[Task]:
        """
        更新Task状态
        
        Args:
            task_id: Task ID
            status: 新状态
            result: 执行结果（可选）
            
        Returns:
            Optional[Task]: 更新后的Task实例或None
        """
        task = self.get_task(task_id)
        if not task:
            return None
        
        old_status = task.status
        task.update_status(status)
        
        # 更新结果
        if result is not None:
            task.output_data = result
        
        # 更新时间戳
        if status == TaskStatus.RUNNING:
            task.started_at = datetime.utcnow()
        elif status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            task.completed_at = datetime.utcnow()
            if task.started_at:
                try:
                    started_at = _ensure_datetime(task.started_at)
                    completed_at = _ensure_datetime(task.completed_at)
                    if started_at and completed_at:
                        task.execution_time = (completed_at - started_at).total_seconds()
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to calculate task execution time: {e}")
        
        try:
            self.db.commit()
            self.db.refresh(task)
            
            logger.info(f"Updated task {task.title} status: {old_status} -> {status}")
            return task
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update task {task_id} status: {str(e)}")
            raise
    
    def get_pending_tasks(self, agent_id: Optional[int] = None) -> List[Task]:
        """
        获取待执行的Task列表
        
        Args:
            agent_id: Agent ID过滤（可选）
            
        Returns:
            List[Task]: 待执行的Task列表
        """
        query = self.db.query(Task).filter(Task.status == TaskStatus.PENDING)
        
        if agent_id:
            query = query.filter(Task.agent_id == agent_id)
        
        # 按优先级和创建时间排序
        return query.order_by(Task.priority.desc(), Task.created_at.asc()).all()
    
    def get_running_tasks(self, agent_id: Optional[int] = None) -> List[Task]:
        """
        获取正在运行的Task列表
        
        Args:
            agent_id: Agent ID过滤（可选）
            
        Returns:
            List[Task]: 正在运行的Task列表
        """
        query = self.db.query(Task).filter(Task.status == TaskStatus.RUNNING)
        
        if agent_id:
            query = query.filter(Task.agent_id == agent_id)
        
        return query.all()
    
    def get_task_dependencies(self, task_id: int) -> List[Task]:
        """
        获取Task的依赖任务
        
        Args:
            task_id: Task ID
            
        Returns:
            List[Task]: 依赖的Task列表
        """
        task = self.get_task(task_id)
        if not task or not task.dependencies:
            return []
        
        return self.db.query(Task).filter(Task.id.in_(task.dependencies)).all()
    
    def get_dependent_tasks(self, task_id: int) -> List[Task]:
        """
        获取依赖于指定Task的任务列表
        
        Args:
            task_id: Task ID
            
        Returns:
            List[Task]: 依赖于该Task的任务列表
        """
        return self.db.query(Task).filter(Task.dependencies.contains([task_id])).all()
    
    def can_execute_task(self, task_id: int) -> bool:
        """
        检查Task是否可以执行（所有依赖都已完成）
        
        Args:
            task_id: Task ID
            
        Returns:
            bool: 是否可以执行
        """
        task = self.get_task(task_id)
        if not task:
            return False
        
        # 检查状态
        if task.status != TaskStatus.PENDING:
            return False
        
        # 检查依赖
        if task.dependencies:
            dependencies = self.get_task_dependencies(task_id)
            for dep_task in dependencies:
                if dep_task.status != TaskStatus.COMPLETED:
                    return False
        
        return True
    
    def get_task_statistics(self, task_id: int) -> Optional[Dict[str, Any]]:
        """
        获取Task统计信息
        
        Args:
            task_id: Task ID
            
        Returns:
            Optional[Dict[str, Any]]: 统计信息或None
        """
        task = self.get_task(task_id)
        if not task:
            return None
        
        return {
            "id": task.id,
            "title": task.title,
            "status": task.status.value,
            "priority": task.priority.value,
            "execution_id": task.execution_id,
            "agent_id": task.agent_id,
            "execution_time": task.execution_time,
            "retry_count": task.retry_count,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "has_dependencies": bool(task.dependencies),
            "dependency_count": len(task.dependencies) if task.dependencies else 0,
            "can_execute": self.can_execute_task(task_id)
        }
    
    def validate_task_config(self, task_data: TaskCreate) -> Dict[str, Any]:
        """
        验证Task配置
        
        Args:
            task_data: Task配置数据
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        errors = []
        warnings = []
        suggestions = []
        
        # 验证必填字段
        if not task_data.title or len(task_data.title.strip()) == 0:
            errors.append("Task title is required")
        
        if not task_data.description or len(task_data.description.strip()) == 0:
            warnings.append("Task description is recommended")
        
        # 验证Agent
        if task_data.agent_id:
            agent = self.db.query(Agent).filter(Agent.id == task_data.agent_id).first()
            if not agent:
                errors.append(f"Agent with ID {task_data.agent_id} not found")
            elif not agent.is_active:
                warnings.append(f"Agent {agent.name} is not active")
        
        # 验证执行配置
        if task_data.timeout and task_data.timeout < 1:
            errors.append("Timeout must be positive")
        
        if task_data.max_retries and task_data.max_retries < 0:
            errors.append("Max retries cannot be negative")
        
        if task_data.retry_delay and task_data.retry_delay < 0:
            errors.append("Retry delay cannot be negative")
        
        # 验证依赖关系
        if task_data.dependencies:
            for dep_id in task_data.dependencies:
                dep_task = self.get_task(dep_id)
                if not dep_task:
                    errors.append(f"Dependency task with ID {dep_id} not found")
        
        # 提供建议
        if not task_data.expected_output:
            suggestions.append("Consider specifying expected output format")
        
        if not task_data.input_data:
            suggestions.append("Consider providing input data for the task")
        
        if task_data.priority == TaskPriority.LOW:
            suggestions.append("Low priority tasks may be delayed in execution")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions
        }
    
    def clone_task(self, task_id: int, new_title: str, new_description: Optional[str] = None) -> Optional[Task]:
        """
        克隆Task
        
        Args:
            task_id: 源Task ID
            new_title: 新Task标题
            new_description: 新Task描述
            
        Returns:
            Optional[Task]: 克隆的Task实例或None
        """
        source_task = self.get_task(task_id)
        if not source_task:
            return None
        
        # 创建克隆数据
        clone_data = TaskCreate(
            title=new_title,
            description=new_description or f"Clone of {source_task.title}",
            priority=source_task.priority,
            
            input_data=source_task.input_data.copy() if source_task.input_data else {},
            expected_output=source_task.expected_output,
            
            agent_id=source_task.agent_id,
            timeout=source_task.timeout,
            max_retries=source_task.max_retries,
            retry_delay=source_task.retry_delay,
            
            # 不复制依赖关系，避免循环依赖
            dependencies=[],
            
            async_execution=source_task.async_execution,
            auto_retry=source_task.auto_retry,
            save_output=source_task.save_output,
            
            metadata=source_task.meta_data.copy() if source_task.meta_data else {},
            tags=source_task.tags.copy() if source_task.tags else [],
            category=source_task.category
        )
        
        return self.create_task(clone_data)
    
    def get_tasks_count(self, status: Optional[TaskStatus] = None, agent_id: Optional[int] = None) -> int:
        """
        获取Task数量
        
        Args:
            status: 状态过滤
            agent_id: Agent ID过滤
            
        Returns:
            int: Task数量
        """
        query = self.db.query(Task)
        if status:
            query = query.filter(Task.status == status)
        if agent_id:
            query = query.filter(Task.agent_id == agent_id)
        return query.count()
    
    def get_tasks_by_agent(self, agent_id: int, status: Optional[TaskStatus] = None) -> List[Task]:
        """
        获取指定Agent的Task列表
        
        Args:
            agent_id: Agent ID
            status: 状态过滤（可选）
            
        Returns:
            List[Task]: Task列表
        """
        query = self.db.query(Task).filter(Task.agent_id == agent_id)
        
        if status:
            query = query.filter(Task.status == status)
        
        return query.order_by(Task.created_at.desc()).all()
    
    def cancel_task(self, task_id: int, reason: Optional[str] = None) -> Optional[Task]:
        """
        取消Task
        
        Args:
            task_id: Task ID
            reason: 取消原因
            
        Returns:
            Optional[Task]: 更新后的Task实例或None
        """
        task = self.get_task(task_id)
        if not task:
            return None
        
        # 只能取消待执行或正在运行的任务
        if task.status not in [TaskStatus.PENDING, TaskStatus.RUNNING]:
            raise ValueError(f"Cannot cancel task with status {task.status.value}")
        
        # 更新状态和错误信息
        task.status = TaskStatus.CANCELLED
        task.completed_at = datetime.utcnow()
        task.error_message = reason or "Task cancelled by user"
        task.updated_at = datetime.utcnow()
        
        if task.started_at:
            try:
                started_at = _ensure_datetime(task.started_at)
                completed_at = _ensure_datetime(task.completed_at)
                if started_at and completed_at:
                    task.execution_time = (completed_at - started_at).total_seconds()
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to calculate task execution time: {e}")
        
        try:
            self.db.commit()
            self.db.refresh(task)
            
            logger.info(f"Cancelled task: {task.title} (ID: {task.id})")
            return task
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to cancel task {task_id}: {str(e)}")
            raise