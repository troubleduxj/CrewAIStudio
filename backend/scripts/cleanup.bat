@echo off
REM 项目清理脚本 - Windows版本
REM 清理临时文件、缓存文件和测试生成的文件

setlocal enabledelayedexpansion

cd /d "%~dp0\.."

echo 🧹 CrewAI Studio 项目清理工具
echo ========================================

if "%1"=="" (
    echo 使用方法: cleanup.bat [选项]
    echo.
    echo 可用选项:
    echo   all      - 清理所有类型的文件 ^(默认^)
    echo   python   - 只清理Python缓存
    echo   test     - 只清理测试缓存
    echo   db       - 只清理备份数据库
    echo   logs     - 只清理日志文件
    echo   temp     - 只清理临时文件
    echo.
    echo 示例:
    echo   cleanup.bat all
    echo   cleanup.bat python
    echo.
    set CLEAN_ALL=1
) else (
    set CLEAN_ALL=0
    if /i "%1"=="all" set CLEAN_ALL=1
    if /i "%1"=="python" set CLEAN_PYTHON=1
    if /i "%1"=="test" set CLEAN_TEST=1
    if /i "%1"=="db" set CLEAN_DB=1
    if /i "%1"=="logs" set CLEAN_LOGS=1
    if /i "%1"=="temp" set CLEAN_TEMP=1
)

REM 清理Python缓存
if "%CLEAN_ALL%"=="1" set CLEAN_PYTHON=1
if "%CLEAN_PYTHON%"=="1" (
    echo 🐍 清理Python缓存文件...
    
    REM 删除__pycache__目录（排除.venv）
    for /f "delims=" %%i in ('dir /s /b /ad __pycache__ 2^>nul ^| findstr /v "\.venv"') do (
        if exist "%%i" (
            rmdir /s /q "%%i" 2>nul
            if !errorlevel! equ 0 echo ✅ 已删除: %%i
        )
    )
    
    REM 删除.pyc文件（排除.venv）
    for /f "delims=" %%i in ('dir /s /b *.pyc 2^>nul ^| findstr /v "\.venv"') do (
        if exist "%%i" (
            del /q "%%i" 2>nul
            if !errorlevel! equ 0 echo ✅ 已删除: %%i
        )
    )
)

REM 清理测试缓存
if "%CLEAN_ALL%"=="1" set CLEAN_TEST=1
if "%CLEAN_TEST%"=="1" (
    echo 🧪 清理测试缓存...
    
    if exist ".pytest_cache" (
        rmdir /s /q ".pytest_cache" 2>nul
        if !errorlevel! equ 0 echo ✅ 已删除: .pytest_cache
    )
    
    if exist ".coverage" (
        del /q ".coverage" 2>nul
        if !errorlevel! equ 0 echo ✅ 已删除: .coverage
    )
    
    if exist "htmlcov" (
        rmdir /s /q "htmlcov" 2>nul
        if !errorlevel! equ 0 echo ✅ 已删除: htmlcov
    )
)

REM 清理备份数据库
if "%CLEAN_ALL%"=="1" set CLEAN_DB=1
if "%CLEAN_DB%"=="1" (
    echo 🗄️ 清理备份数据库文件...
    
    for %%f in (crewai_studio_backup*.db crewai_studio.db_backup_*.db *_backup_*.db test_*.db temp_*.db) do (
        if exist "%%f" (
            del /q "%%f" 2>nul
            if !errorlevel! equ 0 echo ✅ 已删除: %%f
        )
    )
)

REM 清理日志文件
if "%CLEAN_ALL%"=="1" set CLEAN_LOGS=1
if "%CLEAN_LOGS%"=="1" (
    echo 📋 清理日志文件...
    
    for %%f in (*.log logs\*.log *.log.*) do (
        if exist "%%f" (
            del /q "%%f" 2>nul
            if !errorlevel! equ 0 echo ✅ 已删除: %%f
        )
    )
)

REM 清理临时文件
if "%CLEAN_ALL%"=="1" set CLEAN_TEMP=1
if "%CLEAN_TEMP%"=="1" (
    echo 🗑️ 清理临时文件...
    
    for %%f in (*.tmp *.temp *~ .DS_Store Thumbs.db *.swp *.swo) do (
        if exist "%%f" (
            del /q "%%f" 2>nul
            if !errorlevel! equ 0 echo ✅ 已删除: %%f
        )
    )
)

echo.
echo ✅ 清理完成！
echo.
echo 📊 清理后状态:

REM 统计剩余文件
set DB_COUNT=0
for %%f in (*.db) do set /a DB_COUNT+=1
echo 📁 数据库文件: %DB_COUNT% 个

set PYCACHE_COUNT=0
for /f %%i in ('dir /s /b /ad __pycache__ 2^>nul ^| findstr /v "\.venv" ^| find /c /v ""') do set PYCACHE_COUNT=%%i
echo 🐍 Python缓存目录: %PYCACHE_COUNT% 个

if exist ".pytest_cache" (
    echo 🧪 测试缓存: 存在
) else (
    echo 🧪 测试缓存: 已清理
)

echo.
echo 💡 提示: 可以使用 'python -m scripts.cleanup --help' 查看更多选项