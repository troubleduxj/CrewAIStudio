/**
 * 执行服务
 * 处理执行状态查询、轮询和实时更新
 */

import { apiClient } from '@/lib/api';
import { Execution, ExecutionStatus, ApiResponse, PaginatedResponse } from '@/types';

export class ExecutionService {
  private readonly basePath = '/executions';
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private eventSources: Map<string, EventSource> = new Map();

  /**
   * 获取执行状态
   */
  async getExecutionStatus(jobId: string): Promise<Execution> {
    try {
      const response = await apiClient.get<ApiResponse<Execution>>(
        `${this.basePath}/${jobId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch execution status ${jobId}:`, error);
      throw this.handleError(error, 'Failed to fetch execution status');
    }
  }

  /**
   * 获取执行列表
   */
  async getExecutions(params?: {
    skip?: number;
    limit?: number;
    crewId?: string;
    status?: ExecutionStatus;
    startDate?: string;
    endDate?: string;
    sortBy?: 'startedAt' | 'completedAt' | 'duration';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Execution[]> {
    try {
      const response = await apiClient.get<ApiResponse<Execution[]>>(
        this.basePath,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      throw this.handleError(error, 'Failed to fetch executions');
    }
  }

  /**
   * 获取分页的执行列表
   */
  async getExecutionsPaginated(params?: {
    page?: number;
    size?: number;
    crewId?: string;
    status?: ExecutionStatus;
    startDate?: string;
    endDate?: string;
    sortBy?: 'startedAt' | 'completedAt' | 'duration';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Execution>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Execution>>>(
        `${this.basePath}/paginated`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch paginated executions:', error);
      throw this.handleError(error, 'Failed to fetch executions');
    }
  }

  /**
   * 取消执行
   */
  async cancelExecution(jobId: string): Promise<void> {
    try {
      await apiClient.post(`${this.basePath}/${jobId}/cancel`);
    } catch (error) {
      console.error(`Failed to cancel execution ${jobId}:`, error);
      throw this.handleError(error, 'Failed to cancel execution');
    }
  }

  /**
   * 获取执行日志
   */
  async getExecutionLogs(jobId: string, params?: {
    skip?: number;
    limit?: number;
    level?: 'info' | 'warning' | 'error' | 'debug';
  }): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        `${this.basePath}/${jobId}/logs`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch execution logs ${jobId}:`, error);
      throw this.handleError(error, 'Failed to fetch execution logs');
    }
  }

  /**
   * 轮询执行状态
   */
  async pollExecutionStatus(
    jobId: string, 
    onUpdate: (execution: Execution) => void,
    options?: {
      interval?: number; // 轮询间隔（毫秒），默认 2000
      maxRetries?: number; // 最大重试次数，默认 -1（无限制）
      onError?: (error: Error) => void;
      onComplete?: (execution: Execution) => void;
    }
  ): Promise<void> {
    const {
      interval = 2000,
      maxRetries = -1,
      onError,
      onComplete
    } = options || {};

    let retryCount = 0;
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const execution = await this.getExecutionStatus(jobId);
        onUpdate(execution);

        // 检查是否完成
        if (execution.status === 'COMPLETED' || execution.status === 'FAILED') {
          this.stopPolling(jobId);
          onComplete?.(execution);
          return;
        }

        // 重置重试计数
        retryCount = 0;

        // 继续轮询
        const timeoutId = setTimeout(poll, interval);
        this.pollingIntervals.set(jobId, timeoutId);

      } catch (error) {
        console.error(`Polling error for execution ${jobId}:`, error);
        retryCount++;

        if (maxRetries > 0 && retryCount >= maxRetries) {
          this.stopPolling(jobId);
          onError?.(error as Error);
          return;
        }

        // 错误时延长轮询间隔
        const errorInterval = Math.min(interval * Math.pow(2, retryCount), 30000);
        const timeoutId = setTimeout(poll, errorInterval);
        this.pollingIntervals.set(jobId, timeoutId);
      }
    };

    // 开始轮询
    poll();
  }

  /**
   * 停止轮询
   */
  stopPolling(jobId: string): void {
    const timeoutId = this.pollingIntervals.get(jobId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.pollingIntervals.delete(jobId);
    }
  }

  /**
   * 停止所有轮询
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.pollingIntervals.clear();
  }

  /**
   * 使用 Server-Sent Events 监听执行状态（可选）
   */
  subscribeToExecutionUpdates(
    jobId: string,
    onUpdate: (execution: Execution) => void,
    onError?: (error: Event) => void
  ): void {
    // 检查浏览器是否支持 EventSource
    if (typeof EventSource === 'undefined') {
      console.warn('EventSource not supported, falling back to polling');
      this.pollExecutionStatus(jobId, onUpdate);
      return;
    }

    try {
      const eventSource = new EventSource(
        `${apiClient.defaults.baseURL}${this.basePath}/${jobId}/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const execution: Execution = JSON.parse(event.data);
          onUpdate(execution);

          // 如果执行完成，关闭连接
          if (execution.status === 'COMPLETED' || execution.status === 'FAILED') {
            this.unsubscribeFromExecutionUpdates(jobId);
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`SSE error for execution ${jobId}:`, error);
        onError?.(error);
        
        // 发生错误时回退到轮询
        this.unsubscribeFromExecutionUpdates(jobId);
        this.pollExecutionStatus(jobId, onUpdate);
      };

      this.eventSources.set(jobId, eventSource);

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      // 回退到轮询
      this.pollExecutionStatus(jobId, onUpdate);
    }
  }

  /**
   * 取消订阅执行更新
   */
  unsubscribeFromExecutionUpdates(jobId: string): void {
    const eventSource = this.eventSources.get(jobId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(jobId);
    }
  }

  /**
   * 取消所有订阅
   */
  unsubscribeFromAllUpdates(): void {
    this.eventSources.forEach((eventSource) => {
      eventSource.close();
    });
    this.eventSources.clear();
  }

  /**
   * 获取执行统计信息
   */
  async getExecutionStats(params?: {
    crewId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    successRate: number;
    executionsPerDay: Array<{ date: string; count: number }>;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.basePath}/stats`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch execution stats:', error);
      throw this.handleError(error, 'Failed to fetch execution statistics');
    }
  }

  /**
   * 重试失败的执行
   */
  async retryExecution(jobId: string): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse<{ jobId: string }>>(
        `${this.basePath}/${jobId}/retry`
      );
      return response.data.data.jobId;
    } catch (error) {
      console.error(`Failed to retry execution ${jobId}:`, error);
      throw this.handleError(error, 'Failed to retry execution');
    }
  }

  /**
   * 导出执行结果
   */
  async exportExecutionResults(jobId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${this.basePath}/${jobId}/export`,
        {
          params: { format },
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to export execution results ${jobId}:`, error);
      throw this.handleError(error, 'Failed to export execution results');
    }
  }

  /**
   * 格式化执行时长
   */
  formatDuration(duration?: number): string {
    if (!duration) return '0秒';
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟${seconds}秒`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  }

  /**
   * 获取状态显示文本
   */
  getStatusText(status: ExecutionStatus): string {
    switch (status) {
      case 'PENDING':
        return '等待中';
      case 'RUNNING':
        return '执行中';
      case 'COMPLETED':
        return '已完成';
      case 'FAILED':
        return '执行失败';
      default:
        return '未知状态';
    }
  }

  /**
   * 获取状态颜色类名
   */
  getStatusColor(status: ExecutionStatus): string {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'RUNNING':
        return 'text-blue-600 bg-blue-100';
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * 处理 API 错误
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error.response?.data?.error_message) {
      return new Error(error.response.data.error_message);
    }
    
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopAllPolling();
    this.unsubscribeFromAllUpdates();
  }
}

// 创建服务实例
export const executionService = new ExecutionService();