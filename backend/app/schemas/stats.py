from pydantic import BaseModel


class LLMConnectionStats(BaseModel):
    total_connections: int
    today_calls: int
