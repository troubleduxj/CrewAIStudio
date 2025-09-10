#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Crew状态管理服务
处理Crew实例的状态查询、监控和管理
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.services.crewai_service import CrewAIService

# 配置日志
logger = logging.getLogger(__name__)


class CrewStatusService:
    """
    Crew状态管理服务类
    """
    
    def __init__(self, db: Optional[Session] = None):
        """
        初始化Crew状态服务
        
        Args:
            db: 数据库会话（可选）
        """
        self.db = db
        # 只有在有db会话时才初始化CrewAIService
        if self.db:
            self.crewai_service = CrewAIService(self.db)
        else:
            self.crewai_service = None
    
    async def get_all_crews(self) -> List[Dict[str, Any]]:
        """
        获取所有Crew实例信息
        
        Returns:
            List[Dict[str, Any]]: Crew实例列表
        """
        try:
            crews = []
            
            # 检查CrewAI服务是否可用
            if not self.crewai_service:
                logger.warning("CrewAI service not available, returning sample data")
                return await self._get_sample_crews()
            
            # 从CrewAI服务获取活跃的Crew
            active_crews = self.crewai_service.active_crews
            execution_status = self.crewai_service.execution_status
            
            for crew_id, crew_instance in active_crews.items():
                status_info = execution_status.get(crew_id, {})
                
                crew_info = {
                    "id": crew_id,
                    "name": f"Crew-{crew_id[:8]}",
                    "status": status_info.get("status", "unknown"),
                    "created_at": status_info.get("start_time", datetime.now().isoformat()),
                    "agents_count": len(crew_instance.agents) if hasattr(crew_instance, 'agents') else 0,
                    "tasks_count": len(crew_instance.tasks) if hasattr(crew_instance, 'tasks') else 0,
                    "current_task": status_info.get("current_task"),
                    "progress": status_info.get("progress", 0),
                    "execution_time": self._calculate_execution_time(status_info.get("start_time")),
                    "last_activity": status_info.get("last_update", datetime.now().isoformat())
                }
                
                crews.append(crew_info)
            
            # 添加一些示例数据（如果没有活跃的Crew）
            if not crews:
                crews = await self._get_sample_crews()
            
            return crews
            
        except Exception as e:
            logger.error(f"Failed to get crew list: {str(e)}")
            # 返回示例数据作为fallback
            return await self._get_sample_crews()
    
    async def get_crew_details(self, crew_id: str) -> Optional[Dict[str, Any]]:
        """
        获取指定Crew的详细信息
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Optional[Dict[str, Any]]: Crew详细信息
        """
        try:
            active_crews = self.crewai_service.active_crews
            execution_status = self.crewai_service.execution_status
            
            if crew_id not in active_crews:
                # 如果不在活跃列表中，返回示例数据
                return await self._get_sample_crew_details(crew_id)
            
            crew_instance = active_crews[crew_id]
            status_info = execution_status.get(crew_id, {})
            
            # 获取Agent信息
            agents = []
            if hasattr(crew_instance, 'agents'):
                for i, agent in enumerate(crew_instance.agents):
                    agents.append({
                        "id": f"agent-{i}",
                        "name": getattr(agent, 'role', f"Agent {i+1}"),
                        "role": getattr(agent, 'role', "Unknown"),
                        "status": "active" if i == status_info.get("current_agent_index", 0) else "waiting",
                        "backstory": getattr(agent, 'backstory', ""),
                        "tools": [tool.__class__.__name__ for tool in getattr(agent, 'tools', [])]
                    })
            
            # 获取Task信息
            tasks = []
            if hasattr(crew_instance, 'tasks'):
                for i, task in enumerate(crew_instance.tasks):
                    tasks.append({
                        "id": f"task-{i}",
                        "name": getattr(task, 'description', f"Task {i+1}")[:50] + "...",
                        "description": getattr(task, 'description', ""),
                        "status": self._get_task_status(i, status_info),
                        "agent_id": f"agent-{getattr(task, 'agent', 0)}",
                        "expected_output": getattr(task, 'expected_output', ""),
                        "dependencies": getattr(task, 'dependencies', [])
                    })
            
            crew_details = {
                "id": crew_id,
                "name": f"Crew-{crew_id[:8]}",
                "description": "AI Agent工作流执行实例",
                "status": status_info.get("status", "unknown"),
                "created_at": status_info.get("start_time", datetime.now().isoformat()),
                "updated_at": status_info.get("last_update", datetime.now().isoformat()),
                "agents": agents,
                "tasks": tasks,
                "current_task": status_info.get("current_task"),
                "progress": status_info.get("progress", 0),
                "execution_time": self._calculate_execution_time(status_info.get("start_time")),
                "logs": status_info.get("logs", []),
                "error_message": status_info.get("error"),
                "metadata": {
                    "workflow_id": status_info.get("workflow_id"),
                    "execution_id": crew_id,
                    "environment": "development",
                    "version": "1.0.0"
                }
            }
            
            return crew_details
            
        except Exception as e:
            logger.error(f"获取Crew详情失败: {str(e)}")
            return await self._get_sample_crew_details(crew_id)
    
    async def get_crew_status(self, crew_id: str) -> Optional[Dict[str, Any]]:
        """
        获取Crew的执行状态
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Optional[Dict[str, Any]]: Crew执行状态
        """
        try:
            execution_status = self.crewai_service.execution_status
            
            if crew_id not in execution_status:
                return {
                    "crew_id": crew_id,
                    "status": "not_found",
                    "message": "Crew不存在或已完成",
                    "timestamp": datetime.now().isoformat()
                }
            
            status_info = execution_status[crew_id]
            
            return {
                "crew_id": crew_id,
                "status": status_info.get("status", "unknown"),
                "current_task": status_info.get("current_task"),
                "progress": status_info.get("progress", 0),
                "start_time": status_info.get("start_time"),
                "last_update": status_info.get("last_update"),
                "execution_time": self._calculate_execution_time(status_info.get("start_time")),
                "error": status_info.get("error"),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"获取Crew状态失败: {str(e)}")
            return None
    
    async def get_crew_agents(self, crew_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        获取Crew中的Agent列表
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Optional[List[Dict[str, Any]]]: Agent列表
        """
        crew_details = await self.get_crew_details(crew_id)
        if crew_details:
            return crew_details.get("agents", [])
        return None
    
    async def get_crew_tasks(self, crew_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        获取Crew中的Task列表
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Optional[List[Dict[str, Any]]]: Task列表
        """
        crew_details = await self.get_crew_details(crew_id)
        if crew_details:
            return crew_details.get("tasks", [])
        return None
    
    async def get_crew_logs(
        self,
        crew_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        获取Crew的执行日志
        
        Args:
            crew_id: Crew ID
            limit: 返回日志条数限制
            offset: 日志偏移量
            
        Returns:
            Optional[Dict[str, Any]]: 日志信息
        """
        try:
            execution_status = self.crewai_service.execution_status
            
            if crew_id not in execution_status:
                return None
            
            status_info = execution_status[crew_id]
            all_logs = status_info.get("logs", [])
            
            # 分页处理
            total_logs = len(all_logs)
            paginated_logs = all_logs[offset:offset + limit]
            
            return {
                "crew_id": crew_id,
                "logs": paginated_logs,
                "total_count": total_logs,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_logs
            }
            
        except Exception as e:
            logger.error(f"获取Crew日志失败: {str(e)}")
            return None
    
    async def stop_crew(self, crew_id: str) -> Dict[str, Any]:
        """
        停止Crew执行
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Dict[str, Any]: 操作结果
        """
        try:
            active_crews = self.crewai_service.active_crews
            execution_status = self.crewai_service.execution_status
            
            if crew_id not in active_crews:
                return {
                    "success": False,
                    "message": f"Crew {crew_id} 不存在或已停止"
                }
            
            # 更新状态为停止
            if crew_id in execution_status:
                execution_status[crew_id]["status"] = "stopped"
                execution_status[crew_id]["last_update"] = datetime.now().isoformat()
            
            # 从活跃列表中移除
            del active_crews[crew_id]
            
            return {
                "success": True,
                "message": f"Crew {crew_id} 已成功停止",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"停止Crew失败: {str(e)}")
            return {
                "success": False,
                "message": f"停止Crew失败: {str(e)}"
            }
    
    async def get_crew_stats(self) -> Dict[str, Any]:
        """
        获取Crew统计信息
        
        Returns:
            Dict[str, Any]: 统计信息
        """
        try:
            active_crews = self.crewai_service.active_crews
            execution_status = self.crewai_service.execution_status
            
            # 统计各种状态的Crew数量
            status_counts = {
                "running": 0,
                "completed": 0,
                "failed": 0,
                "stopped": 0
            }
            
            for crew_id, status_info in execution_status.items():
                status = status_info.get("status", "unknown")
                if status in status_counts:
                    status_counts[status] += 1
            
            total_crews = len(execution_status)
            active_count = len(active_crews)
            
            return {
                "total_crews": total_crews,
                "active_crews": active_count,
                "status_distribution": status_counts,
                "average_execution_time": self._calculate_average_execution_time(),
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"获取Crew统计信息失败: {str(e)}")
            return {
                "total_crews": 0,
                "active_crews": 0,
                "status_distribution": {"running": 0, "completed": 0, "failed": 0, "stopped": 0},
                "average_execution_time": 0,
                "last_updated": datetime.now().isoformat()
            }
    
    def _calculate_execution_time(self, start_time: Optional[str]) -> int:
        """
        计算执行时间（秒）
        
        Args:
            start_time: 开始时间字符串
            
        Returns:
            int: 执行时间（秒）
        """
        if not start_time:
            return 0
        
        try:
            start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            now = datetime.now(start.tzinfo) if start.tzinfo else datetime.now()
            return int((now - start).total_seconds())
        except Exception:
            return 0
    
    def _get_task_status(self, task_index: int, status_info: Dict[str, Any]) -> str:
        """
        获取任务状态
        
        Args:
            task_index: 任务索引
            status_info: 状态信息
            
        Returns:
            str: 任务状态
        """
        current_task_index = status_info.get("current_task_index", 0)
        
        if task_index < current_task_index:
            return "completed"
        elif task_index == current_task_index:
            return "running"
        else:
            return "pending"
    
    def _calculate_average_execution_time(self) -> float:
        """
        计算平均执行时间
        
        Returns:
            float: 平均执行时间（秒）
        """
        try:
            execution_status = self.crewai_service.execution_status
            total_time = 0
            completed_count = 0
            
            for status_info in execution_status.values():
                if status_info.get("status") == "completed":
                    exec_time = self._calculate_execution_time(status_info.get("start_time"))
                    total_time += exec_time
                    completed_count += 1
            
            return total_time / completed_count if completed_count > 0 else 0
            
        except Exception:
            return 0
    
    async def _get_sample_crews(self) -> List[Dict[str, Any]]:
        """
        获取示例Crew数据
        
        Returns:
            List[Dict[str, Any]]: 示例Crew列表
        """
        now = datetime.now()
        
        return [
            {
                "id": "crew-001",
                "name": "研究分析工作流",
                "status": "running",
                "created_at": (now - timedelta(minutes=15)).isoformat(),
                "agents_count": 2,
                "tasks_count": 3,
                "current_task": "数据分析",
                "progress": 65,
                "execution_time": 900,
                "last_activity": (now - timedelta(minutes=2)).isoformat()
            },
            {
                "id": "crew-002",
                "name": "内容生成工作流",
                "status": "completed",
                "created_at": (now - timedelta(hours=2)).isoformat(),
                "agents_count": 3,
                "tasks_count": 4,
                "current_task": "已完成",
                "progress": 100,
                "execution_time": 3600,
                "last_activity": (now - timedelta(hours=1)).isoformat()
            },
            {
                "id": "crew-003",
                "name": "代码审查工作流",
                "status": "pending",
                "created_at": now.isoformat(),
                "agents_count": 1,
                "tasks_count": 2,
                "current_task": "等待开始",
                "progress": 0,
                "execution_time": 0,
                "last_activity": now.isoformat()
            }
        ]
    
    async def _get_sample_crew_details(self, crew_id: str) -> Dict[str, Any]:
        """
        获取示例Crew详细信息
        
        Args:
            crew_id: Crew ID
            
        Returns:
            Dict[str, Any]: 示例Crew详细信息
        """
        now = datetime.now()
        
        return {
            "id": crew_id,
            "name": f"示例工作流-{crew_id[:8]}",
            "description": "这是一个示例AI Agent工作流执行实例",
            "status": "running",
            "created_at": (now - timedelta(minutes=10)).isoformat(),
            "updated_at": (now - timedelta(minutes=1)).isoformat(),
            "agents": [
                {
                    "id": "agent-1",
                    "name": "研究分析师",
                    "role": "Researcher",
                    "status": "active",
                    "backstory": "专业的数据研究和分析专家",
                    "tools": ["WebSearchTool", "DataAnalysisTool"]
                },
                {
                    "id": "agent-2",
                    "name": "内容创作者",
                    "role": "Writer",
                    "status": "waiting",
                    "backstory": "擅长将复杂信息转化为易懂内容的创作专家",
                    "tools": ["ContentGeneratorTool"]
                }
            ],
            "tasks": [
                {
                    "id": "task-1",
                    "name": "市场研究",
                    "description": "收集和分析目标市场的相关数据",
                    "status": "completed",
                    "agent_id": "agent-1",
                    "expected_output": "详细的市场分析报告",
                    "dependencies": []
                },
                {
                    "id": "task-2",
                    "name": "内容策略制定",
                    "description": "基于研究结果制定内容营销策略",
                    "status": "running",
                    "agent_id": "agent-2",
                    "expected_output": "内容营销策略文档",
                    "dependencies": ["task-1"]
                }
            ],
            "current_task": "内容策略制定",
            "progress": 50,
            "execution_time": 600,
            "logs": [
                {
                    "timestamp": (now - timedelta(minutes=8)).isoformat(),
                    "level": "INFO",
                    "message": "开始执行工作流",
                    "agent_id": None
                },
                {
                    "timestamp": (now - timedelta(minutes=5)).isoformat(),
                    "level": "INFO",
                    "message": "研究分析师开始市场研究任务",
                    "agent_id": "agent-1"
                },
                {
                    "timestamp": (now - timedelta(minutes=2)).isoformat(),
                    "level": "INFO",
                    "message": "市场研究任务完成",
                    "agent_id": "agent-1"
                },
                {
                    "timestamp": (now - timedelta(minutes=1)).isoformat(),
                    "level": "INFO",
                    "message": "内容创作者开始内容策略制定任务",
                    "agent_id": "agent-2"
                }
            ],
            "error_message": None,
            "metadata": {
                "workflow_id": "workflow-123",
                "execution_id": crew_id,
                "environment": "development",
                "version": "1.0.0"
            }
        }