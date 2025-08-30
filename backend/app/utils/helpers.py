#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Helper Utilities
辅助工具模块
"""

import uuid
import hashlib
import re
from datetime import datetime, timezone
from typing import Any, Optional, Union
from pathlib import Path


def generate_uuid() -> str:
    """
    生成UUID字符串
    
    Returns:
        str: UUID字符串
    """
    return str(uuid.uuid4())


def format_datetime(
    dt: datetime, 
    format_str: str = "%Y-%m-%d %H:%M:%S"
) -> str:
    """
    格式化日期时间
    
    Args:
        dt: 日期时间对象
        format_str: 格式字符串
        
    Returns:
        str: 格式化后的日期时间字符串
    """
    return dt.strftime(format_str)


def parse_datetime(
    dt_str: str, 
    format_str: str = "%Y-%m-%d %H:%M:%S"
) -> Optional[datetime]:
    """
    解析日期时间字符串
    
    Args:
        dt_str: 日期时间字符串
        format_str: 格式字符串
        
    Returns:
        datetime: 解析后的日期时间对象，失败返回None
    """
    try:
        return datetime.strptime(dt_str, format_str)
    except ValueError:
        return None


def sanitize_filename(filename: str) -> str:
    """
    清理文件名，移除非法字符
    
    Args:
        filename: 原始文件名
        
    Returns:
        str: 清理后的文件名
    """
    # 移除或替换非法字符
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # 移除开头和结尾的空格和点
    sanitized = sanitized.strip(' .')
    
    # 确保文件名不为空
    if not sanitized:
        sanitized = "unnamed_file"
    
    # 限制长度
    if len(sanitized) > 255:
        name, ext = Path(sanitized).stem, Path(sanitized).suffix
        max_name_length = 255 - len(ext)
        sanitized = name[:max_name_length] + ext
    
    return sanitized


def calculate_file_hash(
    file_path: Union[str, Path], 
    algorithm: str = "md5"
) -> str:
    """
    计算文件哈希值
    
    Args:
        file_path: 文件路径
        algorithm: 哈希算法（md5, sha1, sha256等）
        
    Returns:
        str: 文件哈希值
    """
    hash_obj = hashlib.new(algorithm)
    
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_obj.update(chunk)
    
    return hash_obj.hexdigest()


def format_file_size(size_bytes: int) -> str:
    """
    格式化文件大小
    
    Args:
        size_bytes: 文件大小（字节）
        
    Returns:
        str: 格式化后的文件大小
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def truncate_string(text: str, max_length: int, suffix: str = "...") -> str:
    """
    截断字符串
    
    Args:
        text: 原始字符串
        max_length: 最大长度
        suffix: 截断后缀
        
    Returns:
        str: 截断后的字符串
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def deep_merge_dict(dict1: dict, dict2: dict) -> dict:
    """
    深度合并字典
    
    Args:
        dict1: 第一个字典
        dict2: 第二个字典
        
    Returns:
        dict: 合并后的字典
    """
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dict(result[key], value)
        else:
            result[key] = value
    
    return result


def get_current_timestamp() -> int:
    """
    获取当前时间戳（秒）
    
    Returns:
        int: 当前时间戳
    """
    return int(datetime.now(timezone.utc).timestamp())


def convert_to_snake_case(text: str) -> str:
    """
    将字符串转换为蛇形命名法
    
    Args:
        text: 原始字符串
        
    Returns:
        str: 蛇形命名法字符串
    """
    # 在大写字母前插入下划线
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
    # 在小写字母和大写字母之间插入下划线
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def convert_to_camel_case(text: str) -> str:
    """
    将字符串转换为驼峰命名法
    
    Args:
        text: 原始字符串（蛇形命名法）
        
    Returns:
        str: 驼峰命名法字符串
    """
    components = text.split('_')
    return components[0] + ''.join(word.capitalize() for word in components[1:])


__all__ = [
    "generate_uuid",
    "format_datetime",
    "parse_datetime",
    "sanitize_filename",
    "calculate_file_hash",
    "format_file_size",
    "truncate_string",
    "deep_merge_dict",
    "get_current_timestamp",
    "convert_to_snake_case",
    "convert_to_camel_case",
]