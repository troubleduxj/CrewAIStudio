/**
 * Crew 服务
 * 处理 Crew 的 CRUD 操作、执行和状态管理
 */

import { apiClient } from '@/lib/api';
import { 
  Crew, 
  CrewStatus,
  CreateCrewRequest, 
  UpdateCrewRequest,
  ExecutionInput,
  ApiResponse,
  PaginatedResponse 
} from '@/types/crew';

// 保留原有的执行日志接口用于兼容性
export interface ExecutionLog {
  id: string;
  crew_id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  agent_id?: string;
  task_id?: string;
}

// Crew统计信息接口
export interface CrewStats {
  total_crews: number;
  active_crews: number;
  completed_crews: number;
  failed_crews: number;
  total_agents: number;
  total_tasks: number;
  avg_execution_time: number;
  success_rate: number;
}

export class CrewService {
  private readonly basePath = '/crews';

  /**
   * 获取 Crew 列表
   */
  async getCrews(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
    workflowTemplateId?: string;
    sortBy?: 'name' | 'createdAt' | 'lastExecutionAt' | 'successRate';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Crew[]> {
    try {
      const response = await apiClient.get<any[]>(
        this.basePath,
        { params }
      );
      
      console.log('Raw API response:', response.data);
      
      // 确保响应数据是数组
      if (!Array.isArray(response.data)) {
        console.error('API response is not an array:', response.data);
        return [];
      }
      
      // 转换数据格式
      const crews = response.data.map((crew: any) => {
        try {
          return this.transformCrewData(crew);
        } catch (transformError) {
          console.error('Error transforming crew data:', transformError, crew);
          // 返回一个基本的crew对象，避免整个列表失败
          return {
            id: crew.id || 'unknown',
            name: crew.name || 'Unknown Crew',
            description: crew.description || '',
            workflowTemplateId: crew.workflow_template_id || '',
            workflowTemplateName: 'Unknown Template',
            agentsConfig: [],
            status: 'READY' as CrewStatus,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            successRate: 0,
            totalExecutions: 0,
          };
        }
      });
      
      return crews;
    } catch (error) {
      console.error('Failed to fetch crews, using mock data:', error);
      
      // 如果是网络错误，返回模拟数据而不是抛出错误
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        console.warn('Backend server not available, using mock data');
        return this.getMockCrews();
      }
      
      // 对于其他错误，也尝试返回模拟数据
      return this.getMockCrews();
    }
  }

  /**
   * 获取模拟 Crew 数据
   */
  private getMockCrews(): Crew[] {
    return [
      {
        id: '1',
        name: '内容创作团队',
        description: '专门用于内容创作和审核的AI团队，包含写作和审核智能体',
        workflowTemplateId: '1',
        workflowTemplateName: 'Content Creation Workflow',
        agentsConfig: [
          {
            agentId: 'writer',
            agentName: 'Content Writer',
            llmModel: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
            tools: [
              { toolId: 'web-search', toolName: 'Web Search', enabled: true, config: {} },
              { toolId: 'file-reader', toolName: 'File Reader', enabled: true, config: {} },
            ],
            apiKeys: {},
          },
          {
            agentId: 'reviewer',
            agentName: 'Content Reviewer',
            llmModel: 'gpt-3.5-turbo',
            temperature: 0.3,
            maxTokens: 1500,
            tools: [
              { toolId: 'file-reader', toolName: 'File Reader', enabled: true, config: {} },
            ],
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
        description: '用于数据研究和分析的AI团队，具备深度分析能力',
        workflowTemplateId: '2',
        workflowTemplateName: 'Research & Analysis',
        agentsConfig: [
          {
            agentId: 'researcher',
            agentName: 'Research Agent',
            llmModel: 'gpt-3.5-turbo',
            temperature: 0.3,
            maxTokens: 1500,
            tools: [
              { toolId: 'web-search', toolName: 'Web Search', enabled: true, config: {} },
              { toolId: 'calculator', toolName: 'Calculator', enabled: true, config: {} },
            ],
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
      {
        id: '3',
        name: '客户服务团队',
        description: '自动化客户服务和支持的AI团队',
        workflowTemplateId: '3',
        workflowTemplateName: 'Customer Support Automation',
        agentsConfig: [
          {
            agentId: 'support-agent',
            agentName: 'Support Agent',
            llmModel: 'claude-3-sonnet',
            temperature: 0.5,
            maxTokens: 2000,
            tools: [
              { toolId: 'email-sender', toolName: 'Email Sender', enabled: true, config: {} },
              { toolId: 'file-reader', toolName: 'File Reader', enabled: true, config: {} },
            ],
            apiKeys: {},
          },
        ],
        status: 'READY' as CrewStatus,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastExecutionAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        successRate: 78,
        totalExecutions: 8,
      },
    ];
  }

  /**
   * 获取分页的 Crew 列表
   */
  async getCrewsPaginated(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    workflowTemplateId?: string;
    sortBy?: 'name' | 'createdAt' | 'lastExecutionAt' | 'successRate';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Crew>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Crew>>>(
        `${this.basePath}/paginated`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch paginated crews:', error);
      throw this.handleError(error, 'Failed to fetch crews');
    }
  }

  /**
   * 根据 ID 获取 Crew
   */
  async getCrew(id: string): Promise<Crew> {
    try {
      const response = await apiClient.get<any>(
        `${this.basePath}/${id}`
      );
      
      // 检查响应格式，后端可能直接返回crew对象或包装在data中
      const crewData = response.data.data || response.data;
      return this.transformCrewData(crewData);
    } catch (error) {
      console.error(`Failed to fetch crew ${id}, using mock data:`, error);
      
      // 如果是网络错误，从模拟数据中查找
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        console.warn('Backend server not available, using mock data');
        const mockCrews = this.getMockCrews();
        const crew = mockCrews.find(c => c.id === id);
        if (crew) {
          return crew;
        }
      }
      
      // 如果找不到，返回一个默认的crew对象
      const mockCrews = this.getMockCrews();
      const crew = mockCrews.find(c => c.id === id);
      if (crew) {
        return crew;
      }
      
      throw this.handleError(error, 'Failed to fetch crew');
    }
  }

  /**
   * 创建新的 Crew
   */
  async createCrew(crew: CreateCrewRequest): Promise<Crew> {
    try {
      // 验证 Crew 数据
      this.validateCrewData(crew);

      const response = await apiClient.post<ApiResponse<Crew>>(
        this.basePath,
        crew
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to create crew:', error);
      throw this.handleError(error, 'Failed to create crew');
    }
  }

  /**
   * 更新 Crew
   */
  async updateCrew(id: string, crew: UpdateCrewRequest): Promise<Crew> {
    try {
      // 验证更新数据
      if (crew.agentsConfig) {
        this.validateAgentsConfig(crew.agentsConfig);
      }

      const response = await apiClient.put<ApiResponse<Crew>>(
        `${this.basePath}/${id}`,
        crew
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update crew ${id}:`, error);
      throw this.handleError(error, 'Failed to update crew');
    }
  }

  /**
   * 删除 Crew
   */
  async deleteCrew(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Failed to delete crew ${id}:`, error);
      throw this.handleError(error, 'Failed to delete crew');
    }
  }

  /**
   * 执行 Crew（异步）
   */
  async executeCrew(crewId: string, input: ExecutionInput): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse<{ jobId: string }>>(
        `${this.basePath}/${crewId}/execute`,
        input
      );
      return response.data.data.jobId;
    } catch (error) {
      console.error(`Failed to execute crew ${crewId}:`, error);
      throw this.handleError(error, 'Failed to execute crew');
    }
  }

  /**
   * 停止 Crew 执行
   */
  async stopCrew(crewId: string): Promise<void> {
    try {
      await apiClient.post(`${this.basePath}/${crewId}/stop`);
    } catch (error) {
      console.error(`Failed to stop crew ${crewId}:`, error);
      throw this.handleError(error, 'Failed to stop crew');
    }
  }

  /**
   * 获取 Crew 执行历史
   */
  async getCrewExecutions(crewId: string, params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        `${this.basePath}/${crewId}/executions`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch crew executions ${crewId}:`, error);
      throw this.handleError(error, 'Failed to fetch crew executions');
    }
  }

  /**
   * 获取 Crew 执行日志
   */
  async getCrewLogs(crewId: string, limit: number = 50): Promise<ExecutionLog[]> {
    try {
      const response = await apiClient.get<ApiResponse<ExecutionLog[]>>(
        `${this.basePath}/${crewId}/logs`,
        { params: { limit } }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch crew logs ${crewId}:`, error);
      throw this.handleError(error, 'Failed to fetch crew logs');
    }
  }

  /**
   * 获取 Crew 统计信息
   */
  async getCrewStats(): Promise<CrewStats> {
    try {
      const response = await apiClient.get<ApiResponse<CrewStats>>(
        `${this.basePath}/stats`
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch crew stats:', error);
      throw this.handleError(error, 'Failed to fetch crew statistics');
    }
  }

  /**
   * 检查 Crew 名称是否可用
   */
  async checkCrewName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ available: boolean }>>(
        `${this.basePath}/check-name`,
        { 
          params: { 
            name,
            excludeId 
          } 
        }
      );
      return response.data.data.available;
    } catch (error) {
      console.error('Failed to check crew name:', error);
      throw this.handleError(error, 'Failed to check crew name');
    }
  }

  /**
   * 验证 Crew 数据
   */
  private validateCrewData(crew: CreateCrewRequest): void {
    if (!crew.name || crew.name.trim().length === 0) {
      throw new Error('Crew name is required');
    }

    if (crew.name.length > 100) {
      throw new Error('Crew name must be less than 100 characters');
    }

    if (crew.description && crew.description.length > 500) {
      throw new Error('Crew description must be less than 500 characters');
    }

    if (!crew.workflowTemplateId) {
      throw new Error('Workflow template ID is required');
    }

    this.validateAgentsConfig(crew.agentsConfig);
  }

  /**
   * 验证 Agent 配置
   */
  private validateAgentsConfig(agentsConfig: any[]): void {
    if (!Array.isArray(agentsConfig) || agentsConfig.length === 0) {
      throw new Error('At least one agent configuration is required');
    }

    agentsConfig.forEach((config, index) => {
      if (!config.agentId || !config.llmModel) {
        throw new Error(`Agent configuration ${index + 1} is missing required fields`);
      }

      if (config.temperature < 0 || config.temperature > 2) {
        throw new Error(`Agent configuration ${index + 1} has invalid temperature value`);
      }

      if (config.maxTokens < 1 || config.maxTokens > 32000) {
        throw new Error(`Agent configuration ${index + 1} has invalid maxTokens value`);
      }
    });
  }

  /**
   * 转换后端数据格式为前端格式
   */
  private transformCrewData(backendCrew: any): Crew {
    // 处理日期字段
    const formatDate = (dateStr: any) => {
      if (!dateStr) return '';
      if (typeof dateStr === 'string') return dateStr;
      if (dateStr instanceof Date) return dateStr.toISOString();
      return '';
    };

    return {
      id: backendCrew.id,
      name: backendCrew.name,
      description: backendCrew.description || '',
      workflowTemplateId: backendCrew.workflow_template_id,
      workflowTemplateName: backendCrew.workflow_template_name || 'Unknown Template',
      agentsConfig: backendCrew.agents_config || [],
      status: this.mapStatus(backendCrew.status),
      createdAt: formatDate(backendCrew.created_at),
      updatedAt: formatDate(backendCrew.updated_at),
      lastExecutionAt: formatDate(backendCrew.last_execution_at),
      successRate: this.calculateSuccessRate(backendCrew.success_count, backendCrew.execution_count),
      totalExecutions: backendCrew.execution_count || 0,
      
      // 保留原始后端字段以便组件使用
      workflow_template_id: backendCrew.workflow_template_id,
      agents_config: backendCrew.agents_config || [],
      execution_count: backendCrew.execution_count || 0,
      success_count: backendCrew.success_count || 0,
      error_count: backendCrew.error_count || 0,
      current_execution_id: backendCrew.current_execution_id,
      execution_progress: backendCrew.execution_progress,
      current_agent: backendCrew.current_agent,
      current_task: backendCrew.current_task,
      total_tasks: backendCrew.total_tasks,
      completed_tasks: backendCrew.completed_tasks,
      failed_tasks: backendCrew.failed_tasks,
      execution_time: backendCrew.execution_time,
      last_execution_at: backendCrew.last_execution_at,
      created_at: backendCrew.created_at,
      updated_at: backendCrew.updated_at,
    };
  }

  /**
   * 映射后端状态到前端状态
   */
  private mapStatus(backendStatus: string): CrewStatus {
    switch (backendStatus?.toLowerCase()) {
      case 'running':
        return 'RUNNING';
      case 'disabled':
      case 'inactive':
        return 'DISABLED';
      case 'idle':
      case 'ready':
      case 'completed':
      default:
        return 'READY';
    }
  }

  /**
   * 计算成功率
   */
  private calculateSuccessRate(successCount: number = 0, totalCount: number = 0): number {
    if (totalCount === 0) return 0;
    return Math.round((successCount / totalCount) * 100);
  }

  /**
   * 处理 API 错误
   */
  private handleError(error: any, defaultMessage: string): Error {
    // 处理404错误
    if (error.response?.status === 404) {
      // 404错误可能意味着数据已过期，建议清理缓存
      console.warn('Crew not found (404), cache may be stale');
      return new Error('Request failed with status code 404');
    }
    
    if (error.response?.data?.error_message) {
      return new Error(error.response.data.error_message);
    }
    
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.response?.data?.detail) {
      return new Error(error.response.data.detail);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * 格式化执行时间
   */
  formatExecutionTime(seconds?: number): string {
    if (!seconds) return '0秒';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${remainingSeconds}秒`;
    } else {
      return `${remainingSeconds}秒`;
    }
  }

  /**
   * 计算进度百分比
   */
  calculateProgress(completedTasks: number, totalTasks: number): number {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }
}

// 创建服务实例
export const crewService = new CrewService();