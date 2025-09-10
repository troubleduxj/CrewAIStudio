/**
 * Crew 状态管理
 * 实现 Crew 的状态管理和执行状态跟踪，包含实时状态更新、轮询逻辑和执行历史管理
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Crew, CreateCrewRequest, UpdateCrewRequest, ExecutionInput, Execution, ExecutionStatus } from '@/types';
import { crewService } from '@/services/crewService';
import { executionService } from '@/services/executionService';

interface ExecutionTracker {
  jobId: string;
  crewId: string;
  startTime: number;
  status: ExecutionStatus;
  polling: boolean;
}

interface CrewStats {
  totalCrews: number;
  activeCrews: number;
  runningCrews: number;
  successRate: number;
}

interface CrewStore {
  // 状态
  crews: Crew[];
  currentCrew: Crew | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  searchQuery: string;
  statusFilter: 'ALL' | 'READY' | 'RUNNING' | 'DISABLED';
  sortBy: 'name' | 'createdAt' | 'lastExecutionAt' | 'successRate';
  sortOrder: 'asc' | 'desc';
  
  // 执行相关状态
  executingCrews: Set<string>; // 正在执行的 Crew IDs
  executionTrackers: Map<string, ExecutionTracker>; // 执行跟踪器
  executions: Execution[]; // 执行历史
  executionStats: CrewStats | null; // 统计信息
  
  // 缓存控制
  cacheTimeout: number; // 缓存超时时间（毫秒）
  
  // Actions
  setCrews: (crews: Crew[]) => void;
  addCrew: (crew: Crew) => void;
  updateCrew: (id: string, updates: Partial<Crew>) => void;
  removeCrew: (id: string) => void;
  setCurrentCrew: (crew: Crew | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: 'ALL' | 'READY' | 'RUNNING' | 'DISABLED') => void;
  setSorting: (sortBy: 'name' | 'createdAt' | 'lastExecutionAt' | 'successRate', sortOrder: 'asc' | 'desc') => void;
  clearError: () => void;
  
  // 执行状态管理
  setCrewExecuting: (crewId: string, executing: boolean) => void;
  isCrewExecuting: (crewId: string) => boolean;
  addExecutionTracker: (tracker: ExecutionTracker) => void;
  removeExecutionTracker: (jobId: string) => void;
  updateExecutionTracker: (jobId: string, updates: Partial<ExecutionTracker>) => void;
  getExecutionTracker: (jobId: string) => ExecutionTracker | undefined;
  
  // 缓存管理
  isCacheValid: () => boolean;
  invalidateCache: () => void;
  
  // 异步操作
  fetchCrews: (force?: boolean) => Promise<void>;
  fetchCrewById: (id: string, force?: boolean) => Promise<Crew>;
  createCrew: (crew: CreateCrewRequest) => Promise<Crew>;
  updateCrewById: (id: string, crew: UpdateCrewRequest) => Promise<Crew>;
  deleteCrew: (id: string) => Promise<void>;
  executeCrew: (crewId: string, input: ExecutionInput) => Promise<string>; // 返回 job_id
  stopCrewExecution: (crewId: string) => Promise<void>;
  
  // 执行历史和统计
  setExecutionStats: (stats: CrewStats) => void;
  fetchExecutions: (crewId?: string) => Promise<void>;
  fetchExecutionStats: () => Promise<void>;
  startExecutionTracking: (jobId: string, crewId: string) => void;
  stopExecutionTracking: (jobId: string) => void;
  stopAllExecutionTracking: () => void;
  
  // 工具方法
  getCrewById: (id: string) => Crew | undefined;
  getFilteredCrews: () => Crew[];
  getCrewExecutions: (crewId: string) => Execution[];
}

export const useCrewStore = create<CrewStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        crews: [],
        currentCrew: null,
        loading: false,
        error: null,
        lastFetch: null,
        searchQuery: '',
        statusFilter: 'ALL',
        sortBy: 'lastExecutionAt',
        sortOrder: 'desc',
        executingCrews: new Set(),
        executionTrackers: new Map(),
        executions: [],
        executionStats: null,
        cacheTimeout: 3 * 60 * 1000, // 3分钟缓存（执行状态变化较快）
        
        // 同步 Actions
        setCrews: (crews) => 
          set({ 
            crews, 
            lastFetch: Date.now(),
            error: null 
          }),
        
        addCrew: (crew) => 
          set((state) => ({ 
            crews: [...state.crews, crew],
            error: null
          })),
        
        updateCrew: (id, updates) =>
          set((state) => ({
            crews: state.crews.map((crew) =>
              crew.id === id ? { ...crew, ...updates } : crew
            ),
            currentCrew: state.currentCrew?.id === id 
              ? { ...state.currentCrew, ...updates }
              : state.currentCrew,
            error: null
          })),
        
        removeCrew: (id) =>
          set((state) => {
            // 停止相关的执行跟踪
            const trackersToRemove: string[] = [];
            state.executionTrackers.forEach((tracker, jobId) => {
              if (tracker.crewId === id) {
                trackersToRemove.push(jobId);
              }
            });
            
            trackersToRemove.forEach(jobId => {
              executionService.stopPolling(jobId);
              state.executionTrackers.delete(jobId);
            });
            
            const newExecutingCrews = new Set(state.executingCrews);
            newExecutingCrews.delete(id);
            
            return {
              crews: state.crews.filter((crew) => crew.id !== id),
              currentCrew: state.currentCrew?.id === id ? null : state.currentCrew,
              executingCrews: newExecutingCrews,
              executionTrackers: new Map(state.executionTrackers),
              error: null
            };
          }),
        
        setCurrentCrew: (crew) => set({ currentCrew: crew }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        setStatusFilter: (statusFilter) => set({ statusFilter }),
        setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
        clearError: () => set({ error: null }),
        
        // 执行状态管理
        setCrewExecuting: (crewId, executing) =>
          set((state) => {
            const newExecutingCrews = new Set(state.executingCrews);
            if (executing) {
              newExecutingCrews.add(crewId);
            } else {
              newExecutingCrews.delete(crewId);
            }
            return { executingCrews: newExecutingCrews };
          }),
        
        isCrewExecuting: (crewId) => get().executingCrews.has(crewId),
        
        addExecutionTracker: (tracker) =>
          set((state) => {
            const newTrackers = new Map(state.executionTrackers);
            newTrackers.set(tracker.jobId, tracker);
            return { executionTrackers: newTrackers };
          }),
        
        removeExecutionTracker: (jobId) =>
          set((state) => {
            const newTrackers = new Map(state.executionTrackers);
            newTrackers.delete(jobId);
            return { executionTrackers: newTrackers };
          }),
        
        updateExecutionTracker: (jobId, updates) =>
          set((state) => {
            const tracker = state.executionTrackers.get(jobId);
            if (tracker) {
              const newTrackers = new Map(state.executionTrackers);
              newTrackers.set(jobId, { ...tracker, ...updates });
              return { executionTrackers: newTrackers };
            }
            return state;
          }),
        
        getExecutionTracker: (jobId) => get().executionTrackers.get(jobId),
        
        // 缓存管理
        isCacheValid: () => {
          const { lastFetch, cacheTimeout } = get();
          if (!lastFetch) return false;
          return Date.now() - lastFetch < cacheTimeout;
        },
        
        invalidateCache: () => set({ lastFetch: null }),
        
        // 异步操作
        fetchCrews: async (force = false) => {
          const { isCacheValid, crews } = get();
          
          // 如果缓存有效且不强制刷新，直接返回
          if (!force && isCacheValid() && crews.length > 0) {
            return;
          }
          
          set({ loading: true, error: null });
          try {
            const fetchedCrews = await crewService.getCrews({
              sortBy: get().sortBy,
              sortOrder: get().sortOrder
            });
            
            set({ 
              crews: fetchedCrews, 
              loading: false,
              lastFetch: Date.now(),
              error: null
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch crews',
              loading: false 
            });
            throw error;
          }
        },
        
        fetchCrewById: async (id, force = false) => {
          const { currentCrew, isCacheValid } = get();
          
          // 如果当前 Crew 就是要获取的且缓存有效，直接返回
          if (!force && currentCrew?.id === id && isCacheValid()) {
            return currentCrew;
          }
          
          set({ loading: true, error: null });
          try {
            const crew = await crewService.getCrew(id);
            set({ 
              currentCrew: crew, 
              loading: false,
              error: null
            });
            
            // 同时更新 Crew 列表中的对应项
            get().updateCrew(id, crew);
            
            return crew;
          } catch (error) {
            // 如果是404错误，可能是缓存过期，清理缓存并尝试重新获取列表
            if (error instanceof Error && error.message.includes('404')) {
              console.warn(`Crew ${id} not found, invalidating cache and refreshing crew list`);
              get().invalidateCache();
              
              // 尝试重新获取crew列表，看是否有新的数据
              try {
                await get().fetchCrews(true);
                
                // 检查刷新后的列表中是否有这个crew
                const refreshedCrew = get().getCrewById(id);
                if (refreshedCrew) {
                  set({ 
                    currentCrew: refreshedCrew, 
                    loading: false,
                    error: null
                  });
                  return refreshedCrew;
                }
              } catch (refreshError) {
                console.error('Failed to refresh crew list:', refreshError);
              }
            }
            
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch crew',
              loading: false 
            });
            throw error;
          }
        },
        
        createCrew: async (crew) => {
          set({ loading: true, error: null });
          
          // 乐观更新：先创建临时 Crew
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
          
          get().addCrew(optimisticCrew);
          
          try {
            const newCrew = await crewService.createCrew(crew);
            
            // 替换临时 Crew 为真实 Crew
            set((state) => ({
              crews: state.crews.map(c => 
                c.id === tempId ? newCrew : c
              ),
              loading: false,
              error: null
            }));
            
            return newCrew;
          } catch (error) {
            // 回滚乐观更新
            get().removeCrew(tempId);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create crew',
              loading: false 
            });
            throw error;
          }
        },
        
        updateCrewById: async (id, crew) => {
          set({ loading: true, error: null });
          
          // 保存原始数据用于回滚
          const originalCrew = get().crews.find(c => c.id === id);
          if (!originalCrew) {
            set({ error: 'Crew not found', loading: false });
            throw new Error('Crew not found');
          }
          
          // 乐观更新
          const optimisticUpdates = {
            ...crew,
            updatedAt: new Date().toISOString()
          };
          get().updateCrew(id, optimisticUpdates);
          
          try {
            const updatedCrew = await crewService.updateCrew(id, crew);
            
            // 使用服务器返回的真实数据
            get().updateCrew(id, updatedCrew);
            set({ loading: false, error: null });
            
            return updatedCrew;
          } catch (error) {
            // 回滚乐观更新
            get().updateCrew(id, originalCrew);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update crew',
              loading: false 
            });
            throw error;
          }
        },
        
        deleteCrew: async (id) => {
          set({ loading: true, error: null });
          
          // 保存原始数据用于回滚
          const originalCrew = get().crews.find(c => c.id === id);
          if (!originalCrew) {
            set({ error: 'Crew not found', loading: false });
            throw new Error('Crew not found');
          }
          
          // 乐观更新：先从列表中移除
          get().removeCrew(id);
          
          try {
            await crewService.deleteCrew(id);
            set({ loading: false, error: null });
          } catch (error) {
            // 回滚乐观更新
            get().addCrew(originalCrew);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete crew',
              loading: false 
            });
            throw error;
          }
        },
        
        executeCrew: async (crewId, input) => {
          get().setCrewExecuting(crewId, true);
          set({ error: null });
          
          // 乐观更新 Crew 状态
          get().updateCrew(crewId, { 
            status: 'RUNNING',
            lastExecutionAt: new Date().toISOString()
          });
          
          try {
            const jobId = await crewService.executeCrew(crewId, input);
            
            // 开始执行跟踪
            get().startExecutionTracking(jobId, crewId);
            
            return jobId;
          } catch (error) {
            // 回滚状态更新
            get().setCrewExecuting(crewId, false);
            get().updateCrew(crewId, { status: 'READY' });
            set({ 
              error: error instanceof Error ? error.message : 'Failed to execute crew'
            });
            throw error;
          }
        },
        
        stopCrewExecution: async (crewId) => {
          set({ error: null });
          
          try {
            await crewService.stopCrew(crewId);
            
            // 停止相关的执行跟踪
            const { executionTrackers } = get();
            executionTrackers.forEach((tracker, jobId) => {
              if (tracker.crewId === crewId) {
                get().stopExecutionTracking(jobId);
              }
            });
            
            // 更新 Crew 状态
            get().setCrewExecuting(crewId, false);
            get().updateCrew(crewId, { status: 'READY' });
            
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to stop crew execution'
            });
            throw error;
          }
        },
        
        // 执行历史和统计
        setExecutionStats: (stats) => set({ executionStats: stats }),
        
        fetchExecutions: async (crewId) => {
          try {
            const executions = await executionService.getExecutions({
              crewId,
              sortBy: 'startedAt',
              sortOrder: 'desc',
              limit: 100
            });
            
            set({ executions, error: null });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch executions'
            });
            throw error;
          }
        },
        
        fetchExecutionStats: async () => {
          try {
            const stats = await crewService.getCrewStats();
            set({ 
              executionStats: {
                totalCrews: stats.total_crews,
                activeCrews: stats.active_crews,
                runningCrews: stats.active_crews, // 假设活跃的就是正在运行的
                successRate: stats.success_rate
              },
              error: null 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch execution stats'
            });
            throw error;
          }
        },
        
        startExecutionTracking: (jobId, crewId) => {
          const tracker: ExecutionTracker = {
            jobId,
            crewId,
            startTime: Date.now(),
            status: 'PENDING',
            polling: true
          };
          
          get().addExecutionTracker(tracker);
          
          // 开始轮询执行状态
          executionService.pollExecutionStatus(
            jobId,
            (execution) => {
              // 更新执行跟踪器
              get().updateExecutionTracker(jobId, { 
                status: execution.status 
              });
              
              // 更新 Crew 状态
              if (execution.status === 'COMPLETED' || execution.status === 'FAILED') {
                get().setCrewExecuting(crewId, false);
                get().updateCrew(crewId, { 
                  status: 'READY',
                  // 更新统计信息
                  totalExecutions: (get().getCrewById(crewId)?.totalExecutions || 0) + 1,
                  successRate: execution.status === 'COMPLETED' 
                    ? Math.min(100, (get().getCrewById(crewId)?.successRate || 0) + 1)
                    : Math.max(0, (get().getCrewById(crewId)?.successRate || 0) - 1)
                });
              }
            },
            {
              interval: 2000,
              onComplete: (execution) => {
                get().stopExecutionTracking(jobId);
                
                // 添加到执行历史
                set((state) => ({
                  executions: [execution, ...state.executions.slice(0, 99)] // 保持最新100条
                }));
              },
              onError: (error) => {
                console.error(`Execution tracking error for ${jobId}:`, error);
                get().stopExecutionTracking(jobId);
                get().setCrewExecuting(crewId, false);
                get().updateCrew(crewId, { status: 'READY' });
              }
            }
          );
        },
        
        stopExecutionTracking: (jobId) => {
          executionService.stopPolling(jobId);
          get().removeExecutionTracker(jobId);
        },
        
        stopAllExecutionTracking: () => {
          const { executionTrackers } = get();
          executionTrackers.forEach((_, jobId) => {
            executionService.stopPolling(jobId);
          });
          set({ executionTrackers: new Map() });
        },
        
        // 工具方法
        getCrewById: (id) => {
          return get().crews.find(crew => crew.id === id);
        },
        
        getFilteredCrews: () => {
          const { crews, searchQuery, statusFilter, sortBy, sortOrder } = get();
          
          let filtered = crews;
          
          // 状态过滤
          if (statusFilter !== 'ALL') {
            filtered = crews.filter(crew => crew.status === statusFilter);
          }
          
          // 搜索过滤
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(crew =>
              crew.name.toLowerCase().includes(query) ||
              crew.description.toLowerCase().includes(query) ||
              crew.workflowTemplateName.toLowerCase().includes(query)
            );
          }
          
          // 排序
          filtered.sort((a, b) => {
            let aValue: any = a[sortBy];
            let bValue: any = b[sortBy];
            
            // 处理日期字段
            if (sortBy === 'createdAt' || sortBy === 'lastExecutionAt') {
              aValue = aValue ? new Date(aValue).getTime() : 0;
              bValue = bValue ? new Date(bValue).getTime() : 0;
            }
            
            // 处理字符串字段
            if (typeof aValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
              return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
              return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
          });
          
          return filtered;
        },
        
        getCrewExecutions: (crewId) => {
          return get().executions.filter(execution => execution.crewId === crewId);
        }
      }),
      {
        name: 'crew-store',
        // 只持久化部分状态，不包括 loading、error 和执行跟踪器
        partialize: (state) => ({
          crews: state.crews,
          currentCrew: state.currentCrew,
          lastFetch: state.lastFetch,
          searchQuery: state.searchQuery,
          statusFilter: state.statusFilter,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          executions: state.executions.slice(0, 50), // 只持久化最新50条执行记录
          cacheTimeout: state.cacheTimeout
        })
      }
    ),
    {
      name: 'crew-store',
    }
  )
);
