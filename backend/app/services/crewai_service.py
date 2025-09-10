"""CrewAI服务层 - 处理CrewAI框架的集成和管理"""

from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from datetime import datetime
import json
import logging
import asyncio
import uuid
from concurrent.futures import ThreadPoolExecutor

from app.core.crewai_init import (
    CREWAI_AVAILABLE,
    is_crewai_ready,
    get_crewai_status
)

if CREWAI_AVAILABLE:
    from crewai import Agent as CrewAgent, Task as CrewTask, Crew, Process
    from crewai.tools import BaseTool
else:
    CrewAgent = None
    CrewTask = None
    Crew = None
    Process = None
    BaseTool = None

from ..models.agent import Agent
from ..models.task import Task, TaskStatus
from ..models.workflow import Workflow, WorkflowStatus
from ..core.config import get_settings
from ..tools import BrowserTool, CalculatorTool, FileReaderTool

logger = logging.getLogger(__name__)
settings = get_settings()

class CrewAIService:
    """CrewAI服务类"""
    
    def __init__(self, db: Session):
        """
        初始化CrewAI服务
        
        Args:
            db: 数据库会话
        """
        self.db = db
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.active_crews: Dict[str, Crew] = {}
        self.execution_status: Dict[str, Dict[str, Any]] = {}
        
        if not CREWAI_AVAILABLE:
            logger.warning("CrewAI package not available. Please install with: pip install crewai")
    
    def check_crewai_availability(self) -> bool:
        """
        检查CrewAI是否可用
        
        Returns:
            bool: CrewAI是否可用
        """
        return CREWAI_AVAILABLE and is_crewai_ready()
    
    def create_crew_agent(self, agent: Agent) -> Optional[CrewAgent]:
        """
        从数据库Agent创建CrewAI Agent
        
        Args:
            agent: 数据库Agent实例
            
        Returns:
            Optional[CrewAgent]: CrewAI Agent实例或None
        """
        if not CREWAI_AVAILABLE:
            logger.error("CrewAI not available")
            return None
        
        if not is_crewai_ready():
            logger.error("CrewAI not properly initialized")
            return None
        
        try:
            # 构建Agent配置
            agent_config = {
                "role": agent.role or "Assistant",
                "goal": agent.goal or "Help with tasks",
                "backstory": agent.backstory or "I am an AI assistant ready to help.",
                "verbose": agent.verbose,
                "allow_delegation": agent.allow_delegation,
                "max_iter": agent.max_iterations or 10,
                "memory": agent.memory_enabled
            }
            
            # 添加LLM配置
            if agent.llm_config:
                llm_config = agent.llm_config
                if llm_config.get('model'):
                    # 这里需要根据实际的LLM配置创建LLM实例
                    # 示例使用OpenAI，实际需要根据配置动态创建
                    agent_config['llm'] = self._create_llm_instance(llm_config)
            
            # 添加工具
            if agent.tools:
                agent_config['tools'] = self._create_tools(agent.tools)
            
            # 创建CrewAI Agent
            crew_agent = CrewAgent(**agent_config)
            
            logger.info(f"Created CrewAI agent: {agent.name}")
            return crew_agent
            
        except Exception as e:
            logger.error(f"Failed to create CrewAI agent {agent.name}: {str(e)}")
            return None
    
    def create_crew_task(self, task: Task, agent: Optional[CrewAgent] = None) -> Optional[CrewTask]:
        """
        从数据库Task创建CrewAI Task
        
        Args:
            task: 数据库Task实例
            agent: 执行任务的CrewAI Agent
            
        Returns:
            Optional[CrewTask]: CrewAI Task实例或None
        """
        if not CREWAI_AVAILABLE:
            logger.error("CrewAI not available")
            return None
        
        if not is_crewai_ready():
            logger.error("CrewAI not properly initialized")
            return None
        
        try:
            # 构建Task配置
            task_config = {
                "description": task.description or "Complete the assigned task",
                "expected_output": task.expected_output or "Task completion confirmation",
                "agent": agent
            }
            
            # 添加工具（如果任务有特定工具）
            if task.tools:
                task_config['tools'] = self._create_tools(task.tools)
            
            # 添加上下文（如果有依赖任务）
            if task.dependencies:
                # 这里可以添加依赖任务的输出作为上下文
                pass
            
            # 创建CrewAI Task
            crew_task = CrewTask(**task_config)
            
            logger.info(f"Created CrewAI task: {task.name}")
            return crew_task
            
        except Exception as e:
            logger.error(f"Failed to create CrewAI task {task.name}: {str(e)}")
            return None
    
    def create_crew(self, workflow: Workflow) -> Optional[Crew]:
        """
        从Workflow创建CrewAI Crew
        
        Args:
            workflow: Workflow实例
            
        Returns:
            Optional[Crew]: CrewAI Crew实例或None
        """
        if not CREWAI_AVAILABLE:
            logger.error("CrewAI not available")
            return None
        
        if not is_crewai_ready():
            logger.error("CrewAI not properly initialized")
            return None
        
        try:
            # 获取相关的Agents和Tasks
            agents = []
            tasks = []
            
            # 从agents_config创建agents
            if workflow.agents_config:
                for agent_config in workflow.agents_config:
                    if 'id' in agent_config:
                        db_agent = self.db.query(Agent).filter(Agent.id == agent_config['id']).first()
                        if db_agent:
                            crew_agent = self.create_crew_agent(db_agent)
                            if crew_agent:
                                agents.append(crew_agent)
            
            # 从tasks_config创建tasks
            if workflow.tasks_config:
                for i, task_config in enumerate(workflow.tasks_config):
                    if 'id' in task_config:
                        db_task = self.db.query(Task).filter(Task.id == task_config['id']).first()
                        if db_task:
                            # 分配agent给task
                            assigned_agent = None
                            if i < len(agents):
                                assigned_agent = agents[i]
                            elif agents:
                                assigned_agent = agents[0]  # 默认使用第一个agent
                            
                            crew_task = self.create_crew_task(db_task, assigned_agent)
                            if crew_task:
                                tasks.append(crew_task)
            
            if not agents or not tasks:
                logger.error(f"Workflow {workflow.name} has no valid agents or tasks")
                return None
            
            # 确定执行流程
            process = Process.sequential  # 默认顺序执行
            if workflow.execution_mode.value == "parallel":
                process = Process.hierarchical
            
            # 创建Crew配置
            crew_config = {
                "agents": agents,
                "tasks": tasks,
                "process": process,
                "verbose": True,
                "memory": True
            }
            
            # 添加额外配置
            if workflow.max_execution_time:
                crew_config['max_execution_time'] = workflow.max_execution_time
            
            # 创建Crew
            crew = Crew(**crew_config)
            
            # 存储到活动crew字典
            crew_id = str(uuid.uuid4())
            self.active_crews[crew_id] = crew
            
            logger.info(f"Created CrewAI crew for workflow: {workflow.name}")
            return crew
            
        except Exception as e:
            logger.error(f"Failed to create CrewAI crew for workflow {workflow.name}: {str(e)}")
            return None
    
    async def execute_crew(self, crew: Crew, workflow_id: int, inputs: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        执行CrewAI Crew
        
        Args:
            crew: CrewAI Crew实例
            workflow_id: Workflow ID
            inputs: 输入参数
            
        Returns:
            Dict[str, Any]: 执行结果
        """
        if not CREWAI_AVAILABLE:
            return {"error": "CrewAI not available"}
        
        if not is_crewai_ready():
            return {"error": "CrewAI not properly initialized"}
        
        execution_id = str(uuid.uuid4())
        
        try:
            # 更新workflow状态
            workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
            if workflow:
                workflow.status = WorkflowStatus.RUNNING
                workflow.started_at = datetime.utcnow()
                self.db.commit()
            
            # 初始化执行状态
            self.execution_status[execution_id] = {
                "workflow_id": workflow_id,
                "status": "running",
                "started_at": datetime.utcnow().isoformat(),
                "progress": 0,
                "current_task": None,
                "results": {},
                "errors": []
            }
            
            # 在线程池中执行crew
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._execute_crew_sync,
                crew,
                execution_id,
                inputs or {}
            )
            
            # 更新执行状态
            self.execution_status[execution_id]["status"] = "completed"
            self.execution_status[execution_id]["completed_at"] = datetime.utcnow().isoformat()
            self.execution_status[execution_id]["results"] = result
            
            # 更新workflow状态
            if workflow:
                workflow.status = WorkflowStatus.COMPLETED
                workflow.completed_at = datetime.utcnow()
                workflow.execution_count += 1
                workflow.success_count += 1
                workflow.execution_result = result
                
                if workflow.started_at:
                    try:
                        # 确保started_at是datetime对象
                        if isinstance(workflow.started_at, str):
                            from datetime import datetime
                            started_at = datetime.fromisoformat(workflow.started_at.replace('Z', '+00:00'))
                        else:
                            started_at = workflow.started_at
                        
                        duration = int((workflow.completed_at - started_at).total_seconds())
                        workflow.execution_duration = duration
                        
                        # 更新平均执行时间
                        if workflow.average_execution_time:
                            workflow.average_execution_time = (
                                workflow.average_execution_time * (workflow.execution_count - 1) + duration
                            ) / workflow.execution_count
                        else:
                            workflow.average_execution_time = duration
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Failed to calculate execution duration: {e}")
                        workflow.execution_duration = None
                
                self.db.commit()
            
            logger.info(f"Crew execution completed for workflow {workflow_id}")
            return {
                "execution_id": execution_id,
                "status": "completed",
                "result": result
            }
            
        except Exception as e:
            # 更新执行状态
            self.execution_status[execution_id]["status"] = "failed"
            self.execution_status[execution_id]["completed_at"] = datetime.utcnow().isoformat()
            self.execution_status[execution_id]["errors"].append(str(e))
            
            # 更新workflow状态
            if workflow:
                workflow.status = WorkflowStatus.FAILED
                workflow.completed_at = datetime.utcnow()
                workflow.execution_count += 1
                workflow.failure_count += 1
                workflow.error_message = str(e)
                self.db.commit()
            
            logger.error(f"Crew execution failed for workflow {workflow_id}: {str(e)}")
            return {
                "execution_id": execution_id,
                "status": "failed",
                "error": str(e)
            }
    
    def _execute_crew_sync(self, crew: Crew, execution_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        同步执行crew（在线程池中运行）
        
        Args:
            crew: CrewAI Crew实例
            execution_id: 执行ID
            inputs: 输入参数
            
        Returns:
            Dict[str, Any]: 执行结果
        """
        try:
            # 执行crew
            raw_result = crew.kickoff(inputs=inputs)
            
            # 确保返回字典格式
            if isinstance(raw_result, dict):
                return raw_result
            elif isinstance(raw_result, str):
                return {
                    "status": "completed",
                    "message": raw_result,
                    "execution_id": execution_id,
                    "raw_output": raw_result
                }
            else:
                return {
                    "status": "completed",
                    "message": str(raw_result),
                    "execution_id": execution_id,
                    "raw_output": str(raw_result)
                }
        except Exception as e:
            logger.error(f"Sync crew execution failed: {str(e)}")
            raise
    
    def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """
        获取执行状态
        
        Args:
            execution_id: 执行ID
            
        Returns:
            Optional[Dict[str, Any]]: 执行状态或None
        """
        return self.execution_status.get(execution_id)
    
    def stop_execution(self, execution_id: str) -> bool:
        """
        停止执行
        
        Args:
            execution_id: 执行ID
            
        Returns:
            bool: 是否成功停止
        """
        if execution_id in self.execution_status:
            # 标记为已取消
            self.execution_status[execution_id]["status"] = "cancelled"
            self.execution_status[execution_id]["completed_at"] = datetime.utcnow().isoformat()
            
            # 更新workflow状态
            workflow_id = self.execution_status[execution_id].get("workflow_id")
            if workflow_id:
                workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
                if workflow:
                    workflow.status = WorkflowStatus.CANCELLED
                    workflow.completed_at = datetime.utcnow()
                    self.db.commit()
            
            logger.info(f"Execution {execution_id} cancelled")
            return True
        
        return False
    
    def _create_llm_instance(self, llm_config: Dict[str, Any]) -> Any:
        """
        根据配置创建LLM实例
        
        Args:
            llm_config: LLM配置
            
        Returns:
            Any: LLM实例
        """
        provider = llm_config.get('provider', settings.DEFAULT_LLM_PROVIDER).lower()
        model_name = llm_config.get('model', 'gpt-3.5-turbo')
        temperature = llm_config.get('temperature', 0.7)
        max_tokens = llm_config.get('max_tokens', 1000)
        
        try:
            if provider == 'openai' or 'gpt' in model_name.lower():
                return self._create_openai_llm(model_name, temperature, max_tokens)
            elif provider == 'deepseek':
                return self._create_deepseek_llm(model_name, temperature, max_tokens)
            elif provider == 'ollama':
                return self._create_ollama_llm(model_name, temperature, max_tokens)
            elif provider == 'anthropic':
                return self._create_anthropic_llm(model_name, temperature, max_tokens)
            else:
                logger.warning(f"Unsupported LLM provider: {provider}")
                return None
                
        except ImportError as e:
            logger.error(f"Required LLM package not installed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Failed to create LLM instance: {str(e)}")
            return None
    
    def _create_openai_llm(self, model_name: str, temperature: float, max_tokens: int) -> Any:
        """
        创建OpenAI LLM实例
        
        Args:
            model_name: 模型名称
            temperature: 温度参数
            max_tokens: 最大token数
            
        Returns:
            Any: OpenAI LLM实例
        """
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
            openai_api_key=settings.OPENAI_API_KEY
        )
    
    def _create_deepseek_llm(self, model_name: str, temperature: float, max_tokens: int) -> Any:
        """
        创建DeepSeek LLM实例
        
        Args:
            model_name: 模型名称
            temperature: 温度参数
            max_tokens: 最大token数
            
        Returns:
            Any: DeepSeek LLM实例
        """
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model_name or "deepseek-chat",
            temperature=temperature,
            max_tokens=max_tokens,
            openai_api_key=settings.DEEPSEEK_API_KEY,
            openai_api_base=settings.DEEPSEEK_BASE_URL
        )
    
    def _create_ollama_llm(self, model_name: str, temperature: float, max_tokens: int) -> Any:
        """
        创建Ollama LLM实例
        
        Args:
            model_name: 模型名称
            temperature: 温度参数
            max_tokens: 最大token数
            
        Returns:
            Any: Ollama LLM实例
        """
        from langchain_community.llms import Ollama
        return Ollama(
            model=model_name or settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=temperature,
            num_predict=max_tokens
        )
    
    def _create_anthropic_llm(self, model_name: str, temperature: float, max_tokens: int) -> Any:
        """
        创建Anthropic LLM实例
        
        Args:
            model_name: 模型名称
            temperature: 温度参数
            max_tokens: 最大token数
            
        Returns:
            Any: Anthropic LLM实例
        """
        from langchain_community.chat_models import ChatAnthropic
        return ChatAnthropic(
            model=model_name or "claude-3-sonnet-20240229",
            temperature=temperature,
            max_tokens=max_tokens,
            anthropic_api_key=settings.ANTHROPIC_API_KEY
        )
    
    def _create_tools(self, tools_config: List[Dict[str, Any]]) -> List[BaseTool]:
        """
        根据配置创建工具列表
        
        Args:
            tools_config: 工具配置列表
            
        Returns:
            List[BaseTool]: 工具列表
        """
        tools = []
        
        for tool_config in tools_config:
            tool_name = tool_config.get('name')
            tool_type = tool_config.get('type')
            
            try:
                # 根据工具类型创建相应的工具实例
                if tool_type == 'web_search' or tool_type == 'browser':
                    tool = self._create_browser_tool(tool_config)
                    if tool:
                        tools.append(tool)
                elif tool_type == 'file_read':
                    tool = self._create_file_read_tool(tool_config)
                    if tool:
                        tools.append(tool)
                elif tool_type == 'file_write':
                    tool = self._create_file_write_tool(tool_config)
                    if tool:
                        tools.append(tool)
                elif tool_type == 'calculator':
                    tool = self._create_calculator_tool(tool_config)
                    if tool:
                        tools.append(tool)
                elif tool_type == 'code_executor':
                    tool = self._create_code_executor_tool(tool_config)
                    if tool:
                        tools.append(tool)
                else:
                    logger.warning(f"Unsupported tool type: {tool_type}")
                    
            except Exception as e:
                logger.error(f"Failed to create tool {tool_name}: {str(e)}")
        
        return tools
    
    def _create_browser_tool(self, config: Dict[str, Any]) -> Optional[BaseTool]:
        """
        创建浏览器工具（网页抓取）
        
        Args:
            config: 工具配置
            
        Returns:
            Optional[BaseTool]: 浏览器工具实例或None
        """
        try:
            # 使用自定义的 BrowserTool
            return BrowserTool()
        except Exception as e:
            logger.error(f"Failed to create browser tool: {str(e)}")
            return None
    
    def _create_web_search_tool(self, config: Dict[str, Any]) -> Optional[BaseTool]:
        """
        创建网络搜索工具
        
        Args:
            config: 工具配置
            
        Returns:
            Optional[BaseTool]: 工具实例或None
        """
        try:
            from crewai_tools import SerperDevTool
            return SerperDevTool()
        except ImportError:
            logger.error("SerperDevTool not available")
            return None
    
    def _create_file_read_tool(self, config: Dict[str, Any]) -> Optional[BaseTool]:
        """
        创建文件读取工具
        
        Args:
            config: 工具配置
            
        Returns:
            Optional[BaseTool]: 工具实例或None
        """
        try:
            # 使用自定义的 FileReaderTool
            return FileReaderTool()
        except Exception as e:
            logger.error(f"Failed to create file read tool: {str(e)}")
            return None
    
    def _create_file_write_tool(self, config: Dict[str, Any]) -> Optional[BaseTool]:
        """
        创建文件写入工具
        
        Args:
            config: 工具配置
            
        Returns:
            Optional[BaseTool]: 工具实例或None
        """
        try:
            from crewai_tools import FileWriterTool
            return FileWriterTool()
        except ImportError:
            logger.error("FileWriterTool not available")
            return None
    
    def _create_calculator_tool(self, config: Dict[str, Any]) -> Optional[BaseTool]:
        """
        创建计算器工具
        
        Args:
            config: 工具配置
            
        Returns:
            Optional[BaseTool]: 工具实例或None
        """
        try:
            # 使用自定义的 CalculatorTool
            return CalculatorTool()
        except Exception as e:
            logger.error(f"Failed to create calculator tool: {str(e)}")
            return None
    
    def _create_code_executor_tool(self, config: Dict[str, Any]) -> Optional[BaseTool]:
        """
        创建代码执行工具
        
        Args:
            config: 工具配置
            
        Returns:
            Optional[BaseTool]: 工具实例或None
        """
        try:
            from crewai_tools import CodeInterpreterTool
            return CodeInterpreterTool()
        except ImportError:
            logger.error("CodeInterpreterTool not available")
            return None
    
    def get_available_tools(self) -> List[Dict[str, Any]]:
        """
        获取可用工具列表
        
        Returns:
            List[Dict[str, Any]]: 可用工具列表
        """
        tools = [
            {
                "name": "Browser",
                "type": "browser",
                "description": "Browse and extract content from web pages",
                "available": True,
                "parameters": {
                    "url": {
                        "type": "string",
                        "description": "URL to browse and extract content from"
                    }
                }
            },
            {
                "name": "Web Search",
                "type": "web_search",
                "description": "Search the web for information",
                "available": self._check_tool_availability("SerperDevTool"),
                "parameters": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    }
                }
            },
            {
                "name": "File Read",
                "type": "file_read",
                "description": "Read content from files",
                "available": True,
                "parameters": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to read"
                    }
                }
            },
            {
                "name": "File Write",
                "type": "file_write",
                "description": "Write content to files",
                "available": self._check_tool_availability("FileWriterTool"),
                "parameters": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to write"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write to the file"
                    }
                }
            },
            {
                "name": "Calculator",
                "type": "calculator",
                "description": "Perform mathematical calculations",
                "available": True,
                "parameters": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate"
                    }
                }
            },
            {
                "name": "Code Executor",
                "type": "code_executor",
                "description": "Execute code snippets",
                "available": self._check_tool_availability("CodeInterpreterTool"),
                "parameters": {
                    "code": {
                        "type": "string",
                        "description": "Code to execute"
                    },
                    "language": {
                        "type": "string",
                        "description": "Programming language"
                    }
                }
            }
        ]
        
        return tools
    
    def _check_tool_availability(self, tool_class_name: str) -> bool:
        """
        检查工具是否可用
        
        Args:
            tool_class_name: 工具类名
            
        Returns:
            bool: 工具是否可用
        """
        try:
            exec(f"from crewai_tools import {tool_class_name}")
            return True
        except ImportError:
            return False
    
    def cleanup_execution(self, execution_id: str) -> None:
        """
        清理执行资源
        
        Args:
            execution_id: 执行ID
        """
        if execution_id in self.execution_status:
            del self.execution_status[execution_id]
        
        # 清理相关的crew实例
        crews_to_remove = []
        for crew_id, crew in self.active_crews.items():
            # 这里可以添加逻辑来判断哪些crew需要清理
            pass
        
        for crew_id in crews_to_remove:
            del self.active_crews[crew_id]
    
    def get_crew_statistics(self) -> Dict[str, Any]:
        """
        获取CrewAI统计信息
        
        Returns:
            Dict[str, Any]: 统计信息
        """
        status = get_crewai_status()
        return {
            "crewai_available": CREWAI_AVAILABLE,
            "crewai_ready": is_crewai_ready(),
            "crewai_status": status,
            "active_crews": len(self.active_crews),
            "active_executions": len([s for s in self.execution_status.values() if s["status"] == "running"]),
            "total_executions": len(self.execution_status),
            "available_tools": len([t for t in self.get_available_tools() if t["available"]])
        }
    
    def __del__(self):
        """
        析构函数，清理资源
        """
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=True)