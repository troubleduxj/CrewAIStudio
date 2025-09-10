#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio LLM Configuration Endpoints
LLM配置管理相关API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import asyncio
import logging

from app.core.database import get_db
from app.schemas.llm import (
    LLMConfig,
    LLMConfigCreate,
    LLMConfigUpdate,
    LLMConfigResponse,
    LLMProvider,
)
from app.services.llm_service import LLMService

# 创建路由器
router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/providers", response_model=List[str])
async def get_supported_providers():
    """
    获取支持的LLM提供商列表

    Returns:
        List[str]: 支持的LLM提供商列表
    """
    return [provider.value for provider in LLMProvider]


@router.get("/configs", response_model=List[LLMConfigResponse])
async def get_llm_configs(db: Session = Depends(get_db)):
    """
    获取所有LLM配置

    Args:
        db: 数据库会话

    Returns:
        List[LLMConfigResponse]: LLM配置列表
    """
    try:
        llm_service = LLMService(db)
        configs = await llm_service.get_all_configs()
        return configs
    except Exception as e:
        logger.error(f"Failed to get LLM configs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get LLM configs: {str(e)}",
        )


@router.get("/configs/{provider}", response_model=LLMConfigResponse)
async def get_llm_config(provider: LLMProvider, db: Session = Depends(get_db)):
    """
    获取指定提供商的LLM配置

    Args:
        provider: LLM提供商
        db: 数据库会话

    Returns:
        LLMConfigResponse: LLM配置信息
    """
    try:
        llm_service = LLMService(db)
        config = await llm_service.get_config(provider)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration for provider {provider} not found",
            )
        return config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get LLM config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get LLM config: {str(e)}",
        )


@router.post("/configs", response_model=LLMConfigResponse)
async def create_llm_config(config: LLMConfigCreate, db: Session = Depends(get_db)):
    """
    创建新的LLM配置

    Args:
        config: LLM配置创建数据
        db: 数据库会话

    Returns:
        LLMConfigResponse: 创建的LLM配置
    """
    try:
        llm_service = LLMService(db)

        # 检查是否已存在该提供商的配置
        existing_config = await llm_service.get_config(config.provider)
        if existing_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Configuration for provider {config.provider} already exists, please use update endpoint",
            )

        created_config = await llm_service.create_config(config)
        return created_config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create LLM config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create LLM config: {str(e)}",
        )


@router.put("/configs/{provider}", response_model=LLMConfigResponse)
async def update_llm_config(
    provider: LLMProvider, config: LLMConfigUpdate, db: Session = Depends(get_db)
):
    """
    更新指定提供商的LLM配置

    Args:
        provider: LLM提供商
        config: LLM配置更新数据
        db: 数据库会话

    Returns:
        LLMConfigResponse: 更新后的LLM配置
    """
    try:
        llm_service = LLMService(db)

        # 检查配置是否存在
        existing_config = await llm_service.get_config(provider)
        if not existing_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration for provider {provider} not found",
            )

        updated_config = await llm_service.update_config(provider, config)
        return updated_config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update LLM config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update LLM config: {str(e)}",
        )


@router.delete("/configs/{provider}")
async def delete_llm_config(provider: LLMProvider, db: Session = Depends(get_db)):
    """
    删除指定提供商的LLM配置

    Args:
        provider: LLM提供商
        db: 数据库会话

    Returns:
        Dict[str, str]: 删除结果消息
    """
    try:
        llm_service = LLMService(db)

        # 检查配置是否存在
        existing_config = await llm_service.get_config(provider)
        if not existing_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration for provider {provider} not found",
            )

        await llm_service.delete_config(provider)
        return {
            "message": f"Successfully deleted configuration for provider {provider}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete LLM config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete LLM config: {str(e)}",
        )


@router.post("/configs/{provider}/test")
async def test_llm_connection(
    provider: LLMProvider, config: LLMConfigCreate, db: Session = Depends(get_db)
):
    """
    测试LLM连接

    Args:
        provider: LLM提供商
        config: LLM配置数据
        db: 数据库会话

    Returns:
        Dict[str, Any]: 测试结果
    """
    try:
        llm_service = LLMService(db)
        test_result = await llm_service.test_connection(provider, config)
        return test_result
    except Exception as e:
        logger.error(f"Failed to test LLM connection: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test LLM connection: {str(e)}",
        )


@router.get("/configs/{provider}/status")
async def get_llm_status(provider: LLMProvider, db: Session = Depends(get_db)):
    """
    获取LLM连接状态

    Args:
        provider: LLM提供商
        db: 数据库会话

    Returns:
        Dict[str, Any]: 连接状态信息
    """
    try:
        llm_service = LLMService(db)
        status_info = await llm_service.get_connection_status(provider)

        # 转换数据结构以匹配前端期望的格式
        return {
            "provider": status_info["provider"],
            "is_connected": status_info["status"] == "connected",
            "last_test_time": status_info.get("last_check"),
            "error_message": (
                status_info["message"] if status_info["status"] != "connected" else None
            ),
        }
    except Exception as e:
        logger.error(f"Failed to get LLM status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get LLM status: {str(e)}",
        )


@router.get("/models/{provider}")
async def get_available_models(provider: LLMProvider):
    """
    获取指定提供商的可用模型列表

    Args:
        provider: LLM提供商

    Returns:
        List[Dict[str, Any]]: 可用模型列表
    """
    try:
        llm_service = LLMService()
        models = await llm_service.get_available_models(provider)
        return models
    except Exception as e:
        logger.error(f"Failed to get available models: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available models: {str(e)}",
        )
