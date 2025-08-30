#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Agents Endpoints
AI代理管理相关API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.services.agent_service import AgentService

# 创建路由器
router = APIRouter()


@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db)
) -> AgentResponse:
    """
    创建新的AI代理
    
    Args:
        agent_data: 代理创建数据
        db: 数据库会话
    
    Returns:
        AgentResponse: 创建的代理信息
    
    Raises:
        HTTPException: 创建失败时抛出异常
    """
    try:
        agent_service = AgentService(db)
        agent = agent_service.create_agent(agent_data)
        return agent
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create agent: {str(e)}"
        )


@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[AgentResponse]:
    """
    获取代理列表
    
    Args:
        skip: 跳过的记录数
        limit: 返回的最大记录数
        db: 数据库会话
    
    Returns:
        List[AgentResponse]: 代理列表
    """
    agent_service = AgentService(db)
    agents = agent_service.list_agents(skip=skip, limit=limit)
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: UUID,
    db: Session = Depends(get_db)
) -> AgentResponse:
    """
    根据ID获取代理详情
    
    Args:
        agent_id: 代理ID
        db: 数据库会话
    
    Returns:
        AgentResponse: 代理详情
    
    Raises:
        HTTPException: 代理不存在时抛出404异常
    """
    agent_service = AgentService(db)
    agent = await agent_service.get_agent_by_id(agent_id)
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: UUID,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db)
) -> AgentResponse:
    """
    更新代理信息
    
    Args:
        agent_id: 代理ID
        agent_data: 更新数据
        db: 数据库会话
    
    Returns:
        AgentResponse: 更新后的代理信息
    
    Raises:
        HTTPException: 代理不存在或更新失败时抛出异常
    """
    try:
        agent_service = AgentService(db)
        agent = await agent_service.update_agent(agent_id, agent_data)
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
        
        return agent
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update agent: {str(e)}"
        )


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """
    删除代理
    
    Args:
        agent_id: 代理ID
        db: 数据库会话
    
    Raises:
        HTTPException: 代理不存在时抛出404异常
    """
    agent_service = AgentService(db)
    success = await agent_service.delete_agent(agent_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )


@router.post("/{agent_id}/execute", response_model=dict)
async def execute_agent(
    agent_id: UUID,
    task_input: dict,
    db: Session = Depends(get_db)
) -> dict:
    """
    执行代理任务
    
    Args:
        agent_id: 代理ID
        task_input: 任务输入数据
        db: 数据库会话
    
    Returns:
        dict: 执行结果
    
    Raises:
        HTTPException: 代理不存在或执行失败时抛出异常
    """
    try:
        agent_service = AgentService(db)
        result = await agent_service.execute_agent(agent_id, task_input)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute agent: {str(e)}"
        )


@router.get("/{agent_id}/status", response_model=dict)
async def get_agent_status(
    agent_id: UUID,
    db: Session = Depends(get_db)
) -> dict:
    """
    获取代理状态
    
    Args:
        agent_id: 代理ID
        db: 数据库会话
    
    Returns:
        dict: 代理状态信息
    
    Raises:
        HTTPException: 代理不存在时抛出404异常
    """
    agent_service = AgentService(db)
    status_info = await agent_service.get_agent_status(agent_id)
    
    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return status_info