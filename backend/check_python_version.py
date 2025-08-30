#!/usr/bin/env python3
"""
Python版本检查脚本
检查当前Python版本是否符合项目要求 (>=3.10 <3.14)
"""

import sys
import os
from pathlib import Path

def load_env_vars():
    """
    加载.env文件中的环境变量
    
    Returns:
        tuple: (min_version, max_version)
    """
    env_file = Path(__file__).parent / '.env'
    min_version = '3.10'
    max_version = '3.14'
    
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('PYTHON_VERSION_MIN='):
                    min_version = line.split('=')[1]
                elif line.startswith('PYTHON_VERSION_MAX='):
                    max_version = line.split('=')[1]
    
    return min_version, max_version

def check_python_version():
    """
    检查Python版本是否符合要求
    
    Returns:
        bool: 版本是否符合要求
    """
    current_version = sys.version_info
    min_version, max_version = load_env_vars()
    
    # 解析最小版本
    min_major, min_minor = map(int, min_version.split('.'))
    max_major, max_minor = map(int, max_version.split('.'))
    
    print(f"当前Python版本: {current_version.major}.{current_version.minor}.{current_version.micro}")
    print(f"要求版本范围: >={min_version} <{max_version}")
    
    # 检查版本范围
    if (current_version.major > min_major or 
        (current_version.major == min_major and current_version.minor >= min_minor)):
        if (current_version.major < max_major or 
            (current_version.major == max_major and current_version.minor < max_minor)):
            print("✅ Python版本符合要求")
            return True
    
    print("❌ Python版本不符合要求")
    print(f"请安装Python {min_version}到{max_version}之间的版本")
    return False

def main():
    """
    主函数
    """
    print("=== Python版本检查 ===")
    
    if not check_python_version():
        print("\n建议:")
        print("1. 使用pyenv安装合适的Python版本")
        print("2. 或者从官网下载安装: https://www.python.org/downloads/")
        print("3. 确保虚拟环境使用正确的Python版本")
        sys.exit(1)
    
    print("\n🎉 环境检查通过，可以继续运行项目")

if __name__ == "__main__":
    main()