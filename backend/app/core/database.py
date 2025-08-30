#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Database Configuration
数据库连接和会话管理
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import Generator
from loguru import logger

from app.core.config import settings


# 创建数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool,
    connect_args={
        "check_same_thread": False,  # SQLite特定配置
    } if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG,  # 开发环境下打印SQL语句
)

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 创建基础模型类
Base = declarative_base()

# 元数据对象
metadata = MetaData()


def get_db() -> Generator[Session, None, None]:
    """
    获取数据库会话
    用于FastAPI依赖注入
    
    Yields:
        Session: SQLAlchemy数据库会话
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


async def init_db() -> None:
    """
    初始化数据库
    创建所有表结构
    """
    try:
        logger.info("Initializing database...")
        
        # 导入所有模型以确保它们被注册
        from app.models.agent import Agent
        from app.models.task import Task
        from app.models.workflow import Workflow
        
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def close_db() -> None:
    """
    关闭数据库连接
    清理资源
    """
    try:
        logger.info("Closing database connections...")
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")


def create_tables() -> None:
    """
    创建数据库表
    用于初始化或迁移
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        raise


def drop_tables() -> None:
    """
    删除所有数据库表
    谨慎使用，仅用于开发环境
    """
    try:
        Base.metadata.drop_all(bind=engine)
        logger.warning("All database tables dropped")
    except Exception as e:
        logger.error(f"Failed to drop tables: {e}")
        raise