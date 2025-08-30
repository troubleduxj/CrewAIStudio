#!/usr/bin/env pwsh
# CrewAI Studio 快速启动脚本

Write-Host "🚀 CrewAI Studio 快速启动" -ForegroundColor Magenta
Write-Host "============================" -ForegroundColor Magenta

# 检查Docker是否运行
try {
    docker --version | Out-Null
    Write-Host "✅ Docker已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未安装或未启动" -ForegroundColor Red
    Write-Host "请先安装Docker Desktop并启动" -ForegroundColor Yellow
    exit 1
}

# 检查docker-compose
try {
    docker compose version | Out-Null
    Write-Host "✅ Docker Compose可用" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose不可用" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔨 构建并启动服务..." -ForegroundColor Cyan

# 构建并启动服务
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 服务启动成功!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 前端应用: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "🔧 后端API: http://localhost:8000" -ForegroundColor Yellow
    Write-Host "📚 API文档: http://localhost:8000/docs" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 使用以下命令管理服务:" -ForegroundColor Cyan
    Write-Host "   查看状态: docker compose ps" -ForegroundColor White
    Write-Host "   查看日志: docker compose logs -f" -ForegroundColor White
    Write-Host "   停止服务: docker compose down" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ 服务启动失败" -ForegroundColor Red
    Write-Host "查看错误日志: docker compose logs" -ForegroundColor Yellow
    exit 1
}