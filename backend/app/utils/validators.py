#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Validation Utilities
验证工具模块
"""

import re
import json
from typing import Any, Dict, Optional
from urllib.parse import urlparse
from email_validator import validate_email as _validate_email, EmailNotValidError
from jsonschema import validate, ValidationError


def validate_email(email: str) -> bool:
    """
    验证邮箱地址格式
    
    Args:
        email: 邮箱地址
        
    Returns:
        bool: 验证结果
    """
    try:
        _validate_email(email)
        return True
    except EmailNotValidError:
        return False


def validate_url(url: str) -> bool:
    """
    验证URL格式
    
    Args:
        url: URL地址
        
    Returns:
        bool: 验证结果
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def validate_json_schema(data: Any, schema: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """
    验证JSON数据是否符合指定schema
    
    Args:
        data: 要验证的数据
        schema: JSON Schema定义
        
    Returns:
        tuple: (验证结果, 错误信息)
    """
    try:
        validate(instance=data, schema=schema)
        return True, None
    except ValidationError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Schema validation error: {str(e)}"


def validate_phone_number(phone: str) -> bool:
    """
    验证手机号码格式（中国大陆）
    
    Args:
        phone: 手机号码
        
    Returns:
        bool: 验证结果
    """
    pattern = r'^1[3-9]\d{9}$'
    return bool(re.match(pattern, phone))


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    验证密码强度
    
    Args:
        password: 密码
        
    Returns:
        tuple: (是否通过验证, 错误信息列表)
    """
    errors = []
    
    if len(password) < 8:
        errors.append("密码长度至少8位")
    
    if not re.search(r'[A-Z]', password):
        errors.append("密码必须包含至少一个大写字母")
    
    if not re.search(r'[a-z]', password):
        errors.append("密码必须包含至少一个小写字母")
    
    if not re.search(r'\d', password):
        errors.append("密码必须包含至少一个数字")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("密码必须包含至少一个特殊字符")
    
    return len(errors) == 0, errors


def validate_username(username: str) -> tuple[bool, Optional[str]]:
    """
    验证用户名格式
    
    Args:
        username: 用户名
        
    Returns:
        tuple: (验证结果, 错误信息)
    """
    if not username:
        return False, "用户名不能为空"
    
    if len(username) < 3:
        return False, "用户名长度至少3位"
    
    if len(username) > 20:
        return False, "用户名长度不能超过20位"
    
    # 只允许字母、数字、下划线
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "用户名只能包含字母、数字和下划线"
    
    # 不能以数字开头
    if username[0].isdigit():
        return False, "用户名不能以数字开头"
    
    return True, None


def validate_file_extension(filename: str, allowed_extensions: list[str]) -> bool:
    """
    验证文件扩展名
    
    Args:
        filename: 文件名
        allowed_extensions: 允许的扩展名列表
        
    Returns:
        bool: 验证结果
    """
    if not filename or '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in [ext.lower() for ext in allowed_extensions]


def validate_json_string(json_str: str) -> tuple[bool, Optional[str]]:
    """
    验证JSON字符串格式
    
    Args:
        json_str: JSON字符串
        
    Returns:
        tuple: (验证结果, 错误信息)
    """
    try:
        json.loads(json_str)
        return True, None
    except json.JSONDecodeError as e:
        return False, f"JSON格式错误: {str(e)}"
    except Exception as e:
        return False, f"验证错误: {str(e)}"


__all__ = [
    "validate_email",
    "validate_url",
    "validate_json_schema",
    "validate_phone_number",
    "validate_password_strength",
    "validate_username",
    "validate_file_extension",
    "validate_json_string",
]