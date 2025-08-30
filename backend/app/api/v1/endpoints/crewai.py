#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio CrewAI Management API
CrewAI框架管理API端点
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from loguru import logger

from app.core.crewai_init import (
    get_crewai_status,
    is_crewai_ready,
    CREWAI_AVAILABLE,
    crewai_initializer
)
from app.services.crewai_service import CrewAIService
from app.core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/status")
async def get_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取CrewAI框架状态
    
    Returns:
        Dict[str, Any]: CrewAI状态信息
    """
    try:
        status = get_crewai_status()
        crewai_service = CrewAIService(db)
        service_stats = crewai_service.get_statistics()
        
        return {
            "framework": status,
            "service": service_stats,
            "ready": is_crewai_ready()
        }
    except Exception as e:
        logger.error(f"Failed to get CrewAI status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reinitialize")
async def reinitialize() -> Dict[str, Any]:
    """
    重新初始化CrewAI框架
    
    Returns:
        Dict[str, Any]: 初始化结果
    """
    try:
        if not CREWAI_AVAILABLE:
            raise HTTPException(
                status_code=400, 
                detail="CrewAI framework is not available. Please install crewai package."
            )
        
        success = await crewai_initializer.initialize()
        
        return {
            "success": success,
            "message": "CrewAI reinitialized successfully" if success else "CrewAI reinitialization failed",
            "status": get_crewai_status()
        }
    except Exception as e:
        logger.error(f"Failed to reinitialize CrewAI: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tools")
async def get_available_tools() -> Dict[str, Any]:
    """
    获取可用的CrewAI工具列表
    
    Returns:
        Dict[str, Any]: 可用工具信息
    """
    try:
        if not is_crewai_ready():
            raise HTTPException(
                status_code=400,
                detail="CrewAI framework is not ready"
            )
        
        status = get_crewai_status()
        
        return {
            "available_tools": status.get('available_tools', []),
            "api_keys_configured": status.get('api_keys_configured', {}),
            "ready": is_crewai_ready()
        }
    except Exception as e:
        logger.error(f"Failed to get CrewAI tools: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    CrewAI健康检查
    
    Returns:
        Dict[str, Any]: 健康状态
    """
    try:
        status = get_crewai_status()
        ready = is_crewai_ready()
        
        health_status = "healthy" if ready else "unhealthy"
        
        return {
            "status": health_status,
            "available": status.get('available', False),
            "initialized": status.get('initialized', False),
            "ready": ready,
            "details": status
        }
    except Exception as e:
        logger.error(f"CrewAI health check failed: {e}")
        return {
            "status": "error",
            "available": False,
            "initialized": False,
            "ready": False,
            "error": str(e)
        }


@router.get("/config")
async def get_configuration() -> Dict[str, Any]:
    """
    获取CrewAI配置信息
    
    Returns:
        Dict[str, Any]: 配置信息
    """
    try:
        status = get_crewai_status()
        
        # 隐藏敏感信息
        api_keys_status = {}
        for key, configured in status.get('api_keys_configured', {}).items():
            api_keys_status[key] = {
                'configured': configured,
                'masked_value': '***configured***' if configured else 'not_configured'
            }
        
        return {
            "framework_available": status.get('available', False),
            "framework_initialized": status.get('initialized', False),
            "api_keys": api_keys_status,
            "available_tools": status.get('available_tools', []),
            "ready": is_crewai_ready()
        }
    except Exception as e:
        logger.error(f"Failed to get CrewAI configuration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_statistics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取CrewAI使用统计
    
    Returns:
        Dict[str, Any]: 统计信息
    """
    try:
        crewai_service = CrewAIService(db)
        return crewai_service.get_statistics()
    except Exception as e:
        logger.error(f"Failed to get CrewAI statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 导出路由
__all__ = ['router']