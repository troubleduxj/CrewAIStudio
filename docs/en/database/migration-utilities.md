# CrewAI Studio Migration Utilities

This document describes the migration utilities provided for database management in CrewAI Studio.

## Overview

The migration utilities provide a comprehensive set of tools for managing database migrations, including:

- Migration status checking
- Database backup creation and verification
- Migration upgrade/downgrade operations
- Migration history tracking
- Common migration helper functions

## Components

### MigrationUtilities Class

The main class that provides all migration functionality:

```python
from app.utils.migration import MigrationUtilities

utils = MigrationUtilities()
```

### Convenience Functions

Quick access functions for common operations:

```python
from app.utils.migration import (
    get_migration_status,
    create_backup,
    verify_backup,
    upgrade_to_head
)
```

## Usage Examples

### Check Migration Status

```python
from app.utils.migration import get_migration_status

status = get_migration_status()
print(f"Current revision: {status['current_revision']}")
print(f"Up to date: {status['is_up_to_date']}")
print(f"Pending migrations: {len(status['pending_migrations'])}")
```

### Create and Verify Database Backup

```python
from app.utils.migration import create_backup, verify_backup

# Create backup
backup_path = create_backup()
print(f"Backup created: {backup_path}")

# Verify backup
verification = verify_backup(backup_path)
if verification['is_valid']:
    print("Backup is valid!")
else:
    print("Backup verification failed!")
    for error in verification['errors']:
        print(f"  - {error}")
```

### Upgrade Database

```python
from app.utils.migration import MigrationUtilities

utils = MigrationUtilities()

# Upgrade to latest
result = utils.upgrade_database("head")
print(f"Upgraded from {result['pre_upgrade_revision']} to {result['post_upgrade_revision']}")

# Upgrade to specific revision
result = utils.upgrade_database("abc123")
```

### Get Migration History

```python
from app.utils.migration import MigrationUtilities

utils = MigrationUtilities()
history = utils.get_migration_history()

for revision in history:
    print(f"{revision['revision']}: {revision['doc']}")
```

## Command Line Interface

A CLI tool is provided for common migration operations:

### Check Status
```bash
python migration_cli.py status
```

### Create Backup
```bash
# Create backup
python migration_cli.py backup

# Create backup with verification
python migration_cli.py backup --verify

# Create backup with custom path
python migration_cli.py backup --path /path/to/backup.db
```

### Verify Backup
```bash
python migration_cli.py verify /path/to/backup.db
```

### Upgrade Database
```bash
# Upgrade to latest
python migration_cli.py upgrade

# Upgrade with backup
python migration_cli.py upgrade --backup

# Upgrade to specific revision
python migration_cli.py upgrade --revision abc123
```

### Downgrade Database
```bash
# Downgrade to specific revision
python migration_cli.py downgrade abc123

# Downgrade with backup
python migration_cli.py downgrade abc123 --backup
```

### Generate Migration
```bash
# Generate migration with auto-detection
python migration_cli.py generate "Add new column to users table"

# Generate empty migration
python migration_cli.py generate "Custom migration" --no-autogenerate
```

### View Migration History
```bash
python migration_cli.py history
```

## API Reference

### MigrationUtilities Methods

#### `get_current_revision() -> Optional[str]`
Returns the current database revision ID.

#### `get_head_revision() -> Optional[str]`
Returns the latest available revision ID from migration scripts.

#### `get_migration_history() -> List[Dict[str, Any]]`
Returns a list of all migration revisions with metadata.

#### `check_migration_status() -> Dict[str, Any]`
Returns comprehensive migration status information including:
- `current_revision`: Current database revision
- `head_revision`: Latest available revision
- `is_up_to_date`: Whether database is current
- `pending_migrations`: List of unapplied migrations
- `migration_count`: Total number of migrations

#### `create_database_backup(backup_path: Optional[str] = None) -> str`
Creates a database backup and returns the backup file path.

#### `verify_database_backup(backup_path: str) -> Dict[str, Any]`
Verifies backup integrity and returns verification results:
- `is_valid`: Whether backup is valid
- `file_size`: Backup file size in bytes
- `table_count`: Number of tables in backup
- `errors`: List of any errors found

#### `upgrade_database(revision: str = "head") -> Dict[str, Any]`
Upgrades database to specified revision and returns operation results.

#### `downgrade_database(revision: str) -> Dict[str, Any]`
Downgrades database to specified revision and returns operation results.

#### `generate_migration(message: str, autogenerate: bool = True) -> Dict[str, Any]`
Generates a new migration file and returns generation results.

### Convenience Functions

#### `get_migration_status() -> Dict[str, Any]`
Quick access to migration status check.

#### `create_backup(backup_path: Optional[str] = None) -> str`
Quick access to backup creation.

#### `verify_backup(backup_path: str) -> Dict[str, Any]`
Quick access to backup verification.

#### `upgrade_to_head() -> Dict[str, Any]`
Quick access to upgrade to latest revision.

## Error Handling

All functions raise `MigrationError` for migration-related issues. Always wrap calls in try-catch blocks:

```python
from app.utils.migration import MigrationError, get_migration_status

try:
    status = get_migration_status()
    print(status)
except MigrationError as e:
    print(f"Migration error: {e}")
```

## Database Support

The utilities support both SQLite and PostgreSQL databases:

- **SQLite**: Full backup and verification support using file operations
- **PostgreSQL**: Basic support (backup functionality requires pg_dump)

## Logging

All operations are logged using the application's logging system. Check logs for detailed operation information and troubleshooting.

## Testing

Run the test suite to verify all utilities are working:

```bash
python test_migration_utils.py
```

## Requirements Mapping

This implementation addresses the following requirements:

- **4.1**: Helper functions for common migration operations ✅
- **4.2**: Database backup verification utilities ✅  
- **4.3**: Migration status checking functions ✅
- **5.1**: Error handling and logging for migration operations ✅

## Best Practices

1. **Always create backups** before major migrations
2. **Verify backups** after creation
3. **Check migration status** before operations
4. **Use the CLI** for interactive operations
5. **Handle errors gracefully** in automated scripts
6. **Monitor logs** for detailed operation information