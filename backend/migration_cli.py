#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Migration CLI
数据库迁移命令行工具

This script provides a command-line interface for common database migration operations
using the migration utilities.
"""

import argparse
import sys
import json
from pathlib import Path

# Add the backend directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.utils.migration import (
    MigrationUtilities,
    MigrationError,
    get_migration_status,
    create_backup,
    verify_backup,
    upgrade_to_head
)
from app.utils.migration_validator import validate_migration_system, validate_migration_file


def print_json(data):
    """Print data as formatted JSON."""
    print(json.dumps(data, indent=2, default=str))


def cmd_status(args):
    """Show migration status."""
    try:
        print("🔍 Checking migration status...")
        status = get_migration_status()
        print("Migration Status:")
        print("=" * 50)
        print_json(status)
        
        if status["is_up_to_date"]:
            print("\n✅ Database is up to date!")
        else:
            print(f"\n⚠️  Database needs {len(status['pending_migrations'])} migration(s)")
            print("\nPending migrations:")
            for migration in status['pending_migrations']:
                print(f"  📄 {migration['revision']}: {migration['doc']}")
            print(f"\n💡 Run 'python migration_cli.py upgrade' to apply pending migrations")
            
    except MigrationError as e:
        print(f"❌ Error checking migration status:")
        print(f"   {str(e)}")
        print(f"\n💡 For more help, check the troubleshooting guide in MIGRATION_UTILITIES.md")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print(f"💡 This may indicate a configuration or environment issue")
        sys.exit(1)


def cmd_backup(args):
    """Create database backup."""
    try:
        backup_path = create_backup(args.path)
        print(f"✅ Database backup created: {backup_path}")
        
        if args.verify:
            print("\nVerifying backup...")
            verification = verify_backup(backup_path)
            print_json(verification)
            
            if verification["is_valid"]:
                print("✅ Backup verification successful!")
            else:
                print("❌ Backup verification failed!")
                for error in verification["errors"]:
                    print(f"  - {error}")
                    
    except MigrationError as e:
        print(f"❌ Error creating backup: {e}")
        sys.exit(1)


def cmd_verify(args):
    """Verify database backup."""
    try:
        verification = verify_backup(args.backup_path)
        print("Backup Verification Results:")
        print("=" * 50)
        print_json(verification)
        
        if verification["is_valid"]:
            print("\n✅ Backup is valid!")
        else:
            print("\n❌ Backup verification failed!")
            for error in verification["errors"]:
                print(f"  - {error}")
                
    except MigrationError as e:
        print(f"❌ Error verifying backup: {e}")
        sys.exit(1)


def cmd_upgrade(args):
    """Upgrade database."""
    try:
        utils = MigrationUtilities()
        
        # Show current status
        print("🔍 Checking current migration status...")
        status = get_migration_status()
        print(f"📊 Current revision: {status['current_revision'] or 'None (fresh database)'}")
        print(f"📊 Head revision: {status['head_revision'] or 'None (no migrations)'}")
        
        if status["is_up_to_date"]:
            print("✅ Database is already up to date!")
            return
        
        # Show what will be applied
        if status["pending_migrations"]:
            print(f"\n📋 Will apply {len(status['pending_migrations'])} migration(s):")
            for migration in status["pending_migrations"]:
                print(f"   📄 {migration['revision']}: {migration['doc']}")
        
        # Create backup if requested
        if args.backup:
            print("\n💾 Creating backup before upgrade...")
            try:
                backup_path = create_backup()
                print(f"✅ Backup created: {backup_path}")
            except Exception as backup_error:
                print(f"⚠️  Backup creation failed: {backup_error}")
                response = input("Continue with upgrade without backup? (y/N): ")
                if response.lower() != 'y':
                    print("❌ Upgrade cancelled by user")
                    return
        
        # Perform upgrade
        print(f"\n🚀 Upgrading database to: {args.revision}")
        result = utils.upgrade_database(args.revision)
        
        print("\n📊 Upgrade Results:")
        print_json(result)
        print("✅ Database upgrade completed successfully!")
        
        # Show final status
        final_status = get_migration_status()
        if final_status["is_up_to_date"]:
            print("🎉 Database is now up to date!")
        else:
            print("⚠️  Warning: Database may not be fully up to date")
        
    except MigrationError as e:
        print(f"❌ Migration upgrade failed:")
        print(f"   {str(e)}")
        print(f"\n💡 Check the error details above for troubleshooting steps")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n❌ Upgrade cancelled by user")
        print(f"⚠️  Database may be in an inconsistent state")
        print(f"💡 Check migration status and consider restoring from backup if needed")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error during upgrade: {e}")
        print(f"⚠️  Database may be in an inconsistent state")
        print(f"💡 Check migration status and database logs for more information")
        sys.exit(1)


def cmd_downgrade(args):
    """Downgrade database."""
    try:
        utils = MigrationUtilities()
        
        # Show current status
        print("Current migration status:")
        status = get_migration_status()
        print(f"Current revision: {status['current_revision']}")
        
        # Create backup if requested
        if args.backup:
            print("\nCreating backup before downgrade...")
            backup_path = create_backup()
            print(f"✅ Backup created: {backup_path}")
        
        # Perform downgrade
        print(f"\nDowngrading database to: {args.revision}")
        result = utils.downgrade_database(args.revision)
        print_json(result)
        print("✅ Database downgrade completed!")
        
    except MigrationError as e:
        print(f"❌ Error downgrading database: {e}")
        sys.exit(1)


def cmd_generate(args):
    """Generate new migration."""
    try:
        utils = MigrationUtilities()
        
        print(f"🔧 Generating migration: '{args.message}'")
        if args.autogenerate:
            print("🔍 Auto-detecting model changes...")
        else:
            print("📝 Creating empty migration template...")
            
        result = utils.generate_migration(args.message, args.autogenerate)
        
        print("\n📊 Generation Results:")
        print_json(result)
        print("✅ Migration generated successfully!")
        
        if args.autogenerate:
            print("\n📋 Next steps:")
            print("1. Review the generated migration file for accuracy")
            print("2. Make any necessary manual adjustments")
            print("3. Test the migration on a development database")
            print("4. Apply the migration using: python migration_cli.py upgrade")
        else:
            print("\n📋 Next steps:")
            print("1. Edit the generated migration file to add your changes")
            print("2. Test the migration on a development database")
            print("3. Apply the migration using: python migration_cli.py upgrade")
        
    except MigrationError as e:
        print(f"❌ Migration generation failed:")
        print(f"   {str(e)}")
        print(f"\n💡 Check the error details above for troubleshooting steps")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error during generation: {e}")
        print(f"💡 This may indicate a model import or configuration issue")
        sys.exit(1)


def cmd_history(args):
    """Show migration history."""
    try:
        utils = MigrationUtilities()
        history = utils.get_migration_history()
        
        print("Migration History:")
        print("=" * 50)
        
        if not history:
            print("No migrations found.")
            return
        
        for i, revision in enumerate(history, 1):
            print(f"{i}. {revision['revision']}")
            if revision['doc']:
                print(f"   Description: {revision['doc']}")
            if revision['down_revision']:
                print(f"   Previous: {revision['down_revision']}")
            if revision['create_date']:
                print(f"   Created: {revision['create_date']}")
            print()
            
    except MigrationError as e:
        print(f"❌ Error retrieving migration history: {e}")
        sys.exit(1)


def cmd_validate(args):
    """Validate migration system."""
    try:
        print("🔍 Running comprehensive migration system validation...")
        
        if args.file:
            # Validate specific migration file
            print(f"📄 Validating migration file: {args.file}")
            result = validate_migration_file(args.file)
            
            print("\n📊 Validation Results:")
            print_json(result)
            
            if result["is_valid"]:
                print("✅ Migration file is valid!")
            else:
                print("❌ Migration file has issues!")
                for issue in result["issues"]:
                    print(f"   🔴 {issue}")
            
            if result["warnings"]:
                print("\n⚠️  Warnings:")
                for warning in result["warnings"]:
                    print(f"   🟡 {warning}")
        else:
            # Comprehensive system validation
            result = validate_migration_system()
            
            print("\n📊 Comprehensive Validation Results:")
            print("=" * 60)
            
            # Show overall status
            status_emoji = {
                "PASS": "✅",
                "WARN": "⚠️",
                "FAIL": "❌",
                "ERROR": "💥"
            }
            
            print(f"Overall Status: {status_emoji.get(result['overall_status'], '❓')} {result['overall_status']}")
            print(f"Total Issues: {result['summary']['total_issues']}")
            print(f"Total Warnings: {result['summary']['total_warnings']}")
            
            # Show critical issues
            if result['summary']['critical_issues']:
                print(f"\n🔴 Critical Issues:")
                for issue in result['summary']['critical_issues']:
                    print(f"   • {issue}")
            
            # Show database state
            db_state = result['database_state']
            print(f"\n🗄️  Database State: {'✅ Ready' if db_state['is_ready'] else '❌ Not Ready'}")
            if db_state.get('database_info'):
                info = db_state['database_info']
                print(f"   Type: {info.get('type', 'Unknown')}")
                print(f"   Connection: {info.get('connection', 'Unknown')}")
                if 'free_space_mb' in info:
                    print(f"   Free Space: {info['free_space_mb']} MB")
            
            # Show migration sequence
            seq_state = result['migration_sequence']
            print(f"\n📋 Migration Sequence: {'✅ Valid' if seq_state['is_valid'] else '❌ Invalid'}")
            if seq_state.get('sequence_info'):
                print(f"   Total Migrations: {seq_state['sequence_info'].get('total_migrations', 0)}")
            
            # Show file validation summary
            if result['migration_files']:
                valid_files = sum(1 for f in result['migration_files'] if f['is_valid'])
                total_files = len(result['migration_files'])
                print(f"\n📄 Migration Files: {valid_files}/{total_files} valid")
            
            if args.verbose:
                print(f"\n📋 Detailed Results:")
                print_json(result)
            
            # Exit with appropriate code
            if result['overall_status'] in ['FAIL', 'ERROR']:
                print(f"\n💡 Run with --verbose for detailed information")
                sys.exit(1)
            elif result['overall_status'] == 'WARN':
                print(f"\n💡 System has warnings but is functional")
            else:
                print(f"\n🎉 Migration system is healthy!")
                
    except Exception as e:
        print(f"❌ Validation failed with error: {e}")
        print(f"💡 This may indicate a configuration or system issue")
        sys.exit(1)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="CrewAI Studio Migration CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Status command
    status_parser = subparsers.add_parser("status", help="Show migration status")
    status_parser.set_defaults(func=cmd_status)
    
    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Create database backup")
    backup_parser.add_argument("--path", help="Custom backup file path")
    backup_parser.add_argument("--verify", action="store_true", help="Verify backup after creation")
    backup_parser.set_defaults(func=cmd_backup)
    
    # Verify command
    verify_parser = subparsers.add_parser("verify", help="Verify database backup")
    verify_parser.add_argument("backup_path", help="Path to backup file to verify")
    verify_parser.set_defaults(func=cmd_verify)
    
    # Upgrade command
    upgrade_parser = subparsers.add_parser("upgrade", help="Upgrade database")
    upgrade_parser.add_argument("--revision", default="head", help="Target revision (default: head)")
    upgrade_parser.add_argument("--backup", action="store_true", help="Create backup before upgrade")
    upgrade_parser.set_defaults(func=cmd_upgrade)
    
    # Downgrade command
    downgrade_parser = subparsers.add_parser("downgrade", help="Downgrade database")
    downgrade_parser.add_argument("revision", help="Target revision to downgrade to")
    downgrade_parser.add_argument("--backup", action="store_true", help="Create backup before downgrade")
    downgrade_parser.set_defaults(func=cmd_downgrade)
    
    # Generate command
    generate_parser = subparsers.add_parser("generate", help="Generate new migration")
    generate_parser.add_argument("message", help="Migration description message")
    generate_parser.add_argument("--no-autogenerate", dest="autogenerate", action="store_false", 
                                help="Disable auto-generation from model changes")
    generate_parser.set_defaults(func=cmd_generate)
    
    # History command
    history_parser = subparsers.add_parser("history", help="Show migration history")
    history_parser.set_defaults(func=cmd_history)
    
    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate migration system")
    validate_parser.add_argument("--file", help="Validate specific migration file")
    validate_parser.add_argument("--verbose", action="store_true", help="Show detailed validation results")
    validate_parser.set_defaults(func=cmd_validate)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Execute the selected command
    args.func(args)


if __name__ == "__main__":
    main()