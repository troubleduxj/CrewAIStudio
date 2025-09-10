#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Migration Validation Utilities
数据库迁移验证工具模块

This module provides validation utilities to help prevent common migration issues
and ensure migration integrity before applying changes.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from sqlalchemy import create_engine, inspect, MetaData, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.utils.logger import get_logger
from app.utils.migration import MigrationUtilities, MigrationError

logger = get_logger(__name__)


class MigrationValidator:
    """
    Validation utilities for database migrations.
    """
    
    def __init__(self):
        """Initialize migration validator."""
        self.migration_utils = MigrationUtilities()
        self.database_url = settings.DATABASE_URL
        
    def validate_migration_file(self, migration_file_path: str) -> Dict[str, Any]:
        """
        Validate a migration file for common issues.
        
        Args:
            migration_file_path: Path to the migration file to validate
            
        Returns:
            Dict[str, Any]: Validation results with issues found
        """
        validation_result = {
            "is_valid": True,
            "issues": [],
            "warnings": [],
            "file_path": migration_file_path,
            "validation_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            if not os.path.exists(migration_file_path):
                validation_result["is_valid"] = False
                validation_result["issues"].append(f"Migration file not found: {migration_file_path}")
                return validation_result
            
            logger.info(f"Validating migration file: {migration_file_path}")
            
            with open(migration_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for required functions using regex to handle type hints
            if not re.search(r'def\s+upgrade\s*\(', content):
                validation_result["is_valid"] = False
                validation_result["issues"].append("Missing upgrade() function")
            
            if not re.search(r'def\s+downgrade\s*\(', content):
                validation_result["warnings"].append("Missing downgrade() function - rollback may not be possible")
            
            # Check for common issues
            self._check_syntax_issues(content, validation_result)
            self._check_data_migration_issues(content, validation_result)
            self._check_constraint_issues(content, validation_result)
            
            logger.info(f"Migration file validation completed: {len(validation_result['issues'])} issues, {len(validation_result['warnings'])} warnings")
            
        except Exception as e:
            validation_result["is_valid"] = False
            validation_result["issues"].append(f"Error reading migration file: {e}")
            logger.error(f"Migration file validation failed: {e}")
        
        return validation_result
    
    def _check_syntax_issues(self, content: str, result: Dict[str, Any]) -> None:
        """Check for common syntax issues in migration content."""
        
        # Check for missing imports
        if 'from alembic import op' not in content:
            result["issues"].append("Missing 'from alembic import op' import")
        
        if 'import sqlalchemy as sa' not in content:
            result["warnings"].append("Missing 'import sqlalchemy as sa' import - may be needed for column types")
        
        # Check for dangerous operations
        dangerous_patterns = [
            (r'op\.drop_table\s*\(', "DROP TABLE operation found - ensure data is backed up"),
            (r'op\.drop_column\s*\(', "DROP COLUMN operation found - ensure data is backed up"),
            (r'op\.drop_index\s*\(', "DROP INDEX operation found - may impact performance"),
        ]
        
        for pattern, warning in dangerous_patterns:
            if re.search(pattern, content):
                result["warnings"].append(warning)
    
    def _check_data_migration_issues(self, content: str, result: Dict[str, Any]) -> None:
        """Check for potential data migration issues."""
        
        # Check for data operations without proper error handling
        data_operations = [
            'connection.execute',
            'op.execute',
            'session.execute'
        ]
        
        for operation in data_operations:
            if operation in content and 'try:' not in content:
                result["warnings"].append(f"Data operation '{operation}' found without error handling")
        
        # Check for bulk operations that might timeout
        bulk_patterns = [
            r'UPDATE\s+\w+\s+SET',
            r'DELETE\s+FROM\s+\w+',
            r'INSERT\s+INTO\s+\w+'
        ]
        
        for pattern in bulk_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                result["warnings"].append("Bulk SQL operation found - consider batching for large datasets")
    
    def _check_constraint_issues(self, content: str, result: Dict[str, Any]) -> None:
        """Check for potential constraint issues."""
        
        # Check for foreign key operations
        if 'create_foreign_key' in content or 'drop_constraint' in content:
            result["warnings"].append("Foreign key operations found - ensure referential integrity")
        
        # Check for unique constraint additions
        if 'create_unique_constraint' in content:
            result["warnings"].append("Unique constraint addition found - ensure no duplicate data exists")
        
        # Check for NOT NULL additions without defaults
        if re.search(r'alter_column.*nullable=False', content) and 'default' not in content:
            result["warnings"].append("NOT NULL constraint added without default value - may fail on existing NULL data")
    
    def validate_database_state(self) -> Dict[str, Any]:
        """
        Validate the current database state for migration readiness.
        
        Returns:
            Dict[str, Any]: Database state validation results
        """
        validation_result = {
            "is_ready": True,
            "issues": [],
            "warnings": [],
            "database_info": {},
            "validation_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            logger.info("Validating database state for migration readiness")
            
            # Check database connectivity
            engine = create_engine(self.database_url)
            with engine.connect() as connection:
                # Test basic connectivity
                connection.execute(text("SELECT 1"))
                validation_result["database_info"]["connection"] = "OK"
                
                # Get database type and version
                db_type = engine.dialect.name
                validation_result["database_info"]["type"] = db_type
                
                try:
                    version_result = connection.execute(text("SELECT version()")).fetchone()
                    if version_result:
                        validation_result["database_info"]["version"] = str(version_result[0])
                except:
                    # Some databases don't support version() function
                    validation_result["database_info"]["version"] = "Unknown"
                
                # Check migration table existence
                inspector = inspect(engine)
                tables = inspector.get_table_names()
                
                if 'alembic_version' not in tables:
                    validation_result["warnings"].append("Alembic version table not found - this may be a fresh database")
                else:
                    validation_result["database_info"]["alembic_table"] = "Present"
                
                # Check for common issues
                self._check_database_permissions(connection, validation_result)
                self._check_database_space(connection, validation_result, db_type)
                
            logger.info("Database state validation completed successfully")
            
        except SQLAlchemyError as e:
            validation_result["is_ready"] = False
            validation_result["issues"].append(f"Database connection error: {e}")
            logger.error(f"Database state validation failed: {e}")
        except Exception as e:
            validation_result["is_ready"] = False
            validation_result["issues"].append(f"Unexpected error during validation: {e}")
            logger.error(f"Database state validation failed with unexpected error: {e}")
        
        return validation_result
    
    def _check_database_permissions(self, connection, result: Dict[str, Any]) -> None:
        """Check database permissions for migration operations."""
        try:
            # Try to create and drop a test table
            test_table_name = f"alembic_test_{int(datetime.now().timestamp())}"
            
            connection.execute(text(f"CREATE TABLE {test_table_name} (id INTEGER)"))
            connection.execute(text(f"DROP TABLE {test_table_name}"))
            
            result["database_info"]["permissions"] = "OK"
            
        except Exception as e:
            result["issues"].append(f"Insufficient database permissions for DDL operations: {e}")
    
    def _check_database_space(self, connection, result: Dict[str, Any], db_type: str) -> None:
        """Check available database space."""
        try:
            if db_type == 'sqlite':
                # For SQLite, check file system space
                db_file = self.database_url.replace('sqlite:///', '')
                if os.path.exists(db_file):
                    stat = os.statvfs(os.path.dirname(db_file))
                    free_space = stat.f_bavail * stat.f_frsize
                    result["database_info"]["free_space_mb"] = free_space // (1024 * 1024)
                    
                    if free_space < 100 * 1024 * 1024:  # Less than 100MB
                        result["warnings"].append("Low disk space available for database operations")
            
            elif db_type == 'postgresql':
                # For PostgreSQL, check database size (simplified)
                try:
                    size_result = connection.execute(text("SELECT pg_database_size(current_database())")).fetchone()
                    if size_result:
                        db_size = size_result[0]
                        result["database_info"]["database_size_mb"] = db_size // (1024 * 1024)
                except:
                    # Permission or version issues
                    pass
                    
        except Exception as e:
            logger.debug(f"Could not check database space: {e}")
    
    def validate_migration_sequence(self) -> Dict[str, Any]:
        """
        Validate the migration sequence for consistency and conflicts.
        
        Returns:
            Dict[str, Any]: Migration sequence validation results
        """
        validation_result = {
            "is_valid": True,
            "issues": [],
            "warnings": [],
            "sequence_info": {},
            "validation_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            logger.info("Validating migration sequence")
            
            # Get migration history
            history = self.migration_utils.get_migration_history()
            validation_result["sequence_info"]["total_migrations"] = len(history)
            
            if not history:
                validation_result["warnings"].append("No migrations found in history")
                return validation_result
            
            # Check for sequence issues
            self._check_migration_dependencies(history, validation_result)
            self._check_migration_conflicts(history, validation_result)
            self._check_migration_naming(history, validation_result)
            
            logger.info(f"Migration sequence validation completed: {len(validation_result['issues'])} issues found")
            
        except Exception as e:
            validation_result["is_valid"] = False
            validation_result["issues"].append(f"Error validating migration sequence: {e}")
            logger.error(f"Migration sequence validation failed: {e}")
        
        return validation_result
    
    def _check_migration_dependencies(self, history: List[Dict], result: Dict[str, Any]) -> None:
        """Check migration dependencies for consistency."""
        revisions = {rev["revision"]: rev for rev in history}
        
        for revision in history:
            down_rev = revision.get("down_revision")
            if down_rev and down_rev not in revisions:
                result["issues"].append(f"Migration {revision['revision']} references missing down_revision: {down_rev}")
    
    def _check_migration_conflicts(self, history: List[Dict], result: Dict[str, Any]) -> None:
        """Check for potential migration conflicts."""
        # Check for duplicate revisions
        revision_ids = [rev["revision"] for rev in history]
        duplicates = set([x for x in revision_ids if revision_ids.count(x) > 1])
        
        if duplicates:
            result["issues"].append(f"Duplicate migration revisions found: {duplicates}")
        
        # Check for branching (multiple migrations with same down_revision)
        down_revisions = [rev.get("down_revision") for rev in history if rev.get("down_revision")]
        branches = set([x for x in down_revisions if down_revisions.count(x) > 1])
        
        if branches:
            result["warnings"].append(f"Migration branching detected at revisions: {branches}")
    
    def _check_migration_naming(self, history: List[Dict], result: Dict[str, Any]) -> None:
        """Check migration naming conventions."""
        for revision in history:
            doc = revision.get("doc", "")
            if not doc or doc.strip() == "":
                result["warnings"].append(f"Migration {revision['revision']} has no description")
            elif len(doc) < 10:
                result["warnings"].append(f"Migration {revision['revision']} has very short description: '{doc}'")
    
    def run_comprehensive_validation(self) -> Dict[str, Any]:
        """
        Run comprehensive validation of the entire migration system.
        
        Returns:
            Dict[str, Any]: Complete validation results
        """
        logger.info("Starting comprehensive migration system validation")
        
        comprehensive_result = {
            "overall_status": "PASS",
            "validation_timestamp": datetime.now(timezone.utc).isoformat(),
            "database_state": {},
            "migration_sequence": {},
            "migration_files": [],
            "summary": {
                "total_issues": 0,
                "total_warnings": 0,
                "critical_issues": []
            }
        }
        
        try:
            # Validate database state
            db_validation = self.validate_database_state()
            comprehensive_result["database_state"] = db_validation
            
            if not db_validation["is_ready"]:
                comprehensive_result["overall_status"] = "FAIL"
                comprehensive_result["summary"]["critical_issues"].extend(db_validation["issues"])
            
            # Validate migration sequence
            sequence_validation = self.validate_migration_sequence()
            comprehensive_result["migration_sequence"] = sequence_validation
            
            if not sequence_validation["is_valid"]:
                comprehensive_result["overall_status"] = "FAIL"
                comprehensive_result["summary"]["critical_issues"].extend(sequence_validation["issues"])
            
            # Validate individual migration files
            versions_dir = Path(self.migration_utils.alembic_cfg_path).parent / "alembic" / "versions"
            if versions_dir.exists():
                for migration_file in versions_dir.glob("*.py"):
                    if migration_file.name != "__init__.py":
                        file_validation = self.validate_migration_file(str(migration_file))
                        comprehensive_result["migration_files"].append(file_validation)
                        
                        if not file_validation["is_valid"]:
                            comprehensive_result["overall_status"] = "FAIL"
                            comprehensive_result["summary"]["critical_issues"].extend(file_validation["issues"])
            
            # Calculate summary statistics
            all_validations = [db_validation, sequence_validation] + comprehensive_result["migration_files"]
            
            for validation in all_validations:
                comprehensive_result["summary"]["total_issues"] += len(validation.get("issues", []))
                comprehensive_result["summary"]["total_warnings"] += len(validation.get("warnings", []))
            
            if comprehensive_result["summary"]["total_issues"] > 0 and comprehensive_result["overall_status"] == "PASS":
                comprehensive_result["overall_status"] = "WARN"
            
            logger.info(f"Comprehensive validation completed: {comprehensive_result['overall_status']}")
            
        except Exception as e:
            comprehensive_result["overall_status"] = "ERROR"
            comprehensive_result["summary"]["critical_issues"].append(f"Validation system error: {e}")
            logger.error(f"Comprehensive validation failed: {e}")
        
        return comprehensive_result


# Convenience functions
def validate_migration_file(file_path: str) -> Dict[str, Any]:
    """Validate a single migration file."""
    validator = MigrationValidator()
    return validator.validate_migration_file(file_path)


def validate_database_state() -> Dict[str, Any]:
    """Validate current database state."""
    validator = MigrationValidator()
    return validator.validate_database_state()


def validate_migration_system() -> Dict[str, Any]:
    """Run comprehensive migration system validation."""
    validator = MigrationValidator()
    return validator.run_comprehensive_validation()


__all__ = [
    "MigrationValidator",
    "validate_migration_file",
    "validate_database_state", 
    "validate_migration_system"
]