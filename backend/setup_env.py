#!/usr/bin/env python3
"""
虚拟环境设置脚本
创建虚拟环境、激活并安装依赖
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, shell=True):
    """
    执行命令
    
    Args:
        command (str): 要执行的命令
        shell (bool): 是否使用shell执行
    
    Returns:
        bool: 命令是否执行成功
    """
    try:
        print(f"执行命令: {command}")
        result = subprocess.run(command, shell=shell, check=True, cwd=Path(__file__).parent)
        return True
    except subprocess.CalledProcessError as e:
        print(f"命令执行失败: {e}")
        return False
    except Exception as e:
        print(f"执行命令时发生错误: {e}")
        return False

def create_venv():
    """
    创建虚拟环境
    
    Returns:
        bool: 是否创建成功
    """
    venv_path = Path(__file__).parent / '.venv'
    
    if venv_path.exists():
        print("✅ 虚拟环境已存在")
        return True
    
    print("🔧 创建虚拟环境...")
    return run_command(f"{sys.executable} -m venv .venv")

def install_dependencies():
    """
    安装依赖包
    
    Returns:
        bool: 是否安装成功
    """
    print("📦 安装依赖包...")
    
    # Windows 和 Unix 系统的激活脚本路径不同
    if os.name == 'nt':  # Windows
        pip_path = Path(__file__).parent / '.venv' / 'Scripts' / 'pip.exe'
        activate_script = Path(__file__).parent / '.venv' / 'Scripts' / 'activate.bat'
    else:  # Unix/Linux/macOS
        pip_path = Path(__file__).parent / '.venv' / 'bin' / 'pip'
        activate_script = Path(__file__).parent / '.venv' / 'bin' / 'activate'
    
    # 升级pip
    if not run_command(f"{pip_path} install --upgrade pip"):
        return False
    
    # 安装依赖
    requirements_file = Path(__file__).parent / 'requirements.txt'
    if requirements_file.exists():
        return run_command(f"{pip_path} install -r requirements.txt")
    else:
        print("⚠️ requirements.txt 文件不存在")
        return False

def print_activation_instructions():
    """
    打印激活虚拟环境的说明
    """
    print("\n=== 虚拟环境激活说明 ===")
    
    if os.name == 'nt':  # Windows
        print("Windows PowerShell:")
        print("  .venv\\Scripts\\Activate.ps1")
        print("\nWindows CMD:")
        print("  .venv\\Scripts\\activate.bat")
    else:  # Unix/Linux/macOS
        print("Unix/Linux/macOS:")
        print("  source .venv/bin/activate")
    
    print("\n激活后运行:")
    print("  python main.py")
    print("\n或者直接使用:")
    print("  python start.py")

def main():
    """
    主函数
    """
    print("=== CrewAI Studio Backend 环境设置 ===")
    
    # 检查Python版本
    print("\n1. 检查Python版本...")
    if not run_command(f"{sys.executable} check_python_version.py"):
        print("❌ Python版本检查失败")
        return
    
    # 创建虚拟环境
    print("\n2. 创建虚拟环境...")
    if not create_venv():
        print("❌ 虚拟环境创建失败")
        return
    
    # 安装依赖
    print("\n3. 安装依赖包...")
    if not install_dependencies():
        print("❌ 依赖安装失败")
        print("\n💡 提示: 如果网络连接有问题，可以尝试:")
        print("  - 使用国内镜像源")
        print("  - 手动激活虚拟环境后安装")
        return
    
    print("\n🎉 环境设置完成!")
    print_activation_instructions()

if __name__ == "__main__":
    main()