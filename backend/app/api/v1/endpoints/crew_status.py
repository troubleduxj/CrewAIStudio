#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Crew Status Endpoints
Crew实例状态查询相关API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging

from app.core.database import get_db
from app.services.crew_status_service import CrewStatusService

# 创建路由器
router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/crews", response_model=List[Dict[str, Any]])
async def get_all_crews(db: Session = Depends(get_db)):
    """
    获取所有Crew实例信息
    
    Args:
        db: 数据库会话
        
    Returns:
        List[Dict[str, Any]]: Crew实例列表
    """
    try:
        crew_service = CrewStatusService(db)
        crews = await crew_service.get_all_crews()
        return crews
    except Exception as e:
        logger.error(f"Failed to get crew list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get crew list: {str(e)}"
        )


@router.get("/crews/{crew_id}", response_model=Dict[str, Any])
async def get_crew_details(crew_id: str, db: Session = Depends(get_db)):
    """
    获取指定Crew的详细信息
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: Crew详细信息
    """
    try:
        crew_service = CrewStatusService(db)
        crew_details = await crew_service.get_crew_details(crew_id)
        
        if not crew_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到Crew: {crew_id}"
            )
        
        return crew_details
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取Crew详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取Crew详情失败: {str(e)}"
        )


@router.get("/crews/{crew_id}/status")
async def get_crew_status(crew_id: str, db: Session = Depends(get_db)):
    """
    获取Crew的执行状态
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: Crew执行状态
    """
    try:
        crew_service = CrewStatusService(db)
        status_info = await crew_service.get_crew_status(crew_id)
        
        if not status_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到Crew: {crew_id}"
            )
        
        return status_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取Crew状态失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取Crew状态失败: {str(e)}"
        )


@router.get("/crews/{crew_id}/agents")
async def get_crew_agents(crew_id: str, db: Session = Depends(get_db)):
    """
    获取Crew中的Agent列表
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
        
    Returns:
        List[Dict[str, Any]]: Agent列表
    """
    try:
        crew_service = CrewStatusService(db)
        agents = await crew_service.get_crew_agents(crew_id)
        
        if agents is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到Crew: {crew_id}"
            )
        
        return agents
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取Crew Agent列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取Crew Agent列表失败: {str(e)}"
        )


@router.get("/crews/{crew_id}/tasks")
async def get_crew_tasks(crew_id: str, db: Session = Depends(get_db)):
    """
    获取Crew中的Task列表
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
        
    Returns:
        List[Dict[str, Any]]: Task列表
    """
    try:
        crew_service = CrewStatusService(db)
        tasks = await crew_service.get_crew_tasks(crew_id)
        
        if tasks is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到Crew: {crew_id}"
            )
        
        return tasks
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取Crew Task列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取Crew Task列表失败: {str(e)}"
        )


@router.get("/crews/{crew_id}/logs")
async def get_crew_logs(
    crew_id: str,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    获取Crew的执行日志
    
    Args:
        crew_id: Crew ID
        limit: 返回日志条数限制
        offset: 日志偏移量
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: 日志信息
    """
    try:
        crew_service = CrewStatusService(db)
        logs = await crew_service.get_crew_logs(crew_id, limit, offset)
        
        if logs is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到Crew: {crew_id}"
            )
        
        return logs
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取Crew日志失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取Crew日志失败: {str(e)}"
        )


@router.post("/crews/{crew_id}/stop")
async def stop_crew(crew_id: str, db: Session = Depends(get_db)):
    """
    停止Crew执行
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
        
    Returns:
        Dict[str, str]: 操作结果
    """
    try:
        crew_service = CrewStatusService(db)
        result = await crew_service.stop_crew(crew_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"停止Crew失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"停止Crew失败: {str(e)}"
        )


@router.get("/stats")
async def get_crew_stats(db: Session = Depends(get_db)):
    """
    获取Crew统计信息
    
    Args:
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: 统计信息
    """
    try:
        crew_service = CrewStatusService(db)
        stats = await crew_service.get_crew_stats()
        return stats
    except Exception as e:
        logger.error(f"获取Crew统计信息失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取Crew统计信息失败: {str(e)}"
        )