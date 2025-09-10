/**
 * 执行相关自定义 Hook
 * 集成 React Query 和执行服务，提供执行状态跟踪、轮询和实时更新
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executionService } from '@/services/executionService';
import { Execution, ExecutionStatus } from '@/types';
import { useCallback, useEffect, useRef } from 'react';

// Query Keys
export const executionKeys = {
  all: ['executions'] as const,
  lists: () => [...executionKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...executionKeys.lists(), filters] as const,
  details: () => [...executionKeys.all, 'detail'] as const,
  detail: (jobId: string) => [...executionKeys.details(), jobId] as const,
  logs: (jobId: string) => [...executionKeys.detail(jobId), 'logs'] as const,
  stats: () => [...executionKeys.all, 'stats'] as const,
};

/**
 * 获取执行状态
 */
export function useExecution(jobId: string, options?: {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  onStatusChange?: (execution: Execution) => void;
}) {
  const queryClient = useQueryClient();
  const onStatusChangeRef = useRef(options?.onStatusChange);
  onStatusChangeRef.current = options?.onStatusChange;

  const query = useQuery({
    queryKey: executionKeys.detail(jobId),
    queryFn: () => executionService.getExecutionStatus(jobId),
    enabled: (options?.enabled ?? true) && !!jobId,
    staleTime: options?.staleTime ?? 10 * 1000, // 10秒
    refetchInterval: (data) => {
      // 如果执行已完成，停止轮询
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
        return false;
      }
      return options?.refetchInterval ?? 2000; // 默认2秒轮询
    },
    refetchIntervalInBackground: true,
    retry: (failureCount, error) => {
      // 如果是404错误（执行不存在），不重试
      if (error && 'response' in error && (error as any).response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    onSuccess: (data) => {
      // 触发状态变化回调
      onStatusChangeRef.current?.(data);
    }
  });

  // 手动刷新
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: executionKeys.detail(jobId) });
  }, [queryClient, jobId]);

  return {
    execution: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    refresh,
    
    // 便捷状态检查
    isPending: query.data?.status === 'PENDING',
    isRunning: query.data?.status === 'RUNNING',
    isCompleted: query.data?.status === 'COMPLETED',
    isFailed: query.data?.status === 'FAILED',
    isFinished: query.data?.status === 'COMPLETED' || query.data?.status === 'FAILED'
  };
}

/**
 * 获取执行列表
 */
export function useExecutions(filters?: {
  crewId?: string;
  status?: ExecutionStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: 'startedAt' | 'completedAt' | 'duration';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}, options?: {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: executionKeys.list(filters || {}),
    queryFn: () => executionService.getExecutions({
      crewId: filters?.crewId,
      status: filters?.status,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      sortBy: filters?.sortBy || 'startedAt',
      sortOrder: filters?.sortOrder || 'desc',
      limit: filters?.limit || 50
    }),
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 30 * 1000, // 30秒
    refetchInterval: options?.refetchInterval,
    retry: 2
  });

  // 刷新数据
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
  }, [queryClient]);

  return {
    executions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    refresh
  };
}

/**
 * 取消执行
 */
export function useCancelExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await executionService.cancelExecution(jobId);
      return jobId;
    },
    onMutate: async (jobId) => {
      // 乐观更新：将状态设为已取消（如果有这个状态的话）
      await queryClient.cancelQueries({ queryKey: executionKeys.detail(jobId) });
      
      const previousExecution = queryClient.getQueryData<Execution>(
        executionKeys.detail(jobId)
      );

      // 这里假设取消后状态变为 FAILED，实际应根据后端定义调整
      queryClient.setQueryData(
        executionKeys.detail(jobId),
        (old: Execution | undefined) => {
          return old ? { ...old, status: 'FAILED' as ExecutionStatus } : undefined;
        }
      );

      return { previousExecution };
    },
    onSuccess: (jobId) => {
      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: executionKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
    },
    onError: (error, jobId, context) => {
      // 回滚乐观更新
      if (context?.previousExecution) {
        queryClient.setQueryData(
          executionKeys.detail(jobId),
          context.previousExecution
        );
      }
    }
  });
}

/**
 * 重试执行
 */
export function useRetryExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const newJobId = await executionService.retryExecution(jobId);
      return { originalJobId: jobId, newJobId };
    },
    onSuccess: ({ originalJobId, newJobId }) => {
      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
      
      // 预加载新执行的状态
      queryClient.prefetchQuery({
        queryKey: executionKeys.detail(newJobId),
        queryFn: () => executionService.getExecutionStatus(newJobId),
        staleTime: 10 * 1000
      });
    }
  });
}

/**
 * 获取执行日志
 */
export function useExecutionLogs(jobId: string, options?: {
  enabled?: boolean;
  refetchInterval?: number;
  level?: 'info' | 'warning' | 'error' | 'debug';
  limit?: number;
}) {
  return useQuery({
    queryKey: executionKeys.logs(jobId),
    queryFn: () => executionService.getExecutionLogs(jobId, {
      level: options?.level,
      limit: options?.limit || 100
    }),
    enabled: (options?.enabled ?? true) && !!jobId,
    staleTime: 5 * 1000, // 5秒
    refetchInterval: options?.refetchInterval ?? 3000, // 3秒轮询日志
    retry: 1
  });
}

/**
 * 获取执行统计信息
 */
export function useExecutionStats(filters?: {
  crewId?: string;
  startDate?: string;
  endDate?: string;
}, options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: [...executionKeys.stats(), filters || {}],
    queryFn: () => executionService.getExecutionStats(filters),
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2分钟
    refetchInterval: options?.refetchInterval,
    retry: 1
  });
}

/**
 * 导出执行结果
 */
export function useExportExecutionResults() {
  return useMutation({
    mutationFn: async ({ jobId, format }: { jobId: string; format?: 'json' | 'csv' }) => {
      const blob = await executionService.exportExecutionResults(jobId, format);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `execution-${jobId}-results.${format || 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return jobId;
    }
  });
}

/**
 * 高级执行跟踪 Hook
 * 提供更精细的执行状态跟踪和回调控制
 */
export function useExecutionTracker(jobId: string, options?: {
  enabled?: boolean;
  onStart?: (execution: Execution) => void;
  onProgress?: (execution: Execution) => void;
  onComplete?: (execution: Execution) => void;
  onError?: (execution: Execution) => void;
  onStatusChange?: (execution: Execution, previousStatus?: ExecutionStatus) => void;
  pollInterval?: number;
  useWebSocket?: boolean;
}) {
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<ExecutionStatus>();
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // 使用基础的 useExecution hook
  const executionQuery = useExecution(jobId, {
    enabled: options?.enabled,
    refetchInterval: options?.pollInterval,
    onStatusChange: (execution) => {
      const callbacks = callbacksRef.current;
      const previousStatus = previousStatusRef.current;
      
      // 状态变化回调
      if (previousStatus !== execution.status) {
        callbacks?.onStatusChange?.(execution, previousStatus);
        
        // 特定状态回调
        switch (execution.status) {
          case 'RUNNING':
            if (previousStatus === 'PENDING') {
              callbacks?.onStart?.(execution);
            } else {
              callbacks?.onProgress?.(execution);
            }
            break;
          case 'COMPLETED':
            callbacks?.onComplete?.(execution);
            break;
          case 'FAILED':
            callbacks?.onError?.(execution);
            break;
        }
        
        previousStatusRef.current = execution.status;
      } else if (execution.status === 'RUNNING') {
        // 运行中的进度更新
        callbacks?.onProgress?.(execution);
      }
    }
  });

  // WebSocket 连接（如果启用）
  useEffect(() => {
    if (!options?.useWebSocket || !jobId || !options.enabled) {
      return;
    }

    // 这里可以实现 WebSocket 连接逻辑
    // 目前使用轮询，未来可以扩展为 WebSocket
    
    return () => {
      // 清理 WebSocket 连接
    };
  }, [jobId, options?.useWebSocket, options?.enabled]);

  // 停止跟踪
  const stopTracking = useCallback(() => {
    queryClient.cancelQueries({ queryKey: executionKeys.detail(jobId) });
  }, [queryClient, jobId]);

  return {
    ...executionQuery,
    stopTracking,
    
    // 执行阶段判断
    isInitializing: executionQuery.execution?.status === 'PENDING',
    isExecuting: executionQuery.execution?.status === 'RUNNING',
    hasCompleted: executionQuery.execution?.status === 'COMPLETED',
    hasFailed: executionQuery.execution?.status === 'FAILED',
    
    // 进度信息（如果后端提供）
    progress: executionQuery.execution?.progress || 0,
    currentStep: executionQuery.execution?.currentStep,
    totalSteps: executionQuery.execution?.totalSteps,
    
    // 时间信息
    startTime: executionQuery.execution?.startedAt,
    endTime: executionQuery.execution?.completedAt,
    duration: executionQuery.execution?.duration,
    
    // 格式化方法
    formatDuration: (duration?: number) => executionService.formatDuration(duration),
    getStatusText: (status: ExecutionStatus) => executionService.getStatusText(status),
    getStatusColor: (status: ExecutionStatus) => executionService.getStatusColor(status)
  };
}

/**
 * 批量执行跟踪 Hook
 * 用于同时跟踪多个执行
 */
export function useMultipleExecutionTracker(jobIds: string[], options?: {
  enabled?: boolean;
  onAllComplete?: (executions: Execution[]) => void;
  onAnyFailed?: (failedExecutions: Execution[]) => void;
  pollInterval?: number;
}) {
  const queryClient = useQueryClient();

  // 获取所有执行状态
  const queries = useQuery({
    queryKey: ['multipleExecutions', ...jobIds.sort()],
    queryFn: async () => {
      const executions = await Promise.allSettled(
        jobIds.map(jobId => executionService.getExecutionStatus(jobId))
      );
      
      return executions.map((result, index) => ({
        jobId: jobIds[index],
        execution: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    },
    enabled: (options?.enabled ?? true) && jobIds.length > 0,
    refetchInterval: (data) => {
      // 如果所有执行都已完成，停止轮询
      const allFinished = data?.every(item => 
        item.execution?.status === 'COMPLETED' || 
        item.execution?.status === 'FAILED' ||
        item.error
      );
      return allFinished ? false : (options?.pollInterval ?? 3000);
    },
    retry: 1
  });

  // 计算统计信息
  const stats = {
    total: jobIds.length,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    errors: 0
  };

  const executions: Execution[] = [];
  const failedExecutions: Execution[] = [];

  queries.data?.forEach(item => {
    if (item.error) {
      stats.errors++;
    } else if (item.execution) {
      executions.push(item.execution);
      
      switch (item.execution.status) {
        case 'PENDING':
          stats.pending++;
          break;
        case 'RUNNING':
          stats.running++;
          break;
        case 'COMPLETED':
          stats.completed++;
          break;
        case 'FAILED':
          stats.failed++;
          failedExecutions.push(item.execution);
          break;
      }
    }
  });

  // 检查完成状态
  const allCompleted = stats.completed === stats.total;
  const anyFailed = stats.failed > 0;
  const allFinished = stats.completed + stats.failed + stats.errors === stats.total;

  // 触发回调
  useEffect(() => {
    if (allCompleted && executions.length === stats.total) {
      options?.onAllComplete?.(executions);
    }
  }, [allCompleted, executions.length, stats.total]);

  useEffect(() => {
    if (anyFailed && failedExecutions.length > 0) {
      options?.onAnyFailed?.(failedExecutions);
    }
  }, [anyFailed, failedExecutions.length]);

  return {
    executions,
    failedExecutions,
    stats,
    isLoading: queries.isLoading,
    isError: queries.isError,
    error: queries.error,
    isRefetching: queries.isRefetching,
    allCompleted,
    anyFailed,
    allFinished,
    
    // 进度百分比
    progressPercentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    
    // 刷新所有
    refresh: () => queryClient.invalidateQueries({ 
      queryKey: ['multipleExecutions', ...jobIds.sort()] 
    })
  };
}