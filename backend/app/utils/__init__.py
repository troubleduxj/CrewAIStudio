#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CrewAI Studio Utils Module
工具模块初始化
"""

from .logger import setup_logger, get_logger

# Import security utilities with error handling
try:
    from .security import (
        create_access_token,
        verify_token,
        get_password_hash,
        verify_password
    )
    _security_available = True
except ImportError:
    _security_available = False

# Import validators with error handling
try:
    from .validators import (
        validate_email,
        validate_url,
        validate_json_schema
    )
    _validators_available = True
except ImportError:
    _validators_available = False

from .helpers import (
    generate_uuid,
    format_datetime,
    parse_datetime,
    sanitize_filename,
    calculate_file_hash
)
from .migration import (
    MigrationUtilities,
    MigrationError,
    get_migration_status,
    create_backup,
    verify_backup,
    upgrade_to_head
)

# Build __all__ list dynamically based on available imports
__all__ = [
    # 日志相关
    "setup_logger",
    "get_logger",
    
    # 辅助工具
    "generate_uuid",
    "format_datetime",
    "parse_datetime",
    "sanitize_filename",
    "calculate_file_hash",
    
    # 迁移工具
    "MigrationUtilities",
    "MigrationError",
    "get_migration_status",
    "create_backup",
    "verify_backup",
    "upgrade_to_head",
]

# Add security utilities if available
if _security_available:
    __all__.extend([
        "create_access_token",
        "verify_token",
        "get_password_hash",
        "verify_password",
    ])

# Add validators if available
if _validators_available:
    __all__.extend([
        "validate_email",
        "validate_url",
        "validate_json_schema",
    ])