# 网络错误修复指南

## 问题描述
前端出现 `AxiosError: Network Error`，这是因为前端尝试连接后端API但连接失败。

## 错误分析

### 1. 错误信息
```
AxiosError: Network Error
at XMLHttpRequest.handleError (webpack-internal:///(pages-dir-browser)/../node_modules/axios/lib/adapters/xhr.js:124:14)
at Axios.request (webpack-internal:///(pages-dir-browser)/../node_modules/axios/lib/core/Axios.js:57:41)
at async CrewService.getCrews (webpack-internal:///(pages-dir-browser)/./src/services/crewService.ts:16:30)
at async fetchCrews (webpack-internal:///(pages-dir-browser)/./pages/dashboard.tsx:46:30)
```

### 2. 根本原因
- 前端配置连接到 `http://localhost:9998/api/v1`
- 后端服务器没有运行或端口不匹配
- CORS配置可能有问题

## 解决方案

### 方案1: 启动后端服务器（推荐）

#### 1.1 检查后端配置
后端配置在端口 9998 上运行：
```python
# backend/main.py
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=9998, reload=True, log_level="info")
```

#### 1.2 启动后端服务器
```bash
# 进入后端目录
cd backend

# 安装依赖（如果还没安装）
pip install -r requirements.txt

# 启动后端服务器
python main.py
```

或者使用 uvicorn 直接启动：
```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 9998 --reload
```

#### 1.3 验证后端运行
访问以下URL验证后端是否正常运行：
- 健康检查: http://localhost:9998/health
- API文档: http://localhost:9998/docs
- 根路径: http://localhost:9998/

### 方案2: 使用模拟数据（临时解决）

如果暂时无法启动后端，可以修改前端服务使用模拟数据。

#### 2.1 修改 crewService.ts
```typescript
// 在 crewService.ts 顶部添加模拟数据开关
const USE_MOCK_DATA = true; // 设置为 true 使用模拟数据

export class CrewService {
  async getCrews(params?: any): Promise<Crew[]> {
    if (USE_MOCK_DATA) {
      // 返回模拟数据
      return this.getMockCrews();
    }
    
    // 原有的API调用逻辑
    try {
      const response = await apiClient.get<any[]>(this.basePath, { params });
      // ... 其余代码
    } catch (error) {
      console.error('Failed to fetch crews:', error);
      // 如果API调用失败，回退到模拟数据
      return this.getMockCrews();
    }
  }

  private getMockCrews(): Crew[] {
    return [
      {
        id: '1',
        name: '内容创作团队',
        description: '专门用于内容创作和审核的AI团队',
        workflowTemplateId: '1',
        workflowTemplateName: 'Content Creation Workflow',
        agentsConfig: [
          {
            agentId: 'writer',
            agentName: 'Content Writer',
            llmModel: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
            tools: [],
            apiKeys: {},
          },
        ],
        status: 'READY' as CrewStatus,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastExecutionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        successRate: 85,
        totalExecutions: 12,
      },
      {
        id: '2',
        name: '研究分析团队',
        description: '用于数据研究和分析的AI团队',
        workflowTemplateId: '2',
        workflowTemplateName: 'Research & Analysis',
        agentsConfig: [
          {
            agentId: 'researcher',
            agentName: 'Research Agent',
            llmModel: 'gpt-3.5-turbo',
            temperature: 0.3,
            maxTokens: 1500,
            tools: [],
            apiKeys: {},
          },
        ],
        status: 'RUNNING' as CrewStatus,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        lastExecutionAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        successRate: 92,
        totalExecutions: 25,
      },
    ];
  }
}
```

### 方案3: 修复API配置

#### 3.1 确保环境变量正确
检查 `frontend/.env.local` 文件：
```env
NEXT_PUBLIC_API_URL=http://localhost:9998
NEXT_PUBLIC_API_VERSION=/api/v1
```

#### 3.2 重启前端开发服务器
环境变量更改后需要重启：
```bash
cd frontend
npm run dev
```

### 方案4: 网络诊断

#### 4.1 检查端口占用
```bash
# Windows
netstat -ano | findstr :9998

# macOS/Linux
lsof -i :9998
```

#### 4.2 测试网络连接
```bash
# 使用 curl 测试
curl http://localhost:9998/health

# 或使用 telnet
telnet localhost 9998
```

## 推荐的修复步骤

### 步骤1: 启动后端服务器
```bash
cd backend
python main.py
```

### 步骤2: 验证后端运行
访问 http://localhost:9998/health 应该返回：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "crewai": {...}
}
```

### 步骤3: 重启前端服务器
```bash
cd frontend
npm run dev
```

### 步骤4: 测试前端连接
访问 http://localhost:3000/dashboard 应该能正常加载数据。

## 预防措施

### 1. 创建启动脚本
创建 `start-all.bat` (Windows) 或 `start-all.sh` (macOS/Linux)：

```bash
#!/bin/bash
# 启动后端
cd backend && python main.py &

# 等待后端启动
sleep 5

# 启动前端
cd ../frontend && npm run dev
```

### 2. 添加健康检查
在前端添加API健康检查：
```typescript
// 在应用启动时检查API连接
const checkApiHealth = async () => {
  try {
    const response = await fetch('http://localhost:9998/health');
    if (response.ok) {
      console.log('✅ Backend API is running');
    } else {
      console.warn('⚠️ Backend API returned error status');
    }
  } catch (error) {
    console.error('❌ Backend API is not accessible:', error);
  }
};
```

### 3. 错误处理改进
在服务中添加更好的错误处理：
```typescript
async getCrews(): Promise<Crew[]> {
  try {
    const response = await apiClient.get<any[]>(this.basePath);
    return response.data.map(crew => this.transformCrewData(crew));
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      console.error('Network error: Backend server may not be running');
      // 可以显示用户友好的错误消息
      throw new Error('无法连接到服务器，请确保后端服务正在运行');
    }
    throw error;
  }
}
```

## 总结

网络错误的主要原因是后端服务器没有运行。最简单的解决方案是启动后端服务器。如果需要在没有后端的情况下开发前端，可以使用模拟数据作为临时解决方案。