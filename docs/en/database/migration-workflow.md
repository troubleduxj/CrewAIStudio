# Database Migration Workflow Guide

## Overview

This guide covers the complete database migration workflow for CrewAI Studio using Alembic. Follow these procedures for safe and consistent database schema management.

## Prerequisites

- Python environment with all dependencies installed
- Database connection configured in `.env` file
- Alembic properly configured (see `alembic/env.py`)

## Daily Development Workflow

### 1. Making Model Changes

When you need to modify the database schema:

1. **Edit SQLAlchemy Models**: Make changes to model files in `app/models/`
2. **Generate Migration**: Create a new migration file
3. **Review Migration**: Inspect the generated migration for accuracy
4. **Apply Migration**: Run the migration to update your database
5. **Test Changes**: Verify your application works with the new schema

### 2. Generating Migrations

```bash
# Navigate to backend directory
cd backend

# Generate a new migration with descriptive message
alembic revision --autogenerate -m "Add user preferences table"

# For manual migrations (when autogenerate isn't sufficient)
alembic revision -m "Add custom index for performance"
```

**Best Practices for Migration Messages:**
- Use present tense: "Add", "Remove", "Modify"
- Be specific: "Add email_verified column to users" vs "Update users"
- Include the reason when not obvious: "Add index on created_at for performance"

### 3. Reviewing Generated Migrations

Always review auto-generated migrations before applying:

```bash
# Check the latest migration file in alembic/versions/
# Look for:
# - Correct table and column names
# - Proper data types
# - Missing indexes or constraints
# - Unnecessary operations
```

**Common Issues to Check:**
- Renamed columns might appear as drop + add instead of rename
- Index names might be auto-generated and unclear
- Foreign key constraints might be missing
- Data migration needs might not be detected

### 4. Applying Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply migrations up to a specific revision
alembic upgrade abc123

# Check current migration status
alembic current

# View migration history
alembic history --verbose
```

### 5. Rolling Back Migrations

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade abc123

# Rollback all migrations (use with caution!)
alembic downgrade base
```

**⚠️ Rollback Limitations:**
- SQLite has limited ALTER TABLE support
- Some operations cannot be reversed (data loss operations)
- Always backup your database before major rollbacks

## Advanced Workflows

### Handling Migration Conflicts

When multiple developers create migrations simultaneously:

1. **Pull Latest Changes**: Get the most recent migrations
2. **Check for Conflicts**: Look for duplicate revision numbers
3. **Resolve Conflicts**: Use `alembic merge` if needed
4. **Test Merged Migration**: Apply to a test database first

```bash
# Merge conflicting migration heads
alembic merge -m "Merge migration branches" head1 head2
```

### Data Migrations

For migrations that require data transformation:

1. **Create Empty Migration**: Use `alembic revision` (not autogenerate)
2. **Add Data Migration Code**: Use `op.execute()` for SQL or bulk operations
3. **Test Thoroughly**: Verify data integrity after migration

Example data migration:
```python
def upgrade():
    # Schema changes first
    op.add_column('users', sa.Column('full_name', sa.String(255)))
    
    # Data migration
    connection = op.get_bind()
    connection.execute(
        "UPDATE users SET full_name = first_name || ' ' || last_name"
    )
    
    # Remove old columns if needed
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'last_name')

def downgrade():
    # Reverse operations (if possible)
    op.add_column('users', sa.Column('first_name', sa.String(100)))
    op.add_column('users', sa.Column('last_name', sa.String(100)))
    
    # Split full_name back (example - may need more robust logic)
    connection = op.get_bind()
    connection.execute("""
        UPDATE users 
        SET first_name = SUBSTR(full_name, 1, INSTR(full_name, ' ') - 1),
            last_name = SUBSTR(full_name, INSTR(full_name, ' ') + 1)
    """)
    
    op.drop_column('users', 'full_name')
```

### Working with Multiple Databases

If you need to support different database types:

```bash
# Test migration on SQLite (development)
DATABASE_URL=sqlite:///./test.db alembic upgrade head

# Test migration on PostgreSQL (production-like)
DATABASE_URL=postgresql://user:pass@localhost/testdb alembic upgrade head
```

## Troubleshooting

### Common Issues

**1. "Target database is not up to date"**
```bash
# Check current status
alembic current
alembic history

# Apply missing migrations
alembic upgrade head
```

**2. "Multiple heads detected"**
```bash
# List all heads
alembic heads

# Merge heads if needed
alembic merge -m "Merge branches" head1 head2
```

**3. "Can't locate revision identified by 'abc123'"**
```bash
# Check available revisions
alembic history

# Use correct revision ID or 'head' for latest
alembic upgrade head
```

**4. Migration fails with constraint errors**
- Check for existing data that violates new constraints
- Add data cleanup to migration before adding constraints
- Consider making constraints nullable initially, then tightening later

### Getting Help

1. **Check Migration Status**: `alembic current` and `alembic history`
2. **Review Migration Files**: Look at the generated SQL in `alembic/versions/`
3. **Test on Copy**: Always test migrations on a database copy first
4. **Use Verbose Mode**: Add `--verbose` flag to see detailed output
5. **Check Logs**: Review application logs for database connection issues

## Best Practices Summary

✅ **Do:**
- Always review auto-generated migrations
- Use descriptive migration messages
- Test migrations on a copy of production data
- Backup database before major migrations
- Keep migrations small and focused
- Include both upgrade and downgrade operations

❌ **Don't:**
- Edit existing migration files after they've been applied
- Skip reviewing auto-generated migrations
- Apply untested migrations to production
- Create migrations that can't be rolled back
- Mix schema and data changes in complex ways
- Ignore migration conflicts

## Integration with Development Tools

### IDE Integration
- Most IDEs can run Alembic commands through terminal integration
- Consider creating run configurations for common commands

### CI/CD Integration
- Include migration checks in your CI pipeline
- Ensure migrations are applied before application deployment
- Consider automated rollback procedures for failed deployments

### Database Backup Integration
- Always backup before applying migrations in production
- Consider automated backup verification
- Document recovery procedures