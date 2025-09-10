#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pytest configuration and fixtures for migration tests
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
from typing import Generator, Dict, Any
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.base import Base
from app.core.config import settings


@pytest.fixture(scope="session")
def temp_dir() -> Generator[Path, None, None]:
    """Create a temporary directory for test databases."""
    temp_path = Path(tempfile.mkdtemp(prefix="crewai_test_"))
    yield temp_path
    shutil.rmtree(temp_path, ignore_errors=True)


@pytest.fixture(scope="function")
def sqlite_test_db(temp_dir: Path) -> Generator[str, None, None]:
    """Create a temporary SQLite database for testing."""
    db_path = temp_dir / "test_migration.db"
    database_url = f"sqlite:///{db_path}"
    yield database_url
    # Cleanup is handled by temp_dir fixture


@pytest.fixture(scope="function")
def sqlite_engine(sqlite_test_db: str) -> Generator[Engine, None, None]:
    """Create a SQLAlchemy engine for SQLite testing."""
    engine = create_engine(
        sqlite_test_db,
        connect_args={"check_same_thread": False},
        echo=False
    )
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def clean_sqlite_db(sqlite_engine: Engine) -> Generator[Engine, None, None]:
    """Provide a clean SQLite database with all tables dropped."""
    # Drop all tables if they exist
    Base.metadata.drop_all(bind=sqlite_engine)
    yield sqlite_engine
    # Cleanup after test
    Base.metadata.drop_all(bind=sqlite_engine)


@pytest.fixture(scope="function")
def postgresql_test_db() -> Generator[str, None, None]:
    """
    Create a PostgreSQL test database URL.
    Note: This requires a running PostgreSQL instance.
    """
    # Use environment variables or default test database
    pg_host = os.getenv("TEST_PG_HOST", "localhost")
    pg_port = os.getenv("TEST_PG_PORT", "5432")
    pg_user = os.getenv("TEST_PG_USER", "postgres")
    pg_password = os.getenv("TEST_PG_PASSWORD", "postgres")
    pg_database = os.getenv("TEST_PG_DATABASE", "crewai_test")
    
    database_url = f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}"
    yield database_url


@pytest.fixture(scope="function")
def postgresql_engine(postgresql_test_db: str) -> Generator[Engine, None, None]:
    """
    Create a SQLAlchemy engine for PostgreSQL testing.
    Skips if PostgreSQL is not available.
    """
    try:
        engine = create_engine(postgresql_test_db, echo=False)
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        yield engine
        engine.dispose()
    except Exception as e:
        pytest.skip(f"PostgreSQL not available: {e}")


@pytest.fixture(scope="function")
def clean_postgresql_db(postgresql_engine: Engine) -> Generator[Engine, None, None]:
    """Provide a clean PostgreSQL database with all tables dropped."""
    try:
        # Drop all tables if they exist
        Base.metadata.drop_all(bind=postgresql_engine)
        yield postgresql_engine
        # Cleanup after test
        Base.metadata.drop_all(bind=postgresql_engine)
    except Exception as e:
        pytest.skip(f"PostgreSQL cleanup failed: {e}")


@pytest.fixture
def mock_settings(monkeypatch):
    """Mock application settings for testing."""
    def mock_database_url(url: str):
        monkeypatch.setattr(settings, "DATABASE_URL", url)
    
    return mock_database_url


@pytest.fixture
def alembic_config_path() -> Path:
    """Get the path to the alembic.ini configuration file."""
    return Path(__file__).parent.parent / "alembic.ini"


@pytest.fixture
def migration_versions_path() -> Path:
    """Get the path to the alembic versions directory."""
    return Path(__file__).parent.parent / "alembic" / "versions"


@pytest.fixture
def sample_model_change() -> Dict[str, Any]:
    """Provide sample model changes for autogenerate testing."""
    return {
        "table_name": "test_table",
        "column_name": "test_column",
        "column_type": "String(100)",
        "nullable": False
    }