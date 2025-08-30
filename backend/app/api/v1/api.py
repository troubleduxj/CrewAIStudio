#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio API Router
API路由配置和管理
"""

from fastapi import APIRouter

from app.api.v1.endpoints import agents, tasks, workflows, health, crewai

# 创建API路由器
api_router = APIRouter()

# 注册各个模块的路由
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

api_router.include_router(
    agents.router,
    prefix="/agents",
    tags=["agents"]
)

api_router.include_router(
    tasks.router,
    prefix="/tasks",
    tags=["tasks"]
)

api_router.include_router(
    workflows.router,
    prefix="/workflows",
    tags=["workflows"]
)

api_router.include_router(
    crewai.router,
    prefix="/crewai",
    tags=["crewai"]
)