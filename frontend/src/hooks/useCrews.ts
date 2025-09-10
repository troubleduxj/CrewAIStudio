/**
 * Crew 自定义 Hook
 * 集成 React Query 和 Zustand Store，提供数据获取、缓存和错误处理
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCrewStore } from '@/stores/crewStore';
import { crewService } from '@/services/crewService';
import { Crew, CreateCrewRequest, UpdateCrewRequest, ExecutionInput } from '@/types/crew';
import { useCallback, useEffect } from 'react';

// Query Keys
export const crewKeys = {
  all: ['crews'] as const,
  lists: () => [...crewKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...crewKeys.lists(), filters] as const,
  details: () => [...crewKeys.all, 'detail'] as const,
  detail: (id: string) => [...crewKeys.details(), id] as const,
  executions: (crewId: string) => [...crewKeys.detail(crewId), 'executions'] as const,
  logs: (crewId: string) => [...crewKeys.detail(crewId), 'logs'] as const,
  stats: () => [...crewKeys.all, 'stats'] as const,
};

/**
 * 获取 Crew 列表
 */
export function useCrews(options?: {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}) {
  const store = useCrewStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: crewKeys.list({
      sortBy: store.sortBy,
      sortOrder: store.sortOrder,
      search: store.searchQuery,
      status: store.statusFilter
    }),
    queryFn: async () => {
      const crews = await crewService.getCrews({
        sortBy: store.sortBy,
        sortOrder: store.sortOrder,
        search: store.searchQuery || undefined,
        status: store.statusFilter !== 'ALL' ? store.statusFilter : undefined
      });
      
      // 同步到 Zustand Store
      store.setCrews(crews);
      
      return crews;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 3 * 60 * 1000, // 3分钟
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // 如果是404错误，可能是缓存过期，清理缓存后重试一次
      if (error?.message?.includes('404') && failureCount === 0) {
        store.invalidateCache();
        return true;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (query.error) {
      const error = query.error as Error;
      // 如果是404错误，清理缓存
      if (error.message.includes('404')) {
        console.warn('Crews not found (404), clearing cache');
        store.invalidateCache();
        queryClient.removeQueries({ queryKey: crewKeys.lists() });
      }
      store.setError(error.message || 'Failed to fetch crews');
    }
  }, [query.error, store, queryClient]);

  // 刷新数据
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: crewKeys.lists() });
  }, [queryClient]);

  // 预加载 Crew 详情
  const prefetchCrew = useCallback(async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: crewKeys.detail(id),
      queryFn: () => crewService.getCrew(id),
      staleTime: 3 * 60 * 1000
    });
  }, [queryClient]);

  return {
    crews: query.data || store.crews || [],
    filteredCrews: store.getFilteredCrews(),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error || store.error,
    isRefetching: query.isRefetching,
    refresh,
    prefetchCrew,
    
    // Store actions
    setSearchQuery: store.setSearchQuery,
    setStatusFilter: store.setStatusFilter,
    setSorting: store.setSorting,
    clearError: store.clearError,
    
    // Store state
    searchQuery: store.searchQuery,
    statusFilter: store.statusFilter,
    sortBy: store.sortBy,
    sortOrder: store.sortOrder,
    executingCrews: store.executingCrews
  };
}

/**
 * 获取单个 Crew
 */
export function useCrew(id: string, options?: {
  enabled?: boolean;
  staleTime?: number;
}) {
  const store = useCrewStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: crewKeys.detail(id),
    queryFn: async () => {
      const crew = await crewService.getCrew(id);
      
      // 同步到 Zustand Store
      store.setCurrentCrew(crew);
      store.updateCrew(id, crew);
      
      return crew;
    },
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: options?.staleTime ?? 3 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // 如果是404错误，可能是缓存过期，清理缓存后重试一次
      if (error?.message?.includes('404') && failureCount === 0) {
        store.invalidateCache();
        return true;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (query.error) {
      const error = query.error as Error;
      // 如果是404错误，清理相关缓存
      if (error.message.includes('404')) {
        console.warn(`Crew ${id} not found (404), clearing cache`);
        store.invalidateCache();
        queryClient.removeQueries({ queryKey: crewKeys.detail(id) });
      }
      store.setError(error.message || 'Failed to fetch crew');
    }
  }, [query.error, id, store, queryClient]);

  return {
    crew: query.data || store.currentCrew,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error || store.error,
    isRefetching: query.isRefetching,
    
    // Store actions
    setCurrentCrew: store.setCurrentCrew,
    clearError: store.clearError,
    
    // Execution state
    isExecuting: store.isCrewExecuting(id),
    executionTracker: store.getExecutionTracker
  };
}

/**
 * 创建 Crew
 */
export function useCreateCrew() {
  const store = useCrewStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (crew: CreateCrewRequest) => {
      return await crewService.createCrew(crew);
    },
    onMutate: async (crew) => {
      // 取消相关查询
      await queryClient.cancelQueries({ queryKey: crewKeys.lists() });

      // 乐观更新
      const tempId = `temp-${Date.now()}`;
      const optimisticCrew: Crew = {
        id: tempId,
        name: crew.name,
        description: crew.description,
        workflowTemplateId: crew.workflowTemplateId,
        workflowTemplateName: 'Loading...', // 将在服务器响应后更新
        agentsConfig: crew.agentsConfig,
        status: 'READY',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        successRate: 0,
        totalExecutions: 0
      };

      // 更新查询缓存
      queryClient.setQueryData(
        crewKeys.list({ 
          sortBy: store.sortBy, 
          sortOrder: store.sortOrder,
          status: store.statusFilter 
        }),
        (old: Crew[] | undefined) => {
          return old ? [optimisticCrew, ...old] : [optimisticCrew];
        }
      );

      // 更新 Store
      store.addCrew(optimisticCrew);

      return { tempId, optimisticCrew };
    },
    onSuccess: (newCrew, variables, context) => {
      // 替换乐观更新的数据
      if (context) {
        queryClient.setQueryData(
          crewKeys.list({ 
            sortBy: store.sortBy, 
            sortOrder: store.sortOrder,
            status: store.statusFilter 
          }),
          (old: Crew[] | undefined) => {
            return old?.map(c => c.id === context.tempId ? newCrew : c) || [newCrew];
          }
        );

        // 更新 Store
        store.removeCrew(context.tempId);
        store.addCrew(newCrew);
      }

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: crewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: crewKeys.stats() });
      
      store.clearError();
    },
    onError: (error, variables, context) => {
      // 回滚乐观更新
      if (context) {
        queryClient.setQueryData(
          crewKeys.list({ 
            sortBy: store.sortBy, 
            sortOrder: store.sortOrder,
            status: store.statusFilter 
          }),
          (old: Crew[] | undefined) => {
            return old?.filter(c => c.id !== context.tempId) || [];
          }
        );

        store.removeCrew(context.tempId);
      }

      store.setError(error instanceof Error ? error.message : 'Failed to create crew');
    }
  });
}

/**
 * 更新 Crew
 */
export function useUpdateCrew() {
  const store = useCrewStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, crew }: { id: string; crew: UpdateCrewRequest }) => {
      return await crewService.updateCrew(id, crew);
    },
    onMutate: async ({ id, crew }) => {
      // 取消相关查询
      await queryClient.cancelQueries({ queryKey: crewKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: crewKeys.lists() });

      // 获取当前数据用于回滚
      const previousCrew = queryClient.getQueryData<Crew>(crewKeys.detail(id));

      // 乐观更新
      const optimisticUpdates = {
        ...crew,
        updatedAt: new Date().toISOString()
      };

      // 更新详情查询缓存
      queryClient.setQueryData(
        crewKeys.detail(id),
        (old: Crew | undefined) => {
          return old ? { ...old, ...optimisticUpdates } : undefined;
        }
      );

      // 更新列表查询缓存
      queryClient.setQueryData(
        crewKeys.list({ 
          sortBy: store.sortBy, 
          sortOrder: store.sortOrder,
          status: store.statusFilter 
        }),
        (old: Crew[] | undefined) => {
          return old?.map(c => c.id === id ? { ...c, ...optimisticUpdates } : c);
        }
      );

      // 更新 Store
      store.updateCrew(id, optimisticUpdates);

      return { previousCrew };
    },
    onSuccess: (updatedCrew, { id }) => {
      // 更新缓存为服务器返回的真实数据
      queryClient.setQueryData(crewKeys.detail(id), updatedCrew);
      queryClient.setQueryData(
        crewKeys.list({ 
          sortBy: store.sortBy, 
          sortOrder: store.sortOrder,
          status: store.statusFilter 
        }),
        (old: Crew[] | undefined) => {
          return old?.map(c => c.id === id ? updatedCrew : c);
        }
      );

      // 更新 Store
      store.updateCrew(id, updatedCrew);
      
      store.clearError();
    },
    onError: (error, { id }, context) => {
      // 回滚乐观更新
      if (context?.previousCrew) {
        queryClient.setQueryData(crewKeys.detail(id), context.previousCrew);
        queryClient.setQueryData(
          crewKeys.list({ 
            sortBy: store.sortBy, 
            sortOrder: store.sortOrder,
            status: store.statusFilter 
          }),
          (old: Crew[] | undefined) => {
            return old?.map(c => c.id === id ? context.previousCrew! : c);
          }
        );

        store.updateCrew(id, context.previousCrew);
      }

      store.setError(error instanceof Error ? error.message : 'Failed to update crew');
    }
  });
}

/**
 * 删除 Crew
 */
export function useDeleteCrew() {
  const store = useCrewStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await crewService.deleteCrew(id);
      return id;
    },
    onMutate: async (id) => {
      // 取消相关查询
      await queryClient.cancelQueries({ queryKey: crewKeys.lists() });

      // 获取当前数据用于回滚
      const previousCrews = queryClient.getQueryData<Crew[]>(
        crewKeys.list({ 
          sortBy: store.sortBy, 
          sortOrder: store.sortOrder,
          status: store.statusFilter 
        })
      );

      // 乐观更新：从列表中移除
      queryClient.setQueryData(
        crewKeys.list({ 
          sortBy: store.sortBy, 
          sortOrder: store.sortOrder,
          status: store.statusFilter 
        }),
        (old: Crew[] | undefined) => {
          return old?.filter(c => c.id !== id) || [];
        }
      );

      // 更新 Store
      store.removeCrew(id);

      return { previousCrews };
    },
    onSuccess: (id) => {
      // 移除相关查询缓存
      queryClient.removeQueries({ queryKey: crewKeys.detail(id) });
      queryClient.removeQueries({ queryKey: crewKeys.executions(id) });
      queryClient.removeQueries({ queryKey: crewKeys.logs(id) });
      
      // 使列表查询失效
      queryClient.invalidateQueries({ queryKey: crewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: crewKeys.stats() });
      
      store.clearError();
    },
    onError: (error, id, context) => {
      // 回滚乐观更新
      if (context?.previousCrews) {
        queryClient.setQueryData(
          crewKeys.list({ 
            sortBy: store.sortBy, 
            sortOrder: store.sortOrder,
            status: store.statusFilter 
          }),
          context.previousCrews
        );

        const deletedCrew = context.previousCrews.find(c => c.id === id);
        if (deletedCrew) {
          store.addCrew(deletedCrew);
        }
      }

      store.setError(error instanceof Error ? error.message : 'Failed to delete crew');
    }
  });
}

/**
 * 执行 Crew
 */
export function useExecuteCrew() {
  const store = useCrewStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ crewId, input }: { crewId: string; input: ExecutionInput }) => {
      const jobId = await crewService.executeCrew(crewId, input);
      
      // 开始执行跟踪
      store.startExecutionTracking(jobId, crewId);
      
      return { jobId, crewId };
    },
    onMutate: async ({ crewId }) => {
      // 乐观更新 Crew 状态
      store.setCrewExecuting(crewId, true);
      store.updateCrew(crewId, { 
        status: 'RUNNING',
        lastExecutionAt: new Date().toISOString()
      });

      // 更新查询缓存
      queryClient.setQueryData(
        crewKeys.detail(crewId),
        (old: Crew | undefined) => {
          return old ? { 
            ...old, 
            status: 'RUNNING' as const,
            lastExecutionAt: new Date().toISOString()
          } : undefined;
        }
      );
    },
    onSuccess: ({ jobId, crewId }) => {
      // 使相关查询失效以获取最新状态
      queryClient.invalidateQueries({ queryKey: crewKeys.detail(crewId) });
      queryClient.invalidateQueries({ queryKey: crewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: crewKeys.stats() });
      
      store.clearError();
    },
    onError: (error, { crewId }) => {
      // 回滚状态更新
      store.setCrewExecuting(crewId, false);
      store.updateCrew(crewId, { status: 'READY' });

      // 回滚查询缓存
      queryClient.setQueryData(
        crewKeys.detail(crewId),
        (old: Crew | undefined) => {
          return old ? { ...old, status: 'READY' as const } : undefined;
        }
      );

      store.setError(error instanceof Error ? error.message : 'Failed to execute crew');
    }
  });
}

/**
 * 停止 Crew 执行
 */
export function useStopCrew() {
  const store = useCrewStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (crewId: string) => {
      await crewService.stopCrew(crewId);
      return crewId;
    },
    onSuccess: (crewId) => {
      // 停止执行跟踪
      const { executionTrackers } = store;
      executionTrackers.forEach((tracker, jobId) => {
        if (tracker.crewId === crewId) {
          store.stopExecutionTracking(jobId);
        }
      });

      // 更新状态
      store.setCrewExecuting(crewId, false);
      store.updateCrew(crewId, { status: 'READY' });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: crewKeys.detail(crewId) });
      queryClient.invalidateQueries({ queryKey: crewKeys.lists() });
      
      store.clearError();
    },
    onError: (error) => {
      store.setError(error instanceof Error ? error.message : 'Failed to stop crew execution');
    }
  });
}

/**
 * 获取 Crew 执行历史
 */
export function useCrewExecutions(crewId: string, options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const store = useCrewStore();

  const query = useQuery({
    queryKey: crewKeys.executions(crewId),
    queryFn: async () => {
      const executions = await crewService.getCrewExecutions(crewId);
      
      // 同步到 Store（只同步该 Crew 的执行记录）
      // Note: Store will be updated through the execution tracking mechanism
      
      return executions;
    },
    enabled: (options?.enabled ?? true) && !!crewId,
    staleTime: 1 * 60 * 1000, // 1分钟
    refetchInterval: options?.refetchInterval,
    retry: 1
  });

  return {
    executions: query.data || store.getCrewExecutions(crewId),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching
  };
}

/**
 * 获取 Crew 统计信息
 */
export function useCrewStats(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const store = useCrewStore();

  const query = useQuery({
    queryKey: crewKeys.stats(),
    queryFn: async () => {
      const stats = await crewService.getCrewStats();
      
      // 同步到 Store
      store.setExecutionStats && store.setExecutionStats({
        totalCrews: stats.total_crews,
        activeCrews: stats.active_crews,
        runningCrews: stats.active_crews, // 假设活跃的就是正在运行的
        successRate: stats.success_rate
      });
      
      return stats;
    },
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2分钟
    refetchInterval: options?.refetchInterval,
    retry: 1
  });

  return {
    stats: query.data,
    storeStats: store.executionStats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching
  };
}

/**
 * 检查 Crew 名称可用性
 */
export function useCheckCrewName() {
  return useMutation({
    mutationFn: async ({ name, excludeId }: { name: string; excludeId?: string }) => {
      return await crewService.checkCrewName(name, excludeId);
    }
  });
}

/**
 * 自动清理执行跟踪器的 Hook
 */
export function useExecutionCleanup() {
  const store = useCrewStore();

  useEffect(() => {
    // 组件卸载时清理所有执行跟踪
    return () => {
      store.stopAllExecutionTracking();
    };
  }, [store]);
}
