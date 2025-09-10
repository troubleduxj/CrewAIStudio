#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Crews Endpoints
Crew管理相关API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.crew import CrewCreate, CrewUpdate, CrewResponse
from app.services.crew_service import CrewService

# 创建路由器
router = APIRouter()


@router.post("/", response_model=CrewResponse, status_code=status.HTTP_201_CREATED)
async def create_crew(
    crew_data: CrewCreate,
    db: Session = Depends(get_db)
) -> CrewResponse:
    """
    创建新的Crew
    
    Args:
        crew_data: Crew创建数据
        db: 数据库会话
    
    Returns:
        CrewResponse: 创建的Crew信息
    
    Raises:
        HTTPException: 创建失败时抛出异常
    """
    try:
        crew_service = CrewService(db)
        crew = await crew_service.create_crew(crew_data)
        return crew
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create crew: {str(e)}"
        )


@router.get("/", response_model=List[CrewResponse])
async def list_crews(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[CrewResponse]:
    """
    获取Crew列表
    
    Args:
        skip: 跳过的记录数
        limit: 返回的最大记录数
        search: 搜索关键词
        status_filter: 状态过滤
        db: 数据库会话
    
    Returns:
        List[CrewResponse]: Crew列表
    """
    try:
        crew_service = CrewService(db)
        crews = await crew_service.list_crews(
            skip=skip, 
            limit=limit, 
            search=search, 
            status_filter=status_filter
        )
        return crews
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch crews: {str(e)}"
        )


@router.get("/{crew_id}", response_model=CrewResponse)
async def get_crew(
    crew_id: UUID,
    db: Session = Depends(get_db)
) -> CrewResponse:
    """
    根据ID获取Crew详情
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
    
    Returns:
        CrewResponse: Crew详情
    
    Raises:
        HTTPException: Crew不存在时抛出404异常
    """
    crew_service = CrewService(db)
    crew = await crew_service.get_crew_by_id(str(crew_id))
    
    if not crew:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )
    
    return crew


@router.put("/{crew_id}", response_model=CrewResponse)
async def update_crew(
    crew_id: UUID,
    crew_data: CrewUpdate,
    db: Session = Depends(get_db)
) -> CrewResponse:
    """
    更新Crew信息
    
    Args:
        crew_id: Crew ID
        crew_data: 更新数据
        db: 数据库会话
    
    Returns:
        CrewResponse: 更新后的Crew信息
    
    Raises:
        HTTPException: Crew不存在或更新失败时抛出异常
    """
    try:
        crew_service = CrewService(db)
        crew = await crew_service.update_crew(str(crew_id), crew_data)
        
        if not crew:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crew not found"
            )
        
        return crew
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update crew: {str(e)}"
        )


@router.delete("/{crew_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_crew(
    crew_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """
    删除Crew
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
    
    Raises:
        HTTPException: Crew不存在时抛出404异常
    """
    crew_service = CrewService(db)
    success = await crew_service.delete_crew(str(crew_id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )


@router.post("/{crew_id}/execute", response_model=dict)
async def execute_crew(
    crew_id: UUID,
    execution_input: dict,
    db: Session = Depends(get_db)
) -> dict:
    """
    执行Crew
    
    Args:
        crew_id: Crew ID
        execution_input: 执行输入数据
        db: 数据库会话
    
    Returns:
        dict: 执行结果
    
    Raises:
        HTTPException: Crew不存在或执行失败时抛出异常
    """
    try:
        crew_service = CrewService(db)
        result = await crew_service.execute_crew(str(crew_id), execution_input)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crew not found"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute crew: {str(e)}"
        )


@router.post("/{crew_id}/stop", response_model=dict)
async def stop_crew(
    crew_id: UUID,
    db: Session = Depends(get_db)
) -> dict:
    """
    停止Crew执行
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
    
    Returns:
        dict: 停止结果
    
    Raises:
        HTTPException: Crew不存在或停止失败时抛出异常
    """
    try:
        crew_service = CrewService(db)
        result = await crew_service.stop_crew(str(crew_id))
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crew not found"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop crew: {str(e)}"
        )


@router.get("/{crew_id}/status", response_model=dict)
async def get_crew_status(
    crew_id: UUID,
    db: Session = Depends(get_db)
) -> dict:
    """
    获取Crew状态
    
    Args:
        crew_id: Crew ID
        db: 数据库会话
    
    Returns:
        dict: Crew状态信息
    
    Raises:
        HTTPException: Crew不存在时抛出404异常
    """
    crew_service = CrewService(db)
    status_info = await crew_service.get_crew_status(str(crew_id))
    
    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )
    
    return status_info


@router.get("/{crew_id}/logs", response_model=List[dict])
async def get_crew_logs(
    crew_id: UUID,
    limit: int = 50,
    db: Session = Depends(get_db)
) -> List[dict]:
    """
    获取Crew执行日志
    
    Args:
        crew_id: Crew ID
        limit: 返回的最大日志数
        db: 数据库会话
    
    Returns:
        List[dict]: 执行日志列表
    
    Raises:
        HTTPException: Crew不存在时抛出404异常
    """
    crew_service = CrewService(db)
    logs = await crew_service.get_crew_logs(str(crew_id), limit)
    
    if logs is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )
    
    return logs


@router.get("/stats", response_model=dict)
async def get_crew_stats(
    db: Session = Depends(get_db)
) -> dict:
    """
    获取Crew统计信息
    
    Args:
        db: 数据库会话
    
    Returns:
        dict: 统计信息
    """
    try:
        crew_service = CrewService(db)
        stats = await crew_service.get_crew_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch crew stats: {str(e)}"
        )