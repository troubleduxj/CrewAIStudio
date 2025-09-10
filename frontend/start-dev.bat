@echo off
echo 🔍 正在查找可用端口...

:: 检查端口3001
netstat -an | find "3001" >nul
if %errorlevel% neq 0 (
    echo ✅ 端口3001可用，启动开发服务器...
    npm run dev:3001
    goto :end
)

:: 检查端口3002
netstat -an | find "3002" >nul
if %errorlevel% neq 0 (
    echo ✅ 端口3002可用，启动开发服务器...
    npm run dev:3002
    goto :end
)

:: 检查端口3003
netstat -an | find "3003" >nul
if %errorlevel% neq 0 (
    echo ✅ 端口3003可用，启动开发服务器...
    npx next dev -p 3003
    goto :end
)

:: 检查端口3004
netstat -an | find "3004" >nul
if %errorlevel% neq 0 (
    echo ✅ 端口3004可用，启动开发服务器...
    npx next dev -p 3004
    goto :end
)

echo ❌ 端口3001-3004都被占用，请手动释放端口或使用其他端口
echo 💡 你可以尝试运行: npx next dev -p 3005

:end
pause