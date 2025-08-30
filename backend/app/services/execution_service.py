"""执行服务层 - 处理任务和工作流的执行管理"""

from typing import List, Optional, Dict, Any, Callable
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import logging
import asyncio
import uuid
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, Future
import threading
from dataclasses import dataclass

from ..models.agent import Agent
from ..models.task import Task, TaskStatus, TaskPriority
from ..models.workflow import Workflow, WorkflowStatus, ExecutionMode
from ..core.config import get_settings
from .crewai_service import CrewAIService

logger = logging.getLogger(__name__)
settings = get_settings()

class ExecutionType(Enum):
    """执行类型枚举"""
    TASK = "task"
    WORKFLOW = "workflow"
    AGENT = "agent"

@dataclass
class ExecutionContext:
    """执行上下文"""
    execution_id: str
    execution_type: ExecutionType
    target_id: int
    user_id: Optional[str] = None
    inputs: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "pending"
    progress: int = 0
    current_step: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    logs: List[str] = None
    
    def __post_init__(self):
        if self.logs is None:
            self.logs = []

class ExecutionService:
    """执行服务类"""
    
    def __init__(self, db: Session):
        """
        初始化执行服务
        
        Args:
            db: 数据库会话
        """
        self.db = db
        self.crewai_service = CrewAIService(db)
        self.executor = ThreadPoolExecutor(max_workers=8)
        self.execution_contexts: Dict[str, ExecutionContext] = {}
        self.execution_futures: Dict[str, Future] = {}
        self.execution_callbacks: Dict[str, List[Callable]] = {}
        self.lock = threading.Lock()
        
        # 执行队列
        self.task_queue: List[ExecutionContext] = []
        self.workflow_queue: List[ExecutionContext] = []
        
        # 执行限制
        self.max_concurrent_tasks = settings.MAX_CONCURRENT_TASKS or 5
        self.max_concurrent_workflows = settings.MAX_CONCURRENT_WORKFLOWS or 3
        
        # 当前执行计数
        self.current_task_executions = 0
        self.current_workflow_executions = 0
    
    async def execute_task(self, task_id: int, inputs: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None) -> str:
        """
        执行单个任务
        
        Args:
            task_id: 任务ID
            inputs: 输入参数
            user_id: 用户ID
            
        Returns:
            str: 执行ID
        """
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        if not task.is_active:
            raise ValueError(f"Task {task_id} is not active")
        
        # 创建执行上下文
        execution_id = str(uuid.uuid4())
        context = ExecutionContext(
            execution_id=execution_id,
            execution_type=ExecutionType.TASK,
            target_id=task_id,
            user_id=user_id,
            inputs=inputs or {},
            metadata={"task_name": task.name, "task_type": task.task_type.value if task.task_type else None}
        )
        
        with self.lock:
            self.execution_contexts[execution_id] = context
        
        # 检查是否可以立即执行
        if self.current_task_executions < self.max_concurrent_tasks:
            await self._start_task_execution(context)
        else:
            # 添加到队列
            self.task_queue.append(context)
            context.status = "queued"
            logger.info(f"Task {task_id} queued for execution (execution_id: {execution_id})")
        
        return execution_id
    
    async def execute_workflow(self, workflow_id: int, inputs: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None) -> str:
        """
        执行工作流
        
        Args:
            workflow_id: 工作流ID
            inputs: 输入参数
            user_id: 用户ID
            
        Returns:
            str: 执行ID
        """
        workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        if not workflow.is_active:
            raise ValueError(f"Workflow {workflow_id} is not active")
        
        if workflow.status not in [WorkflowStatus.READY, WorkflowStatus.PAUSED]:
            raise ValueError(f"Workflow {workflow_id} is not in executable state")
        
        # 创建执行上下文
        execution_id = str(uuid.uuid4())
        context = ExecutionContext(
            execution_id=execution_id,
            execution_type=ExecutionType.WORKFLOW,
            target_id=workflow_id,
            user_id=user_id,
            inputs=inputs or {},
            metadata={
                "workflow_name": workflow.name,
                "workflow_type": workflow.workflow_type.value,
                "execution_mode": workflow.execution_mode.value
            }
        )
        
        with self.lock:
            self.execution_contexts[execution_id] = context
        
        # 检查是否可以立即执行
        if self.current_workflow_executions < self.max_concurrent_workflows:
            await self._start_workflow_execution(context)
        else:
            # 添加到队列
            self.workflow_queue.append(context)
            context.status = "queued"
            logger.info(f"Workflow {workflow_id} queued for execution (execution_id: {execution_id})")
        
        return execution_id
    
    async def execute_agent(self, agent_id: int, task_description: str, inputs: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None) -> str:
        """
        执行单个Agent
        
        Args:
            agent_id: Agent ID
            task_description: 任务描述
            inputs: 输入参数
            user_id: 用户ID
            
        Returns:
            str: 执行ID
        """
        agent = self.db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        
        if not agent.is_active:
            raise ValueError(f"Agent {agent_id} is not active")
        
        # 创建执行上下文
        execution_id = str(uuid.uuid4())
        context = ExecutionContext(
            execution_id=execution_id,
            execution_type=ExecutionType.AGENT,
            target_id=agent_id,
            user_id=user_id,
            inputs=inputs or {},
            metadata={
                "agent_name": agent.name,
                "task_description": task_description,
                "agent_role": agent.role
            }
        )
        
        with self.lock:
            self.execution_contexts[execution_id] = context
        
        # Agent执行不受并发限制（可以根据需要调整）
        await self._start_agent_execution(context, task_description)
        
        return execution_id
    
    async def _start_task_execution(self, context: ExecutionContext) -> None:
        """
        开始任务执行
        
        Args:
            context: 执行上下文
        """
        with self.lock:
            self.current_task_executions += 1
        
        context.status = "running"
        context.started_at = datetime.utcnow()
        
        # 更新数据库中的任务状态
        task = self.db.query(Task).filter(Task.id == context.target_id).first()
        if task:
            task.status = TaskStatus.RUNNING
            task.started_at = context.started_at
            self.db.commit()
        
        # 在线程池中执行任务
        future = self.executor.submit(self._execute_task_sync, context)
        self.execution_futures[context.execution_id] = future
        
        # 添加完成回调
        future.add_done_callback(lambda f: self._on_task_execution_complete(context.execution_id, f))
        
        logger.info(f"Started task execution: {context.execution_id}")
    
    async def _start_workflow_execution(self, context: ExecutionContext) -> None:
        """
        开始工作流执行
        
        Args:
            context: 执行上下文
        """
        with self.lock:
            self.current_workflow_executions += 1
        
        context.status = "running"
        context.started_at = datetime.utcnow()
        
        # 更新数据库中的工作流状态
        workflow = self.db.query(Workflow).filter(Workflow.id == context.target_id).first()
        if workflow:
            workflow.status = WorkflowStatus.RUNNING
            workflow.started_at = context.started_at
            self.db.commit()
        
        # 在线程池中执行工作流
        future = self.executor.submit(self._execute_workflow_sync, context)
        self.execution_futures[context.execution_id] = future
        
        # 添加完成回调
        future.add_done_callback(lambda f: self._on_workflow_execution_complete(context.execution_id, f))
        
        logger.info(f"Started workflow execution: {context.execution_id}")
    
    async def _start_agent_execution(self, context: ExecutionContext, task_description: str) -> None:
        """
        开始Agent执行
        
        Args:
            context: 执行上下文
            task_description: 任务描述
        """
        context.status = "running"
        context.started_at = datetime.utcnow()
        
        # 在线程池中执行Agent
        future = self.executor.submit(self._execute_agent_sync, context, task_description)
        self.execution_futures[context.execution_id] = future
        
        # 添加完成回调
        future.add_done_callback(lambda f: self._on_agent_execution_complete(context.execution_id, f))
        
        logger.info(f"Started agent execution: {context.execution_id}")
    
    def _execute_task_sync(self, context: ExecutionContext) -> Any:
        """
        同步执行任务
        
        Args:
            context: 执行上下文
            
        Returns:
            Any: 执行结果
        """
        try:
            task = self.db.query(Task).filter(Task.id == context.target_id).first()
            if not task:
                raise ValueError(f"Task {context.target_id} not found")
            
            context.logs.append(f"Starting task execution: {task.name}")
            
            # 检查任务依赖
            if task.dependencies:
                context.logs.append("Checking task dependencies...")
                for dep_id in task.dependencies:
                    dep_task = self.db.query(Task).filter(Task.id == dep_id).first()
                    if not dep_task or dep_task.status != TaskStatus.COMPLETED:
                        raise ValueError(f"Dependency task {dep_id} not completed")
            
            # 获取关联的Agent
            agent = None
            if task.agent_id:
                agent = self.db.query(Agent).filter(Agent.id == task.agent_id).first()
                if not agent:
                    raise ValueError(f"Agent {task.agent_id} not found")
            
            # 模拟任务执行（实际实现中应该调用相应的执行逻辑）
            context.logs.append("Executing task logic...")
            
            # 这里可以集成CrewAI或其他执行引擎
            if agent and self.crewai_service.check_crewai_availability():
                crew_agent = self.crewai_service.create_crew_agent(agent)
                crew_task = self.crewai_service.create_crew_task(task, crew_agent)
                
                if crew_agent and crew_task:
                    # 使用CrewAI执行
                    context.logs.append("Using CrewAI for task execution")
                    # 这里需要实现CrewAI的单任务执行逻辑
                    result = f"Task {task.name} completed using CrewAI"
                else:
                    # 回退到简单执行
                    result = self._execute_simple_task(task, context)
            else:
                # 简单执行
                result = self._execute_simple_task(task, context)
            
            context.logs.append(f"Task execution completed: {result}")
            return result
            
        except Exception as e:
            context.logs.append(f"Task execution failed: {str(e)}")
            raise
    
    def _execute_workflow_sync(self, context: ExecutionContext) -> Any:
        """
        同步执行工作流
        
        Args:
            context: 执行上下文
            
        Returns:
            Any: 执行结果
        """
        try:
            workflow = self.db.query(Workflow).filter(Workflow.id == context.target_id).first()
            if not workflow:
                raise ValueError(f"Workflow {context.target_id} not found")
            
            context.logs.append(f"Starting workflow execution: {workflow.name}")
            
            # 使用CrewAI执行工作流
            if self.crewai_service.check_crewai_availability():
                context.logs.append("Using CrewAI for workflow execution")
                crew = self.crewai_service.create_crew(workflow)
                
                if crew:
                    # 同步执行crew
                    result = self.crewai_service._execute_crew_sync(crew, context.execution_id, context.inputs)
                    context.logs.append(f"CrewAI execution completed")
                    return result
                else:
                    context.logs.append("Failed to create CrewAI crew, falling back to simple execution")
            
            # 回退到简单执行
            result = self._execute_simple_workflow(workflow, context)
            context.logs.append(f"Workflow execution completed: {result}")
            return result
            
        except Exception as e:
            context.logs.append(f"Workflow execution failed: {str(e)}")
            raise
    
    def _execute_agent_sync(self, context: ExecutionContext, task_description: str) -> Any:
        """
        同步执行Agent
        
        Args:
            context: 执行上下文
            task_description: 任务描述
            
        Returns:
            Any: 执行结果
        """
        try:
            agent = self.db.query(Agent).filter(Agent.id == context.target_id).first()
            if not agent:
                raise ValueError(f"Agent {context.target_id} not found")
            
            context.logs.append(f"Starting agent execution: {agent.name}")
            context.logs.append(f"Task description: {task_description}")
            
            # 使用CrewAI执行Agent
            if self.crewai_service.check_crewai_availability():
                context.logs.append("Using CrewAI for agent execution")
                crew_agent = self.crewai_service.create_crew_agent(agent)
                
                if crew_agent:
                    # 创建临时任务
                    temp_task = Task(
                        name=f"Temp task for agent {agent.name}",
                        description=task_description,
                        expected_output="Task completion result"
                    )
                    
                    crew_task = self.crewai_service.create_crew_task(temp_task, crew_agent)
                    
                    if crew_task:
                        # 这里需要实现单Agent执行逻辑
                        result = f"Agent {agent.name} completed task: {task_description}"
                        context.logs.append(f"CrewAI agent execution completed")
                        return result
            
            # 回退到简单执行
            result = self._execute_simple_agent(agent, task_description, context)
            context.logs.append(f"Agent execution completed: {result}")
            return result
            
        except Exception as e:
            context.logs.append(f"Agent execution failed: {str(e)}")
            raise
    
    def _execute_simple_task(self, task: Task, context: ExecutionContext) -> str:
        """
        简单任务执行（模拟）
        
        Args:
            task: 任务实例
            context: 执行上下文
            
        Returns:
            str: 执行结果
        """
        import time
        import random
        
        # 模拟执行时间
        execution_time = random.uniform(1, 5)
        
        for i in range(10):
            time.sleep(execution_time / 10)
            progress = (i + 1) * 10
            context.progress = progress
            context.current_step = f"Step {i + 1}/10"
            
            # 更新数据库中的进度
            task.progress_percentage = progress
            self.db.commit()
        
        return f"Task '{task.name}' completed successfully with inputs: {context.inputs}"
    
    def _execute_simple_workflow(self, workflow: Workflow, context: ExecutionContext) -> str:
        """
        简单工作流执行（模拟）
        
        Args:
            workflow: 工作流实例
            context: 执行上下文
            
        Returns:
            str: 执行结果
        """
        import time
        import random
        
        # 模拟执行时间
        execution_time = random.uniform(5, 15)
        steps = workflow.total_steps or 5
        
        for i in range(steps):
            time.sleep(execution_time / steps)
            progress = int((i + 1) * 100 / steps)
            context.progress = progress
            context.current_step = f"Step {i + 1}/{steps}"
            
            # 更新数据库中的进度
            workflow.progress_percentage = progress
            workflow.completed_steps = i + 1
            workflow.current_step = context.current_step
            self.db.commit()
        
        return f"Workflow '{workflow.name}' completed successfully with {steps} steps"
    
    def _execute_simple_agent(self, agent: Agent, task_description: str, context: ExecutionContext) -> str:
        """
        简单Agent执行（模拟）
        
        Args:
            agent: Agent实例
            task_description: 任务描述
            context: 执行上下文
            
        Returns:
            str: 执行结果
        """
        import time
        import random
        
        # 模拟执行时间
        execution_time = random.uniform(2, 8)
        
        for i in range(5):
            time.sleep(execution_time / 5)
            progress = (i + 1) * 20
            context.progress = progress
            context.current_step = f"Processing step {i + 1}/5"
        
        return f"Agent '{agent.name}' completed task: {task_description}"
    
    def _on_task_execution_complete(self, execution_id: str, future: Future) -> None:
        """
        任务执行完成回调
        
        Args:
            execution_id: 执行ID
            future: Future对象
        """
        context = self.execution_contexts.get(execution_id)
        if not context:
            return
        
        try:
            result = future.result()
            context.status = "completed"
            context.result = result
            context.completed_at = datetime.utcnow()
            
            # 更新数据库中的任务状态
            task = self.db.query(Task).filter(Task.id == context.target_id).first()
            if task:
                task.status = TaskStatus.COMPLETED
                task.completed_at = context.completed_at
                task.result = result
                task.progress_percentage = 100
                
                if task.started_at:
                    duration = int((task.completed_at - task.started_at).total_seconds())
                    task.execution_duration = duration
                
                self.db.commit()
            
            logger.info(f"Task execution completed: {execution_id}")
            
        except Exception as e:
            context.status = "failed"
            context.error = str(e)
            context.completed_at = datetime.utcnow()
            
            # 更新数据库中的任务状态
            task = self.db.query(Task).filter(Task.id == context.target_id).first()
            if task:
                task.status = TaskStatus.FAILED
                task.completed_at = context.completed_at
                task.last_error = str(e)
                self.db.commit()
            
            logger.error(f"Task execution failed: {execution_id} - {str(e)}")
        
        finally:
            # 减少当前执行计数
            with self.lock:
                self.current_task_executions -= 1
            
            # 处理队列中的下一个任务
            asyncio.create_task(self._process_task_queue())
            
            # 执行回调
            self._execute_callbacks(execution_id)
    
    def _on_workflow_execution_complete(self, execution_id: str, future: Future) -> None:
        """
        工作流执行完成回调
        
        Args:
            execution_id: 执行ID
            future: Future对象
        """
        context = self.execution_contexts.get(execution_id)
        if not context:
            return
        
        try:
            result = future.result()
            context.status = "completed"
            context.result = result
            context.completed_at = datetime.utcnow()
            
            # 更新数据库中的工作流状态
            workflow = self.db.query(Workflow).filter(Workflow.id == context.target_id).first()
            if workflow:
                workflow.status = WorkflowStatus.COMPLETED
                workflow.completed_at = context.completed_at
                workflow.result = result
                workflow.progress_percentage = 100
                workflow.execution_count += 1
                workflow.success_count += 1
                
                if workflow.started_at:
                    duration = int((workflow.completed_at - workflow.started_at).total_seconds())
                    workflow.execution_duration = duration
                    
                    # 更新平均执行时间
                    if workflow.average_execution_time:
                        workflow.average_execution_time = (
                            workflow.average_execution_time * (workflow.execution_count - 1) + duration
                        ) / workflow.execution_count
                    else:
                        workflow.average_execution_time = duration
                
                self.db.commit()
            
            logger.info(f"Workflow execution completed: {execution_id}")
            
        except Exception as e:
            context.status = "failed"
            context.error = str(e)
            context.completed_at = datetime.utcnow()
            
            # 更新数据库中的工作流状态
            workflow = self.db.query(Workflow).filter(Workflow.id == context.target_id).first()
            if workflow:
                workflow.status = WorkflowStatus.FAILED
                workflow.completed_at = context.completed_at
                workflow.last_error = str(e)
                workflow.execution_count += 1
                workflow.failure_count += 1
                self.db.commit()
            
            logger.error(f"Workflow execution failed: {execution_id} - {str(e)}")
        
        finally:
            # 减少当前执行计数
            with self.lock:
                self.current_workflow_executions -= 1
            
            # 处理队列中的下一个工作流
            asyncio.create_task(self._process_workflow_queue())
            
            # 执行回调
            self._execute_callbacks(execution_id)
    
    def _on_agent_execution_complete(self, execution_id: str, future: Future) -> None:
        """
        Agent执行完成回调
        
        Args:
            execution_id: 执行ID
            future: Future对象
        """
        context = self.execution_contexts.get(execution_id)
        if not context:
            return
        
        try:
            result = future.result()
            context.status = "completed"
            context.result = result
            context.completed_at = datetime.utcnow()
            
            # 更新Agent统计信息
            agent = self.db.query(Agent).filter(Agent.id == context.target_id).first()
            if agent:
                agent.total_executions += 1
                agent.successful_executions += 1
                agent.last_execution_at = context.completed_at
                
                if context.started_at:
                    duration = int((context.completed_at - context.started_at).total_seconds())
                    if agent.average_execution_time:
                        agent.average_execution_time = (
                            agent.average_execution_time * (agent.total_executions - 1) + duration
                        ) / agent.total_executions
                    else:
                        agent.average_execution_time = duration
                
                self.db.commit()
            
            logger.info(f"Agent execution completed: {execution_id}")
            
        except Exception as e:
            context.status = "failed"
            context.error = str(e)
            context.completed_at = datetime.utcnow()
            
            # 更新Agent统计信息
            agent = self.db.query(Agent).filter(Agent.id == context.target_id).first()
            if agent:
                agent.total_executions += 1
                agent.failed_executions += 1
                agent.last_execution_at = context.completed_at
                self.db.commit()
            
            logger.error(f"Agent execution failed: {execution_id} - {str(e)}")
        
        finally:
            # 执行回调
            self._execute_callbacks(execution_id)
    
    async def _process_task_queue(self) -> None:
        """
        处理任务队列
        """
        if self.current_task_executions < self.max_concurrent_tasks and self.task_queue:
            context = self.task_queue.pop(0)
            await self._start_task_execution(context)
    
    async def _process_workflow_queue(self) -> None:
        """
        处理工作流队列
        """
        if self.current_workflow_executions < self.max_concurrent_workflows and self.workflow_queue:
            context = self.workflow_queue.pop(0)
            await self._start_workflow_execution(context)
    
    def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """
        获取执行状态
        
        Args:
            execution_id: 执行ID
            
        Returns:
            Optional[Dict[str, Any]]: 执行状态或None
        """
        context = self.execution_contexts.get(execution_id)
        if not context:
            return None
        
        return {
            "execution_id": context.execution_id,
            "execution_type": context.execution_type.value,
            "target_id": context.target_id,
            "status": context.status,
            "progress": context.progress,
            "current_step": context.current_step,
            "started_at": context.started_at.isoformat() if context.started_at else None,
            "completed_at": context.completed_at.isoformat() if context.completed_at else None,
            "result": context.result,
            "error": context.error,
            "logs": context.logs,
            "metadata": context.metadata
        }
    
    def stop_execution(self, execution_id: str) -> bool:
        """
        停止执行
        
        Args:
            execution_id: 执行ID
            
        Returns:
            bool: 是否成功停止
        """
        context = self.execution_contexts.get(execution_id)
        if not context:
            return False
        
        if context.status not in ["running", "queued"]:
            return False
        
        # 如果在队列中，直接移除
        if context.status == "queued":
            if context in self.task_queue:
                self.task_queue.remove(context)
            if context in self.workflow_queue:
                self.workflow_queue.remove(context)
            
            context.status = "cancelled"
            context.completed_at = datetime.utcnow()
            return True
        
        # 如果正在运行，尝试取消Future
        future = self.execution_futures.get(execution_id)
        if future:
            cancelled = future.cancel()
            if cancelled:
                context.status = "cancelled"
                context.completed_at = datetime.utcnow()
                
                # 更新数据库状态
                if context.execution_type == ExecutionType.TASK:
                    task = self.db.query(Task).filter(Task.id == context.target_id).first()
                    if task:
                        task.status = TaskStatus.CANCELLED
                        task.completed_at = context.completed_at
                        self.db.commit()
                elif context.execution_type == ExecutionType.WORKFLOW:
                    workflow = self.db.query(Workflow).filter(Workflow.id == context.target_id).first()
                    if workflow:
                        workflow.status = WorkflowStatus.CANCELLED
                        workflow.completed_at = context.completed_at
                        self.db.commit()
                
                logger.info(f"Execution {execution_id} cancelled")
                return True
        
        return False
    
    def add_execution_callback(self, execution_id: str, callback: Callable[[str, Dict[str, Any]], None]) -> None:
        """
        添加执行完成回调
        
        Args:
            execution_id: 执行ID
            callback: 回调函数
        """
        if execution_id not in self.execution_callbacks:
            self.execution_callbacks[execution_id] = []
        self.execution_callbacks[execution_id].append(callback)
    
    def _execute_callbacks(self, execution_id: str) -> None:
        """
        执行回调函数
        
        Args:
            execution_id: 执行ID
        """
        callbacks = self.execution_callbacks.get(execution_id, [])
        context = self.execution_contexts.get(execution_id)
        
        if context:
            status = self.get_execution_status(execution_id)
            for callback in callbacks:
                try:
                    callback(execution_id, status)
                except Exception as e:
                    logger.error(f"Callback execution failed for {execution_id}: {str(e)}")
        
        # 清理回调
        if execution_id in self.execution_callbacks:
            del self.execution_callbacks[execution_id]
    
    def get_execution_statistics(self) -> Dict[str, Any]:
        """
        获取执行统计信息
        
        Returns:
            Dict[str, Any]: 统计信息
        """
        total_executions = len(self.execution_contexts)
        running_executions = len([c for c in self.execution_contexts.values() if c.status == "running"])
        queued_executions = len([c for c in self.execution_contexts.values() if c.status == "queued"])
        completed_executions = len([c for c in self.execution_contexts.values() if c.status == "completed"])
        failed_executions = len([c for c in self.execution_contexts.values() if c.status == "failed"])
        
        return {
            "total_executions": total_executions,
            "running_executions": running_executions,
            "queued_executions": queued_executions,
            "completed_executions": completed_executions,
            "failed_executions": failed_executions,
            "current_task_executions": self.current_task_executions,
            "current_workflow_executions": self.current_workflow_executions,
            "max_concurrent_tasks": self.max_concurrent_tasks,
            "max_concurrent_workflows": self.max_concurrent_workflows,
            "task_queue_length": len(self.task_queue),
            "workflow_queue_length": len(self.workflow_queue)
        }
    
    def cleanup_completed_executions(self, older_than_hours: int = 24) -> int:
        """
        清理已完成的执行记录
        
        Args:
            older_than_hours: 清理多少小时前的记录
            
        Returns:
            int: 清理的记录数
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=older_than_hours)
        cleaned_count = 0
        
        execution_ids_to_remove = []
        for execution_id, context in self.execution_contexts.items():
            if (context.status in ["completed", "failed", "cancelled"] and 
                context.completed_at and context.completed_at < cutoff_time):
                execution_ids_to_remove.append(execution_id)
        
        for execution_id in execution_ids_to_remove:
            del self.execution_contexts[execution_id]
            if execution_id in self.execution_futures:
                del self.execution_futures[execution_id]
            if execution_id in self.execution_callbacks:
                del self.execution_callbacks[execution_id]
            cleaned_count += 1
        
        logger.info(f"Cleaned up {cleaned_count} completed execution records")
        return cleaned_count
    
    def __del__(self):
        """
        析构函数，清理资源
        """
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=True)