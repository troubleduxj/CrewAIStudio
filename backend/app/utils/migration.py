#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Migration Utilities
数据库迁移工具模块

This module provides utility functions for database migration operations,
including backup verification, migration status checking, and common migration tasks.
"""

import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import sqlite3
import logging

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MigrationError(Exception):
    """Custom exception for migration-related errors."""
    
    def __init__(self, message: str, original_error: Optional[Exception] = None, troubleshooting_steps: Optional[List[str]] = None):
        """
        Initialize MigrationError with enhanced error information.
        
        Args:
            message: Primary error message
            original_error: The original exception that caused this error
            troubleshooting_steps: List of troubleshooting steps for the user
        """
        self.original_error = original_error
        self.troubleshooting_steps = troubleshooting_steps or []
        
        # Build comprehensive error message
        full_message = message
        
        if self.troubleshooting_steps:
            full_message += "\n\nTroubleshooting steps:"
            for i, step in enumerate(self.troubleshooting_steps, 1):
                full_message += f"\n{i}. {step}"
        
        if original_error:
            full_message += f"\n\nOriginal error: {str(original_error)}"
            full_message += f"\nError type: {type(original_error).__name__}"
        
        super().__init__(full_message)


class DatabaseConnectionError(MigrationError):
    """Specific error for database connection issues."""
    pass


class MigrationConflictError(MigrationError):
    """Specific error for migration conflicts."""
    pass


class SchemaValidationError(MigrationError):
    """Specific error for schema validation issues."""
    pass


class MigrationUtilities:
    """
    Migration utility class providing helper functions for database migration operations.
    """
    
    def __init__(self):
        """Initialize migration utilities with current configuration."""
        self.database_url = settings.DATABASE_URL
        self.alembic_cfg_path = Path(__file__).parent.parent.parent / "alembic.ini"
        self.alembic_cfg = Config(str(self.alembic_cfg_path))
        
    def get_current_revision(self) -> Optional[str]:
        """
        Get the current database revision.
        
        Returns:
            Optional[str]: Current revision ID, None if no migrations applied
            
        Raises:
            MigrationError: If unable to determine current revision
        """
        try:
            logger.info(f"Connecting to database to get current revision: {self.database_url.split('://')[0]}://[REDACTED]")
            engine = create_engine(self.database_url)
            
            with engine.connect() as connection:
                logger.debug("Database connection established for revision check")
                context = MigrationContext.configure(connection)
                current_rev = context.get_current_revision()
                
                if current_rev:
                    logger.info(f"Current database revision: {current_rev}")
                else:
                    logger.info("No migrations have been applied to this database")
                    
                return current_rev
                
        except SQLAlchemyError as e:
            troubleshooting_steps = [
                "Check that the database server is running and accessible",
                "Verify database connection parameters in DATABASE_URL",
                "Ensure the database exists and you have proper permissions",
                "For SQLite: check that the database file exists and is readable",
                "For PostgreSQL: verify network connectivity and credentials",
                "Check if the alembic_version table exists in the database"
            ]
            
            logger.error(f"SQLAlchemy error while getting current revision: {e}")
            raise DatabaseConnectionError(
                "Unable to determine current database revision due to connection error",
                original_error=e,
                troubleshooting_steps=troubleshooting_steps
            )
        except Exception as e:
            logger.error(f"Unexpected error while getting current revision: {e}")
            raise MigrationError(
                "Unexpected error occurred while determining current revision",
                original_error=e,
                troubleshooting_steps=[
                    "Check the database URL format and configuration",
                    "Verify that all required dependencies are installed",
                    "Review the full error traceback for specific details"
                ]
            )
    
    def get_head_revision(self) -> Optional[str]:
        """
        Get the head (latest) revision from migration scripts.
        
        Returns:
            Optional[str]: Head revision ID, None if no migrations exist
            
        Raises:
            MigrationError: If unable to determine head revision
        """
        try:
            logger.debug(f"Reading migration scripts from Alembic configuration: {self.alembic_cfg_path}")
            script_dir = ScriptDirectory.from_config(self.alembic_cfg)
            head_rev = script_dir.get_current_head()
            
            if head_rev:
                logger.info(f"Head revision found: {head_rev}")
            else:
                logger.info("No migration scripts found - this may be a new project")
                
            return head_rev
            
        except Exception as e:
            troubleshooting_steps = [
                "Check that the alembic.ini file exists and is properly configured",
                "Verify that the alembic/versions directory exists",
                "Ensure migration script files are not corrupted",
                "Check file permissions on the alembic directory",
                "Verify that the script_location in alembic.ini points to the correct directory"
            ]
            
            logger.error(f"Failed to get head revision: {e}")
            raise MigrationError(
                "Unable to determine head revision from migration scripts",
                original_error=e,
                troubleshooting_steps=troubleshooting_steps
            )
    
    def get_migration_history(self) -> List[Dict[str, Any]]:
        """
        Get the migration history with revision details.
        
        Returns:
            List[Dict[str, Any]]: List of migration revisions with metadata
            
        Raises:
            MigrationError: If unable to retrieve migration history
        """
        try:
            script_dir = ScriptDirectory.from_config(self.alembic_cfg)
            revisions = []
            
            for revision in script_dir.walk_revisions():
                rev_info = {
                    "revision": revision.revision,
                    "down_revision": revision.down_revision,
                    "branch_labels": getattr(revision, 'branch_labels', None),
                    "depends_on": getattr(revision, 'depends_on', None),
                    "doc": revision.doc,
                    "create_date": getattr(revision, 'create_date', None)
                }
                revisions.append(rev_info)
            
            logger.info(f"Retrieved {len(revisions)} migration revisions")
            return revisions
        except Exception as e:
            logger.error(f"Failed to get migration history: {e}")
            raise MigrationError(f"Unable to retrieve migration history: {e}")
    
    def check_migration_status(self) -> Dict[str, Any]:
        """
        Check the current migration status and provide detailed information.
        
        Returns:
            Dict[str, Any]: Migration status information including:
                - current_revision: Current database revision
                - head_revision: Latest available revision
                - is_up_to_date: Whether database is up to date
                - pending_migrations: List of pending migrations
                - migration_count: Total number of migrations
                
        Raises:
            MigrationError: If unable to check migration status
        """
        try:
            current_rev = self.get_current_revision()
            head_rev = self.get_head_revision()
            
            # Check if database is up to date
            is_up_to_date = current_rev == head_rev
            
            # Get pending migrations
            pending_migrations = []
            if not is_up_to_date and head_rev:
                script_dir = ScriptDirectory.from_config(self.alembic_cfg)
                if current_rev:
                    # Get revisions between current and head
                    for revision in script_dir.iterate_revisions(head_rev, current_rev):
                        if revision.revision != current_rev:
                            pending_migrations.append({
                                "revision": revision.revision,
                                "doc": revision.doc,
                                "down_revision": revision.down_revision
                            })
                else:
                    # No current revision, all migrations are pending
                    for revision in script_dir.iterate_revisions(head_rev, None):
                        pending_migrations.append({
                            "revision": revision.revision,
                            "doc": revision.doc,
                            "down_revision": revision.down_revision
                        })
            
            migration_history = self.get_migration_history()
            
            status = {
                "current_revision": current_rev,
                "head_revision": head_rev,
                "is_up_to_date": is_up_to_date,
                "pending_migrations": pending_migrations,
                "migration_count": len(migration_history),
                "database_url": self.database_url,
                "check_timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            logger.info(f"Migration status check completed: {status}")
            return status
        except Exception as e:
            logger.error(f"Failed to check migration status: {e}")
            raise MigrationError(f"Unable to check migration status: {e}")
    
    def create_database_backup(self, backup_path: Optional[str] = None) -> str:
        """
        Create a backup of the current database.
        
        Args:
            backup_path: Optional custom backup path
            
        Returns:
            str: Path to the created backup file
            
        Raises:
            MigrationError: If backup creation fails
        """
        try:
            if not backup_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                if self.database_url.startswith("sqlite"):
                    # Extract database file path from SQLite URL
                    db_file = self.database_url.replace("sqlite:///", "")
                    backup_path = f"{db_file}_backup_{timestamp}.db"
                else:
                    # For PostgreSQL, use pg_dump
                    backup_path = f"database_backup_{timestamp}.sql"
            
            if self.database_url.startswith("sqlite"):
                # SQLite backup using file copy
                db_file = self.database_url.replace("sqlite:///", "")
                if os.path.exists(db_file):
                    shutil.copy2(db_file, backup_path)
                    logger.info(f"SQLite database backed up to: {backup_path}")
                else:
                    raise MigrationError(f"Database file not found: {db_file}")
            else:
                # PostgreSQL backup using pg_dump
                # This is a simplified implementation - in production, you'd want more robust handling
                logger.warning("PostgreSQL backup not fully implemented - consider using pg_dump manually")
                raise MigrationError("PostgreSQL backup not implemented in this utility")
            
            return backup_path
        except Exception as e:
            logger.error(f"Failed to create database backup: {e}")
            raise MigrationError(f"Backup creation failed: {e}")
    
    def verify_database_backup(self, backup_path: str) -> Dict[str, Any]:
        """
        Verify the integrity and completeness of a database backup.
        
        Args:
            backup_path: Path to the backup file to verify
            
        Returns:
            Dict[str, Any]: Verification results including:
                - is_valid: Whether backup is valid
                - file_size: Backup file size in bytes
                - table_count: Number of tables in backup
                - verification_timestamp: When verification was performed
                - errors: List of any errors found
                
        Raises:
            MigrationError: If verification fails
        """
        try:
            if not os.path.exists(backup_path):
                raise MigrationError(f"Backup file not found: {backup_path}")
            
            file_size = os.path.getsize(backup_path)
            errors = []
            table_count = 0
            is_valid = False
            
            if backup_path.endswith('.db'):
                # SQLite backup verification
                try:
                    conn = sqlite3.connect(backup_path)
                    cursor = conn.cursor()
                    
                    # Check if database can be opened and queried
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                    tables = cursor.fetchall()
                    table_count = len(tables)
                    
                    # Basic integrity check
                    cursor.execute("PRAGMA integrity_check;")
                    integrity_result = cursor.fetchone()
                    
                    if integrity_result and integrity_result[0] == "ok":
                        is_valid = True
                    else:
                        errors.append(f"Integrity check failed: {integrity_result}")
                    
                    conn.close()
                except sqlite3.Error as e:
                    errors.append(f"SQLite error: {e}")
            else:
                # For SQL dump files, basic validation
                try:
                    with open(backup_path, 'r', encoding='utf-8') as f:
                        content = f.read(1024)  # Read first 1KB
                        if 'CREATE TABLE' in content or 'INSERT INTO' in content:
                            is_valid = True
                        else:
                            errors.append("Backup file doesn't appear to contain SQL statements")
                except Exception as e:
                    errors.append(f"File read error: {e}")
            
            verification_result = {
                "is_valid": is_valid,
                "file_size": file_size,
                "table_count": table_count,
                "verification_timestamp": datetime.now(timezone.utc).isoformat(),
                "errors": errors,
                "backup_path": backup_path
            }
            
            logger.info(f"Backup verification completed: {verification_result}")
            return verification_result
        except Exception as e:
            logger.error(f"Failed to verify database backup: {e}")
            raise MigrationError(f"Backup verification failed: {e}")
    
    def upgrade_database(self, revision: str = "head") -> Dict[str, Any]:
        """
        Upgrade database to specified revision.
        
        Args:
            revision: Target revision (default: "head" for latest)
            
        Returns:
            Dict[str, Any]: Upgrade operation results
            
        Raises:
            MigrationError: If upgrade fails
        """
        try:
            logger.info(f"Starting database upgrade to revision: {revision}")
            
            # Get current status before upgrade
            logger.info("Checking migration status before upgrade")
            pre_status = self.check_migration_status()
            logger.info(f"Pre-upgrade status: Current={pre_status['current_revision']}, Head={pre_status['head_revision']}")
            
            # Check if upgrade is needed
            if pre_status["is_up_to_date"] and revision == "head":
                logger.info("Database is already up to date, no upgrade needed")
                return {
                    "success": True,
                    "target_revision": revision,
                    "pre_upgrade_revision": pre_status["current_revision"],
                    "post_upgrade_revision": pre_status["current_revision"],
                    "upgrade_timestamp": datetime.now(timezone.utc).isoformat(),
                    "message": "Database was already up to date"
                }
            
            # Log pending migrations
            if pre_status["pending_migrations"]:
                logger.info(f"Applying {len(pre_status['pending_migrations'])} pending migration(s):")
                for migration in pre_status["pending_migrations"]:
                    logger.info(f"  - {migration['revision']}: {migration['doc']}")
            
            # Perform upgrade
            logger.info(f"Executing Alembic upgrade command to revision: {revision}")
            command.upgrade(self.alembic_cfg, revision)
            logger.info("Alembic upgrade command completed")
            
            # Get status after upgrade
            logger.info("Checking migration status after upgrade")
            post_status = self.check_migration_status()
            logger.info(f"Post-upgrade status: Current={post_status['current_revision']}, Head={post_status['head_revision']}")
            
            result = {
                "success": True,
                "target_revision": revision,
                "pre_upgrade_revision": pre_status["current_revision"],
                "post_upgrade_revision": post_status["current_revision"],
                "upgrade_timestamp": datetime.now(timezone.utc).isoformat(),
                "migrations_applied": len(pre_status["pending_migrations"]) if pre_status["pending_migrations"] else 0
            }
            
            logger.info(f"Database upgrade completed successfully: {result}")
            return result
            
        except Exception as e:
            troubleshooting_steps = [
                "Check that all migration files are syntactically correct",
                "Verify that the target revision exists in the migration history",
                "Ensure the database connection is stable during the upgrade",
                "Check for foreign key constraint violations or data conflicts",
                "Review migration files for any manual intervention requirements",
                "Consider creating a database backup before retrying",
                "Check database server logs for additional error details"
            ]
            
            logger.error(f"Database upgrade failed: {e}")
            
            # Try to determine the specific type of error
            if "revision" in str(e).lower() and "not found" in str(e).lower():
                raise MigrationError(
                    f"Migration revision '{revision}' not found in migration history",
                    original_error=e,
                    troubleshooting_steps=[
                        "Check that the specified revision exists using 'alembic history'",
                        "Verify that all migration files are present in the versions directory",
                        "Use 'head' to upgrade to the latest revision",
                        "Check for typos in the revision identifier"
                    ]
                )
            elif "constraint" in str(e).lower():
                raise MigrationError(
                    "Database upgrade failed due to constraint violation",
                    original_error=e,
                    troubleshooting_steps=[
                        "Check for foreign key constraint violations",
                        "Verify data integrity before running migrations",
                        "Review migration files for proper constraint handling",
                        "Consider fixing data issues before retrying the upgrade"
                    ]
                )
            else:
                raise MigrationError(
                    "Database upgrade operation failed",
                    original_error=e,
                    troubleshooting_steps=troubleshooting_steps
                )
    
    def downgrade_database(self, revision: str) -> Dict[str, Any]:
        """
        Downgrade database to specified revision.
        
        Args:
            revision: Target revision to downgrade to
            
        Returns:
            Dict[str, Any]: Downgrade operation results
            
        Raises:
            MigrationError: If downgrade fails
        """
        try:
            logger.info(f"Starting database downgrade to revision: {revision}")
            
            # Get current status before downgrade
            pre_status = self.check_migration_status()
            
            # Perform downgrade
            command.downgrade(self.alembic_cfg, revision)
            
            # Get status after downgrade
            post_status = self.check_migration_status()
            
            result = {
                "success": True,
                "target_revision": revision,
                "pre_downgrade_revision": pre_status["current_revision"],
                "post_downgrade_revision": post_status["current_revision"],
                "downgrade_timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            logger.info(f"Database downgrade completed successfully: {result}")
            return result
        except Exception as e:
            logger.error(f"Database downgrade failed: {e}")
            raise MigrationError(f"Downgrade operation failed: {e}")
    
    def generate_migration(self, message: str, autogenerate: bool = True) -> Dict[str, Any]:
        """
        Generate a new migration file.
        
        Args:
            message: Migration description message
            autogenerate: Whether to auto-generate migration from model changes
            
        Returns:
            Dict[str, Any]: Generation operation results
            
        Raises:
            MigrationError: If generation fails
        """
        try:
            logger.info(f"Generating new migration with message: '{message}' (autogenerate={autogenerate})")
            
            # Get current status before generation
            pre_status = self.check_migration_status()
            logger.info(f"Current migration status before generation: {pre_status['current_revision']}")
            
            if autogenerate:
                logger.info("Running autogenerate to detect model changes")
                command.revision(self.alembic_cfg, message=message, autogenerate=True)
            else:
                logger.info("Creating empty migration template")
                command.revision(self.alembic_cfg, message=message)
            
            # Get the newly created revision
            logger.info("Retrieving information about the newly created migration")
            new_head = self.get_head_revision()
            
            # Get updated status
            post_status = self.check_migration_status()
            
            result = {
                "success": True,
                "message": message,
                "autogenerate": autogenerate,
                "new_revision": new_head,
                "previous_head": pre_status["head_revision"],
                "generation_timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            logger.info(f"Migration generation completed successfully: {result}")
            
            if autogenerate:
                logger.info("Please review the generated migration file before applying it")
                logger.info("Check for any manual adjustments needed, especially for:")
                logger.info("  - Data migrations or transformations")
                logger.info("  - Index creation/deletion")
                logger.info("  - Complex constraint changes")
            
            return result
            
        except Exception as e:
            troubleshooting_steps = [
                "Check that all model imports are working correctly",
                "Verify that the database connection is available for autogenerate",
                "Ensure the alembic/versions directory is writable",
                "Check for syntax errors in model definitions",
                "Verify that all required SQLAlchemy models are imported",
                "Check for circular import issues in model files"
            ]
            
            logger.error(f"Migration generation failed: {e}")
            
            # Provide specific guidance based on error type
            if "import" in str(e).lower():
                raise MigrationError(
                    "Migration generation failed due to import error",
                    original_error=e,
                    troubleshooting_steps=[
                        "Check that all model files can be imported without errors",
                        "Verify that all dependencies are installed",
                        "Look for circular import issues between model files",
                        "Ensure the Python path includes all necessary directories"
                    ]
                )
            elif "connection" in str(e).lower() or "database" in str(e).lower():
                raise MigrationError(
                    "Migration generation failed due to database connection issue",
                    original_error=e,
                    troubleshooting_steps=[
                        "Ensure the database is accessible for autogenerate comparison",
                        "Check database connection parameters",
                        "Verify that the database schema is in a consistent state",
                        "Try generating without autogenerate first"
                    ]
                )
            else:
                raise MigrationError(
                    "Migration generation operation failed",
                    original_error=e,
                    troubleshooting_steps=troubleshooting_steps
                )


# Convenience functions for common operations
def get_migration_status() -> Dict[str, Any]:
    """
    Get current migration status.
    
    Returns:
        Dict[str, Any]: Migration status information
    """
    utils = MigrationUtilities()
    return utils.check_migration_status()


def create_backup(backup_path: Optional[str] = None) -> str:
    """
    Create a database backup.
    
    Args:
        backup_path: Optional custom backup path
        
    Returns:
        str: Path to created backup
    """
    utils = MigrationUtilities()
    return utils.create_database_backup(backup_path)


def verify_backup(backup_path: str) -> Dict[str, Any]:
    """
    Verify a database backup.
    
    Args:
        backup_path: Path to backup file
        
    Returns:
        Dict[str, Any]: Verification results
    """
    utils = MigrationUtilities()
    return utils.verify_database_backup(backup_path)


def upgrade_to_head() -> Dict[str, Any]:
    """
    Upgrade database to the latest revision.
    
    Returns:
        Dict[str, Any]: Upgrade operation results
    """
    utils = MigrationUtilities()
    return utils.upgrade_database("head")


__all__ = [
    "MigrationUtilities",
    "MigrationError",
    "DatabaseConnectionError",
    "MigrationConflictError", 
    "SchemaValidationError",
    "get_migration_status",
    "create_backup",
    "verify_backup",
    "upgrade_to_head",
]