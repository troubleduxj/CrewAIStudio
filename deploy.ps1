#!/usr/bin/env pwsh
# CrewAI Studio Docker部署脚本
# 用于管理Docker容器的构建、启动、停止和清理

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("build", "start", "stop", "restart", "clean", "logs", "status")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("frontend", "backend", "all")]
    [string]$Service = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 检查Docker是否安装
function Test-DockerInstalled {
    try {
        docker --version | Out-Null
        return $true
    }
    catch {
        Write-ColorOutput "错误: Docker未安装或未启动" "Red"
        Write-ColorOutput "请先安装Docker Desktop并确保其正在运行" "Yellow"
        return $false
    }
}

# 检查docker-compose是否可用
function Test-DockerComposeAvailable {
    try {
        docker compose version | Out-Null
        return $true
    }
    catch {
        try {
            docker-compose --version | Out-Null
            return $true
        }
        catch {
            Write-ColorOutput "错误: docker-compose未安装" "Red"
            return $false
        }
    }
}

# 构建服务
function Build-Services {
    param([string]$ServiceName)
    
    Write-ColorOutput "🔨 构建Docker镜像..." "Cyan"
    
    if ($ServiceName -eq "all") {
        docker compose build
    } else {
        docker compose build $ServiceName
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ 构建完成" "Green"
    } else {
        Write-ColorOutput "❌ 构建失败" "Red"
        exit 1
    }
}

# 启动服务
function Start-Services {
    param([string]$ServiceName)
    
    Write-ColorOutput "🚀 启动服务..." "Cyan"
    
    if ($ServiceName -eq "all") {
        docker compose up -d
    } else {
        docker compose up -d $ServiceName
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ 服务启动成功" "Green"
        Write-ColorOutput "前端地址: http://localhost:3000" "Yellow"
        Write-ColorOutput "后端地址: http://localhost:8000" "Yellow"
        Write-ColorOutput "API文档: http://localhost:8000/docs" "Yellow"
    } else {
        Write-ColorOutput "❌ 服务启动失败" "Red"
        exit 1
    }
}

# 停止服务
function Stop-Services {
    param([string]$ServiceName)
    
    Write-ColorOutput "🛑 停止服务..." "Cyan"
    
    if ($ServiceName -eq "all") {
        docker compose down
    } else {
        docker compose stop $ServiceName
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ 服务已停止" "Green"
    } else {
        Write-ColorOutput "❌ 停止服务失败" "Red"
        exit 1
    }
}

# 重启服务
function Restart-Services {
    param([string]$ServiceName)
    
    Write-ColorOutput "🔄 重启服务..." "Cyan"
    Stop-Services $ServiceName
    Start-Services $ServiceName
}

# 清理资源
function Clean-Resources {
    Write-ColorOutput "🧹 清理Docker资源..." "Cyan"
    
    if ($Force) {
        Write-ColorOutput "强制清理所有相关资源..." "Yellow"
        docker compose down -v --rmi all --remove-orphans
        docker system prune -f
    } else {
        docker compose down -v --remove-orphans
    }
    
    Write-ColorOutput "✅ 清理完成" "Green"
}

# 查看日志
function Show-Logs {
    param([string]$ServiceName)
    
    Write-ColorOutput "📋 查看服务日志..." "Cyan"
    
    if ($ServiceName -eq "all") {
        docker compose logs -f
    } else {
        docker compose logs -f $ServiceName
    }
}

# 查看状态
function Show-Status {
    Write-ColorOutput "📊 服务状态:" "Cyan"
    docker compose ps
    
    Write-ColorOutput "\n🐳 Docker镜像:" "Cyan"
    docker images | Select-String "crewai-studio"
    
    Write-ColorOutput "\n🌐 网络:" "Cyan"
    docker network ls | Select-String "crewai"
    
    Write-ColorOutput "\n💾 数据卷:" "Cyan"
    docker volume ls | Select-String "crewai"
}

# 主逻辑
Write-ColorOutput "CrewAI Studio Docker部署管理器" "Magenta"
Write-ColorOutput "==============================" "Magenta"

# 检查Docker环境
if (-not (Test-DockerInstalled)) {
    exit 1
}

if (-not (Test-DockerComposeAvailable)) {
    exit 1
}

# 执行相应操作
switch ($Action) {
    "build" {
        Build-Services $Service
    }
    "start" {
        Start-Services $Service
    }
    "stop" {
        Stop-Services $Service
    }
    "restart" {
        Restart-Services $Service
    }
    "clean" {
        Clean-Resources
    }
    "logs" {
        Show-Logs $Service
    }
    "status" {
        Show-Status
    }
}

Write-ColorOutput "\n操作完成!" "Green"