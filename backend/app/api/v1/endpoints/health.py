#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Health Check Endpoints
健康检查相关API端点
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any

from app.core.database import get_db
from app.core.config import get_settings, Settings

# 创建路由器
router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def health_check(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
) -> Dict[str, Any]:
    """
    基础健康检查
    检查API服务状态
    
    Args:
        db: 数据库会话
        settings: 应用配置
    
    Returns:
        Dict[str, Any]: 健康状态信息
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


@router.get("/detailed", response_model=Dict[str, Any])
async def detailed_health_check(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
) -> Dict[str, Any]:
    """
    详细健康检查
    检查各个组件的状态
    
    Args:
        db: 数据库会话
        settings: 应用配置
    
    Returns:
        Dict[str, Any]: 详细健康状态信息
    """
    
    # 检查数据库连接
    db_status = "healthy"
    try:
        # 执行简单查询测试数据库连接
        db.execute("SELECT 1")
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # 检查CrewAI配置
    crewai_status = "configured" if settings.CREWAI_API_KEY else "not_configured"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "components": {
            "database": db_status,
            "crewai": crewai_status,
            "api": "healthy"
        },
        "environment": {
            "debug": settings.DEBUG,
            "host": settings.HOST,
            "port": settings.PORT
        }
    }


@router.get("/readiness", response_model=Dict[str, Any])
async def readiness_check(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    就绪状态检查
    用于Kubernetes等容器编排系统
    
    Args:
        db: 数据库会话
    
    Returns:
        Dict[str, Any]: 就绪状态信息
    """
    
    try:
        # 检查数据库连接
        db.execute("SELECT 1")
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }


@router.get("/liveness", response_model=Dict[str, Any])
async def liveness_check() -> Dict[str, Any]:
    """
    存活状态检查
    用于Kubernetes等容器编排系统
    
    Returns:
        Dict[str, Any]: 存活状态信息
    """
    
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }