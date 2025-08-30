#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio API v1 Endpoints Module
API v1端点模块初始化
"""

from .agents import router as agents_router
from .tasks import router as tasks_router
from .workflows import router as workflows_router
from .health import router as health_router
from .crewai import router as crewai_router

__all__ = [
    "agents_router",
    "tasks_router", 
    "workflows_router",
    "health_router",
    "crewai_router"
]