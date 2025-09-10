#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM相关的Pydantic模式定义
"""

from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class LLMProvider(str, Enum):
    """
    LLM提供商枚举
    """

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    DEEPSEEK = "deepseek"
    OLLAMA = "ollama"
    GEMINI = "gemini"


class LLMConfig(BaseModel):
    """
    LLM配置模型
    """

    provider: LLMProvider = Field(LLMProvider.OPENAI, description="LLM提供商")
    name: str = Field("Default Name", description="配置名称")
    description: Optional[str] = Field(None, description="配置描述")
    model: str = Field("gpt-3.5-turbo", description="模型名称")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="温度参数")
    max_tokens: int = Field(1000, gt=0, description="最大token数")

    # 可选的高级配置
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0, description="Top-p采样参数")
    frequency_penalty: Optional[float] = Field(
        None, ge=-2.0, le=2.0, description="频率惩罚"
    )
    presence_penalty: Optional[float] = Field(
        None, ge=-2.0, le=2.0, description="存在惩罚"
    )

    # 提供商特定配置
    base_url: Optional[str] = Field(None, description="自定义API基础URL")
    api_key: Optional[str] = Field(None, description="API密钥")

    # 额外配置
    extra_config: Optional[Dict[str, Any]] = Field(None, description="额外配置参数")

    class Config:
        use_enum_values = True
        json_encoders = {LLMProvider: lambda v: v.value}


class LLMConfigCreate(LLMConfig):
    """
    创建LLM配置的请求模型
    """

    pass


class LLMConfigUpdate(BaseModel):
    """
    更新LLM配置的请求模型
    """

    provider: Optional[LLMProvider] = Field(None, description="LLM提供商")
    name: Optional[str] = Field(None, description="配置名称")
    description: Optional[str] = Field(None, description="配置描述")
    model: Optional[str] = Field(None, description="模型名称")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="温度参数")
    max_tokens: Optional[int] = Field(None, gt=0, description="最大token数")

    # 可选的高级配置
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0, description="Top-p采样参数")
    frequency_penalty: Optional[float] = Field(
        None, ge=-2.0, le=2.0, description="频率惩罚"
    )
    presence_penalty: Optional[float] = Field(
        None, ge=-2.0, le=2.0, description="存在惩罚"
    )

    # 提供商特定配置
    base_url: Optional[str] = Field(None, description="自定义API基础URL")
    api_key: Optional[str] = Field(None, description="API密钥")

    # 额外配置
    extra_config: Optional[Dict[str, Any]] = Field(None, description="额外配置参数")

    class Config:
        use_enum_values = True


class LLMConfigResponse(LLMConfig):
    """
    LLM配置响应模型
    """

    # 隐藏敏感信息
    api_key: Optional[str] = Field(None, description="API密钥（已脱敏）")

    def dict(self, **kwargs):
        data = super().dict(**kwargs)
        # 脱敏API密钥
        if data.get("api_key"):
            data["api_key"] = (
                "***" + data["api_key"][-4:] if len(data["api_key"]) > 4 else "***"
            )
        return data
