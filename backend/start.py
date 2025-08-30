#!/usr/bin/env python3
"""
项目启动脚本
在启动主应用前检查Python版本和环境配置
"""

import sys
import subprocess
from pathlib import Path

def check_python_version():
    """
    检查Python版本
    
    Returns:
        bool: 版本检查是否通过
    """
    try:
        result = subprocess.run(
            [sys.executable, 'check_python_version.py'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )
        
        if result.returncode == 0:
            print(result.stdout)
            return True
        else:
            print("Python版本检查失败:")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"版本检查时发生错误: {e}")
        return False

def start_application():
    """
    启动主应用
    """
    print("\n🚀 启动CrewAI Studio Backend...")
    try:
        # 使用uvicorn启动应用
        subprocess.run([
            sys.executable, '-m', 'uvicorn', 
            'main:app', 
            '--reload', 
            '--host', '0.0.0.0', 
            '--port', '8000'
        ], cwd=Path(__file__).parent)
    except KeyboardInterrupt:
        print("\n👋 应用已停止")
    except Exception as e:
        print(f"启动应用时发生错误: {e}")
        sys.exit(1)

def main():
    """
    主函数
    """
    print("=== CrewAI Studio Backend 启动检查 ===")
    
    # 检查Python版本
    if not check_python_version():
        print("\n❌ 环境检查失败，请修复后重试")
        sys.exit(1)
    
    # 启动应用
    start_application()

if __name__ == "__main__":
    main()