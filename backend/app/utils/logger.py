#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Logger Utilities
日志工具模块
"""

import sys
from pathlib import Path
from typing import Optional
from loguru import logger

from app.core.config import settings


def setup_logger(
    log_level: Optional[str] = None,
    log_file: Optional[str] = None,
    rotation: str = "10 MB",
    retention: str = "30 days"
) -> None:
    """
    设置日志配置
    
    Args:
        log_level: 日志级别，默认使用配置文件中的设置
        log_file: 日志文件路径，可选
        rotation: 日志轮转大小
        retention: 日志保留时间
    """
    # 移除默认处理器
    logger.remove()
    
    # 获取日志级别
    level = log_level or settings.LOG_LEVEL
    
    # 添加控制台处理器
    logger.add(
        sys.stdout,
        format=settings.LOG_FORMAT,
        level=level,
        colorize=True,
        backtrace=True,
        diagnose=True
    )
    
    # 如果指定了日志文件，添加文件处理器
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.add(
            log_file,
            format=settings.LOG_FORMAT,
            level=level,
            rotation=rotation,
            retention=retention,
            compression="zip",
            backtrace=True,
            diagnose=True
        )
    
    logger.info(f"Logger initialized with level: {level}")


def get_logger(name: str = __name__):
    """
    获取指定名称的日志器
    
    Args:
        name: 日志器名称
        
    Returns:
        logger: 配置好的日志器实例
    """
    return logger.bind(name=name)


# 设置默认日志配置
setup_logger()

# 导出默认日志器
__all__ = ["setup_logger", "get_logger", "logger"]