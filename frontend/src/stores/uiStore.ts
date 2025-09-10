/**
 * UI 状态管理
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ToastMessage } from '@/types';

interface UiStore {
  // 主题和布局
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // 通知系统
  toasts: ToastMessage[];
  
  // 对话框状态
  dialogs: {
    crewWizard: boolean;
    executionDialog: boolean;
    confirmDialog: boolean;
  };
  
  // 确认对话框数据
  confirmDialog: {
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: 'default' | 'destructive';
    onConfirm: (() => void) | null;
  };
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Toast 管理
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // 对话框管理
  openDialog: (dialog: keyof UiStore['dialogs']) => void;
  closeDialog: (dialog: keyof UiStore['dialogs']) => void;
  
  // 确认对话框
  showConfirmDialog: (config: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
  }) => void;
  hideConfirmDialog: () => void;
}

export const useUiStore = create<UiStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        sidebarCollapsed: false,
        theme: 'system',
        toasts: [],
        dialogs: {
          crewWizard: false,
          executionDialog: false,
          confirmDialog: false,
        },
        confirmDialog: {
          title: '',
          description: '',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant: 'default',
          onConfirm: null,
        },
        
        // Actions
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        setTheme: (theme) => set({ theme }),
        
        // Toast 管理
        addToast: (toast) => {
          const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newToast: ToastMessage = {
            id,
            duration: 5000, // 默认 5 秒
            ...toast,
          };
          
          set((state) => ({
            toasts: [...state.toasts, newToast]
          }));
          
          // 自动移除 toast
          if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, newToast.duration);
          }
        },
        
        removeToast: (id) =>
          set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id)
          })),
        
        clearToasts: () => set({ toasts: [] }),
        
        // 对话框管理
        openDialog: (dialog) =>
          set((state) => ({
            dialogs: { ...state.dialogs, [dialog]: true }
          })),
        
        closeDialog: (dialog) =>
          set((state) => ({
            dialogs: { ...state.dialogs, [dialog]: false }
          })),
        
        // 确认对话框
        showConfirmDialog: (config) =>
          set({
            dialogs: { ...get().dialogs, confirmDialog: true },
            confirmDialog: {
              title: config.title,
              description: config.description,
              confirmText: config.confirmText || 'Confirm',
              cancelText: config.cancelText || 'Cancel',
              variant: config.variant || 'default',
              onConfirm: config.onConfirm,
            }
          }),
        
        hideConfirmDialog: () =>
          set({
            dialogs: { ...get().dialogs, confirmDialog: false },
            confirmDialog: {
              ...get().confirmDialog,
              onConfirm: null,
            }
          }),
      }),
      {
        name: 'ui-store',
        // 只持久化主题和侧边栏状态
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);