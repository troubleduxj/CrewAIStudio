#!/usr/bin/env python3
"""
项目清理脚本

清理临时文件、缓存文件和测试生成的文件。
使用方法: python -m scripts.cleanup [选项]
"""

import os
import sys
import shutil
import argparse
import glob
from pathlib import Path

# 添加backend目录到Python路径
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def remove_directory(path):
    """安全删除目录"""
    if os.path.exists(path):
        try:
            shutil.rmtree(path)
            print(f"✅ 已删除目录: {path}")
            return True
        except Exception as e:
            print(f"❌ 删除目录失败 {path}: {e}")
            return False
    return True

def remove_file(path):
    """安全删除文件"""
    if os.path.exists(path):
        try:
            os.remove(path)
            print(f"✅ 已删除文件: {path}")
            return True
        except Exception as e:
            print(f"❌ 删除文件失败 {path}: {e}")
            return False
    return True

def clean_python_cache():
    """清理Python缓存文件"""
    print("🧹 清理Python缓存文件...")
    
    # 清理__pycache__目录
    for root, dirs, files in os.walk(backend_dir):
        # 跳过虚拟环境目录
        if '.venv' in root or 'venv' in root:
            continue
            
        for dir_name in dirs[:]:  # 使用切片复制避免修改正在迭代的列表
            if dir_name == '__pycache__':
                pycache_path = os.path.join(root, dir_name)
                remove_directory(pycache_path)
                dirs.remove(dir_name)  # 从迭代中移除已删除的目录
    
    # 清理.pyc文件
    pyc_files = glob.glob(str(backend_dir / "**/*.pyc"), recursive=True)
    for pyc_file in pyc_files:
        if '.venv' not in pyc_file and 'venv' not in pyc_file:
            remove_file(pyc_file)
    
    # 清理.pyo文件
    pyo_files = glob.glob(str(backend_dir / "**/*.pyo"), recursive=True)
    for pyo_file in pyo_files:
        if '.venv' not in pyo_file and 'venv' not in pyo_file:
            remove_file(pyo_file)

def clean_test_cache():
    """清理测试缓存"""
    print("🧹 清理测试缓存...")
    
    # 清理pytest缓存
    pytest_cache = backend_dir / ".pytest_cache"
    remove_directory(pytest_cache)
    
    # 清理coverage文件
    coverage_files = [
        backend_dir / ".coverage",
        backend_dir / "htmlcov",
        backend_dir / ".coverage.*"
    ]
    
    for coverage_file in coverage_files:
        if coverage_file.name.endswith(".*"):
            # 处理通配符
            for file in glob.glob(str(coverage_file)):
                remove_file(file)
        else:
            if coverage_file.is_file():
                remove_file(coverage_file)
            elif coverage_file.is_dir():
                remove_directory(coverage_file)

def clean_backup_databases():
    """清理备份数据库文件"""
    print("🧹 清理备份数据库文件...")
    
    # 保留主数据库，删除备份文件
    db_patterns = [
        "crewai_studio_backup*.db",
        "crewai_studio.db_backup_*.db",
        "*_backup_*.db",
        "test_*.db",
        "temp_*.db"
    ]
    
    for pattern in db_patterns:
        db_files = glob.glob(str(backend_dir / pattern))
        for db_file in db_files:
            remove_file(db_file)

def clean_log_files():
    """清理日志文件"""
    print("🧹 清理日志文件...")
    
    log_patterns = [
        "*.log",
        "logs/*.log",
        "*.log.*"
    ]
    
    for pattern in log_patterns:
        log_files = glob.glob(str(backend_dir / pattern))
        for log_file in log_files:
            remove_file(log_file)

def clean_temp_files():
    """清理临时文件"""
    print("🧹 清理临时文件...")
    
    temp_patterns = [
        "*.tmp",
        "*.temp",
        "*~",
        ".DS_Store",
        "Thumbs.db",
        "*.swp",
        "*.swo"
    ]
    
    for pattern in temp_patterns:
        temp_files = glob.glob(str(backend_dir / "**" / pattern), recursive=True)
        for temp_file in temp_files:
            if '.venv' not in temp_file and 'venv' not in temp_file:
                remove_file(temp_file)

def clean_build_artifacts():
    """清理构建产物"""
    print("🧹 清理构建产物...")
    
    build_dirs = [
        backend_dir / "build",
        backend_dir / "dist",
        backend_dir / "*.egg-info"
    ]
    
    for build_dir in build_dirs:
        if build_dir.name.endswith("*.egg-info"):
            # 处理通配符
            for dir_path in glob.glob(str(build_dir)):
                remove_directory(dir_path)
        else:
            remove_directory(build_dir)

def show_cleanup_summary():
    """显示清理后的状态"""
    print("\n📊 清理完成统计:")
    
    # 检查剩余的数据库文件
    db_files = list(backend_dir.glob("*.db"))
    print(f"📁 数据库文件: {len(db_files)} 个")
    for db_file in db_files:
        print(f"   - {db_file.name}")
    
    # 检查Python缓存
    pycache_dirs = []
    for root, dirs, files in os.walk(backend_dir):
        if '.venv' not in root and 'venv' not in root:
            for dir_name in dirs:
                if dir_name == '__pycache__':
                    pycache_dirs.append(os.path.join(root, dir_name))
    
    print(f"🐍 Python缓存目录: {len(pycache_dirs)} 个")
    
    # 检查测试缓存
    pytest_cache = backend_dir / ".pytest_cache"
    print(f"🧪 测试缓存: {'存在' if pytest_cache.exists() else '已清理'}")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="项目清理脚本")
    parser.add_argument("--all", action="store_true", help="清理所有类型的文件")
    parser.add_argument("--python", action="store_true", help="只清理Python缓存")
    parser.add_argument("--test", action="store_true", help="只清理测试缓存")
    parser.add_argument("--db", action="store_true", help="只清理备份数据库")
    parser.add_argument("--logs", action="store_true", help="只清理日志文件")
    parser.add_argument("--temp", action="store_true", help="只清理临时文件")
    parser.add_argument("--build", action="store_true", help="只清理构建产物")
    parser.add_argument("--dry-run", action="store_true", help="预览将要删除的文件（不实际删除）")
    
    args = parser.parse_args()
    
    print("🧹 CrewAI Studio 项目清理工具")
    print("=" * 40)
    
    if args.dry_run:
        print("⚠️  预览模式：将显示要删除的文件但不实际删除")
        print()
    
    # 如果没有指定具体选项，默认清理所有
    if not any([args.python, args.test, args.db, args.logs, args.temp, args.build]):
        args.all = True
    
    try:
        if args.all or args.python:
            clean_python_cache()
        
        if args.all or args.test:
            clean_test_cache()
        
        if args.all or args.db:
            clean_backup_databases()
        
        if args.all or args.logs:
            clean_log_files()
        
        if args.all or args.temp:
            clean_temp_files()
        
        if args.all or args.build:
            clean_build_artifacts()
        
        print("\n✅ 清理完成！")
        show_cleanup_summary()
        
    except KeyboardInterrupt:
        print("\n⚠️  清理被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 清理过程中发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()