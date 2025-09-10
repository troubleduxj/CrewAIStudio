#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Executions API
执行记录相关的API端点
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime

from ...core.database import get_db
from ...services.execution_service import ExecutionService, get_execution_service
from ...schemas.execution import (
    ExecutionCreate, ExecutionUpdate, ExecutionResponse, ExecutionListResponse,
    ExecutionLogRequest, ExecutionProgressUpdate, ExecutionStatsResponse,
    ExecutionFilterParams, ExecutionActionRequest, ExecutionActionResponse,
    ExecutionType, ExecutionStatus, ExecutionPriority
)
from ...utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/executions", tags=["executions"])


@router.post("/", response_model=ExecutionResponse, summary="创建执行记录")
def create_execution(
    execution_data: ExecutionCreate,
    db: Session = Depends(get_db)
):
    """
    创建新的执行记录
    
    Args:
        execution_data: 执行记录创建数据
        db: 数据库会话
        
    Returns:
        ExecutionResponse: 创建的执行记录
    """
    try:
        execution_service = get_execution_service(db)
        return execution_service.create_execution(execution_data)
    except Exception as e:
        logger.error(f"Failed to create execution: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=ExecutionListResponse, summary="获取执行记录列表")
def get_executions(
    execution_type: Optional[ExecutionType] = Query(None, description="执行类型"),
    status: Optional[ExecutionStatus] = Query(None, description="执行状态"),
    priority: Optional[ExecutionPriority] = Query(None, description="执行优先级"),
    entity_id: Optional[int] = Query(None, description="关联实体ID"),
    user_id: Optional[str] = Query(None, description="执行用户ID"),
    parent_execution_id: Optional[str] = Query(None, description="父执行ID"),
    created_after: Optional[datetime] = Query(None, description="创建时间之后"),
    created_before: Optional[datetime] = Query(None, description="创建时间之前"),
    started_after: Optional[datetime] = Query(None, description="开始时间之后"),
    started_before: Optional[datetime] = Query(None, description="开始时间之前"),
    completed_after: Optional[datetime] = Query(None, description="完成时间之后"),
    completed_before: Optional[datetime] = Query(None, description="完成时间之前"),
    min_execution_time: Optional[float] = Query(None, description="最小执行时间"),
    max_execution_time: Optional[float] = Query(None, description="最大执行时间"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页大小"),
    sort_by: Optional[str] = Query("created_at", description="排序字段"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="排序顺序"),
    db: Session = Depends(get_db)
):
    """
    根据过滤条件获取执行记录列表
    
    Args:
        execution_type: 执行类型过滤
        status: 执行状态过滤
        priority: 执行优先级过滤
        entity_id: 关联实体ID过滤
        user_id: 执行用户ID过滤
        parent_execution_id: 父执行ID过滤
        created_after: 创建时间之后过滤
        created_before: 创建时间之前过滤
        started_after: 开始时间之后过滤
        started_before: 开始时间之前过滤
        completed_after: 完成时间之后过滤
        completed_before: 完成时间之前过滤
        min_execution_time: 最小执行时间过滤
        max_execution_time: 最大执行时间过滤
        search: 搜索关键词
        page: 页码
        size: 每页大小
        sort_by: 排序字段
        sort_order: 排序顺序
        db: 数据库会话
        
    Returns:
        ExecutionListResponse: 执行记录列表响应
    """
    try:
        filters = ExecutionFilterParams(
            execution_type=execution_type,
            status=status,
            priority=priority,
            entity_id=entity_id,
            user_id=user_id,
            parent_execution_id=parent_execution_id,
            created_after=created_after,
            created_before=created_before,
            started_after=started_after,
            started_before=started_before,
            completed_after=completed_after,
            completed_before=completed_before,
            min_execution_time=min_execution_time,
            max_execution_time=max_execution_time,
            search=search,
            page=page,
            size=size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        execution_service = get_execution_service(db)
        return execution_service.get_executions(filters)
    except Exception as e:
        logger.error(f"Failed to get executions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=ExecutionStatsResponse, summary="获取执行统计信息")
def get_execution_stats(
    db: Session = Depends(get_db)
):
    """
    获取执行统计信息
    
    Args:
        db: 数据库会话
        
    Returns:
        ExecutionStatsResponse: 执行统计响应
    """
    try:
        execution_service = get_execution_service(db)
        return execution_service.get_execution_stats()
    except Exception as e:
        logger.error(f"Failed to get execution stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runtime-stats", summary="获取运行时执行统计")
def get_runtime_execution_stats():
    """
    获取运行时执行统计信息（来自ExecutionService内存）
    
    Returns:
        Dict[str, Any]: 运行时统计信息
    """
    try:
        execution_service = ExecutionService()
        return execution_service.get_execution_statistics()
    except Exception as e:
        logger.error(f"Failed to get runtime execution stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{execution_id}", response_model=ExecutionResponse, summary="获取执行记录详情")
def get_execution(
    execution_id: str = Path(..., description="执行记录ID"),
    db: Session = Depends(get_db)
):
    """
    根据ID获取执行记录详情
    
    Args:
        execution_id: 执行记录ID
        db: 数据库会话
        
    Returns:
        ExecutionResponse: 执行记录详情
    """
    try:
        execution_service = get_execution_service(db)
        execution = execution_service.get_execution(execution_id)
        
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return execution
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get execution {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{execution_id}/status", summary="获取执行状态")
def get_execution_status(
    execution_id: str = Path(..., description="执行记录ID"),
    db: Session = Depends(get_db)
):
    """
    获取执行状态（包含运行时状态）
    
    Args:
        execution_id: 执行记录ID
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: 执行状态信息
    """
    try:
        # 首先尝试从运行时获取状态
        execution_service_runtime = ExecutionService()
        runtime_status = execution_service_runtime.get_execution_status(execution_id)
        
        if runtime_status:
            return {
                "source": "runtime",
                "execution_id": execution_id,
                **runtime_status
            }
        
        # 如果运行时没有，从数据库获取
        execution_service = get_execution_service(db)
        execution = execution_service.get_execution(execution_id)
        
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return {
            "source": "database",
            "execution_id": execution_id,
            "status": execution.status,
            "progress": execution.progress,
            "current_step": execution.current_step,
            "started_at": execution.started_at,
            "completed_at": execution.completed_at,
            "execution_time": execution.execution_time,
            "error_message": execution.error_message,
            "is_running": execution.is_running,
            "is_completed": execution.is_completed,
            "is_successful": execution.is_successful
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get execution status {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{execution_id}/logs", summary="获取执行日志")
def get_execution_logs(
    execution_id: str = Path(..., description="执行记录ID"),
    level: Optional[str] = Query(None, description="日志级别过滤"),
    limit: int = Query(100, ge=1, le=1000, description="日志条数限制"),
    offset: int = Query(0, ge=0, description="日志偏移量"),
    db: Session = Depends(get_db)
):
    """
    获取执行日志
    
    Args:
        execution_id: 执行记录ID
        level: 日志级别过滤
        limit: 日志条数限制
        offset: 日志偏移量
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: 执行日志信息
    """
    try:
        # 首先尝试从运行时获取日志
        execution_service_runtime = ExecutionService()
        runtime_status = execution_service_runtime.get_execution_status(execution_id)
        
        if runtime_status and "logs" in runtime_status:
            logs = runtime_status["logs"]
            
            # 应用级别过滤
            if level:
                logs = [log for log in logs if log.get("level") == level]
            
            # 应用分页
            total_logs = len(logs)
            logs = logs[offset:offset + limit]
            
            return {
                "source": "runtime",
                "execution_id": execution_id,
                "logs": logs,
                "total": total_logs,
                "limit": limit,
                "offset": offset
            }
        
        # 如果运行时没有，从数据库获取
        execution_service = get_execution_service(db)
        execution = execution_service.get_execution(execution_id)
        
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        logs = execution.logs or []
        
        # 应用级别过滤
        if level:
            logs = [log for log in logs if log.get("level") == level]
        
        # 应用分页
        total_logs = len(logs)
        logs = logs[offset:offset + limit]
        
        return {
            "source": "database",
            "execution_id": execution_id,
            "logs": logs,
            "total": total_logs,
            "limit": limit,
            "offset": offset
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get execution logs {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{execution_id}", response_model=ExecutionResponse, summary="更新执行记录")
def update_execution(
    execution_id: str = Path(..., description="执行记录ID"),
    update_data: ExecutionUpdate = None,
    db: Session = Depends(get_db)
):
    """
    更新执行记录
    
    Args:
        execution_id: 执行记录ID
        update_data: 更新数据
        db: 数据库会话
        
    Returns:
        ExecutionResponse: 更新后的执行记录
    """
    try:
        execution_service = get_execution_service(db)
        execution = execution_service.update_execution(execution_id, update_data)
        
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return execution
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update execution {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{execution_id}", summary="删除执行记录")
def delete_execution(
    execution_id: str = Path(..., description="执行记录ID"),
    db: Session = Depends(get_db)
):
    """
    删除执行记录
    
    Args:
        execution_id: 执行记录ID
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: 删除结果
    """
    try:
        execution_service = get_execution_service(db)
        success = execution_service.delete_execution(execution_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return {"message": "Execution deleted successfully", "execution_id": execution_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete execution {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{execution_id}/logs", summary="添加执行日志")
def add_execution_log(
    execution_id: str = Path(..., description="执行记录ID"),
    log_request: ExecutionLogRequest = None,
    db: Session = Depends(get_db)
):
    """
    添加执行日志
    
    Args:
        execution_id: 执行记录ID
        log_request: 日志请求数据
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: 添加结果
    """
    try:
        execution_service = get_execution_service(db)
        success = execution_service.add_log(execution_id, log_request)
        
        if not success:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return {"message": "Log added successfully", "execution_id": execution_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add log to execution {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{execution_id}/progress", summary="更新执行进度")
def update_execution_progress(
    execution_id: str = Path(..., description="执行记录ID"),
    progress_update: ExecutionProgressUpdate = None,
    db: Session = Depends(get_db)
):
    """
    更新执行进度
    
    Args:
        execution_id: 执行记录ID
        progress_update: 进度更新数据
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: 更新结果
    """
    try:
        execution_service = get_execution_service(db)
        success = execution_service.update_progress(execution_id, progress_update)
        
        if not success:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return {"message": "Progress updated successfully", "execution_id": execution_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update progress for execution {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{execution_id}/actions", response_model=ExecutionActionResponse, summary="执行操作")
def perform_execution_action(
    execution_id: str = Path(..., description="执行记录ID"),
    action_request: ExecutionActionRequest = None,
    db: Session = Depends(get_db)
):
    """
    执行操作（开始、停止、取消、重试）
    
    Args:
        execution_id: 执行记录ID
        action_request: 操作请求
        db: 数据库会话
        
    Returns:
        ExecutionActionResponse: 操作响应
    """
    try:
        # 对于运行时操作，优先使用ExecutionService
        if action_request.action.lower() in ["stop", "cancel"]:
            execution_service_runtime = ExecutionService()
            success = execution_service_runtime.cancel_execution(execution_id)
            
            if success:
                return ExecutionActionResponse(
                    success=True,
                    message=f"Execution {action_request.action}led successfully",
                    execution_id=execution_id
                )
        
        # 其他操作使用数据库服务
        execution_service = get_execution_service(db)
        return execution_service.perform_action(execution_id, action_request)
    except Exception as e:
        logger.error(f"Failed to perform action on execution {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup", summary="清理旧执行记录")
def cleanup_old_executions(
    days: int = Query(30, ge=1, description="保留天数"),
    db: Session = Depends(get_db)
):
    """
    清理旧的执行记录
    
    Args:
        days: 保留天数
        db: 数据库会话
        
    Returns:
        Dict[str, Any]: 清理结果
    """
    try:
        execution_service = get_execution_service(db)
        cleaned_count = execution_service.cleanup_old_executions(days)
        
        # 同时清理运行时记录
        execution_service_runtime = ExecutionService()
        runtime_cleaned = execution_service_runtime.cleanup_completed_executions(days * 24)
        
        return {
            "message": "Cleanup completed successfully",
            "database_cleaned": cleaned_count,
            "runtime_cleaned": runtime_cleaned,
            "total_cleaned": cleaned_count + runtime_cleaned
        }
    except Exception as e:
        logger.error(f"Failed to cleanup executions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))