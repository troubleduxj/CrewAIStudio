/**
 * 工作流模板状态管理
 * 实现模板的增删改查状态管理，包含加载状态、错误处理、缓存逻辑和乐观更新
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { WorkflowTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '@/types/workflow';
import { workflowTemplateService } from '@/services/workflowTemplateService';

interface WorkflowTemplateStore {
  // 状态
  templates: WorkflowTemplate[];
  currentTemplate: WorkflowTemplate | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  searchQuery: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder: 'asc' | 'desc';
  
  // 缓存控制
  cacheTimeout: number; // 缓存超时时间（毫秒）
  
  // Actions
  setTemplates: (templates: WorkflowTemplate[]) => void;
  addTemplate: (template: WorkflowTemplate) => void;
  updateTemplate: (id: string, updates: Partial<WorkflowTemplate>) => void;
  removeTemplate: (id: string) => void;
  setCurrentTemplate: (template: WorkflowTemplate | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: 'name' | 'createdAt' | 'updatedAt' | 'usageCount', sortOrder: 'asc' | 'desc') => void;
  clearError: () => void;
  
  // 缓存管理
  isCacheValid: () => boolean;
  invalidateCache: () => void;
  
  // 异步操作
  fetchTemplates: (force?: boolean) => Promise<void>;
  fetchTemplateById: (id: string, force?: boolean) => Promise<WorkflowTemplate>;
  createTemplate: (template: CreateTemplateRequest) => Promise<WorkflowTemplate>;
  updateTemplateById: (id: string, template: UpdateTemplateRequest) => Promise<WorkflowTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  cloneTemplate: (id: string, name: string) => Promise<WorkflowTemplate>;
  
  // 工具方法
  getTemplateById: (id: string) => WorkflowTemplate | undefined;
  getFilteredTemplates: () => WorkflowTemplate[];
}

export const useWorkflowTemplateStore = create<WorkflowTemplateStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        templates: [],
        currentTemplate: null,
        loading: false,
        error: null,
        lastFetch: null,
        searchQuery: '',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
        
        // 同步 Actions
        setTemplates: (templates) => 
          set({ 
            templates, 
            lastFetch: Date.now(),
            error: null 
          }),
        
        addTemplate: (template) => 
          set((state) => ({ 
            templates: [...state.templates, template],
            error: null
          })),
        
        updateTemplate: (id, updates) =>
          set((state) => ({
            templates: state.templates.map((template) =>
              template.id === id ? { ...template, ...updates } : template
            ),
            currentTemplate: state.currentTemplate?.id === id 
              ? { ...state.currentTemplate, ...updates }
              : state.currentTemplate,
            error: null
          })),
        
        removeTemplate: (id) =>
          set((state) => ({
            templates: state.templates.filter((template) => template.id !== id),
            currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
            error: null
          })),
        
        setCurrentTemplate: (template) => set({ currentTemplate: template }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
        clearError: () => set({ error: null }),
        
        // 缓存管理
        isCacheValid: () => {
          const { lastFetch, cacheTimeout } = get();
          if (!lastFetch) return false;
          return Date.now() - lastFetch < cacheTimeout;
        },
        
        invalidateCache: () => set({ lastFetch: null }),
        
        // 异步操作
        fetchTemplates: async (force = false) => {
          const { isCacheValid, templates } = get();
          
          // 如果缓存有效且不强制刷新，直接返回
          if (!force && isCacheValid() && templates.length > 0) {
            return;
          }
          
          set({ loading: true, error: null });
          try {
            const fetchedTemplates = await workflowTemplateService.getTemplates({
              sortBy: get().sortBy,
              sortOrder: get().sortOrder
            });
            
            set({ 
              templates: fetchedTemplates, 
              loading: false,
              lastFetch: Date.now(),
              error: null
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch templates',
              loading: false 
            });
            throw error;
          }
        },
        
        fetchTemplateById: async (id, force = false) => {
          const { currentTemplate, isCacheValid } = get();
          
          // 如果当前模板就是要获取的模板且缓存有效，直接返回
          if (!force && currentTemplate?.id === id && isCacheValid()) {
            return currentTemplate;
          }
          
          set({ loading: true, error: null });
          try {
            const template = await workflowTemplateService.getTemplate(id);
            set({ 
              currentTemplate: template, 
              loading: false,
              error: null
            });
            
            // 同时更新模板列表中的对应项
            get().updateTemplate(id, template);
            
            return template;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch template',
              loading: false 
            });
            throw error;
          }
        },
        
        createTemplate: async (template) => {
          set({ loading: true, error: null });
          
          // 乐观更新：先创建临时模板
          const tempId = `temp-${Date.now()}`;
          const optimisticTemplate: WorkflowTemplate = {
            id: tempId,
            name: template.name,
            description: template.description,
            definition: template.definition,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0
          };
          
          get().addTemplate(optimisticTemplate);
          
          try {
            const newTemplate = await workflowTemplateService.createTemplate(template);
            
            // 替换临时模板为真实模板
            set((state) => ({
              templates: state.templates.map(t => 
                t.id === tempId ? newTemplate : t
              ),
              loading: false,
              error: null
            }));
            
            return newTemplate;
          } catch (error) {
            // 回滚乐观更新
            get().removeTemplate(tempId);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create template',
              loading: false 
            });
            throw error;
          }
        },
        
        updateTemplateById: async (id, template) => {
          set({ loading: true, error: null });
          
          // 保存原始数据用于回滚
          const originalTemplate = get().templates.find(t => t.id === id);
          if (!originalTemplate) {
            set({ error: 'Template not found', loading: false });
            throw new Error('Template not found');
          }
          
          // 乐观更新
          const optimisticUpdates = {
            ...template,
            updatedAt: new Date().toISOString()
          };
          get().updateTemplate(id, optimisticUpdates);
          
          try {
            const updatedTemplate = await workflowTemplateService.updateTemplate(id, template);
            
            // 使用服务器返回的真实数据
            get().updateTemplate(id, updatedTemplate);
            set({ loading: false, error: null });
            
            return updatedTemplate;
          } catch (error) {
            // 回滚乐观更新
            get().updateTemplate(id, originalTemplate);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update template',
              loading: false 
            });
            throw error;
          }
        },
        
        deleteTemplate: async (id) => {
          set({ loading: true, error: null });
          
          // 保存原始数据用于回滚
          const originalTemplate = get().templates.find(t => t.id === id);
          if (!originalTemplate) {
            set({ error: 'Template not found', loading: false });
            throw new Error('Template not found');
          }
          
          // 乐观更新：先从列表中移除
          get().removeTemplate(id);
          
          try {
            await workflowTemplateService.deleteTemplate(id);
            set({ loading: false, error: null });
          } catch (error) {
            // 回滚乐观更新
            get().addTemplate(originalTemplate);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete template',
              loading: false 
            });
            throw error;
          }
        },
        
        cloneTemplate: async (id, name) => {
          const template = get().templates.find(t => t.id === id);
          if (!template) {
            set({ error: 'Template not found' });
            throw new Error('Template not found');
          }
          
          set({ loading: true, error: null });
          
          try {
            const clonedTemplate = await workflowTemplateService.cloneTemplate(id, name);
            get().addTemplate(clonedTemplate);
            set({ loading: false, error: null });
            
            return clonedTemplate;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to clone template',
              loading: false 
            });
            throw error;
          }
        },
        
        // 工具方法
        getTemplateById: (id) => {
          return get().templates.find(template => template.id === id);
        },
        
        getFilteredTemplates: () => {
          const { templates, searchQuery, sortBy, sortOrder } = get();
          
          let filtered = templates;
          
          // 搜索过滤
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = templates.filter(template =>
              template.name.toLowerCase().includes(query) ||
              template.description.toLowerCase().includes(query)
            );
          }
          
          // 排序
          filtered.sort((a, b) => {
            let aValue: any = a[sortBy];
            let bValue: any = b[sortBy];
            
            // 处理日期字段
            if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
              aValue = new Date(aValue).getTime();
              bValue = new Date(bValue).getTime();
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
        }
      }),
      {
        name: 'workflow-template-store',
        // 只持久化部分状态，不包括 loading 和 error
        partialize: (state) => ({
          templates: state.templates,
          currentTemplate: state.currentTemplate,
          lastFetch: state.lastFetch,
          searchQuery: state.searchQuery,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          cacheTimeout: state.cacheTimeout
        })
      }
    ),
    {
      name: 'workflow-template-store',
    }
  )
);