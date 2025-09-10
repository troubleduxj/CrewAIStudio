#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio CrewAI Framework Initialization
CrewAI框架初始化和配置
"""

import os
import importlib.util
import inspect
from pathlib import Path
from typing import Optional, Dict, Any
from loguru import logger

try:
    from crewai import Agent, Task, Crew
    from crewai.tools import BaseTool
    from crewai_tools import (
        WebsiteSearchTool,
        FileReadTool,
        FileWriterTool,
        DirectoryReadTool,
        CodeDocsSearchTool,
        SerperDevTool,
    )

    CREWAI_AVAILABLE = True
except ImportError as e:
    logger.warning(f"CrewAI not available: {e}")
    CREWAI_AVAILABLE = False
    Agent = None
    Task = None
    Crew = None
    BaseTool = None

from app.core.config import settings


class CrewAIInitializer:
    """
    CrewAI框架初始化器
    负责检查和配置CrewAI环境
    """

    def __init__(self):
        self.is_initialized = False
        self.available_tools = (
            []
        )  # 存储 { "name": "ToolName", "type": "system" | "custom" }
        self.api_keys_configured = {}

    async def initialize(self) -> bool:
        """
        初始化CrewAI框架

        Returns:
            bool: 初始化是否成功
        """
        if not CREWAI_AVAILABLE:
            logger.error(
                "CrewAI framework is not available. Please install crewai package."
            )
            return False

        logger.info("Initializing CrewAI framework...")

        # 检查API密钥配置
        self._check_api_keys()

        # 初始化可用工具
        self._initialize_tools()

        # 验证CrewAI基本功能
        if await self._verify_crewai_functionality():
            self.is_initialized = True
            logger.info("CrewAI framework initialized successfully")
            return True
        else:
            logger.error("CrewAI framework initialization failed")
            return False

    def _check_api_keys(self) -> None:
        """
        检查API密钥配置
        """
        api_keys = {
            "OPENAI_API_KEY": settings.OPENAI_API_KEY,
            "ANTHROPIC_API_KEY": settings.ANTHROPIC_API_KEY,
            "CREWAI_API_KEY": settings.CREWAI_API_KEY,
            "DEEPSEEK_API_KEY": settings.DEEPSEEK_API_KEY,
        }

        for key_name, key_value in api_keys.items():
            if (
                key_value
                and key_value != f"your-{key_name.lower().replace('_', '-')}-here"
            ):
                self.api_keys_configured[key_name] = True
                # 设置环境变量
                os.environ[key_name] = key_value
                logger.info(f"{key_name} configured")
            else:
                self.api_keys_configured[key_name] = False
                logger.warning(f"{key_name} not configured")

    def _initialize_tools(self) -> None:
        """
        初始化可用的CrewAI工具, 包括内置和自定义工具
        """
        if not CREWAI_AVAILABLE:
            return

        try:
            # 1. 加载CrewAI自带的基础工具
            system_tools = [
                "FileReadTool",
                "FileWriterTool",
                "DirectoryReadTool",
            ]
            for tool_name in system_tools:
                self.available_tools.append({"name": tool_name, "type": "system"})

            # 2. 加载需要API密钥的CrewAI工具
            if self.api_keys_configured.get("OPENAI_API_KEY"):
                self.available_tools.append(
                    {"name": "WebsiteSearchTool", "type": "system"}
                )

            if os.getenv("SERPER_API_KEY"):
                self.available_tools.append({"name": "SerperDevTool", "type": "system"})

            # 3. 动态加载自定义工具
            custom_tools_path = Path(__file__).parent.parent / "tools"
            for file_path in custom_tools_path.glob("*.py"):
                if file_path.name.startswith("_"):
                    continue

                tool_type = "custom"
                if file_path.name.endswith("_api_tool.py"):
                    tool_type = "api"
                elif file_path.name.endswith("_mcp_tool.py"):
                    tool_type = "mcp"

                module_name = f"app.tools.{file_path.stem}"
                try:
                    spec = importlib.util.spec_from_file_location(
                        module_name, file_path
                    )
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        for name, obj in inspect.getmembers(module):
                            if (
                                inspect.isclass(obj)
                                and issubclass(obj, BaseTool)
                                and obj is not BaseTool
                            ):
                                self.available_tools.append(
                                    {"name": name, "type": tool_type}
                                )
                                logger.info(f"Loaded {tool_type} tool: {name}")
                except Exception as e:
                    logger.error(
                        f"Failed to load custom tool from {file_path.name}: {e}"
                    )

            logger.info(
                f"All available tools: {', '.join([tool['name'] for tool in self.available_tools])}"
            )

        except Exception as e:
            logger.error(f"Failed to initialize CrewAI tools: {e}")

    async def _verify_crewai_functionality(self) -> bool:
        """
        验证CrewAI基本功能

        Returns:
            bool: 验证是否成功
        """
        if not CREWAI_AVAILABLE:
            return False

        try:
            # 创建一个简单的测试代理
            test_agent = Agent(
                role="Test Agent",
                goal="Verify CrewAI functionality",
                backstory="A simple test agent to verify CrewAI is working",
                verbose=False,
                allow_delegation=False,
            )

            # 创建一个简单的测试任务
            test_task = Task(
                description="Say hello to verify CrewAI is working",
                agent=test_agent,
                expected_output="A simple hello message",
            )

            logger.info("CrewAI basic functionality verified")
            return True

        except Exception as e:
            logger.error(f"CrewAI functionality verification failed: {e}")
            return False

    def get_status(self) -> Dict[str, Any]:
        """
        获取CrewAI初始化状态

        Returns:
            Dict[str, Any]: 状态信息
        """
        return {
            "available": CREWAI_AVAILABLE,
            "initialized": self.is_initialized,
            "api_keys_configured": self.api_keys_configured,
            "available_tools": self.available_tools,
        }

    def is_ready(self) -> bool:
        """
        检查CrewAI是否准备就绪

        Returns:
            bool: 是否准备就绪
        """
        return CREWAI_AVAILABLE and self.is_initialized


# 全局初始化器实例
crewai_initializer = CrewAIInitializer()


async def init_crewai() -> bool:
    """
    初始化CrewAI框架

    Returns:
        bool: 初始化是否成功
    """
    return await crewai_initializer.initialize()


def get_crewai_status() -> Dict[str, Any]:
    """
    获取CrewAI状态

    Returns:
        Dict[str, Any]: 状态信息
    """
    return crewai_initializer.get_status()


def is_crewai_ready() -> bool:
    """
    检查CrewAI是否准备就绪

    Returns:
        bool: 是否准备就绪
    """
    return crewai_initializer.is_ready()


__all__ = [
    "CrewAIInitializer",
    "crewai_initializer",
    "init_crewai",
    "get_crewai_status",
    "is_crewai_ready",
    "CREWAI_AVAILABLE",
]
