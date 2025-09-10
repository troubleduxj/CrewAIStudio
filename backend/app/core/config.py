#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Backend Configuration
应用配置管理
"""

from typing import List, Optional
import os
from pathlib import Path

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from pydantic import validator, Field, model_validator


class Settings(BaseSettings):
    """
    应用配置类
    使用Pydantic进行配置验证和管理
    """

    # 项目基础信息
    PROJECT_NAME: str = "CrewAI Studio Backend"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "CrewAI Studio Backend API for managing AI agents and workflows"

    # API配置
    API_V1_STR: str = "/api/v1"

    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 9998
    DEBUG: bool = True

    # 数据库配置
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "crewai_user"
    POSTGRES_PASSWORD: str = "crewai_password"
    POSTGRES_DB: str = "crewai_studio"
    POSTGRES_PORT: int = 5432

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        """
        构建数据库连接URL
        如果没有提供DATABASE_URL，则从其他配置项构建
        """
        if isinstance(v, str):
            return v
        return (
            f"postgresql://{values.get('POSTGRES_USER')}:"
            f"{values.get('POSTGRES_PASSWORD')}@"
            f"{values.get('POSTGRES_SERVER')}:"
            f"{values.get('POSTGRES_PORT')}/"
            f"{values.get('POSTGRES_DB')}"
        )

    # CORS配置
    BACKEND_CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://localhost:9002,http://localhost:9998"
    )

    @model_validator(mode="before")
    @classmethod
    def parse_cors_origins(cls, values):
        """
        解析CORS origins配置
        """
        if isinstance(values, dict) and "BACKEND_CORS_ORIGINS" in values:
            cors_value = values["BACKEND_CORS_ORIGINS"]
            if isinstance(cors_value, str):
                # 保持字符串格式，在使用时再解析
                values["BACKEND_CORS_ORIGINS"] = cors_value
        return values

    def get_cors_origins(self) -> List[str]:
        """
        获取解析后的CORS origins列表

        Returns:
            List[str]: CORS origins列表
        """
        origins = set()
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            if self.BACKEND_CORS_ORIGINS.startswith(
                "["
            ) and self.BACKEND_CORS_ORIGINS.endswith("]"):
                import json

                try:
                    origins.update(json.loads(self.BACKEND_CORS_ORIGINS))
                except json.JSONDecodeError:
                    pass
            else:
                # 处理逗号分隔的字符串
                origins.update(
                    [
                        i.strip()
                        for i in self.BACKEND_CORS_ORIGINS.split(",")
                        if i.strip()
                    ]
                )

        # 确保开发环境的前端URL始终被允许
        origins.add("http://localhost:3000")

        # 如果列表为空，添加一个默认值以避免FastAPI出错
        if not origins:
            return ["http://localhost:3000"]

        return list(origins)

    # JWT配置
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CrewAI配置
    CREWAI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # DeepSeek配置
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"

    # Ollama配置
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama2"

    # LLM提供商配置
    DEFAULT_LLM_PROVIDER: str = "openai"
    SUPPORTED_LLM_PROVIDERS: List[str] = ["openai", "anthropic", "deepseek", "ollama"]

    # 文件存储配置
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = (
        "{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}"
    )

    # Redis配置（用于任务队列）
    REDIS_URL: str = "redis://localhost:6379/0"

    # 任务队列配置
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # 工作流执行配置
    MAX_CONCURRENT_TASKS: int = 5
    MAX_CONCURRENT_WORKFLOWS: int = 3

    class Config:
        """
        Pydantic配置类
        """

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# 创建全局配置实例
settings = Settings()


def get_settings() -> Settings:
    """
    获取配置实例
    用于依赖注入

    Returns:
        Settings: 配置实例
    """
    return settings
