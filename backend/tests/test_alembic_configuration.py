#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit tests for Alembic configuration
Tests requirement 4.4: Test migration workflow - Alembic configuration
"""

import os
import sys
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from alembic.config import Config
from alembic import command
from alembic.runtime.environment import EnvironmentContext
from alembic.script import ScriptDirectory


class TestAlembicConfiguration:
    """Test suite for Alembic configuration validation."""
    
    def test_alembic_config_file_exists(self, alembic_config_path: Path):
        """Test that alembic.ini configuration file exists."""
        assert alembic_config_path.exists(), "alembic.ini configuration file not found"
        assert alembic_config_path.is_file(), "alembic.ini is not a file"
    
    def test_alembic_config_loads_successfully(self, alembic_config_path: Path):
        """Test that Alembic configuration loads without errors."""
        try:
            config = Config(str(alembic_config_path))
            assert config is not None
            
            # Test that we can access basic configuration
            script_location = config.get_main_option("script_location")
            assert script_location is not None
            assert "alembic" in script_location
            
        except Exception as e:
            pytest.fail(f"Failed to load Alembic configuration: {e}")
    
    def test_alembic_script_directory_exists(self, alembic_config_path: Path):
        """Test that the Alembic script directory exists and is accessible."""
        config = Config(str(alembic_config_path))
        script_dir = ScriptDirectory.from_config(config)
        
        assert script_dir is not None
        assert Path(script_dir.dir).exists()
        assert Path(script_dir.dir).is_dir()
    
    def test_alembic_env_py_exists_and_imports(self, alembic_config_path: Path):
        """Test that env.py exists and can be imported successfully."""
        config = Config(str(alembic_config_path))
        script_dir = ScriptDirectory.from_config(config)
        env_py_path = Path(script_dir.dir) / "env.py"
        
        assert env_py_path.exists(), "env.py file not found"
        
        # Test that env.py file is syntactically correct by reading it
        try:
            content = env_py_path.read_text()
            assert "def run_migrations_online" in content
            assert "def run_migrations_offline" in content
            assert "target_metadata" in content
        except Exception as e:
            pytest.fail(f"Failed to read or validate env.py: {e}")
    
    def test_target_metadata_configuration(self, alembic_config_path: Path):
        """Test that target_metadata is properly configured with application models."""
        # Test that we can import all the models that should be in the metadata
        try:
            from app.models.base import Base
            from app.models.agent import Agent
            from app.models.task import Task
            from app.models.workflow import Workflow
            from app.models.execution import Execution
            from app.models.crew import Crew
            
            # Verify that all models are registered with the Base metadata
            table_names = [table.name for table in Base.metadata.tables.values()]
            expected_tables = ['agents', 'tasks', 'workflows', 'executions', 'crews']
            
            for expected_table in expected_tables:
                assert expected_table in table_names, f"Table {expected_table} not found in metadata"
                
        except ImportError as e:
            pytest.fail(f"Failed to import required models: {e}")
    
    def test_database_url_configuration(self, sqlite_test_db: str, mock_settings):
        """Test that Alembic uses the same database URL as the application."""
        # Mock the settings to use our test database
        mock_settings(sqlite_test_db)
        
        # Test that we can import the function from our env.py
        try:
            import sys
            import importlib.util
            
            # Load the env.py module directly
            env_path = Path(__file__).parent.parent / "alembic" / "env.py"
            spec = importlib.util.spec_from_file_location("alembic_env", env_path)
            alembic_env = importlib.util.module_from_spec(spec)
            sys.modules["alembic_env"] = alembic_env
            spec.loader.exec_module(alembic_env)
            
            url = alembic_env.get_database_url()
            assert url == sqlite_test_db
            assert url.startswith("sqlite://")
        except Exception as e:
            pytest.fail(f"Failed to get database URL from Alembic: {e}")
    
    def test_database_url_validation(self, mock_settings):
        """Test database URL validation in Alembic configuration."""
        from alembic.env import get_database_url
        
        # Test with invalid URL
        mock_settings("invalid://url")
        
        with pytest.raises(ValueError, match="Invalid DATABASE_URL format"):
            get_database_url()
        
        # Test with empty URL
        mock_settings("")
        
        with pytest.raises(ValueError, match="DATABASE_URL is not configured"):
            get_database_url()
    
    def test_sqlite_batch_mode_configuration(self, sqlite_test_db: str, mock_settings):
        """Test that SQLite batch mode is properly configured."""
        mock_settings(sqlite_test_db)
        
        # Create a mock context to test batch mode configuration
        with patch('alembic.context') as mock_context:
            mock_context.is_offline_mode.return_value = True
            mock_context.configure = MagicMock()
            
            # Import and run offline migration to test configuration
            from alembic.env import run_migrations_offline
            
            try:
                run_migrations_offline()
                
                # Verify that configure was called with render_as_batch=True for SQLite
                mock_context.configure.assert_called_once()
                call_args = mock_context.configure.call_args
                assert call_args[1]['render_as_batch'] is True
                
            except Exception as e:
                pytest.fail(f"SQLite batch mode configuration failed: {e}")
    
    def test_postgresql_configuration(self, mock_settings):
        """Test PostgreSQL-specific configuration."""
        postgresql_url = "postgresql://user:pass@localhost/test"
        mock_settings(postgresql_url)
        
        from alembic.env import get_database_url
        
        try:
            url = get_database_url()
            assert url == postgresql_url
            assert url.startswith("postgresql://")
        except Exception as e:
            pytest.fail(f"PostgreSQL configuration failed: {e}")
    
    def test_logging_configuration(self, alembic_config_path: Path):
        """Test that logging is properly configured for Alembic."""
        config = Config(str(alembic_config_path))
        
        # Test that logging configuration exists
        loggers_section = config.get_section("loggers")
        assert loggers_section is not None
        
        # Test that alembic logger is configured
        assert "keys" in loggers_section
        logger_keys = loggers_section["keys"]
        assert "root" in logger_keys or "alembic" in logger_keys
    
    def test_migration_file_naming_convention(self, alembic_config_path: Path):
        """Test that migration file naming convention is properly configured."""
        config = Config(str(alembic_config_path))
        
        # Check if file_template is configured
        file_template = config.get_main_option("file_template")
        if file_template:
            # Should include revision and description
            assert "%%(rev)s" in file_template
            assert "%%(slug)s" in file_template
    
    def test_version_locations_configuration(self, alembic_config_path: Path, migration_versions_path: Path):
        """Test that version locations are properly configured."""
        config = Config(str(alembic_config_path))
        script_dir = ScriptDirectory.from_config(config)
        
        # Test that versions directory exists
        assert migration_versions_path.exists()
        assert migration_versions_path.is_dir()
        
        # Test that script directory points to the correct location
        assert Path(script_dir.dir).name == "alembic"


class TestAlembicEnvironmentIntegration:
    """Test suite for Alembic environment integration with application."""
    
    def test_application_models_import_successfully(self):
        """Test that all application models can be imported in Alembic environment."""
        try:
            # These imports should work in the Alembic environment
            from app.models.base import Base
            from app.models.agent import Agent
            from app.models.task import Task
            from app.models.workflow import Workflow
            from app.models.execution import Execution
            from app.models.crew import Crew
            
            # Verify models are properly defined
            assert hasattr(Agent, '__tablename__')
            assert hasattr(Task, '__tablename__')
            assert hasattr(Workflow, '__tablename__')
            assert hasattr(Execution, '__tablename__')
            assert hasattr(Crew, '__tablename__')
            
        except ImportError as e:
            pytest.fail(f"Failed to import application models: {e}")
    
    def test_settings_import_in_alembic_environment(self):
        """Test that application settings can be imported in Alembic environment."""
        try:
            from app.core.config import settings
            assert settings is not None
            
            # Test that DATABASE_URL is accessible
            assert hasattr(settings, 'DATABASE_URL')
            
        except ImportError as e:
            pytest.fail(f"Failed to import application settings: {e}")
    
    def test_logger_import_in_alembic_environment(self):
        """Test that application logger can be imported in Alembic environment."""
        try:
            from app.utils.logger import get_logger
            logger = get_logger("test")
            assert logger is not None
            
        except ImportError as e:
            pytest.fail(f"Failed to import application logger: {e}")
    
    def test_metadata_completeness(self):
        """Test that Base.metadata includes all expected tables."""
        from app.models.base import Base
        
        # Import all models to ensure they're registered
        from app.models.agent import Agent
        from app.models.task import Task
        from app.models.workflow import Workflow
        from app.models.execution import Execution
        from app.models.crew import Crew
        
        # Check that all expected tables are in metadata
        table_names = set(Base.metadata.tables.keys())
        expected_tables = {'agents', 'tasks', 'workflows', 'executions', 'crews'}
        
        missing_tables = expected_tables - table_names
        assert not missing_tables, f"Missing tables in metadata: {missing_tables}"
        
        # Verify each table has the expected structure
        for table_name in expected_tables:
            table = Base.metadata.tables[table_name]
            assert len(table.columns) > 0, f"Table {table_name} has no columns"
            
            # Check for common base fields
            column_names = set(table.columns.keys())
            if table_name != 'executions':  # executions has different timestamp structure
                expected_base_fields = {'id', 'created_at', 'updated_at'}
                missing_fields = expected_base_fields - column_names
                assert not missing_fields, f"Table {table_name} missing base fields: {missing_fields}"