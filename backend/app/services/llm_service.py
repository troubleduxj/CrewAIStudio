#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM配置管理服务
处理LLM配置的CRUD操作、连接测试和状态管理
"""

import os
import json
import asyncio
from loguru import logger
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.schemas.llm import (
    LLMConfig,
    LLMConfigCreate,
    LLMConfigUpdate,
    LLMConfigResponse,
    LLMProvider,
)
from app.core.config import get_settings

settings = get_settings()


class LLMService:
    """
    LLM配置管理服务类
    """

    def __init__(self, db: Optional[Session] = None):
        """
        初始化LLM服务

        Args:
            db: 数据库会话（可选）
        """
        self.db = db
        self.config_file = os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "llm_configs.json"
        )
        self._ensure_config_file()

    def _ensure_config_file(self):
        """
        确保配置文件存在
        """
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        if not os.path.exists(self.config_file):
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump({}, f, ensure_ascii=False, indent=2)

    def _load_configs(self) -> Dict[str, Dict[str, Any]]:
        """
        从文件加载配置

        Returns:
            Dict[str, Dict[str, Any]]: 配置字典
        """
        try:
            with open(self.config_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"加载配置文件失败: {str(e)}")
            return {}

    def _save_configs(self, configs: Dict[str, Dict[str, Any]]):
        """
        保存配置到文件

        Args:
            configs: 配置字典
        """
        try:
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(configs, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"保存配置文件失败: {str(e)}")
            raise

    async def get_all_configs(self) -> List[LLMConfigResponse]:
        """
        获取所有LLM配置

        Returns:
            List[LLMConfigResponse]: LLM配置列表
        """
        configs = self._load_configs()
        result = []

        for provider, config_data in configs.items():
            try:
                config = LLMConfigResponse(**config_data)
                result.append(config)
            except Exception as e:
                logger.error(f"解析配置失败 {provider}: {str(e)}")

        return result

    async def get_config(self, provider: LLMProvider) -> Optional[LLMConfigResponse]:
        """
        获取指定提供商的配置

        Args:
            provider: LLM提供商

        Returns:
            Optional[LLMConfigResponse]: LLM配置或None
        """
        configs = self._load_configs()
        # 处理provider可能是字符串或枚举的情况
        provider_key = provider.value if hasattr(provider, "value") else provider
        config_data = configs.get(provider_key)

        if config_data:
            try:
                return LLMConfigResponse(**config_data)
            except Exception as e:
                logger.error(f"解析配置失败 {provider}: {str(e)}")

        return None

    async def create_config(self, config: LLMConfigCreate) -> LLMConfigResponse:
        """
        创建新的LLM配置

        Args:
            config: LLM配置创建数据

        Returns:
            LLMConfigResponse: 创建的LLM配置
        """
        configs = self._load_configs()

        # 添加时间戳
        config_data = config.dict()
        config_data["created_at"] = datetime.now().isoformat()
        config_data["updated_at"] = datetime.now().isoformat()
        if "is_active" not in config_data:
            config_data["is_active"] = True

        # 处理provider可能是字符串或枚举的情况
        provider_key = (
            config.provider.value
            if hasattr(config.provider, "value")
            else config.provider
        )
        configs[provider_key] = config_data
        self._save_configs(configs)

        return LLMConfigResponse(**config_data)

    async def update_config(
        self, provider: LLMProvider, config: LLMConfigUpdate
    ) -> LLMConfigResponse:
        """
        更新LLM配置

        Args:
            provider: LLM提供商
            config: LLM配置更新数据

        Returns:
            LLMConfigResponse: 更新后的LLM配置
        """
        configs = self._load_configs()
        # 处理provider可能是字符串或枚举的情况
        provider_key = provider.value if hasattr(provider, "value") else provider
        existing_config = configs.get(provider_key, {})

        # 更新配置
        update_data = config.dict(exclude_unset=True)
        existing_config.update(update_data)
        existing_config["updated_at"] = datetime.now().isoformat()
        if "is_active" not in existing_config:
            existing_config["is_active"] = True

        configs[provider_key] = existing_config
        self._save_configs(configs)

        return LLMConfigResponse(**existing_config)

    async def delete_config(self, provider: LLMProvider):
        """
        删除LLM配置

        Args:
            provider: LLM提供商
        """
        configs = self._load_configs()
        if provider.value in configs:
            del configs[provider.value]
            self._save_configs(configs)

    async def test_connection(
        self, provider: LLMProvider, config: LLMConfigCreate
    ) -> Dict[str, Any]:
        """
        测试LLM连接

        Args:
            provider: LLM提供商
            config: LLM配置数据

        Returns:
            Dict[str, Any]: 测试结果
        """
        try:
            start_time = datetime.now()

            if provider == LLMProvider.OPENAI:
                result = await self._test_openai_connection(config)
            elif provider == LLMProvider.DEEPSEEK:
                result = await self._test_deepseek_connection(config)
            elif provider == LLMProvider.ANTHROPIC:
                result = await self._test_anthropic_connection(config)
            elif provider == LLMProvider.OLLAMA:
                result = await self._test_ollama_connection(config)
            elif provider == LLMProvider.GEMINI:
                result = await self._test_gemini_connection(config)
            else:
                raise ValueError(f"Unsupported provider: {provider}")

            end_time = datetime.now()
            latency = (end_time - start_time).total_seconds() * 1000  # 毫秒

            return {
                "success": result["success"],
                "message": result["message"],
                "latency_ms": round(latency, 2),
                "timestamp": datetime.now().isoformat(),
                "details": result.get("details", {}),
            }

        except Exception as e:
            logger.error(f"测试连接失败 {provider}: {str(e)}")
            return {
                "success": False,
                "message": f"连接测试失败: {str(e)}",
                "latency_ms": 0,
                "timestamp": datetime.now().isoformat(),
                "details": {"error": str(e)},
            }

    async def _test_openai_connection(self, config: LLMConfigCreate) -> Dict[str, Any]:
        """
        测试OpenAI连接

        Args:
            config: LLM配置

        Returns:
            Dict[str, Any]: 测试结果
        """
        try:
            import openai

            client = openai.OpenAI(
                api_key=config.api_key or os.getenv("OPENAI_API_KEY"),
                base_url=config.base_url,
                timeout=10.0,  # 10秒超时
            )

            # 测试简单的API调用
            response = client.chat.completions.create(
                model=config.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5,
            )

            return {
                "success": True,
                "message": "OpenAI connection successful",
                "details": {"model": config.model, "response_id": response.id},
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"OpenAI connection failed: {str(e)}",
                "details": {"error": str(e)},
            }

    async def _test_deepseek_connection(
        self, config: LLMConfigCreate
    ) -> Dict[str, Any]:
        """
        测试DeepSeek连接

        Args:
            config: LLM配置

        Returns:
            Dict[str, Any]: 测试结果
        """
        logger.info("Attempting to test DeepSeek connection...")
        try:
            import openai

            api_key_to_use = config.api_key or os.getenv("DEEPSEEK_API_KEY")
            base_url_to_use = config.base_url or "https://api.deepseek.com"

            logger.info(
                f"Using API Key: {'***' + api_key_to_use[-4:] if api_key_to_use else 'None'}"
            )
            logger.info(f"Using Base URL: {base_url_to_use}")

            client = openai.OpenAI(
                api_key=config.api_key or os.getenv("DEEPSEEK_API_KEY"),
                base_url=config.base_url or "https://api.deepseek.com",
                timeout=10.0,  # 10秒超时
            )

            # 测试简单的API调用
            response = client.chat.completions.create(
                model=config.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5,
            )

            return {
                "success": True,
                "message": "DeepSeek connection successful",
                "details": {"model": config.model, "response_id": response.id},
            }

        except Exception as e:
            logger.error(f"DeepSeek connection test failed: {e}", exc_info=True)
            return {
                "success": False,
                "message": f"DeepSeek connection failed: {str(e)}",
                "details": {"error": str(e)},
            }

    async def _test_anthropic_connection(
        self, config: LLMConfigCreate
    ) -> Dict[str, Any]:
        """
        测试Anthropic连接

        Args:
            config: LLM配置

        Returns:
            Dict[str, Any]: 测试结果
        """
        try:
            import anthropic

            client = anthropic.Anthropic(
                api_key=config.api_key or os.getenv("ANTHROPIC_API_KEY"),
                timeout=10.0,  # 10秒超时
            )

            # 测试简单的API调用
            response = client.messages.create(
                model=config.model,
                max_tokens=5,
                messages=[{"role": "user", "content": "Hello"}],
            )

            return {
                "success": True,
                "message": "Anthropic connection successful",
                "details": {"model": config.model, "response_id": response.id},
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Anthropic connection failed: {str(e)}",
                "details": {"error": str(e)},
            }

    async def _test_ollama_connection(self, config: LLMConfigCreate) -> Dict[str, Any]:
        """
        测试Ollama连接

        Args:
            config: LLM配置

        Returns:
            Dict[str, Any]: 测试结果
        """
        try:
            import aiohttp

            base_url = config.base_url or "http://localhost:11434"

            timeout = aiohttp.ClientTimeout(total=10)  # 10秒超时
            async with aiohttp.ClientSession(timeout=timeout) as session:
                # 测试Ollama服务是否运行
                async with session.get(f"{base_url}/api/tags") as response:
                    if response.status == 200:
                        data = await response.json()
                        models = [model["name"] for model in data.get("models", [])]

                        if config.model in models:
                            return {
                                "success": True,
                                "message": "Ollama connection successful",
                                "details": {
                                    "model": config.model,
                                    "available_models": models,
                                },
                            }
                        else:
                            return {
                                "success": False,
                                "message": f"Model {config.model} not available",
                                "details": {"available_models": models},
                            }
                    else:
                        return {
                            "success": False,
                            "message": f"Ollama service error: {response.status}",
                            "details": {"status_code": response.status},
                        }

        except Exception as e:
            return {
                "success": False,
                "message": f"Ollama connection failed: {str(e)}",
                "details": {"error": str(e)},
            }

    async def _test_gemini_connection(self, config: LLMConfigCreate) -> Dict[str, Any]:
        """
        测试Google Gemini连接

        Args:
            config: LLM配置

        Returns:
            Dict[str, Any]: 测试结果
        """
        try:
            import aiohttp

            api_key = config.api_key or os.getenv("GEMINI_API_KEY")
            if not api_key:
                return {
                    "success": False,
                    "message": "Gemini API key not provided",
                    "details": {"error": "Missing API key"},
                }

            base_url = config.base_url or "https://generativelanguage.googleapis.com/v1"
            url = f"{base_url}/models/{config.model}:generateContent"

            headers = {"Content-Type": "application/json"}

            data = {
                "contents": [{"parts": [{"text": "Hello"}]}],
                "generationConfig": {"maxOutputTokens": 5},
            }

            timeout = aiohttp.ClientTimeout(total=10)  # 10秒超时
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    f"{url}?key={api_key}", headers=headers, json=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "success": True,
                            "message": "Gemini connection successful",
                            "details": {"model": config.model, "response": result},
                        }
                    else:
                        error_text = await response.text()
                        return {
                            "success": False,
                            "message": f"Gemini API error: {response.status}",
                            "details": {
                                "status_code": response.status,
                                "error": error_text,
                            },
                        }

        except Exception as e:
            return {
                "success": False,
                "message": f"Gemini connection failed: {str(e)}",
                "details": {"error": str(e)},
            }

    async def get_connection_status(self, provider: LLMProvider) -> Dict[str, Any]:
        """
        获取LLM连接状态

        Args:
            provider: LLM提供商

        Returns:
            Dict[str, Any]: 连接状态信息
        """
        configs = self._load_configs()
        provider_key = provider.value if hasattr(provider, "value") else provider
        config_data = configs.get(provider_key)

        if not config_data:
            return {
                "provider": provider.value,
                "status": "not_configured",
                "message": "未配置",
                "last_check": None,
            }

        try:
            # 使用原始数据创建LLMConfigCreate对象，避免脱敏问题
            config_for_test = LLMConfigCreate(**config_data)
        except Exception as e:
            logger.error(f"创建用于测试的配置失败 {provider}: {str(e)}")
            return {
                "provider": provider.value,
                "status": "error",
                "message": "配置解析失败",
                "last_check": datetime.now().isoformat(),
            }

        # 执行连接测试
        test_result = await self.test_connection(provider, config_for_test)

        return {
            "provider": provider.value,
            "status": "connected" if test_result["success"] else "error",
            "message": test_result["message"],
            "last_check": test_result["timestamp"],
            "latency_ms": test_result["latency_ms"],
            "details": test_result["details"],
        }

    async def get_available_models(self, provider: LLMProvider) -> List[Dict[str, Any]]:
        """
        获取指定提供商的可用模型列表

        Args:
            provider: LLM提供商

        Returns:
            List[Dict[str, Any]]: 可用模型列表
        """
        if provider == LLMProvider.OPENAI:
            return [
                {
                    "id": "gpt-3.5-turbo",
                    "name": "GPT-3.5 Turbo",
                    "description": "快速、经济的模型",
                },
                {"id": "gpt-4", "name": "GPT-4", "description": "最强大的模型"},
                {
                    "id": "gpt-4-turbo",
                    "name": "GPT-4 Turbo",
                    "description": "更快的GPT-4版本",
                },
            ]
        elif provider == LLMProvider.DEEPSEEK:
            return [
                {
                    "id": "deepseek-chat",
                    "name": "DeepSeek Chat",
                    "description": "通用对话模型",
                },
                {
                    "id": "deepseek-coder",
                    "name": "DeepSeek Coder",
                    "description": "代码生成专用模型",
                },
            ]
        elif provider == LLMProvider.ANTHROPIC:
            return [
                {
                    "id": "claude-3-sonnet-20240229",
                    "name": "Claude 3 Sonnet",
                    "description": "平衡性能和速度",
                },
                {
                    "id": "claude-3-opus-20240229",
                    "name": "Claude 3 Opus",
                    "description": "最强大的Claude模型",
                },
            ]
        elif provider == LLMProvider.OLLAMA:
            # 对于Ollama，尝试从服务获取实际可用的模型
            try:
                import aiohttp

                base_url = "http://localhost:11434"

                timeout = aiohttp.ClientTimeout(
                    total=5
                )  # 5秒超时，获取模型列表用较短超时
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(f"{base_url}/api/tags") as response:
                        if response.status == 200:
                            data = await response.json()
                            return [
                                {
                                    "id": model["name"],
                                    "name": model["name"],
                                    "description": f"本地模型 - {model.get('size', 'Unknown size')}",
                                }
                                for model in data.get("models", [])
                            ]
            except Exception as e:
                logger.error(f"获取Ollama模型列表失败: {str(e)}")

            # 返回默认模型列表
            return [
                {
                    "id": "llama2",
                    "name": "Llama 2",
                    "description": "Meta的开源大语言模型",
                },
                {
                    "id": "codellama",
                    "name": "Code Llama",
                    "description": "代码生成专用模型",
                },
                {"id": "mistral", "name": "Mistral", "description": "高效的开源模型"},
            ]
        elif provider == LLMProvider.GEMINI:
            return [
                {
                    "id": "gemini-pro",
                    "name": "Gemini Pro",
                    "description": "Google的高性能多模态模型",
                },
                {
                    "id": "gemini-pro-vision",
                    "name": "Gemini Pro Vision",
                    "description": "支持图像理解的Gemini模型",
                },
                {
                    "id": "gemini-1.5-pro",
                    "name": "Gemini 1.5 Pro",
                    "description": "最新版本的Gemini Pro模型",
                },
            ]

        return []
