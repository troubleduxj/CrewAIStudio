"""Workflow相关的Pydantic schemas"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from ..models.workflow import WorkflowStatus, WorkflowType, ExecutionMode

class WorkflowBase(BaseModel):
    """Workflow基础模型"""
    name: str = Field(..., min_length=1, max_length=255, description="工作流名称")
    description: Optional[str] = Field(None, description="工作流描述")
    version: str = Field("1.0.0", description="版本号")
    workflow_type: WorkflowType = Field(WorkflowType.SEQUENTIAL, description="工作流类型")
    execution_mode: ExecutionMode = Field(ExecutionMode.MANUAL, description="执行模式")
    
    # 工作流定义
    workflow_definition: Dict[str, Any] = Field(..., description="工作流定义JSON")
    agents_config: List[Dict[str, Any]] = Field(default_factory=list, description="参与的Agent配置")
    tasks_config: List[Dict[str, Any]] = Field(default_factory=list, description="任务配置")
    
    # 执行配置
    max_execution_time: Optional[int] = Field(3600, ge=1, le=86400, description="最大执行时间（秒）")
    retry_policy: Dict[str, Any] = Field(default_factory=dict, description="重试策略")
    error_handling: Dict[str, Any] = Field(default_factory=dict, description="错误处理配置")
    
    # 调度配置
    schedule_config: Dict[str, Any] = Field(default_factory=dict, description="调度配置")
    trigger_conditions: List[Dict[str, Any]] = Field(default_factory=list, description="触发条件")
    
    # 配置选项
    is_template: bool = Field(False, description="是否为模板")
    is_public: bool = Field(False, description="是否公开")
    is_active: bool = Field(True, description="是否激活")
    
    # 权限和所有者
    owner_id: Optional[str] = Field(None, description="所有者ID")
    permissions: Dict[str, Any] = Field(default_factory=dict, description="权限配置")
    
    # 元数据
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    tags: List[str] = Field(default_factory=list, description="标签")
    category: Optional[str] = Field(None, description="分类")
    
    @field_validator('workflow_definition')
    @classmethod
    def validate_workflow_definition(cls, v):
        if not v or not isinstance(v, dict):
            raise ValueError('Workflow definition must be a non-empty dictionary')
        
        # 基本结构验证
        required_fields = ['steps', 'connections']
        for field in required_fields:
            if field not in v:
                raise ValueError(f'Workflow definition must contain "{field}" field')
        
        # 步骤验证
        steps = v.get('steps', [])
        if not isinstance(steps, list) or len(steps) == 0:
            raise ValueError('Workflow must contain at least one step')
        
        return v
    
    @field_validator('version')
    @classmethod
    def validate_version(cls, v):
        import re
        if not re.match(r'^\d+\.\d+\.\d+$', v):
            raise ValueError('Version must follow semantic versioning (e.g., 1.0.0)')
        return v

class WorkflowCreate(WorkflowBase):
    """创建Workflow的请求模型"""
    pass

class WorkflowUpdate(BaseModel):
    """更新Workflow的请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="工作流名称")
    description: Optional[str] = Field(None, description="工作流描述")
    version: Optional[str] = Field(None, description="版本号")
    workflow_type: Optional[WorkflowType] = Field(None, description="工作流类型")
    execution_mode: Optional[ExecutionMode] = Field(None, description="执行模式")
    status: Optional[WorkflowStatus] = Field(None, description="工作流状态")
    
    # 工作流定义
    workflow_definition: Optional[Dict[str, Any]] = Field(None, description="工作流定义JSON")
    agents_config: Optional[List[Dict[str, Any]]] = Field(None, description="参与的Agent配置")
    tasks_config: Optional[List[Dict[str, Any]]] = Field(None, description="任务配置")
    
    # 执行配置
    max_execution_time: Optional[int] = Field(None, ge=1, le=86400, description="最大执行时间（秒）")
    retry_policy: Optional[Dict[str, Any]] = Field(None, description="重试策略")
    error_handling: Optional[Dict[str, Any]] = Field(None, description="错误处理配置")
    
    # 调度配置
    schedule_config: Optional[Dict[str, Any]] = Field(None, description="调度配置")
    trigger_conditions: Optional[List[Dict[str, Any]]] = Field(None, description="触发条件")
    
    # 配置选项
    is_template: Optional[bool] = Field(None, description="是否为模板")
    is_public: Optional[bool] = Field(None, description="是否公开")
    is_active: Optional[bool] = Field(None, description="是否激活")
    
    # 权限和所有者
    owner_id: Optional[str] = Field(None, description="所有者ID")
    permissions: Optional[Dict[str, Any]] = Field(None, description="权限配置")
    
    # 元数据
    meta_data: Optional[Dict[str, Any]] = Field(None, description="元数据")
    tags: Optional[List[str]] = Field(None, description="标签")
    category: Optional[str] = Field(None, description="分类")

class WorkflowResponse(WorkflowBase):
    """Workflow响应模型"""
    id: int = Field(..., description="工作流ID")
    status: WorkflowStatus = Field(..., description="工作流状态")
    
    # 执行信息
    current_step: Optional[str] = Field(None, description="当前执行步骤")
    execution_history: List[Dict[str, Any]] = Field(default_factory=list, description="执行历史")
    
    # 时间信息
    started_at: Optional[str] = Field(None, description="开始执行时间")
    completed_at: Optional[str] = Field(None, description="完成时间")
    execution_duration: Optional[int] = Field(None, description="执行时长（秒）")
    
    # 结果信息
    execution_result: Dict[str, Any] = Field(default_factory=dict, description="执行结果")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="输出数据")
    
    # 错误信息
    error_message: Optional[str] = Field(None, description="错误消息")
    error_details: Dict[str, Any] = Field(default_factory=dict, description="错误详情")
    failed_step: Optional[str] = Field(None, description="失败的步骤")
    
    # 进度信息
    progress_percentage: int = Field(0, description="进度百分比")
    completed_steps: int = Field(0, description="已完成步骤数")
    total_steps: int = Field(0, description="总步骤数")
    
    # 统计信息
    execution_count: int = Field(0, description="执行次数")
    success_count: int = Field(0, description="成功次数")
    failure_count: int = Field(0, description="失败次数")
    
    # 版本控制
    parent_workflow_id: Optional[int] = Field(None, description="父工作流ID")
    is_latest_version: bool = Field(True, description="是否为最新版本")
    
    # 时间戳
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    
    class Config:
        from_attributes = True
        use_enum_values = True

class WorkflowExecuteRequest(BaseModel):
    """Workflow执行请求模型"""
    execution_params: Dict[str, Any] = Field(default_factory=dict, description="执行参数")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="输入数据")
    
    # 执行配置
    timeout: Optional[int] = Field(None, ge=1, le=86400, description="超时时间（秒）")
    async_execution: bool = Field(False, description="是否异步执行")
    
    # 执行选项
    start_from_step: Optional[str] = Field(None, description="从指定步骤开始")
    skip_steps: List[str] = Field(default_factory=list, description="跳过的步骤")
    force_execution: bool = Field(False, description="是否强制执行")
    
    # 回调配置
    callback_url: Optional[str] = Field(None, description="回调URL")
    webhook_headers: Optional[Dict[str, str]] = Field(None, description="Webhook头部")
    
    # 监控配置
    enable_monitoring: bool = Field(True, description="是否启用监控")
    log_level: Optional[str] = Field("INFO", description="日志级别")

class WorkflowExecuteResponse(BaseModel):
    """Workflow执行响应模型"""
    execution_id: str = Field(..., description="执行ID")
    workflow_id: int = Field(..., description="工作流ID")
    status: str = Field(..., description="执行状态")
    
    # 执行结果
    result: Optional[Dict[str, Any]] = Field(None, description="执行结果")
    output: Optional[Dict[str, Any]] = Field(None, description="输出数据")
    
    # 执行信息
    started_at: datetime = Field(..., description="开始时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    execution_time: Optional[float] = Field(None, description="执行时间（秒）")
    
    # 进度信息
    progress: int = Field(0, description="进度百分比")
    current_step: Optional[str] = Field(None, description="当前步骤")
    completed_steps: List[str] = Field(default_factory=list, description="已完成步骤")
    
    # 错误信息
    error_message: Optional[str] = Field(None, description="错误消息")
    error_details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    failed_step: Optional[str] = Field(None, description="失败步骤")
    
    # 日志和调试信息
    logs: List[str] = Field(default_factory=list, description="执行日志")
    debug_info: Optional[Dict[str, Any]] = Field(None, description="调试信息")

class WorkflowStatusResponse(BaseModel):
    """Workflow状态响应模型"""
    workflow_id: int = Field(..., description="工作流ID")
    status: WorkflowStatus = Field(..., description="当前状态")
    is_executable: bool = Field(..., description="是否可执行")
    
    # 执行信息
    current_execution_id: Optional[str] = Field(None, description="当前执行ID")
    current_step: Optional[str] = Field(None, description="当前步骤")
    progress: int = Field(0, description="进度百分比")
    
    # 步骤状态
    step_statuses: Dict[str, str] = Field(default_factory=dict, description="步骤状态")
    completed_steps: List[str] = Field(default_factory=list, description="已完成步骤")
    pending_steps: List[str] = Field(default_factory=list, description="待执行步骤")
    
    # 时间信息
    started_at: Optional[datetime] = Field(None, description="开始时间")
    estimated_completion: Optional[datetime] = Field(None, description="预计完成时间")
    
    # 资源使用情况
    active_agents: List[int] = Field(default_factory=list, description="活跃Agent列表")
    resource_usage: Dict[str, Any] = Field(default_factory=dict, description="资源使用情况")
    
    # 统计信息
    total_executions: int = Field(0, description="总执行次数")
    successful_executions: int = Field(0, description="成功执行次数")
    failed_executions: int = Field(0, description="失败执行次数")
    average_execution_time: Optional[float] = Field(None, description="平均执行时间")
    
    class Config:
        use_enum_values = True

class WorkflowListResponse(BaseModel):
    """Workflow列表响应模型"""
    workflows: List[WorkflowResponse] = Field(..., description="工作流列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页")
    size: int = Field(..., description="每页大小")
    pages: int = Field(..., description="总页数")

class WorkflowSearchRequest(BaseModel):
    """Workflow搜索请求模型"""
    query: Optional[str] = Field(None, description="搜索关键词")
    status: Optional[WorkflowStatus] = Field(None, description="状态过滤")
    workflow_type: Optional[WorkflowType] = Field(None, description="类型过滤")
    execution_mode: Optional[ExecutionMode] = Field(None, description="执行模式过滤")
    category: Optional[str] = Field(None, description="分类过滤")
    owner_id: Optional[str] = Field(None, description="所有者过滤")
    tags: Optional[List[str]] = Field(None, description="标签过滤")
    is_template: Optional[bool] = Field(None, description="模板过滤")
    is_public: Optional[bool] = Field(None, description="公开过滤")
    
    # 时间过滤
    created_after: Optional[datetime] = Field(None, description="创建时间起")
    created_before: Optional[datetime] = Field(None, description="创建时间止")
    
    # 排序
    sort_by: Optional[str] = Field("created_at", description="排序字段")
    sort_order: Optional[str] = Field("desc", description="排序方向")
    
    # 分页
    page: int = Field(1, ge=1, description="页码")
    size: int = Field(20, ge=1, le=100, description="每页大小")

class WorkflowVersionRequest(BaseModel):
    """工作流版本请求模型"""
    version_type: str = Field(..., description="版本类型: major, minor, patch")
    description: Optional[str] = Field(None, description="版本描述")
    changes: List[str] = Field(default_factory=list, description="变更列表")

class WorkflowVersionResponse(BaseModel):
    """工作流版本响应模型"""
    id: int = Field(..., description="新版本ID")
    version: str = Field(..., description="版本号")
    parent_workflow_id: int = Field(..., description="父工作流ID")
    description: Optional[str] = Field(None, description="版本描述")
    changes: List[str] = Field(default_factory=list, description="变更列表")
    created_at: datetime = Field(..., description="创建时间")

class WorkflowCloneRequest(BaseModel):
    """工作流克隆请求模型"""
    name: str = Field(..., description="新工作流名称")
    description: Optional[str] = Field(None, description="新工作流描述")
    copy_execution_history: bool = Field(False, description="是否复制执行历史")
    reset_statistics: bool = Field(True, description="是否重置统计信息")

class WorkflowValidationResponse(BaseModel):
    """工作流验证响应模型"""
    is_valid: bool = Field(..., description="是否有效")
    errors: List[str] = Field(default_factory=list, description="错误列表")
    warnings: List[str] = Field(default_factory=list, description="警告列表")
    suggestions: List[str] = Field(default_factory=list, description="建议列表")
    validation_details: Dict[str, Any] = Field(default_factory=dict, description="验证详情")