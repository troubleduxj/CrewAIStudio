from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Any, List
import logging
import json

from .... import schemas
from ....core.database import get_db
from ....services.workflow_service import workflow_service

# Use a standard logger
logger = logging.getLogger(__name__)

router = APIRouter(redirect_slashes=False)


@router.get("/")
def read_workflow_templates(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve workflow templates.
    """
    db_templates = workflow_service.get_workflow_templates(db, skip=skip, limit=limit)

    # Manually construct the response to ensure correct date formatting and key casing
    response_data = []
    for db_template in db_templates:
        definition = {}
        try:
            if db_template.workflow_definition:
                definition = json.loads(db_template.workflow_definition)
        except json.JSONDecodeError:
            logger.error(
                f"Failed to parse workflow_definition for template {db_template.id}"
            )

        response_data.append(
            {
                "id": str(db_template.id),
                "name": db_template.name,
                "description": db_template.description,
                "definition": definition,
                "createdAt": (
                    db_template.created_at.isoformat()
                    if db_template.created_at
                    else None
                ),
                "updatedAt": (
                    db_template.updated_at.isoformat()
                    if db_template.updated_at
                    else None
                ),
                "usageCount": getattr(db_template, "usage_count", 0),
            }
        )

    return JSONResponse(content=response_data)


@router.get("/{template_id}")
def read_workflow_template(
    *,
    db: Session = Depends(get_db),
    template_id: int,
) -> Any:
    """
    Get workflow template by ID.
    """
    db_template = workflow_service.get_workflow_template(db, template_id=template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Workflow template not found")

    definition = {}
    try:
        if db_template.workflow_definition:
            definition = json.loads(db_template.workflow_definition)
    except json.JSONDecodeError:
        logger.error(
            f"Failed to parse workflow_definition for template {db_template.id}"
        )

    response_data = {
        "id": str(db_template.id),
        "name": db_template.name,
        "description": db_template.description,
        "definition": definition,
        "createdAt": (
            db_template.created_at.isoformat() if db_template.created_at else None
        ),
        "updatedAt": (
            db_template.updated_at.isoformat() if db_template.updated_at else None
        ),
        "usageCount": getattr(db_template, "usage_count", 0),
    }
    return JSONResponse(content=response_data)


@router.post("/", response_model=schemas.WorkflowTemplateResponse)
def create_workflow_template(
    *,
    db: Session = Depends(get_db),
    template_in: schemas.WorkflowTemplateCreate,
) -> Any:
    """
    Create new workflow template.
    """
    try:
        logger.info(f"Received request to create workflow template: {template_in.name}")
        db_template = workflow_service.create_workflow_template(
            db=db, template=template_in
        )
        logger.info(f"Successfully created workflow template with ID: {db_template.id}")

        # Manually construct the response to ensure correct date formatting and key casing
        response_data = {
            "id": str(db_template.id),
            "name": db_template.name,
            "description": db_template.description,
            "definition": template_in.definition.model_dump(),
            "createdAt": db_template.created_at.isoformat(),
            "updatedAt": db_template.updated_at.isoformat(),
            "usageCount": 0,
        }
        return JSONResponse(content=response_data)
    except Exception as e:
        # Log the full exception traceback to the console
        logger.error("Error creating workflow template:", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred.")


@router.delete("/{template_id}", status_code=204)
def delete_workflow_template(
    *,
    db: Session = Depends(get_db),
    template_id: int,
):
    """
    Delete a workflow template.
    """
    db_template = workflow_service.delete_workflow_template(db, template_id=template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Workflow template not found")
    return
