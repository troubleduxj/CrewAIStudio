#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test runner for migration workflow tests
Implements task 7: Test migration workflow
"""

import sys
import os
import subprocess
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))


def run_tests():
    """Run all migration workflow tests."""
    print("CrewAI Studio Migration Workflow Test Suite")
    print("=" * 60)
    
    # Check if pytest is available
    try:
        import pytest
    except ImportError:
        print("❌ pytest is not installed. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pytest", "pytest-asyncio", "pytest-mock", "pytest-cov"])
        import pytest
    
    # Set environment variables for testing
    os.environ["TESTING"] = "1"
    
    # Test arguments
    test_args = [
        "-v",
        "--tb=short",
        "--color=yes",
        "tests/test_alembic_configuration.py",
        "tests/test_migration_workflow.py"
    ]
    
    print("\n1. Running Alembic Configuration Tests...")
    print("-" * 40)
    
    # Run Alembic configuration tests
    config_result = pytest.main([
        "-v", "--tb=short", "--color=yes",
        "tests/test_alembic_configuration.py"
    ])
    
    print("\n2. Running Migration Workflow Tests...")
    print("-" * 40)
    
    # Run migration workflow tests
    workflow_result = pytest.main([
        "-v", "--tb=short", "--color=yes",
        "tests/test_migration_workflow.py"
    ])
    
    print("\n" + "=" * 60)
    
    if config_result == 0 and workflow_result == 0:
        print("🎉 All migration tests passed successfully!")
        print("\nTest Coverage Summary:")
        print("✅ Alembic configuration validation")
        print("✅ Initial migration on SQLite")
        print("✅ Initial migration on PostgreSQL (if available)")
        print("✅ Migration rollback functionality")
        print("✅ Autogenerate functionality")
        print("✅ Migration status and history")
        print("✅ Error handling and validation")
        return 0
    else:
        print("❌ Some migration tests failed!")
        if config_result != 0:
            print("  - Alembic configuration tests failed")
        if workflow_result != 0:
            print("  - Migration workflow tests failed")
        return 1


def run_specific_test_category(category: str):
    """Run a specific category of tests."""
    # Check if pytest is available
    try:
        import pytest
    except ImportError:
        print("❌ pytest is not installed. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pytest", "pytest-asyncio", "pytest-mock", "pytest-cov"])
        import pytest
    
    if category == "config":
        print("Running Alembic Configuration Tests...")
        return pytest.main(["-v", "tests/test_alembic_configuration.py"])
    elif category == "workflow":
        print("Running Migration Workflow Tests...")
        return pytest.main(["-v", "tests/test_migration_workflow.py"])
    elif category == "sqlite":
        print("Running SQLite-specific tests...")
        return pytest.main(["-v", "-k", "sqlite", "tests/"])
    elif category == "postgresql":
        print("Running PostgreSQL-specific tests...")
        os.environ["TEST_POSTGRESQL"] = "true"
        return pytest.main(["-v", "-k", "postgresql", "tests/"])
    else:
        print(f"Unknown test category: {category}")
        print("Available categories: config, workflow, sqlite, postgresql")
        return 1


def main():
    """Main test runner function."""
    if len(sys.argv) > 1:
        category = sys.argv[1]
        return run_specific_test_category(category)
    else:
        return run_tests()


if __name__ == "__main__":
    sys.exit(main())