from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

from ....core.database import get_db
from ....models.execution import Execution
from ....schemas.stats import LLMConnectionStats
from ....services.llm_service import LLMService

router = APIRouter()


@router.get("/llm-connections", response_model=LLMConnectionStats)
async def get_llm_connection_stats(db: Session = Depends(get_db)):
    """
    获取LLM连接页面的统计数据
    """
    # 1. 获取总连接数
    llm_service = LLMService(db)
    configs = await llm_service.get_all_configs()
    total_connections = len(configs)

    # 2. 获取今日调用次数
    today = date.today()
    today_calls = (
        db.query(func.count(Execution.id))
        .filter(func.date(Execution.created_at) == today)
        .scalar()
    )

    return LLMConnectionStats(
        total_connections=total_connections,
        today_calls=today_calls or 0,
    )
