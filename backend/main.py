#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Backend API
主应用入口文件
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import init_db
from app.core.crewai_init import init_crewai, get_crewai_status


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    启动时初始化数据库和CrewAI，关闭时清理资源
    """
    logger.info("Starting CrewAI Studio Backend...")
    
    # 初始化数据库
    await init_db()
    
    # 初始化CrewAI框架
    crewai_success = await init_crewai()
    if crewai_success:
        logger.info("CrewAI framework initialized successfully")
    else:
        logger.warning("CrewAI framework initialization failed, some features may not be available")
    
    yield
    
    logger.info("Shutting down CrewAI Studio Backend...")


# 创建FastAPI应用实例
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CrewAI Studio Backend API for managing AI agents and workflows",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """
    根路径健康检查
    返回API状态信息
    """
    return {
        "message": "CrewAI Studio Backend API",
        "status": "running",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    健康检查端点
    用于监控服务状态
    """
    from datetime import datetime
    
    crewai_status = get_crewai_status()
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "crewai": crewai_status
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """
    HTTP异常处理器
    统一处理HTTP错误响应格式
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


if __name__ == "__main__":
    # 开发环境启动配置
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )