#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Core Module
核心模块初始化
"""

from .config import settings, get_settings
from .database import (
    engine,
    SessionLocal,
    Base,
    metadata,
    get_db,
    init_db,
    close_db,
    create_tables,
    drop_tables
)
from .crewai_init import (
    CrewAIInitializer,
    crewai_initializer,
    init_crewai,
    get_crewai_status,
    is_crewai_ready,
    CREWAI_AVAILABLE
)

__all__ = [
    # 配置相关
    "settings",
    "get_settings",
    
    # 数据库相关
    "engine",
    "SessionLocal",
    "Base",
    "metadata",
    "get_db",
    "init_db",
    "close_db",
    "create_tables",
    "drop_tables",
    
    # CrewAI相关
    "CrewAIInitializer",
    "crewai_initializer",
    "init_crewai",
    "get_crewai_status",
    "is_crewai_ready",
    "CREWAI_AVAILABLE",
]