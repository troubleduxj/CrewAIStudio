from logging.config import fileConfig
import sys
import os
from typing import Optional
import traceback

from sqlalchemy import engine_from_config, create_engine, text
from sqlalchemy import pool
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError, OperationalError, DatabaseError

from alembic import context

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Import application configuration and models
    from app.core.config import settings
    from app.models.base import Base
    from app.utils.logger import get_logger

    # Import all models to ensure they are registered with SQLAlchemy
    from app.models.agent import Agent
    from app.models.task import Task
    from app.models.workflow import Workflow
    from app.models.execution import Execution
    from app.models.crew import Crew
    
    logger = get_logger(__name__)
    logger.info("Successfully imported all application models and configuration")
    
except ImportError as e:
    # Fallback logging if application logger is not available
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import application modules: {e}")
    logger.error("This may indicate a configuration or dependency issue")
    raise RuntimeError(
        f"Migration environment setup failed due to import error: {e}\n"
        "Troubleshooting steps:\n"
        "1. Ensure all dependencies are installed: pip install -r requirements.txt\n"
        "2. Check that the backend directory is in your Python path\n"
        "3. Verify that all model files exist and are syntactically correct\n"
        "4. Check your .env file configuration"
    ) from e

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata to use the application's Base metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_database_url() -> str:
    """Get the database URL from application settings.
    
    This ensures Alembic uses the same database configuration
    as the main application, supporting both SQLite and PostgreSQL.
    
    Returns:
        str: The database URL from application settings
        
    Raises:
        ValueError: If DATABASE_URL is not configured
    """
    try:
        database_url = settings.DATABASE_URL
        if not database_url:
            error_msg = (
                "DATABASE_URL is not configured.\n"
                "Troubleshooting steps:\n"
                "1. Create a .env file in the backend directory if it doesn't exist\n"
                "2. Add DATABASE_URL to your .env file, for example:\n"
                "   - For SQLite: DATABASE_URL=sqlite:///./crewai_studio.db\n"
                "   - For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/dbname\n"
                "3. Ensure the .env file is in the correct location (backend/.env)\n"
                "4. Check that python-dotenv is installed: pip install python-dotenv\n"
                "5. Verify file permissions allow reading the .env file"
            )
            logger.error("DATABASE_URL configuration missing")
            raise ValueError(error_msg)
        
        logger.info(f"Using database URL: {database_url.split('://')[0]}://[REDACTED]")
        
        # Validate database URL format
        if not any(database_url.startswith(prefix) for prefix in ['sqlite:', 'postgresql:', 'mysql:']):
            error_msg = (
                f"Invalid DATABASE_URL format: {database_url}\n"
                "Supported formats:\n"
                "- SQLite: sqlite:///path/to/database.db\n"
                "- PostgreSQL: postgresql://user:password@host:port/database\n"
                "- MySQL: mysql://user:password@host:port/database"
            )
            logger.error(f"Invalid DATABASE_URL format: {database_url}")
            raise ValueError(error_msg)
        
        return database_url
        
    except AttributeError as e:
        error_msg = (
            f"Failed to access settings.DATABASE_URL: {e}\n"
            "This may indicate a configuration loading issue.\n"
            "Troubleshooting steps:\n"
            "1. Check that app.core.config module exists and is importable\n"
            "2. Verify that the Settings class is properly defined\n"
            "3. Ensure all required environment variables are set\n"
            "4. Check for syntax errors in the config module"
        )
        logger.error(f"Settings access error: {e}")
        raise ValueError(error_msg) from e


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    try:
        logger.info("Starting offline migration mode")
        
        # Use the application's database URL instead of the config file
        url = get_database_url()
        logger.info(f"Configuring offline migrations for database type: {url.split('://')[0]}")
        
        # Configure context with database-specific options
        context_config = {
            "url": url,
            "target_metadata": target_metadata,
            "literal_binds": True,
            "dialect_opts": {"paramstyle": "named"},
        }
        
        # Add database-specific configuration
        if url.startswith("sqlite"):
            # SQLite requires batch mode for ALTER operations
            context_config["render_as_batch"] = True
            logger.info("Enabled batch mode for SQLite ALTER operations")
        elif url.startswith("postgresql"):
            # PostgreSQL-specific configuration can be added here if needed
            logger.info("Using PostgreSQL-specific configuration")
        
        context.configure(**context_config)
        logger.info("Migration context configured successfully")

        with context.begin_transaction():
            logger.info("Beginning offline migration transaction")
            context.run_migrations()
            logger.info("Offline migrations completed successfully")
            
    except Exception as e:
        error_msg = (
            f"Offline migration failed: {e}\n"
            "Troubleshooting steps:\n"
            "1. Check that the database URL is correctly formatted\n"
            "2. Ensure all required models are imported\n"
            "3. Verify that the target_metadata is properly configured\n"
            "4. Check for syntax errors in migration files\n"
            f"Full error traceback:\n{traceback.format_exc()}"
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = None
    try:
        logger.info("Starting online migration mode")
        
        # Get database URL from application settings
        database_url = get_database_url()
        logger.info(f"Connecting to database: {database_url.split('://')[0]}://[REDACTED]")
        
        # Create engine configuration using application settings
        configuration = config.get_section(config.config_ini_section, {})
        configuration["sqlalchemy.url"] = database_url
        
        # Configure engine based on database type
        engine_config = {
            "prefix": "sqlalchemy.",
            "poolclass": pool.NullPool,
        }
        
        # Add database-specific configuration
        if database_url.startswith("sqlite"):
            # SQLite specific settings
            configuration["sqlalchemy.connect_args"] = {"check_same_thread": False}
            # Use StaticPool for SQLite to maintain connection consistency
            engine_config["poolclass"] = pool.StaticPool
            logger.info("Configured SQLite-specific engine settings")
        elif database_url.startswith("postgresql"):
            # PostgreSQL can use the default NullPool for migrations
            logger.info("Using PostgreSQL default engine configuration")
        
        try:
            connectable = engine_from_config(configuration, **engine_config)
            logger.info("Database engine created successfully")
        except Exception as e:
            error_msg = (
                f"Failed to create database engine: {e}\n"
                "Troubleshooting steps:\n"
                "1. Check database connection parameters in DATABASE_URL\n"
                "2. Ensure the database server is running and accessible\n"
                "3. Verify database credentials are correct\n"
                "4. For SQLite: ensure the database file path is writable\n"
                "5. For PostgreSQL: check network connectivity and firewall settings\n"
                f"Database URL format: {database_url.split('://')[0]}://[REDACTED]\n"
                f"Full error: {traceback.format_exc()}"
            )
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e

        try:
            with connectable.connect() as connection:
                logger.info("Database connection established successfully")
                
                # Test the connection with a simple query
                try:
                    connection.execute(text("SELECT 1"))
                    logger.info("Database connection test successful")
                except Exception as e:
                    logger.warning(f"Database connection test failed, but proceeding: {e}")
                
                # Configure context with database-specific options
                context_config = {
                    "connection": connection,
                    "target_metadata": target_metadata,
                }
                
                # Add database-specific configuration for migrations
                if database_url.startswith("sqlite"):
                    # SQLite requires batch mode for ALTER operations
                    context_config["render_as_batch"] = True
                    logger.info("Enabled batch mode for SQLite ALTER operations")
                elif database_url.startswith("postgresql"):
                    # PostgreSQL supports full DDL operations
                    logger.info("Using PostgreSQL full DDL support")
                
                context.configure(**context_config)
                logger.info("Migration context configured successfully")

                with context.begin_transaction():
                    logger.info("Beginning online migration transaction")
                    context.run_migrations()
                    logger.info("Online migrations completed successfully")
                    
        except OperationalError as e:
            error_msg = (
                f"Database operational error during migration: {e}\n"
                "This typically indicates a connection or permission issue.\n"
                "Troubleshooting steps:\n"
                "1. Check if the database server is running\n"
                "2. Verify database credentials and permissions\n"
                "3. For SQLite: ensure the database file and directory are writable\n"
                "4. For PostgreSQL: check if the database exists and is accessible\n"
                "5. Verify network connectivity to the database server\n"
                "6. Check database server logs for additional error details\n"
                f"Original error: {str(e)}"
            )
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e
            
        except DatabaseError as e:
            error_msg = (
                f"Database error during migration: {e}\n"
                "This may indicate a schema or data integrity issue.\n"
                "Troubleshooting steps:\n"
                "1. Check if there are conflicting schema changes\n"
                "2. Verify that all required tables and columns exist\n"
                "3. Review the migration files for syntax errors\n"
                "4. Consider creating a database backup before retrying\n"
                "5. Check if there are foreign key constraint violations\n"
                "6. Verify that the database schema matches the expected state\n"
                f"Original error: {str(e)}"
            )
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e
            
    except Exception as e:
        error_msg = (
            f"Online migration failed with unexpected error: {e}\n"
            "Troubleshooting steps:\n"
            "1. Check the full error traceback below for specific details\n"
            "2. Verify all migration dependencies are properly installed\n"
            "3. Ensure the database is accessible and properly configured\n"
            "4. Check for any recent changes to model definitions\n"
            "5. Consider running migrations in offline mode for debugging\n"
            f"Full error traceback:\n{traceback.format_exc()}"
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e
    finally:
        if connectable:
            try:
                connectable.dispose()
                logger.info("Database engine disposed successfully")
            except Exception as e:
                logger.warning(f"Failed to dispose database engine: {e}")


try:
    if context.is_offline_mode():
        logger.info("Running migrations in offline mode")
        run_migrations_offline()
    else:
        logger.info("Running migrations in online mode")
        run_migrations_online()
except Exception as e:
    logger.error(f"Migration execution failed: {e}")
    logger.error("For additional help, check the troubleshooting guide in MIGRATION_UTILITIES.md")
    raise
