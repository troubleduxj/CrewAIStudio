#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM集成测试脚本
测试DeepSeek和Ollama模型的集成
"""

import os
import sys
import asyncio
from typing import Dict, Any

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.services.crewai_service import CrewAIService
from app.core.database import SessionLocal
from app.schemas.llm import LLMProvider


def test_openai_llm():
    """
    测试OpenAI LLM配置
    """
    print("\n=== 测试OpenAI LLM ===")
    
    db = SessionLocal()
    service = CrewAIService(db)
    
    llm_config = {
        'provider': 'openai',
        'model': 'gpt-3.5-turbo',
        'temperature': 0.7,
        'max_tokens': 100
    }
    
    try:
        llm_instance = service._create_llm_instance(llm_config)
        if llm_instance:
            print("✅ OpenAI LLM实例创建成功")
            print(f"   模型类型: {type(llm_instance).__name__}")
        else:
            print("❌ OpenAI LLM实例创建失败")
    except Exception as e:
        print(f"❌ OpenAI LLM测试出错: {str(e)}")
    finally:
        db.close()


def test_deepseek_llm():
    """
    测试DeepSeek LLM配置
    """
    print("\n=== 测试DeepSeek LLM ===")
    
    db = SessionLocal()
    service = CrewAIService(db)
    
    llm_config = {
        'provider': 'deepseek',
        'model': 'deepseek-chat',
        'temperature': 0.7,
        'max_tokens': 100
    }
    
    try:
        llm_instance = service._create_llm_instance(llm_config)
        if llm_instance:
            print("✅ DeepSeek LLM实例创建成功")
            print(f"   模型类型: {type(llm_instance).__name__}")
            print(f"   API基础URL: {settings.DEEPSEEK_BASE_URL}")
        else:
            print("❌ DeepSeek LLM实例创建失败")
    except Exception as e:
        print(f"❌ DeepSeek LLM测试出错: {str(e)}")
    finally:
        db.close()


def test_ollama_llm():
    """
    测试Ollama LLM配置
    """
    print("\n=== 测试Ollama LLM ===")
    
    db = SessionLocal()
    service = CrewAIService(db)
    
    llm_config = {
        'provider': 'ollama',
        'model': 'llama2',
        'temperature': 0.7,
        'max_tokens': 100
    }
    
    try:
        llm_instance = service._create_llm_instance(llm_config)
        if llm_instance:
            print("✅ Ollama LLM实例创建成功")
            print(f"   模型类型: {type(llm_instance).__name__}")
            print(f"   Ollama服务URL: {settings.OLLAMA_BASE_URL}")
        else:
            print("❌ Ollama LLM实例创建失败")
    except Exception as e:
        print(f"❌ Ollama LLM测试出错: {str(e)}")
    finally:
        db.close()


def test_anthropic_llm():
    """
    测试Anthropic LLM配置
    """
    print("\n=== 测试Anthropic LLM ===")
    
    db = SessionLocal()
    service = CrewAIService(db)
    
    llm_config = {
        'provider': 'anthropic',
        'model': 'claude-3-sonnet-20240229',
        'temperature': 0.7,
        'max_tokens': 100
    }
    
    try:
        llm_instance = service._create_llm_instance(llm_config)
        if llm_instance:
            print("✅ Anthropic LLM实例创建成功")
            print(f"   模型类型: {type(llm_instance).__name__}")
        else:
            print("❌ Anthropic LLM实例创建失败")
    except Exception as e:
        print(f"❌ Anthropic LLM测试出错: {str(e)}")
    finally:
        db.close()


def test_configuration():
    """
    测试配置信息
    """
    print("\n=== 配置信息 ===")
    print(f"默认LLM提供商: {settings.DEFAULT_LLM_PROVIDER}")
    print(f"支持的LLM提供商: {settings.SUPPORTED_LLM_PROVIDERS}")
    print(f"DeepSeek基础URL: {settings.DEEPSEEK_BASE_URL}")
    print(f"Ollama基础URL: {settings.OLLAMA_BASE_URL}")
    print(f"Ollama默认模型: {settings.OLLAMA_MODEL}")
    
    # 检查API密钥配置状态（不显示实际值）
    print("\n=== API密钥配置状态 ===")
    print(f"OpenAI API Key: {'✅ 已配置' if settings.OPENAI_API_KEY else '❌ 未配置'}")
    print(f"DeepSeek API Key: {'✅ 已配置' if settings.DEEPSEEK_API_KEY else '❌ 未配置'}")
    print(f"Anthropic API Key: {'✅ 已配置' if settings.ANTHROPIC_API_KEY else '❌ 未配置'}")


def main():
    """
    主测试函数
    """
    print("CrewAI Studio LLM集成测试")
    print("=" * 50)
    
    # 测试配置
    test_configuration()
    
    # 测试各种LLM提供商
    test_openai_llm()
    test_deepseek_llm()
    test_ollama_llm()
    test_anthropic_llm()
    
    print("\n=== 测试完成 ===")
    print("\n注意事项:")
    print("1. OpenAI和DeepSeek需要有效的API密钥才能正常工作")
    print("2. Ollama需要本地运行Ollama服务 (http://localhost:11434)")
    print("3. Anthropic需要有效的API密钥才能正常工作")
    print("4. 如果某个提供商测试失败，请检查相应的配置和依赖")


if __name__ == "__main__":
    main()