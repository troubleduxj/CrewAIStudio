#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Research Analysis API
研究分析API端点
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from loguru import logger
from pydantic import BaseModel

from app.services.crewai_service import CrewAIService
from app.core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


class ResearchRequest(BaseModel):
    """
    研究请求模型
    
    Attributes:
        topic: 研究主题
    """
    topic: str


class ResearchResponse(BaseModel):
    """
    研究响应模型
    
    Attributes:
        result: 研究结果（Markdown格式）
        success: 是否成功
        message: 消息
    """
    result: str
    success: bool
    message: str


@router.post("/analyze", response_model=ResearchResponse)
async def research_analyze(
    request: ResearchRequest,
    db: Session = Depends(get_db)
) -> ResearchResponse:
    """
    执行研究分析
    
    Args:
        request: 研究请求
        db: 数据库会话
        
    Returns:
        ResearchResponse: 研究结果
    """
    try:
        logger.info(f"Starting research analysis for topic: {request.topic}")
        
        # 创建CrewAI服务实例
        crewai_service = CrewAIService(db)
        
        # 定义研究代理配置
        agent_config = {
            "name": "Research Analyst",
            "role": "Senior Research Analyst",
            "goal": f"Conduct comprehensive research on the topic: {request.topic}",
            "backstory": "You are an experienced research analyst with expertise in gathering, analyzing, and synthesizing information from various sources to provide comprehensive insights.",
            "verbose": True,
            "allow_delegation": False
        }
        
        # 定义研究任务配置
        task_config = {
            "name": "Research Analysis Task",
            "description": f"""
            Conduct a comprehensive research analysis on the topic: {request.topic}
            
            Your task is to:
            1. Use the browser tool to search for and gather relevant information from web sources
            2. Use the calculator tool if any mathematical calculations are needed
            3. Use the file reader tool if any local files need to be analyzed
            4. Synthesize all gathered information into a comprehensive, well-structured analysis
            5. Present the final result in clear, professional Markdown format
            
            The final output should be a detailed analysis that covers:
            - Key findings and insights
            - Supporting evidence and sources
            - Conclusions and recommendations where applicable
            """,
            "expected_output": "A comprehensive research analysis in Markdown format"
        }
        
        # 定义可用工具
        tools_config = [
            {"name": "browser", "type": "browser"},
            {"name": "calculator", "type": "calculator"},
            {"name": "file_reader", "type": "file_read"}
        ]
        
        # 创建并执行Crew
        crew_config = {
            "agents": [agent_config],
            "tasks": [task_config],
            "tools": tools_config,
            "verbose": True
        }
        
        # 执行研究分析
        result = await crewai_service.execute_crew(crew_config)
        
        if result and result.get("success"):
            # 提取研究结果
            research_result = result.get("output", "")
            
            logger.info(f"Research analysis completed successfully for topic: {request.topic}")
            
            return ResearchResponse(
                result=research_result,
                success=True,
                message="Research analysis completed successfully"
            )
        else:
            error_msg = result.get("error", "Unknown error occurred during research analysis")
            logger.error(f"Research analysis failed: {error_msg}")
            
            return ResearchResponse(
                result="",
                success=False,
                message=f"Research analysis failed: {error_msg}"
            )
            
    except Exception as e:
        logger.error(f"Error during research analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during research analysis: {str(e)}"
        )


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    研究分析服务健康检查
    
    Returns:
        Dict[str, Any]: 健康状态
    """
    return {
        "status": "healthy",
        "service": "research_analysis",
        "message": "Research analysis service is running"
    }


__all__ = ['router']