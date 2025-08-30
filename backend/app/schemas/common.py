"""通用Pydantic schemas"""

from typing import Any, Dict, List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')

class BaseResponse(BaseModel):
    """基础响应模型"""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class ErrorResponse(BaseResponse):
    """错误响应模型"""
    success: bool = False
    error_code: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None

class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应模型"""
    items: List[T]
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    size: int = Field(..., description="每页大小")
    pages: int = Field(..., description="总页数")
    has_next: bool = Field(..., description="是否有下一页")
    has_prev: bool = Field(..., description="是否有上一页")

    class Config:
        from_attributes = True

class HealthCheckResponse(BaseModel):
    """健康检查响应模型"""
    status: str = Field(..., description="服务状态")
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = Field(..., description="应用版本")
    uptime: Optional[str] = Field(None, description="运行时间")
    
class DetailedHealthCheckResponse(HealthCheckResponse):
    """详细健康检查响应模型"""
    database: Dict[str, Any] = Field(..., description="数据库状态")
    crewai: Dict[str, Any] = Field(..., description="CrewAI状态")
    system: Dict[str, Any] = Field(..., description="系统信息")
    dependencies: Dict[str, Any] = Field(..., description="依赖服务状态")

class ExecutionStatus(BaseModel):
    """执行状态模型"""
    status: str = Field(..., description="执行状态")
    progress: int = Field(0, description="进度百分比")
    current_step: Optional[str] = Field(None, description="当前步骤")
    started_at: Optional[datetime] = Field(None, description="开始时间")
    estimated_completion: Optional[datetime] = Field(None, description="预计完成时间")
    logs: List[str] = Field(default_factory=list, description="执行日志")

class FileUploadResponse(BaseModel):
    """文件上传响应模型"""
    filename: str = Field(..., description="文件名")
    file_path: str = Field(..., description="文件路径")
    file_size: int = Field(..., description="文件大小")
    content_type: str = Field(..., description="文件类型")
    upload_time: datetime = Field(default_factory=datetime.now)

class BulkOperationResponse(BaseModel):
    """批量操作响应模型"""
    total_requested: int = Field(..., description="请求处理的总数")
    successful: int = Field(..., description="成功处理的数量")
    failed: int = Field(..., description="失败的数量")
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="错误详情")
    results: List[Dict[str, Any]] = Field(default_factory=list, description="处理结果")

class SearchRequest(BaseModel):
    """搜索请求模型"""
    query: str = Field(..., description="搜索查询")
    filters: Optional[Dict[str, Any]] = Field(None, description="过滤条件")
    sort_by: Optional[str] = Field(None, description="排序字段")
    sort_order: Optional[str] = Field("asc", description="排序方向")
    page: int = Field(1, ge=1, description="页码")
    size: int = Field(20, ge=1, le=100, description="每页大小")

class SearchResponse(BaseModel, Generic[T]):
    """搜索响应模型"""
    query: str = Field(..., description="搜索查询")
    results: List[T] = Field(..., description="搜索结果")
    total: int = Field(..., description="总结果数")
    page: int = Field(..., description="当前页码")
    size: int = Field(..., description="每页大小")
    search_time: float = Field(..., description="搜索耗时（秒）")
    suggestions: List[str] = Field(default_factory=list, description="搜索建议")

class ConfigurationResponse(BaseModel):
    """配置响应模型"""
    key: str = Field(..., description="配置键")
    value: Any = Field(..., description="配置值")
    description: Optional[str] = Field(None, description="配置描述")
    is_sensitive: bool = Field(False, description="是否为敏感信息")
    last_updated: Optional[datetime] = Field(None, description="最后更新时间")

class MetricsResponse(BaseModel):
    """指标响应模型"""
    metric_name: str = Field(..., description="指标名称")
    value: float = Field(..., description="指标值")
    unit: Optional[str] = Field(None, description="单位")
    timestamp: datetime = Field(default_factory=datetime.now)
    tags: Dict[str, str] = Field(default_factory=dict, description="标签")

class LogEntry(BaseModel):
    """日志条目模型"""
    level: str = Field(..., description="日志级别")
    message: str = Field(..., description="日志消息")
    timestamp: datetime = Field(default_factory=datetime.now)
    source: Optional[str] = Field(None, description="日志来源")
    context: Dict[str, Any] = Field(default_factory=dict, description="上下文信息")

class NotificationRequest(BaseModel):
    """通知请求模型"""
    title: str = Field(..., description="通知标题")
    message: str = Field(..., description="通知内容")
    type: str = Field("info", description="通知类型")
    recipients: List[str] = Field(..., description="接收者列表")
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="元数据")

class WebSocketMessage(BaseModel):
    """WebSocket消息模型"""
    type: str = Field(..., description="消息类型")
    data: Dict[str, Any] = Field(..., description="消息数据")
    timestamp: datetime = Field(default_factory=datetime.now)
    sender: Optional[str] = Field(None, description="发送者")
    recipient: Optional[str] = Field(None, description="接收者")