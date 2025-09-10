#!/bin/bash
# Migration Helper Script for Unix/Linux/Mac
# Usage: ./migrate.sh <command> [options]

set -e

# Change to backend directory
cd "$(dirname "$0")/.."

show_usage() {
    echo "Usage: ./migrate.sh <command> [options]"
    echo ""
    echo "Available commands:"
    echo "  status     - Check migration status"
    echo "  generate   - Generate new migration"
    echo "  apply      - Apply pending migrations"
    echo "  rollback   - Rollback last migration"
    echo "  history    - Show migration history"
    echo "  validate   - Validate migrations"
    echo "  reset      - Reset database (WARNING: destroys data)"
    echo ""
    echo "Examples:"
    echo "  ./migrate.sh status"
    echo "  ./migrate.sh generate \"Add user preferences\""
    echo "  ./migrate.sh apply"
    echo "  ./migrate.sh rollback"
}

if [ $# -eq 0 ]; then
    show_usage
    exit 0
fi

COMMAND=$1
shift

case $COMMAND in
    "status")
        echo "🔍 Checking migration status..."
        echo "Current revision:"
        alembic current
        echo ""
        echo "Available heads:"
        alembic heads
        ;;
    
    "generate")
        if [ -z "$1" ]; then
            read -p "Enter migration message: " MESSAGE
        else
            MESSAGE="$1"
        fi
        
        if [ -z "$MESSAGE" ]; then
            echo "❌ Migration message is required"
            exit 1
        fi
        
        echo "🔄 Generating migration: $MESSAGE"
        alembic revision --autogenerate -m "$MESSAGE"
        echo ""
        echo "⚠️  Please review the generated migration before applying!"
        ;;
    
    "apply")
        echo "🚀 Applying migrations..."
        alembic upgrade head
        echo "✅ Migration completed!"
        ;;
    
    "rollback")
        echo "⏪ Rolling back last migration..."
        read -p "Are you sure? (y/N): " CONFIRM
        
        if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
            alembic downgrade -1
            echo "✅ Rollback completed!"
        else
            echo "Rollback cancelled."
        fi
        ;;
    
    "history")
        echo "📚 Migration history:"
        alembic history --verbose
        ;;
    
    "validate")
        echo "🔍 Validating migrations..."
        python -m scripts.migration_helpers validate
        ;;
    
    "reset")
        echo "⚠️  WARNING: This will destroy all data!"
        read -p "Type RESET to confirm: " CONFIRM
        
        if [ "$CONFIRM" = "RESET" ]; then
            echo "🔄 Resetting database..."
            alembic downgrade base
            alembic upgrade head
            echo "✅ Database reset completed!"
        else
            echo "Reset cancelled."
        fi
        ;;
    
    *)
        echo "❌ Unknown command: $COMMAND"
        echo ""
        show_usage
        exit 1
        ;;
esac