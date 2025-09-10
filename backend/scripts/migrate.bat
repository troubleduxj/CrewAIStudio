@echo off
REM Migration Helper Script for Windows
REM Usage: migrate.bat <command> [options]

setlocal enabledelayedexpansion

cd /d "%~dp0\.."

if "%1"=="" (
    echo Usage: migrate.bat ^<command^> [options]
    echo.
    echo Available commands:
    echo   status     - Check migration status
    echo   generate   - Generate new migration
    echo   apply      - Apply pending migrations
    echo   rollback   - Rollback last migration
    echo   history    - Show migration history
    echo   validate   - Validate migrations
    echo   reset      - Reset database ^(WARNING: destroys data^)
    echo.
    echo Examples:
    echo   migrate.bat status
    echo   migrate.bat generate "Add user preferences"
    echo   migrate.bat apply
    echo   migrate.bat rollback
    goto :eof
)

set COMMAND=%1
shift

if "%COMMAND%"=="status" (
    echo Checking migration status...
    alembic current
    alembic heads
    goto :eof
)

if "%COMMAND%"=="generate" (
    if "%1"=="" (
        set /p MESSAGE="Enter migration message: "
    ) else (
        set MESSAGE=%1
    )
    echo Generating migration: !MESSAGE!
    alembic revision --autogenerate -m "!MESSAGE!"
    echo.
    echo Please review the generated migration before applying!
    goto :eof
)

if "%COMMAND%"=="apply" (
    echo Applying migrations...
    alembic upgrade head
    echo Migration completed!
    goto :eof
)

if "%COMMAND%"=="rollback" (
    echo Rolling back last migration...
    set /p CONFIRM="Are you sure? (y/N): "
    if /i "!CONFIRM!"=="y" (
        alembic downgrade -1
        echo Rollback completed!
    ) else (
        echo Rollback cancelled.
    )
    goto :eof
)

if "%COMMAND%"=="history" (
    echo Migration history:
    alembic history --verbose
    goto :eof
)

if "%COMMAND%"=="validate" (
    echo Validating migrations...
    python -m scripts.migration_helpers validate
    goto :eof
)

if "%COMMAND%"=="reset" (
    echo WARNING: This will destroy all data!
    set /p CONFIRM="Type RESET to confirm: "
    if "!CONFIRM!"=="RESET" (
        alembic downgrade base
        alembic upgrade head
        echo Database reset completed!
    ) else (
        echo Reset cancelled.
    )
    goto :eof
)

echo Unknown command: %COMMAND%
echo Run 'migrate.bat' without arguments to see usage.