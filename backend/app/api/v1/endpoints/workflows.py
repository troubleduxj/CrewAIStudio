#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Workflows Endpoints
工作流管理相关API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # 记录接收到的数据
        logger.info(f"Received workflow data: {workflow_data.model_dump()}")
        
        workflow_service = WorkflowService(db)
        workflow = workflow_service.create_workflow(workflow_data)
        
        logger.info(f"Successfully created workflow with ID: {workflow.id}")
        return workflow
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Failed to create workflow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create workflow: {str(e)}"
        )


@router.get("/check-name/{workflow_name}", response_model=dict)
async def check_workflow_name(
    workflow_name: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    检查工作流名称是否已存在
    
    Args:
        workflow_name: 工作流名称
        db: 数据库会话
    
    Returns:
        dict: 包含exists字段的响应
    """
    workflow_service = WorkflowService(db)
    existing_workflow = workflow_service.get_workflow_by_name(workflow_name)
    
    return {
        "exists": existing_workflow is not None,
        "workflow_id": existing_workflow.id if existing_workflow else None
    }


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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        from app.models.workflow import WorkflowStatus
        
        # 转换字符串状态为枚举
        status_enum = None
        if status_filter:
            try:
                status_enum = WorkflowStatus(status_filter)
            except ValueError:
                # 如果状态值无效，忽略过滤
                status_enum = None
        
        workflow_service = WorkflowService(db)
        workflows = workflow_service.list_workflows(
            skip=skip, 
            limit=limit, 
            status=status_enum
        )
        logger.info(f"Successfully retrieved {len(workflows)} workflows")
        return workflows
    except Exception as e:
        logger.error(f"Error in list_workflows: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve workflows: {str(e)}"
        )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
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
    workflow = workflow_service.get_workflow(workflow_id)
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
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
        workflow = workflow_service.update_workflow(workflow_id, workflow_data)
        
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
    workflow_id: int,
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
    workflow_id: int,
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
        
        # 调用WorkflowService执行工作流
        execution_id = await workflow_service.execute_workflow(
            workflow_id=workflow_id,
            inputs=execution_params
        )
        
        return {
            "execution_id": execution_id,
            "workflow_id": str(workflow_id),
            "status": "running",
            "message": "Workflow execution started successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid workflow execution request: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute workflow: {str(e)}"
        )


@router.get("/execution/{execution_id}/status", response_model=dict)
async def get_workflow_status(
    execution_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    获取工作流执行状态
    
    Args:
        execution_id: 执行ID
        db: 数据库会话
    
    Returns:
        dict: 工作流状态信息
    """
    workflow_service = WorkflowService(db)
    status_info = workflow_service.get_workflow_status(execution_id)
    
    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution {execution_id} not found"
        )
    
    return status_info


@router.post("/execution/{execution_id}/stop", response_model=dict)
async def stop_workflow(
    execution_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    停止工作流执行
    
    Args:
        execution_id: 执行ID
        db: 数据库会话
    
    Returns:
        dict: 停止操作结果
    """
    try:
        workflow_service = WorkflowService(db)
        success = workflow_service.stop_workflow(execution_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to stop execution {execution_id}. It may not be running or may not exist."
            )
        
        return {
            "execution_id": execution_id,
            "status": "stopped",
            "message": "Workflow execution stopped successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop workflow execution: {str(e)}"
        )