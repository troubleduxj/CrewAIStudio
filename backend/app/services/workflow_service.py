"""Workflow服务层 - 处理Workflow相关的业务逻辑"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
import json
import logging
import uuid

from ..models.workflow import Workflow, WorkflowStatus, WorkflowType, ExecutionMode
from ..models.agent import Agent
from ..models.task import Task
from ..schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowSearchRequest
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class WorkflowService:
    """Workflow服务类"""
    
    def __init__(self, db: Session):
        """
        初始化Workflow服务
        
        Args:
            db: 数据库会话
        """
        self.db = db
    
    def create_workflow(self, workflow_data: WorkflowCreate) -> Workflow:
        """
        创建新的Workflow
        
        Args:
            workflow_data: Workflow创建数据
            
        Returns:
            Workflow: 创建的Workflow实例
            
        Raises:
            ValueError: 当Workflow名称已存在或配置无效时
        """
        # 检查名称是否已存在
        existing_workflow = self.db.query(Workflow).filter(Workflow.name == workflow_data.name).first()
        if existing_workflow:
            raise ValueError(f"Workflow with name '{workflow_data.name}' already exists")
        
        # 验证工作流定义
        self._validate_workflow_definition(workflow_data.workflow_definition)
        
        # 创建新Workflow
        workflow = Workflow(
            name=workflow_data.name,
            description=workflow_data.description,
            version=workflow_data.version,
            workflow_type=workflow_data.workflow_type,
            execution_mode=workflow_data.execution_mode,
            status=WorkflowStatus.DRAFT,
            
            # 工作流定义
            workflow_definition=workflow_data.workflow_definition,
            agents_config=workflow_data.agents_config,
            tasks_config=workflow_data.tasks_config,
            
            # 执行配置
            max_execution_time=workflow_data.max_execution_time,
            retry_policy=workflow_data.retry_policy,
            error_handling=workflow_data.error_handling,
            
            # 调度配置
            schedule_config=workflow_data.schedule_config,
            trigger_conditions=workflow_data.trigger_conditions,
            
            # 配置选项
            is_template=workflow_data.is_template,
            is_public=workflow_data.is_public,
            is_active=workflow_data.is_active,
            
            # 权限和所有者
            owner_id=workflow_data.owner_id,
            permissions=workflow_data.permissions,
            
            # 元数据
            metadata=workflow_data.meta_data,
            tags=workflow_data.tags,
            category=workflow_data.category,
            
            # 初始化统计信息
            total_steps=len(workflow_data.workflow_definition.get('steps', []))
        )
        
        try:
            self.db.add(workflow)
            self.db.commit()
            self.db.refresh(workflow)
            
            logger.info(f"Created new workflow: {workflow.name} (ID: {workflow.id})")
            return workflow
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create workflow: {str(e)}")
            raise
    
    def get_workflow(self, workflow_id: int) -> Optional[Workflow]:
        """
        根据ID获取Workflow
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            Optional[Workflow]: Workflow实例或None
        """
        return self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    def get_workflow_by_name(self, name: str) -> Optional[Workflow]:
        """
        根据名称获取Workflow
        
        Args:
            name: Workflow名称
            
        Returns:
            Optional[Workflow]: Workflow实例或None
        """
        return self.db.query(Workflow).filter(Workflow.name == name).first()
    
    def list_workflows(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[WorkflowStatus] = None,
        workflow_type: Optional[WorkflowType] = None,
        is_active: Optional[bool] = None,
        category: Optional[str] = None
    ) -> List[Workflow]:
        """
        获取Workflow列表
        
        Args:
            skip: 跳过的记录数
            limit: 限制返回的记录数
            status: 状态过滤
            workflow_type: 类型过滤
            is_active: 是否激活过滤
            category: 分类过滤
            
        Returns:
            List[Workflow]: Workflow列表
        """
        query = self.db.query(Workflow)
        
        # 应用过滤条件
        if status is not None:
            query = query.filter(Workflow.status == status)
        if workflow_type is not None:
            query = query.filter(Workflow.workflow_type == workflow_type)
        if is_active is not None:
            query = query.filter(Workflow.is_active == is_active)
        if category:
            query = query.filter(Workflow.category == category)
        
        return query.offset(skip).limit(limit).all()
    
    def search_workflows(self, search_request: WorkflowSearchRequest) -> List[Workflow]:
        """
        搜索Workflow
        
        Args:
            search_request: 搜索请求参数
            
        Returns:
            List[Workflow]: 匹配的Workflow列表
        """
        query = self.db.query(Workflow)
        
        # 关键词搜索
        if search_request.query:
            search_term = f"%{search_request.query}%"
            query = query.filter(
                or_(
                    Workflow.name.ilike(search_term),
                    Workflow.description.ilike(search_term)
                )
            )
        
        # 状态过滤
        if search_request.status:
            query = query.filter(Workflow.status == search_request.status)
        
        # 类型过滤
        if search_request.workflow_type:
            query = query.filter(Workflow.workflow_type == search_request.workflow_type)
        
        # 执行模式过滤
        if search_request.execution_mode:
            query = query.filter(Workflow.execution_mode == search_request.execution_mode)
        
        # 分类过滤
        if search_request.category:
            query = query.filter(Workflow.category == search_request.category)
        
        # 所有者过滤
        if search_request.owner_id:
            query = query.filter(Workflow.owner_id == search_request.owner_id)
        
        # 标签过滤
        if search_request.tags:
            for tag in search_request.tags:
                query = query.filter(Workflow.tags.contains([tag]))
        
        # 模板过滤
        if search_request.is_template is not None:
            query = query.filter(Workflow.is_template == search_request.is_template)
        
        # 公开过滤
        if search_request.is_public is not None:
            query = query.filter(Workflow.is_public == search_request.is_public)
        
        # 时间过滤
        if search_request.created_after:
            query = query.filter(Workflow.created_at >= search_request.created_after)
        if search_request.created_before:
            query = query.filter(Workflow.created_at <= search_request.created_before)
        
        # 排序
        if search_request.sort_by:
            sort_column = getattr(Workflow, search_request.sort_by, None)
            if sort_column:
                if search_request.sort_order == "desc":
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column.asc())
        
        # 分页
        offset = (search_request.page - 1) * search_request.size
        return query.offset(offset).limit(search_request.size).all()
    
    def update_workflow(self, workflow_id: int, workflow_data: WorkflowUpdate) -> Optional[Workflow]:
        """
        更新Workflow
        
        Args:
            workflow_id: Workflow ID
            workflow_data: 更新数据
            
        Returns:
            Optional[Workflow]: 更新后的Workflow实例或None
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return None
        
        # 验证工作流定义（如果提供）
        if workflow_data.workflow_definition is not None:
            self._validate_workflow_definition(workflow_data.workflow_definition)
        
        # 更新字段
        update_data = workflow_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(workflow, field):
                setattr(workflow, field, value)
        
        # 更新总步骤数
        if workflow_data.workflow_definition is not None:
            workflow.total_steps = len(workflow_data.workflow_definition.get('steps', []))
        
        workflow.updated_at = datetime.utcnow()
        
        try:
            self.db.commit()
            self.db.refresh(workflow)
            
            logger.info(f"Updated workflow: {workflow.name} (ID: {workflow.id})")
            return workflow
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update workflow {workflow_id}: {str(e)}")
            raise
    
    def delete_workflow(self, workflow_id: int) -> bool:
        """
        删除Workflow
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            bool: 是否删除成功
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return False
        
        # 检查是否可以删除（不能删除正在运行的工作流）
        if workflow.status == WorkflowStatus.RUNNING:
            raise ValueError("Cannot delete running workflow")
        
        try:
            self.db.delete(workflow)
            self.db.commit()
            
            logger.info(f"Deleted workflow: {workflow.name} (ID: {workflow.id})")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete workflow {workflow_id}: {str(e)}")
            raise
    
    def update_workflow_status(self, workflow_id: int, status: WorkflowStatus) -> Optional[Workflow]:
        """
        更新Workflow状态
        
        Args:
            workflow_id: Workflow ID
            status: 新状态
            
        Returns:
            Optional[Workflow]: 更新后的Workflow实例或None
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return None
        
        old_status = workflow.status
        workflow.update_status(status)
        
        # 更新时间戳
        if status == WorkflowStatus.RUNNING:
            workflow.started_at = datetime.utcnow()
        elif status in [WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED]:
            workflow.completed_at = datetime.utcnow()
            if workflow.started_at:
                workflow.execution_duration = int((workflow.completed_at - workflow.started_at).total_seconds())
        
        try:
            self.db.commit()
            self.db.refresh(workflow)
            
            logger.info(f"Updated workflow {workflow.name} status: {old_status} -> {status}")
            return workflow
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update workflow {workflow_id} status: {str(e)}")
            raise
    
    def update_workflow_progress(self, workflow_id: int, progress: int, current_step: Optional[str] = None) -> Optional[Workflow]:
        """
        更新Workflow进度
        
        Args:
            workflow_id: Workflow ID
            progress: 进度百分比
            current_step: 当前步骤
            
        Returns:
            Optional[Workflow]: 更新后的Workflow实例或None
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return None
        
        workflow.update_progress(progress)
        if current_step:
            workflow.current_step = current_step
        
        try:
            self.db.commit()
            self.db.refresh(workflow)
            return workflow
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update workflow {workflow_id} progress: {str(e)}")
            raise
    
    def get_executable_workflows(self) -> List[Workflow]:
        """
        获取可执行的Workflow列表
        
        Returns:
            List[Workflow]: 可执行的Workflow列表
        """
        return self.db.query(Workflow).filter(
            and_(
                Workflow.is_active == True,
                Workflow.status.in_([WorkflowStatus.READY, WorkflowStatus.PAUSED])
            )
        ).all()
    
    def get_workflow_statistics(self, workflow_id: int) -> Optional[Dict[str, Any]]:
        """
        获取Workflow统计信息
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            Optional[Dict[str, Any]]: 统计信息或None
        """
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return None
        
        return {
            "id": workflow.id,
            "name": workflow.name,
            "status": workflow.status.value,
            "workflow_type": workflow.workflow_type.value,
            "execution_mode": workflow.execution_mode.value,
            "execution_count": workflow.execution_count,
            "success_count": workflow.success_count,
            "failure_count": workflow.failure_count,
            "average_execution_time": workflow.average_execution_time,
            "progress_percentage": workflow.progress_percentage,
            "completed_steps": workflow.completed_steps,
            "total_steps": workflow.total_steps,
            "current_step": workflow.current_step,
            "created_at": workflow.created_at.isoformat(),
            "updated_at": workflow.updated_at.isoformat(),
            "started_at": workflow.started_at.isoformat() if workflow.started_at else None,
            "completed_at": workflow.completed_at.isoformat() if workflow.completed_at else None,
            "execution_duration": workflow.execution_duration
        }
    
    def validate_workflow_config(self, workflow_data: WorkflowCreate) -> Dict[str, Any]:
        """
        验证Workflow配置
        
        Args:
            workflow_data: Workflow配置数据
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        errors = []
        warnings = []
        suggestions = []
        
        # 验证必填字段
        if not workflow_data.name or len(workflow_data.name.strip()) == 0:
            errors.append("Workflow name is required")
        
        if not workflow_data.workflow_definition:
            errors.append("Workflow definition is required")
        else:
            # 验证工作流定义结构
            try:
                self._validate_workflow_definition(workflow_data.workflow_definition)
            except ValueError as e:
                errors.append(str(e))
        
        # 验证版本号
        import re
        if not re.match(r'^\d+\.\d+\.\d+$', workflow_data.version):
            errors.append('Version must follow semantic versioning (e.g., 1.0.0)')
        
        # 验证执行配置
        if workflow_data.max_execution_time and workflow_data.max_execution_time < 1:
            errors.append("Max execution time must be positive")
        
        # 验证Agent配置
        if workflow_data.agents_config:
            for i, agent_config in enumerate(workflow_data.agents_config):
                if 'id' in agent_config:
                    agent = self.db.query(Agent).filter(Agent.id == agent_config['id']).first()
                    if not agent:
                        errors.append(f"Agent {agent_config['id']} in agents_config[{i}] not found")
                    elif not agent.is_active:
                        warnings.append(f"Agent {agent.name} in agents_config[{i}] is not active")
        
        # 提供建议
        if not workflow_data.description:
            suggestions.append("Consider adding a description to explain the workflow purpose")
        
        if not workflow_data.agents_config:
            suggestions.append("Consider specifying agent configurations for better control")
        
        if not workflow_data.error_handling:
            suggestions.append("Consider adding error handling configuration")
        
        if workflow_data.execution_mode == ExecutionMode.MANUAL:
            suggestions.append("Manual execution mode requires user intervention to start")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions
        }
    
    def clone_workflow(self, workflow_id: int, new_name: str, new_description: Optional[str] = None) -> Optional[Workflow]:
        """
        克隆Workflow
        
        Args:
            workflow_id: 源Workflow ID
            new_name: 新Workflow名称
            new_description: 新Workflow描述
            
        Returns:
            Optional[Workflow]: 克隆的Workflow实例或None
        """
        source_workflow = self.get_workflow(workflow_id)
        if not source_workflow:
            return None
        
        # 检查新名称是否已存在
        if self.get_workflow_by_name(new_name):
            raise ValueError(f"Workflow with name '{new_name}' already exists")
        
        # 创建克隆数据
        clone_data = WorkflowCreate(
            name=new_name,
            description=new_description or f"Clone of {source_workflow.name}",
            version="1.0.0",  # 新版本从1.0.0开始
            workflow_type=source_workflow.workflow_type,
            execution_mode=source_workflow.execution_mode,
            
            workflow_definition=source_workflow.workflow_definition.copy() if source_workflow.workflow_definition else {},
            agents_config=source_workflow.agents_config.copy() if source_workflow.agents_config else [],
            tasks_config=source_workflow.tasks_config.copy() if source_workflow.tasks_config else [],
            
            max_execution_time=source_workflow.max_execution_time,
            retry_policy=source_workflow.retry_policy.copy() if source_workflow.retry_policy else {},
            error_handling=source_workflow.error_handling.copy() if source_workflow.error_handling else {},
            
            schedule_config=source_workflow.schedule_config.copy() if source_workflow.schedule_config else {},
            trigger_conditions=source_workflow.trigger_conditions.copy() if source_workflow.trigger_conditions else [],
            
            is_template=False,  # 克隆的工作流默认不是模板
            is_public=False,   # 克隆的工作流默认私有
            is_active=True,    # 克隆的工作流默认激活
            
            owner_id=source_workflow.owner_id,
            permissions=source_workflow.permissions.copy() if source_workflow.permissions else {},
            
            metadata=source_workflow.meta_data.copy() if source_workflow.meta_data else {},
            tags=source_workflow.tags.copy() if source_workflow.tags else [],
            category=source_workflow.category
        )
        
        return self.create_workflow(clone_data)
    
    def get_workflows_count(self, status: Optional[WorkflowStatus] = None) -> int:
        """
        获取Workflow数量
        
        Args:
            status: 状态过滤
            
        Returns:
            int: Workflow数量
        """
        query = self.db.query(Workflow)
        if status:
            query = query.filter(Workflow.status == status)
        return query.count()
    
    def _validate_workflow_definition(self, definition: Dict[str, Any]) -> None:
        """
        验证工作流定义结构
        
        Args:
            definition: 工作流定义
            
        Raises:
            ValueError: 当定义无效时
        """
        if not definition or not isinstance(definition, dict):
            raise ValueError('Workflow definition must be a non-empty dictionary')
        
        # 基本结构验证
        required_fields = ['steps', 'connections']
        for field in required_fields:
            if field not in definition:
                raise ValueError(f'Workflow definition must contain "{field}" field')
        
        # 步骤验证
        steps = definition.get('steps', [])
        if not isinstance(steps, list) or len(steps) == 0:
            raise ValueError('Workflow must contain at least one step')
        
        # 验证每个步骤
        step_ids = set()
        for i, step in enumerate(steps):
            if not isinstance(step, dict):
                raise ValueError(f'Step {i} must be a dictionary')
            
            if 'id' not in step:
                raise ValueError(f'Step {i} must have an "id" field')
            
            step_id = step['id']
            if step_id in step_ids:
                raise ValueError(f'Duplicate step ID: {step_id}')
            step_ids.add(step_id)
            
            if 'type' not in step:
                raise ValueError(f'Step {step_id} must have a "type" field')
        
        # 连接验证
        connections = definition.get('connections', [])
        if not isinstance(connections, list):
            raise ValueError('Connections must be a list')
        
        # 验证连接引用的步骤存在
        for i, connection in enumerate(connections):
            if not isinstance(connection, dict):
                raise ValueError(f'Connection {i} must be a dictionary')
            
            if 'from' not in connection or 'to' not in connection:
                raise ValueError(f'Connection {i} must have "from" and "to" fields')
            
            from_step = connection['from']
            to_step = connection['to']
            
            if from_step not in step_ids:
                raise ValueError(f'Connection {i} references unknown step: {from_step}')
            
            if to_step not in step_ids:
                raise ValueError(f'Connection {i} references unknown step: {to_step}')
    
    def create_workflow_version(self, workflow_id: int, version_type: str = "minor", description: Optional[str] = None) -> Optional[Workflow]:
        """
        创建Workflow新版本
        
        Args:
            workflow_id: 源Workflow ID
            version_type: 版本类型 (major, minor, patch)
            description: 版本描述
            
        Returns:
            Optional[Workflow]: 新版本Workflow实例或None
        """
        source_workflow = self.get_workflow(workflow_id)
        if not source_workflow:
            return None
        
        # 计算新版本号
        current_version = source_workflow.version
        version_parts = current_version.split('.')
        major, minor, patch = int(version_parts[0]), int(version_parts[1]), int(version_parts[2])
        
        if version_type == "major":
            major += 1
            minor = 0
            patch = 0
        elif version_type == "minor":
            minor += 1
            patch = 0
        else:  # patch
            patch += 1
        
        new_version = f"{major}.{minor}.{patch}"
        
        # 标记旧版本为非最新
        source_workflow.is_latest_version = False
        
        # 创建新版本
        new_workflow_data = WorkflowCreate(
            name=source_workflow.name,
            description=description or source_workflow.description,
            version=new_version,
            workflow_type=source_workflow.workflow_type,
            execution_mode=source_workflow.execution_mode,
            
            workflow_definition=source_workflow.workflow_definition.copy() if source_workflow.workflow_definition else {},
            agents_config=source_workflow.agents_config.copy() if source_workflow.agents_config else [],
            tasks_config=source_workflow.tasks_config.copy() if source_workflow.tasks_config else [],
            
            max_execution_time=source_workflow.max_execution_time,
            retry_policy=source_workflow.retry_policy.copy() if source_workflow.retry_policy else {},
            error_handling=source_workflow.error_handling.copy() if source_workflow.error_handling else {},
            
            schedule_config=source_workflow.schedule_config.copy() if source_workflow.schedule_config else {},
            trigger_conditions=source_workflow.trigger_conditions.copy() if source_workflow.trigger_conditions else [],
            
            is_template=source_workflow.is_template,
            is_public=source_workflow.is_public,
            is_active=source_workflow.is_active,
            
            owner_id=source_workflow.owner_id,
            permissions=source_workflow.permissions.copy() if source_workflow.permissions else {},
            
            metadata=source_workflow.meta_data.copy() if source_workflow.meta_data else {},
            tags=source_workflow.tags.copy() if source_workflow.tags else [],
            category=source_workflow.category
        )
        
        new_workflow = self.create_workflow(new_workflow_data)
        if new_workflow:
            new_workflow.parent_workflow_id = workflow_id
            new_workflow.is_latest_version = True
            
            try:
                self.db.commit()
                self.db.refresh(new_workflow)
                logger.info(f"Created new version {new_version} for workflow {source_workflow.name}")
                return new_workflow
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to create workflow version: {str(e)}")
                raise
        
        return None