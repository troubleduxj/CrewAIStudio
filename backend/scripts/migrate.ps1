# Migration Helper Script for PowerShell
# Usage: .\migrate.ps1 <command> [options]

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Message,
    
    [Parameter()]
    [int]$Steps = 1
)

# Change to backend directory
$BackendDir = Split-Path -Parent $PSScriptRoot
Set-Location $BackendDir

function Show-Usage {
    Write-Host "Usage: .\migrate.ps1 <command> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Cyan
    Write-Host "  status     - Check migration status"
    Write-Host "  generate   - Generate new migration"
    Write-Host "  apply      - Apply pending migrations"
    Write-Host "  rollback   - Rollback last migration"
    Write-Host "  history    - Show migration history"
    Write-Host "  validate   - Validate migrations"
    Write-Host "  reset      - Reset database (WARNING: destroys data)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\migrate.ps1 status"
    Write-Host "  .\migrate.ps1 generate -Message 'Add user preferences'"
    Write-Host "  .\migrate.ps1 apply"
    Write-Host "  .\migrate.ps1 rollback"
}

function Invoke-AlembicCommand {
    param([string]$AlembicArgs)
    
    try {
        $result = Invoke-Expression "alembic $AlembicArgs"
        return $result
    }
    catch {
        Write-Error "Failed to execute alembic command: $AlembicArgs"
        Write-Error $_.Exception.Message
        exit 1
    }
}

if (-not $Command) {
    Show-Usage
    exit 0
}

switch ($Command.ToLower()) {
    "status" {
        Write-Host "🔍 Checking migration status..." -ForegroundColor Blue
        Write-Host "Current revision:" -ForegroundColor Yellow
        Invoke-AlembicCommand "current"
        Write-Host ""
        Write-Host "Available heads:" -ForegroundColor Yellow
        Invoke-AlembicCommand "heads"
    }
    
    "generate" {
        if (-not $Message) {
            $Message = Read-Host "Enter migration message"
        }
        
        if (-not $Message) {
            Write-Error "Migration message is required"
            exit 1
        }
        
        Write-Host "🔄 Generating migration: $Message" -ForegroundColor Blue
        Invoke-AlembicCommand "revision --autogenerate -m `"$Message`""
        Write-Host ""
        Write-Host "⚠️  Please review the generated migration before applying!" -ForegroundColor Yellow
    }
    
    "apply" {
        Write-Host "🚀 Applying migrations..." -ForegroundColor Blue
        Invoke-AlembicCommand "upgrade head"
        Write-Host "✅ Migration completed!" -ForegroundColor Green
    }
    
    "rollback" {
        Write-Host "⏪ Rolling back last migration..." -ForegroundColor Blue
        $confirm = Read-Host "Are you sure? (y/N)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Invoke-AlembicCommand "downgrade -1"
            Write-Host "✅ Rollback completed!" -ForegroundColor Green
        }
        else {
            Write-Host "Rollback cancelled." -ForegroundColor Yellow
        }
    }
    
    "history" {
        Write-Host "📚 Migration history:" -ForegroundColor Blue
        Invoke-AlembicCommand "history --verbose"
    }
    
    "validate" {
        Write-Host "🔍 Validating migrations..." -ForegroundColor Blue
        python -m scripts.migration_helpers validate
    }
    
    "reset" {
        Write-Host "⚠️  WARNING: This will destroy all data!" -ForegroundColor Red
        $confirm = Read-Host "Type RESET to confirm"
        
        if ($confirm -eq "RESET") {
            Write-Host "🔄 Resetting database..." -ForegroundColor Blue
            Invoke-AlembicCommand "downgrade base"
            Invoke-AlembicCommand "upgrade head"
            Write-Host "✅ Database reset completed!" -ForegroundColor Green
        }
        else {
            Write-Host "Reset cancelled." -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Error "Unknown command: $Command"
        Write-Host ""
        Show-Usage
        exit 1
    }
}