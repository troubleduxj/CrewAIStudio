# 工作流运行按钮功能逻辑文档

## 概述

本文档详细描述了CrewAI Studio中"Run"按钮的功能逻辑，包括前端触发、后端API处理、执行服务管理等完整流程。

## 架构概览

工作流执行涉及以下主要组件：

1. **前端界面** (`frontend/pages/workflow.tsx`)
2. **前端API客户端** (`frontend/src/lib/api.ts`)
3. **后端API端点** (`backend/app/api/v1/endpoints/workflows.py`)
4. **工作流服务** (`backend/app/services/workflow_service.py`)
5. **执行服务** (`backend/app/services/execution_service.py`)
6. **CrewAI服务** (`backend/app/services/crewai_service.py`)
7. **数据模型** (`backend/app/models/workflow.py`)

## 详细流程

### 1. 前端触发 (workflow.tsx)

#### runWorkflow 函数
```typescript
const runWorkflow = async () => {
  setIsExecuting(true);
  setExecutionLogs(prev => [...prev, '开始执行工作流...']);
  
  try {
    // 验证工作流配置
    if (nodes.length === 0) {
      throw new Error('工作流为空，请先添加节点');
    }
    
    setExecutionLogs(prev => [...prev, '验证工作流配置...']);
    
    // 模拟执行过程
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      setExecutionLogs(prev => [...prev, `执行节点: ${node.data?.label || node.id}`]);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setExecutionLogs(prev => [...prev, '工作流执行完成']);
  } catch (error) {
    setExecutionLogs(prev => [...prev, `执行失败: ${error}`]);
  } finally {
    setIsExecuting(false);
  }
};
```

**当前状态**: 前端目前使用模拟执行，需要集成真实的后端API调用。

#### Run按钮定义
```jsx
<Button 
  onClick={runWorkflow} 
  disabled={isExecuting}
  className="bg-green-600 hover:bg-green-700"
>
  {isExecuting ? (
    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />执行中</>
  ) : (
    <><Play className="w-4 h-4 mr-2" />运行</>
  )}
</Button>
```

### 2. 前端API客户端 (api.ts)

#### 工作流相关API方法
```typescript
export const workflowsApi = {
  // 执行工作流
  executeWorkflow: async (id: string, executionParams?: any) => {
    const response = await apiClient.post(`/workflows/${id}/execute`, executionParams);
    return response.data;
  },

  // 获取工作流状态
  getWorkflowStatus: async (id: string) => {
    const response = await apiClient.get(`/workflows/${id}/status`);
    return response.data;
  },

  // 停止工作流
  stopWorkflow: async (id: string) => {
    const response = await apiClient.post(`/workflows/${id}/stop`);
    return response.data;
  }
};
```

### 3. 后端API端点 (workflows.py)

#### 执行工作流端点
```python
@router.post("/{workflow_id}/execute", response_model=dict)
async def execute_workflow(
    workflow_id: UUID,
    execution_params: dict = {},
    db: Session = Depends(get_db)
) -> dict:
    """
    执行工作流
    
    Args:
        workflow_id: 工作流ID
        execution_params: 执行参数
        db: 数据库会话
    
    Returns:
        dict: 执行结果
    """
    try:
        workflow_service = WorkflowService(db)
        result = await workflow_service.execute_workflow(workflow_id, execution_params)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute workflow: {str(e)}"
        )
```

#### 获取状态端点
```python
@router.get("/{workflow_id}/status", response_model=dict)
async def get_workflow_status(
    workflow_id: UUID,
    db: Session = Depends(get_db)
) -> dict:
    """
    获取工作流执行状态
    """
    workflow_service = WorkflowService(db)
    status_info = await workflow_service.get_workflow_status(workflow_id)
    
    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return status_info
```

#### 停止工作流端点
```python
@router.post("/{workflow_id}/stop", response_model=dict)
async def stop_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db)
) -> dict:
    """
    停止工作流执行
    """
    try:
        workflow_service = WorkflowService(db)
        result = await workflow_service.stop_workflow(workflow_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop workflow: {str(e)}"
        )
```

### 4. 执行服务 (execution_service.py)

#### 执行工作流方法
```python
async def execute_workflow(self, workflow_id: int, inputs: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None) -> str:
    """
    执行工作流
    
    Args:
        workflow_id: 工作流ID
        inputs: 输入参数
        user_id: 用户ID
        
    Returns:
        str: 执行ID
    """
    workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise ValueError(f"Workflow {workflow_id} not found")
    
    if not workflow.is_active:
        raise ValueError(f"Workflow {workflow_id} is not active")
    
    if workflow.status not in [WorkflowStatus.READY, WorkflowStatus.PAUSED]:
        raise ValueError(f"Workflow {workflow_id} is not in executable state")
    
    # 创建执行上下文
    execution_id = str(uuid.uuid4())
    context = ExecutionContext(
        execution_id=execution_id,
        execution_type=ExecutionType.WORKFLOW,
        target_id=workflow_id,
        user_id=user_id,
        inputs=inputs or {},
        metadata={
            "workflow_name": workflow.name,
            "workflow_type": workflow.workflow_type.value,
            "execution_mode": workflow.execution_mode.value
        }
    )
    
    with self.lock:
        self.execution_contexts[execution_id] = context
    
    # 检查是否可以立即执行
    if self.current_workflow_executions < self.max_concurrent_workflows:
        await self._start_workflow_execution(context)
    else:
        # 添加到队列
        self.workflow_queue.append(context)
        context.status = "queued"
        logger.info(f"Workflow {workflow_id} queued for execution (execution_id: {execution_id})")
    
    return execution_id
```

#### 获取执行状态方法
```python
def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
    """
    获取执行状态
    
    Args:
        execution_id: 执行ID
        
    Returns:
        Optional[Dict[str, Any]]: 执行状态或None
    """
    context = self.execution_contexts.get(execution_id)
    if not context:
        return None
    
    return {
        "execution_id": context.execution_id,
        "execution_type": context.execution_type.value,
        "target_id": context.target_id,
        "status": context.status,
        "progress": context.progress,
        "current_step": context.current_step,
        "started_at": context.started_at.isoformat() if context.started_at else None,
        "completed_at": context.completed_at.isoformat() if context.completed_at else None,
        "result": context.result,
        "error": context.error,
        "logs": context.logs,
        "metadata": context.metadata
    }
```

#### 停止执行方法
```python
def stop_execution(self, execution_id: str) -> bool:
    """
    停止执行
    
    Args:
        execution_id: 执行ID
        
    Returns:
        bool: 是否成功停止
    """
    context = self.execution_contexts.get(execution_id)
    if not context:
        return False
    
    if context.status not in ["running", "queued"]:
        return False
    
    # 如果在队列中，直接移除
    if context.status == "queued":
        if context in self.task_queue:
            self.task_queue.remove(context)
        if context in self.workflow_queue:
            self.workflow_queue.remove(context)
        
        context.status = "cancelled"
        context.completed_at = datetime.utcnow()
        return True
    
    # 如果正在运行，尝试取消Future
    future = self.execution_futures.get(execution_id)
    if future:
        cancelled = future.cancel()
        if cancelled:
            context.status = "cancelled"
            context.completed_at = datetime.utcnow()
            
            # 更新数据库状态
            if context.execution_type == ExecutionType.WORKFLOW:
                workflow = self.db.query(Workflow).filter(Workflow.id == context.target_id).first()
                if workflow:
                    workflow.status = WorkflowStatus.CANCELLED
                    workflow.completed_at = context.completed_at
                    self.db.commit()
            
            logger.info(f"Execution {execution_id} cancelled")
            return True
    
    return False
```

### 5. 工作流模型 (workflow.py)

#### 执行相关方法
```python
def is_executable(self):
    """检查工作流是否可执行"""
    return (
        self.is_active and
        self.status in [WorkflowStatus.ACTIVE, WorkflowStatus.PAUSED] and
        self.workflow_definition and
        len(self.workflow_definition) > 0
    )

def can_be_paused(self):
    """检查工作流是否可以暂停"""
    return self.status == WorkflowStatus.RUNNING

def can_be_resumed(self):
    """检查工作流是否可以恢复"""
    return self.status == WorkflowStatus.PAUSED

def can_be_cancelled(self):
    """检查工作流是否可以取消"""
    return self.status in [WorkflowStatus.RUNNING, WorkflowStatus.PAUSED]

def update_progress(self, completed_steps: int = None, total_steps: int = None):
    """更新工作流进度"""
    if completed_steps is not None:
        self.completed_steps = completed_steps
    if total_steps is not None:
        self.total_steps = total_steps
    
    if self.total_steps and self.total_steps > 0:
        self.progress_percentage = min(100, int((self.completed_steps / self.total_steps) * 100))
```

## 执行流程图

```
前端点击Run按钮
       ↓
调用runWorkflow函数
       ↓
验证工作流配置
       ↓
调用API: workflowsApi.executeWorkflow()
       ↓
POST /workflows/{id}/execute
       ↓
WorkflowService.execute_workflow()
       ↓
ExecutionService.execute_workflow()
       ↓
创建ExecutionContext
       ↓
检查并发限制
       ↓
立即执行 或 加入队列
       ↓
_start_workflow_execution()
       ↓
更新数据库状态
       ↓
在线程池中执行
       ↓
返回execution_id
```

## 状态管理

### 工作流状态 (WorkflowStatus)
- `DRAFT`: 草稿状态
- `READY`: 准备执行
- `RUNNING`: 正在执行
- `PAUSED`: 已暂停
- `COMPLETED`: 已完成
- `FAILED`: 执行失败
- `CANCELLED`: 已取消

### 执行上下文状态
- `queued`: 排队中
- `running`: 执行中
- `completed`: 已完成
- `failed`: 失败
- `cancelled`: 已取消

## 并发控制

执行服务通过以下机制控制并发：

1. **最大并发工作流数**: `max_concurrent_workflows`
2. **最大并发任务数**: `max_concurrent_tasks`
3. **队列管理**: `workflow_queue` 和 `task_queue`
4. **线程池**: 使用 `ThreadPoolExecutor` 管理执行
5. **锁机制**: 使用 `threading.Lock` 保护共享状态

## 错误处理

1. **前端错误处理**: 捕获异常并显示在执行日志中
2. **API错误处理**: 返回适当的HTTP状态码和错误信息
3. **执行错误处理**: 更新执行上下文状态和数据库记录
4. **重试机制**: 支持配置重试策略

## 需要改进的地方

1. **前端集成**: 当前前端使用模拟执行，需要集成真实的API调用
2. **实时状态更新**: 需要WebSocket或轮询机制实时更新执行状态
3. **执行日志**: 需要实现详细的执行日志收集和展示
4. **错误恢复**: 需要完善错误恢复和重试机制
5. **性能监控**: 需要添加执行性能监控和统计

## 建议的改进方案

### 1. 前端API集成
```typescript
const runWorkflow = async () => {
  setIsExecuting(true);
  setExecutionLogs(prev => [...prev, '开始执行工作流...']);
  
  try {
    // 调用真实API
    const result = await workflowsApi.executeWorkflow(workflowId, {
      inputs: getWorkflowInputs(),
      user_id: getCurrentUserId()
    });
    
    const executionId = result.execution_id;
    
    // 轮询状态更新
    const statusInterval = setInterval(async () => {
      const status = await workflowsApi.getWorkflowStatus(workflowId);
      updateExecutionStatus(status);
      
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(statusInterval);
        setIsExecuting(false);
      }
    }, 1000);
    
  } catch (error) {
    setExecutionLogs(prev => [...prev, `执行失败: ${error.message}`]);
    setIsExecuting(false);
  }
};
```

### 2. WebSocket实时更新
```typescript
// 建立WebSocket连接监听执行状态
const ws = new WebSocket(`ws://localhost:8000/ws/workflow/${workflowId}`);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateExecutionStatus(data);
};
```

### 3. 执行日志收集
```python
# 在ExecutionService中添加日志收集
def log_execution_step(self, execution_id: str, step: str, message: str):
    context = self.execution_contexts.get(execution_id)
    if context:
        context.logs.append({
            "timestamp": datetime.utcnow().isoformat(),
            "step": step,
            "message": message
        })
```

这个文档提供了Run按钮功能的完整技术实现细节，可以作为开发和维护的参考。