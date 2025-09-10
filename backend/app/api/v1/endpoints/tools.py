from fastapi import APIRouter
from typing import List

from ....core.crewai_init import get_crewai_status
from ....schemas.common import ToolInfo

router = APIRouter()


@router.get("", response_model=List[ToolInfo])
async def get_available_tools():
    """
    获取所有可用的工具列表
    """
    status = get_crewai_status()
    available_tools = status.get("available_tools", [])
    return available_tools
