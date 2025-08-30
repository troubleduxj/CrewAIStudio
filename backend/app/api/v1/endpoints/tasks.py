#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Tasks Endpoints
任务管理相关API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.task_service import TaskService

# 创建路由器
router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db)
) -> TaskResponse:
    """
    创建新任务
    
    Args:
        task_data: 任务创建数据
        db: 数据库会话
    
    Returns:
        TaskResponse: 创建的任务信息
    """
    try:
        task_service = TaskService(db)
        task = task_service.create_task(task_data)
        return task
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create task: {str(e)}"
        )


@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[TaskResponse]:
    """
    获取任务列表
    
    Args:
        skip: 跳过的记录数
        limit: 返回的最大记录数
        status_filter: 状态过滤器
        db: 数据库会话
    
    Returns:
        List[TaskResponse]: 任务列表
    """
    task_service = TaskService(db)
    tasks = task_service.list_tasks(
        skip=skip, 
        limit=limit, 
        status=status_filter
    )
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: Session = Depends(get_db)
) -> TaskResponse:
    """
    根据ID获取任务详情
    
    Args:
        task_id: 任务ID
        db: 数据库会话
    
    Returns:
        TaskResponse: 任务详情
    """
    task_service = TaskService(db)
    task = await task_service.get_task_by_id(task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: Session = Depends(get_db)
) -> TaskResponse:
    """
    更新任务信息
    
    Args:
        task_id: 任务ID
        task_data: 更新数据
        db: 数据库会话
    
    Returns:
        TaskResponse: 更新后的任务信息
    """
    try:
        task_service = TaskService(db)
        task = await task_service.update_task(task_id, task_data)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return task
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update task: {str(e)}"
        )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """
    删除任务
    
    Args:
        task_id: 任务ID
        db: 数据库会话
    """
    task_service = TaskService(db)
    success = await task_service.delete_task(task_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )


@router.post("/{task_id}/execute", response_model=dict)
async def execute_task(
    task_id: UUID,
    execution_params: dict = {},
    db: Session = Depends(get_db)
) -> dict:
    """
    执行任务
    
    Args:
        task_id: 任务ID
        execution_params: 执行参数
        db: 数据库会话
    
    Returns:
        dict: 执行结果
    """
    try:
        task_service = TaskService(db)
        result = await task_service.execute_task(task_id, execution_params)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute task: {str(e)}"
        )