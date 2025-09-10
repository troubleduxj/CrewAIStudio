from sqlalchemy.orm import Session
import json
from typing import List
from .. import models, schemas
from ..models.workflow import WorkflowStatus, WorkflowType, ExecutionMode


class WorkflowService:
    def create_workflow_template(
        self, db: Session, template: schemas.WorkflowTemplateCreate
    ) -> models.Workflow:
        """
        Create a new workflow template.
        """
        # The 'definition' is a Pydantic model, so we need to convert it to a dict/JSON string
        # to store in the database. `model_dump_json` is a good way to do this.
        definition_json = template.definition.model_dump_json()

        db_template = models.Workflow(
            name=template.name,
            description=template.description,
            workflow_definition=definition_json,
            is_template=True,
            # Provide default values for other required fields
            version="1.0.0",
            workflow_type=WorkflowType.SEQUENTIAL,
            execution_mode=ExecutionMode.MANUAL,
            agents_config=[],
            tasks_config=[],
            status=WorkflowStatus.DRAFT,  # Use the enum member
        )
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template

    def get_workflow_templates(
        self, db: Session, skip: int = 0, limit: int = 100
    ) -> List[models.Workflow]:
        """
        Retrieve workflow templates.
        """
        return (
            db.query(models.Workflow)
            .filter(models.Workflow.is_template == True)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_workflow_template(self, db: Session, template_id: int) -> models.Workflow:
        """
        Retrieve a single workflow template by its ID.
        """
        return (
            db.query(models.Workflow)
            .filter(
                models.Workflow.id == template_id, models.Workflow.is_template == True
            )
            .first()
        )

    def delete_workflow_template(
        self, db: Session, template_id: int
    ) -> models.Workflow:
        """
        Delete a workflow template by its ID.
        """
        db_template = self.get_workflow_template(db, template_id=template_id)
        if db_template:
            db.delete(db_template)
            db.commit()
        return db_template


workflow_service = WorkflowService()
