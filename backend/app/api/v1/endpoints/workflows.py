#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Workflows Endpoints
工作流管理相关API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse
from app.services.workflow_service import WorkflowService

# 创建路由器
router = APIRouter()


@router.post("/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    db: Session = Depends(get_db)
) -> WorkflowResponse:
    """
    创建新工作流
    
    Args:
        workflow_data: 工作流创建数据
        db: 数据库会话
    
    Returns:
        WorkflowResponse: 创建的工作流信息
    """
    try:
        workflow_service = WorkflowService(db)
        workflow = workflow_service.create_workflow(workflow_data)
        return workflow
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create workflow: {str(e)}"
        )


@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[WorkflowResponse]:
    """
    获取工作流列表
    
    Args:
        skip: 跳过的记录数
        limit: 返回的最大记录数
        status_filter: 状态过滤器
        db: 数据库会话
    
    Returns:
        List[WorkflowResponse]: 工作流列表
    """
    workflow_service = WorkflowService(db)
    workflows = workflow_service.list_workflows(
        skip=skip, 
        limit=limit, 
        status=status_filter
    )
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db)
) -> WorkflowResponse:
    """
    根据ID获取工作流详情
    
    Args:
        workflow_id: 工作流ID
        db: 数据库会话
    
    Returns:
        WorkflowResponse: 工作流详情
    """
    workflow_service = WorkflowService(db)
    workflow = await workflow_service.get_workflow_by_id(workflow_id)
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: UUID,
    workflow_data: WorkflowUpdate,
    db: Session = Depends(get_db)
) -> WorkflowResponse:
    """
    更新工作流信息
    
    Args:
        workflow_id: 工作流ID
        workflow_data: 更新数据
        db: 数据库会话
    
    Returns:
        WorkflowResponse: 更新后的工作流信息
    """
    try:
        workflow_service = WorkflowService(db)
        workflow = await workflow_service.update_workflow(workflow_id, workflow_data)
        
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        return workflow
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update workflow: {str(e)}"
        )


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db)
) -> None:
    """
    删除工作流
    
    Args:
        workflow_id: 工作流ID
        db: 数据库会话
    """
    workflow_service = WorkflowService(db)
    success = await workflow_service.delete_workflow(workflow_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )


@router.post("/{workflow_id}/execute", response_model=dict)
async def execute_workflow(
    workflow_id: UUID,
    execution_params: dict = {},
    db: Session = Depends(get_db)
) -> dict:
    """
    执行工作流
    
    Args:
        workflow_id: 工作流ID
        execution_params: 执行参数
        db: 数据库会话
    
    Returns:
        dict: 执行结果
    """
    try:
        workflow_service = WorkflowService(db)
        result = await workflow_service.execute_workflow(workflow_id, execution_params)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute workflow: {str(e)}"
        )


@router.get("/{workflow_id}/status", response_model=dict)
async def get_workflow_status(
    workflow_id: UUID,
    db: Session = Depends(get_db)
) -> dict:
    """
    获取工作流执行状态
    
    Args:
        workflow_id: 工作流ID
        db: 数据库会话
    
    Returns:
        dict: 工作流状态信息
    """
    workflow_service = WorkflowService(db)
    status_info = await workflow_service.get_workflow_status(workflow_id)
    
    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return status_info


@router.post("/{workflow_id}/stop", response_model=dict)
async def stop_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db)
) -> dict:
    """
    停止工作流执行
    
    Args:
        workflow_id: 工作流ID
        db: 数据库会话
    
    Returns:
        dict: 停止操作结果
    """
    try:
        workflow_service = WorkflowService(db)
        result = await workflow_service.stop_workflow(workflow_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop workflow: {str(e)}"
        )