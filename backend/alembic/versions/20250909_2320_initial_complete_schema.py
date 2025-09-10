"""Initial complete database schema

Revision ID: 20250909_2320
Revises: 
Create Date: 2025-09-09 23:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '20250909_2320'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables with complete schema."""
    
    # Create agents table
    op.create_table('agents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('role', sa.String(length=100), nullable=False),
        sa.Column('goal', sa.Text(), nullable=False),
        sa.Column('backstory', sa.Text(), nullable=True),
        sa.Column('agent_type', sa.Enum('RESEARCHER', 'WRITER', 'ANALYST', 'MANAGER', 'CUSTOM', name='agenttype'), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'TRAINING', 'ERROR', name='agentstatus'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('llm_model', sa.String(length=100), nullable=False),
        sa.Column('temperature', sa.String(length=10), nullable=True),
        sa.Column('max_tokens', sa.String(length=10), nullable=True),
        sa.Column('tools', sa.JSON(), nullable=True),
        sa.Column('capabilities', sa.JSON(), nullable=True),
        sa.Column('max_execution_time', sa.String(length=10), nullable=True),
        sa.Column('allow_delegation', sa.Boolean(), nullable=False),
        sa.Column('verbose', sa.Boolean(), nullable=False),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('custom_instructions', sa.Text(), nullable=True),
        sa.Column('execution_count', sa.String(length=10), nullable=True),
        sa.Column('success_count', sa.String(length=10), nullable=True),
        sa.Column('error_count', sa.String(length=10), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_agents_id'), 'agents', ['id'], unique=False)
    op.create_index(op.f('ix_agents_name'), 'agents', ['name'], unique=False)

    # Create crews table
    op.create_table('crews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('workflow_template_id', sa.String(length=100), nullable=False),
        sa.Column('agents_config', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('max_execution_time', sa.Integer(), nullable=True),
        sa.Column('verbose', sa.Boolean(), nullable=False),
        sa.Column('execution_count', sa.Integer(), nullable=False),
        sa.Column('success_count', sa.Integer(), nullable=False),
        sa.Column('error_count', sa.Integer(), nullable=False),
        sa.Column('current_execution_id', sa.String(length=100), nullable=True),
        sa.Column('execution_progress', sa.Integer(), nullable=True),
        sa.Column('current_agent', sa.String(length=100), nullable=True),
        sa.Column('current_task', sa.String(length=200), nullable=True),
        sa.Column('total_tasks', sa.Integer(), nullable=False),
        sa.Column('completed_tasks', sa.Integer(), nullable=False),
        sa.Column('failed_tasks', sa.Integer(), nullable=False),
        sa.Column('execution_time', sa.Float(), nullable=True),
        sa.Column('last_execution_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_crews_id'), 'crews', ['id'], unique=False)
    op.create_index(op.f('ix_crews_name'), 'crews', ['name'], unique=False)

    # Create executions table
    op.create_table('executions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('execution_type', sa.Enum('WORKFLOW', 'TASK', 'AGENT', name='executiontype'), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('entity_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT', name='executionstatus'), nullable=True),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'URGENT', name='executionpriority'), nullable=True),
        sa.Column('progress', sa.Float(), nullable=True),
        sa.Column('current_step', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('execution_time', sa.Float(), nullable=True),
        sa.Column('timeout_seconds', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('user_name', sa.String(length=100), nullable=True),
        sa.Column('input_data', sa.JSON(), nullable=True),
        sa.Column('output_data', sa.JSON(), nullable=True),
        sa.Column('context', sa.JSON(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', sa.JSON(), nullable=True),
        sa.Column('logs', sa.JSON(), nullable=True),
        sa.Column('debug_info', sa.JSON(), nullable=True),
        sa.Column('memory_usage', sa.Float(), nullable=True),
        sa.Column('cpu_usage', sa.Float(), nullable=True),
        sa.Column('options', sa.JSON(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('max_retries', sa.Integer(), nullable=True),
        sa.Column('parent_execution_id', sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(['parent_execution_id'], ['executions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_executions_id'), 'executions', ['id'], unique=False)

    # Create tasks table
    op.create_table('tasks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('task_type', sa.Enum('RESEARCH', 'ANALYSIS', 'WRITING', 'REVIEW', 'CUSTOM', name='tasktype'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED', name='taskstatus'), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'URGENT', name='taskpriority'), nullable=False),
        sa.Column('input_data', sa.JSON(), nullable=True),
        sa.Column('expected_output', sa.Text(), nullable=True),
        sa.Column('output_data', sa.JSON(), nullable=True),
        sa.Column('max_execution_time', sa.Integer(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('max_retries', sa.Integer(), nullable=True),
        sa.Column('assigned_agent_id', sa.Integer(), nullable=True),
        sa.Column('dependencies', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.String(length=50), nullable=True),
        sa.Column('completed_at', sa.String(length=50), nullable=True),
        sa.Column('execution_duration', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', sa.JSON(), nullable=True),
        sa.Column('progress_percentage', sa.Integer(), nullable=True),
        sa.Column('progress_details', sa.JSON(), nullable=True),
        sa.Column('quality_score', sa.String(length=10), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('is_template', sa.Boolean(), nullable=False),
        sa.Column('is_recurring', sa.Boolean(), nullable=False),
        sa.Column('schedule_config', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_agent_id'], ['agents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_index(op.f('ix_tasks_name'), 'tasks', ['name'], unique=False)

    # Create workflows table
    op.create_table('workflows',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('version', sa.String(length=20), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'ACTIVE', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED', 'ARCHIVED', name='workflowstatus'), nullable=False),
        sa.Column('workflow_type', sa.Enum('SEQUENTIAL', 'PARALLEL', 'CONDITIONAL', 'LOOP', 'CUSTOM', name='workflowtype'), nullable=False),
        sa.Column('execution_mode', sa.Enum('AUTOMATIC', 'MANUAL', 'SCHEDULED', 'TRIGGERED', name='executionmode'), nullable=False),
        sa.Column('workflow_definition', sa.JSON(), nullable=False),
        sa.Column('agents_config', sa.JSON(), nullable=True),
        sa.Column('tasks_config', sa.JSON(), nullable=True),
        sa.Column('max_execution_time', sa.Integer(), nullable=True),
        sa.Column('retry_policy', sa.JSON(), nullable=True),
        sa.Column('error_handling', sa.JSON(), nullable=True),
        sa.Column('schedule_config', sa.JSON(), nullable=True),
        sa.Column('trigger_conditions', sa.JSON(), nullable=True),
        sa.Column('current_step', sa.String(length=100), nullable=True),
        sa.Column('execution_history', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.String(length=50), nullable=True),
        sa.Column('completed_at', sa.String(length=50), nullable=True),
        sa.Column('execution_duration', sa.Integer(), nullable=True),
        sa.Column('execution_result', sa.JSON(), nullable=True),
        sa.Column('output_data', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', sa.JSON(), nullable=True),
        sa.Column('failed_step', sa.String(length=100), nullable=True),
        sa.Column('progress_percentage', sa.Integer(), nullable=True),
        sa.Column('completed_steps', sa.Integer(), nullable=True),
        sa.Column('total_steps', sa.Integer(), nullable=True),
        sa.Column('execution_count', sa.Integer(), nullable=True),
        sa.Column('success_count', sa.Integer(), nullable=True),
        sa.Column('failure_count', sa.Integer(), nullable=True),
        sa.Column('average_execution_time', sa.Integer(), nullable=True),
        sa.Column('is_template', sa.Boolean(), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('owner_id', sa.String(length=100), nullable=True),
        sa.Column('permissions', sa.JSON(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('parent_workflow_id', sa.Integer(), nullable=True),
        sa.Column('is_latest_version', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workflows_id'), 'workflows', ['id'], unique=False)
    op.create_index(op.f('ix_workflows_name'), 'workflows', ['name'], unique=False)


def downgrade() -> None:
    """Drop all tables."""
    op.drop_index(op.f('ix_workflows_name'), table_name='workflows')
    op.drop_index(op.f('ix_workflows_id'), table_name='workflows')
    op.drop_table('workflows')
    op.drop_index(op.f('ix_tasks_name'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_table('tasks')
    op.drop_index(op.f('ix_executions_id'), table_name='executions')
    op.drop_table('executions')
    op.drop_index(op.f('ix_crews_name'), table_name='crews')
    op.drop_index(op.f('ix_crews_id'), table_name='crews')
    op.drop_table('crews')
    op.drop_index(op.f('ix_agents_name'), table_name='agents')
    op.drop_index(op.f('ix_agents_id'), table_name='agents')
    op.drop_table('agents')