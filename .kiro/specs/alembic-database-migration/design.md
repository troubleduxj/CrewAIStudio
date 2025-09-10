# Design Document

## Overview

This design outlines the complete integration of Alembic database migrations with the existing CrewAI Studio backend. The current setup has Alembic partially initialized but lacks proper configuration to work with the existing SQLAlchemy models and database connection system. This design will establish a robust, automated database migration workflow that integrates seamlessly with the current application architecture.

## Architecture

### Current State Analysis

The backend currently uses:
- SQLAlchemy with a declarative base model system
- Dynamic database URL configuration through Pydantic settings
- Support for both SQLite (development) and PostgreSQL (production)
- Model definitions spread across multiple files in `app/models/`
- Database initialization through `init_db()` function in `main.py`

### Target Architecture

The enhanced architecture will include:
- Properly configured Alembic environment that imports all models
- Dynamic database URL resolution matching the main application
- Automated initial migration generation from existing schema
- Integration with the existing database configuration system
- Support for both development and production environments

## Components and Interfaces

### 1. Alembic Environment Configuration (`alembic/env.py`)

**Purpose**: Configure Alembic to work with the existing application models and database settings.

**Key Changes**:
- Import the application's Base metadata from `app.models.base`
- Import all model classes to ensure they're registered with SQLAlchemy
- Use the same database URL resolution logic as the main application
- Configure proper logging integration

**Interface**:
```python
# Import application models and configuration
from app.core.config import settings
from app.models.base import Base
from app.models import *  # Import all models

# Set target metadata
target_metadata = Base.metadata

# Use application's database URL
def get_url():
    return settings.DATABASE_URL
```

### 2. Database URL Configuration Integration

**Purpose**: Ensure Alembic uses the same database connection as the main application.

**Implementation Strategy**:
- Modify `alembic.ini` to use a programmatic URL resolver
- Create a helper function in `env.py` that reads from the same configuration source
- Support environment variable overrides for different deployment scenarios

**Configuration Flow**:
1. Alembic reads `alembic.ini`
2. `env.py` imports application settings
3. Database URL is resolved using the same logic as main application
4. Connection is established with appropriate parameters

### 3. Model Registration System

**Purpose**: Ensure all SQLAlchemy models are properly imported and registered.

**Current Models to Include**:
- `Agent` - AI agent configurations
- `Task` - Task definitions and states
- `Workflow` - Workflow templates and configurations
- `Execution` - Execution history and results
- `Crew` - Team configurations and statistics

**Registration Strategy**:
- Import all models in `alembic/env.py`
- Verify metadata includes all expected tables
- Add validation to ensure no models are missed

### 4. Initial Migration Generation

**Purpose**: Create a baseline migration that captures the current database schema.

**Process**:
1. Generate migration using `alembic revision --autogenerate`
2. Review generated migration for completeness
3. Test migration on clean database
4. Validate resulting schema matches current models

**Migration Content**:
- All table definitions with proper column types
- Primary keys, foreign keys, and indexes
- Check constraints and default values
- Proper handling of UUID and JSON column types

### 5. Migration Workflow Integration

**Purpose**: Establish standardized procedures for ongoing schema changes.

**Developer Workflow**:
1. Modify SQLAlchemy models
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review and edit migration file if needed
4. Apply migration: `alembic upgrade head`
5. Commit both model changes and migration file

**Deployment Workflow**:
1. Pull latest code including migrations
2. Run `alembic upgrade head` before starting application
3. Verify migration success through logging
4. Start application with updated schema

## Data Models

### Migration Tracking

Alembic will create and manage the `alembic_version` table:
- `version_num` (VARCHAR): Current migration version
- Automatically maintained by Alembic
- Used to track which migrations have been applied

### Model Metadata Integration

All existing models will be included in the migration system:

**Base Model Fields** (inherited by all models):
- `id`: Primary key (Integer or UUID)
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone, auto-updated

**Crew Model** (most complex):
- UUID primary key
- JSON fields for configuration and metadata
- Multiple status and statistics fields
- Proper indexing on frequently queried fields

**Database Type Considerations**:
- SQLite: Limited ALTER TABLE support, may require table recreation
- PostgreSQL: Full DDL support, efficient migrations
- JSON fields: Proper handling across database types

## Error Handling

### Migration Failure Recovery

**Connection Errors**:
- Clear error messages for database connectivity issues
- Validation of database URL format and accessibility
- Fallback procedures for different environments

**Schema Conflicts**:
- Detection of manual schema changes outside of migrations
- Guidance for resolving migration conflicts
- Backup recommendations before applying migrations

**Rollback Procedures**:
- Support for `alembic downgrade` operations
- Clear documentation of rollback limitations
- Database backup verification before major migrations

### Logging and Monitoring

**Migration Logging**:
- Detailed logs of migration operations
- Integration with application's loguru logging system
- Structured logging for monitoring and debugging

**Error Reporting**:
- Clear error messages with actionable guidance
- Context information for troubleshooting
- Integration with application error handling patterns

## Testing Strategy

### Unit Testing

**Configuration Testing**:
- Verify Alembic can import all models
- Test database URL resolution in different environments
- Validate metadata completeness

**Migration Testing**:
- Test initial migration on clean database
- Verify migration generates expected schema
- Test rollback operations where supported

### Integration Testing

**End-to-End Migration Testing**:
- Apply migrations to test database
- Verify application can connect and operate
- Test migration in both SQLite and PostgreSQL environments

**Regression Testing**:
- Ensure existing functionality remains intact
- Test database operations after migration
- Verify data integrity through migration process

### Environment Testing

**Development Environment**:
- SQLite database migration testing
- Local development workflow validation
- IDE integration testing

**Production Environment**:
- PostgreSQL migration testing
- Performance impact assessment
- Deployment procedure validation

## Implementation Phases

### Phase 1: Configuration Setup
- Update `alembic/env.py` with proper model imports
- Configure database URL resolution
- Test basic Alembic commands

### Phase 2: Initial Migration
- Generate comprehensive initial migration
- Test migration on clean databases
- Validate schema completeness

### Phase 3: Workflow Integration
- Document migration procedures
- Create helper scripts if needed
- Test full development workflow

### Phase 4: Production Readiness
- Test with PostgreSQL
- Validate deployment procedures
- Create rollback documentation