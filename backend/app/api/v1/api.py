#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio API Router
API路由配置和管理
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    agents,
    tasks,
    workflows,
    health,
    crewai,
    research,
    llm,
    interactive_session,
    crew_status,
    crews,
    stats,
    tools,
    workflow_templates,
)
from app.api.v1 import executions

# 创建API路由器
api_router = APIRouter()

# 注册各个模块的路由
api_router.include_router(health.router, prefix="/health", tags=["health"])

api_router.include_router(agents.router, prefix="/agents", tags=["agents"])

api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])

api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])

api_router.include_router(crewai.router, prefix="/crewai", tags=["crewai"])

api_router.include_router(research.router, prefix="/research", tags=["research"])

api_router.include_router(executions.router, prefix="/executions", tags=["executions"])

api_router.include_router(llm.router, prefix="/llm", tags=["llm"])

api_router.include_router(
    crew_status.router, prefix="/crew-status", tags=["crew-status"]
)

api_router.include_router(crews.router, prefix="/crews", tags=["crews"])

api_router.include_router(stats.router, prefix="/stats", tags=["stats"])

api_router.include_router(tools.router, prefix="/tools", tags=["tools"])

api_router.include_router(
    workflow_templates.router,
    prefix="/workflow-templates",
    tags=["Workflow Templates"],
)

api_router.include_router(
    interactive_session.router,
    prefix="/interactive-session",
    tags=["Interactive Session"],
)
