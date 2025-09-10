#!/usr/bin/env python3
"""
Migration Helper Scripts for CrewAI Studio

This module provides convenient functions for common migration tasks.
Run with: python -m scripts.migration_helpers <command>
"""

import os
import sys
import subprocess
import argparse
from datetime import datetime
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def run_command(cmd, cwd=None):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            cwd=cwd or backend_dir,
            capture_output=True, 
            text=True, 
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {cmd}")
        print(f"Error output: {e.stderr}")
        sys.exit(1)

def check_migration_status():
    """Check the current migration status."""
    print("🔍 Checking migration status...")
    
    # Check current revision
    current = run_command("alembic current")
    print(f"Current revision: {current}")
    
    # Check if there are pending migrations
    try:
        heads = run_command("alembic heads")
        print(f"Available heads: {heads}")
        
        # Check if current matches head
        if current and heads and current.split()[0] in heads:
            print("✅ Database is up to date")
        else:
            print("⚠️  Database may need updates")
            
    except Exception as e:
        print(f"Could not determine migration status: {e}")

def generate_migration(message=None):
    """Generate a new migration with autogenerate."""
    if not message:
        message = input("Enter migration message: ").strip()
        if not message:
            print("Migration message is required")
            sys.exit(1)
    
    print(f"🔄 Generating migration: {message}")
    
    # Generate the migration
    output = run_command(f'alembic revision --autogenerate -m "{message}"')
    print(output)
    
    # Extract the revision ID from output
    lines = output.split('\n')
    revision_file = None
    for line in lines:
        if 'Generating' in line and 'alembic/versions' in line:
            revision_file = line.split('/')[-1]
            break
    
    if revision_file:
        print(f"📝 Created migration file: {revision_file}")
        print("⚠️  Please review the generated migration before applying!")
        
        # Show the file path for easy access
        versions_dir = backend_dir / "alembic" / "versions"
        migration_files = list(versions_dir.glob("*.py"))
        if migration_files:
            latest_file = max(migration_files, key=os.path.getctime)
            print(f"📁 File location: {latest_file}")
    
def apply_migrations():
    """Apply all pending migrations."""
    print("🚀 Applying migrations...")
    
    # Check status first
    check_migration_status()
    
    # Apply migrations
    output = run_command("alembic upgrade head")
    print(output)
    
    print("✅ Migrations applied successfully")
    
    # Check final status
    check_migration_status()

def rollback_migration(steps=1):
    """Rollback migrations by specified number of steps."""
    print(f"⏪ Rolling back {steps} migration(s)...")
    
    # Show current status
    check_migration_status()
    
    # Confirm rollback
    confirm = input(f"Are you sure you want to rollback {steps} migration(s)? (y/N): ")
    if confirm.lower() != 'y':
        print("Rollback cancelled")
        return
    
    # Perform rollback
    if steps == 1:
        output = run_command("alembic downgrade -1")
    else:
        output = run_command(f"alembic downgrade -{steps}")
    
    print(output)
    print("✅ Rollback completed")
    
    # Check final status
    check_migration_status()

def show_history():
    """Show migration history."""
    print("📚 Migration history:")
    output = run_command("alembic history --verbose")
    print(output)

def validate_migrations():
    """Validate that migrations can be applied and rolled back."""
    print("🔍 Validating migrations...")
    
    # Create a backup of current state
    print("Creating backup...")
    backup_file = f"migration_test_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    
    try:
        # Get current revision
        current_rev = run_command("alembic current")
        print(f"Current revision: {current_rev}")
        
        # Try to apply all migrations
        print("Testing migration application...")
        run_command("alembic upgrade head")
        
        # Try to rollback to original state
        if current_rev:
            print("Testing rollback...")
            rev_id = current_rev.split()[0] if current_rev else "base"
            run_command(f"alembic downgrade {rev_id}")
            
        print("✅ Migration validation successful")
        
    except Exception as e:
        print(f"❌ Migration validation failed: {e}")
        sys.exit(1)

def create_manual_migration(message=None):
    """Create an empty migration file for manual editing."""
    if not message:
        message = input("Enter migration message: ").strip()
        if not message:
            print("Migration message is required")
            sys.exit(1)
    
    print(f"📝 Creating manual migration: {message}")
    
    # Create empty migration
    output = run_command(f'alembic revision -m "{message}"')
    print(output)
    
    print("📝 Empty migration created. Edit the file to add your custom operations.")

def reset_database():
    """Reset database to base state (removes all data!)."""
    print("⚠️  WARNING: This will remove ALL data from the database!")
    confirm = input("Type 'RESET' to confirm: ")
    
    if confirm != 'RESET':
        print("Reset cancelled")
        return
    
    print("🔄 Resetting database...")
    
    # Downgrade to base
    run_command("alembic downgrade base")
    
    # Upgrade to head
    run_command("alembic upgrade head")
    
    print("✅ Database reset completed")

def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(description="Migration Helper Scripts")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Status command
    subparsers.add_parser('status', help='Check migration status')
    
    # Generate command
    gen_parser = subparsers.add_parser('generate', help='Generate new migration')
    gen_parser.add_argument('-m', '--message', help='Migration message')
    
    # Apply command
    subparsers.add_parser('apply', help='Apply pending migrations')
    
    # Rollback command
    rollback_parser = subparsers.add_parser('rollback', help='Rollback migrations')
    rollback_parser.add_argument('-s', '--steps', type=int, default=1, help='Number of steps to rollback')
    
    # History command
    subparsers.add_parser('history', help='Show migration history')
    
    # Validate command
    subparsers.add_parser('validate', help='Validate migrations')
    
    # Manual command
    manual_parser = subparsers.add_parser('manual', help='Create manual migration')
    manual_parser.add_argument('-m', '--message', help='Migration message')
    
    # Reset command
    subparsers.add_parser('reset', help='Reset database (WARNING: destroys data)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Execute the appropriate command
    if args.command == 'status':
        check_migration_status()
    elif args.command == 'generate':
        generate_migration(args.message)
    elif args.command == 'apply':
        apply_migrations()
    elif args.command == 'rollback':
        rollback_migration(args.steps)
    elif args.command == 'history':
        show_history()
    elif args.command == 'validate':
        validate_migrations()
    elif args.command == 'manual':
        create_manual_migration(args.message)
    elif args.command == 'reset':
        reset_database()

if __name__ == "__main__":
    main()