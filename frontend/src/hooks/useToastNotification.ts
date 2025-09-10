"use client"

import React from 'react';
import { ToastNotification, ToastType, ToastPriority } from '@/components/shared/ToastNotification';

interface ToastOptions {
  type?: ToastType;
  title: string;
  description?: string;
  priority?: ToastPriority;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface ToastContextType {
  toasts: ToastNotification[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  success: (title: string, description?: string, options?: Partial<ToastOptions>) => string;
  error: (title: string, description?: string, options?: Partial<ToastOptions>) => string;
  warning: (title: string, description?: string, options?: Partial<ToastOptions>) => string;
  info: (title: string, description?: string, options?: Partial<ToastOptions>) => string;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

/**
 * Toast 通知提供者组件
 */
export function ToastProvider({ 
  children, 
  maxToasts = 5,
  defaultDuration = 5000 
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastNotification[]>([]);

  // 添加 Toast
  const addToast = React.useCallback((options: ToastOptions): string => {
    const id = generateToastId();
    const toast: ToastNotification = {
      id,
      type: options.type || 'info',
      title: options.title,
      description: options.description,
      priority: options.priority || 'medium',
      duration: options.duration !== undefined ? options.duration : defaultDuration,
      persistent: options.persistent || false,
      action: options.action,
      onClose: options.onClose,
      timestamp: Date.now()
    };

    setToasts(prev => {
      const newToasts = [toast, ...prev];
      // 如果超过最大数量，移除最旧的低优先级 toast
      if (newToasts.length > maxToasts) {
        const sortedByPriority = newToasts.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        return sortedByPriority.slice(0, maxToasts);
      }
      return newToasts;
    });

    return id;
  }, [defaultDuration, maxToasts]);

  // 移除 Toast
  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 清除所有 Toast
  const clearAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  // 便捷方法
  const success = React.useCallback((
    title: string, 
    description?: string, 
    options?: Partial<ToastOptions>
  ): string => {
    return addToast({
      ...options,
      type: 'success',
      title,
      description
    });
  }, [addToast]);

  const error = React.useCallback((
    title: string, 
    description?: string, 
    options?: Partial<ToastOptions>
  ): string => {
    return addToast({
      ...options,
      type: 'error',
      title,
      description,
      duration: options?.duration !== undefined ? options.duration : 8000, // 错误消息显示更久
      priority: options?.priority || 'high'
    });
  }, [addToast]);

  const warning = React.useCallback((
    title: string, 
    description?: string, 
    options?: Partial<ToastOptions>
  ): string => {
    return addToast({
      ...options,
      type: 'warning',
      title,
      description,
      duration: options?.duration !== undefined ? options.duration : 6000,
      priority: options?.priority || 'medium'
    });
  }, [addToast]);

  const info = React.useCallback((
    title: string, 
    description?: string, 
    options?: Partial<ToastOptions>
  ): string => {
    return addToast({
      ...options,
      type: 'info',
      title,
      description
    });
  }, [addToast]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

/**
 * 使用 Toast 通知的 Hook
 */
export function useToastNotification(): ToastContextType {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastNotification must be used within a ToastProvider');
  }
  return context;
}

/**
 * 全局 Toast 通知服务
 * 可以在任何地方使用，不需要 Hook 上下文
 */
class ToastService {
  private listeners: Set<(toasts: ToastNotification[]) => void> = new Set();
  private toasts: ToastNotification[] = [];
  private maxToasts = 5;
  private defaultDuration = 5000;

  subscribe(listener: (toasts: ToastNotification[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  addToast(options: ToastOptions): string {
    const id = generateToastId();
    const toast: ToastNotification = {
      id,
      type: options.type || 'info',
      title: options.title,
      description: options.description,
      priority: options.priority || 'medium',
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      persistent: options.persistent || false,
      action: options.action,
      onClose: options.onClose,
      timestamp: Date.now()
    };

    this.toasts = [toast, ...this.toasts];
    
    // 限制最大数量
    if (this.toasts.length > this.maxToasts) {
      const sortedByPriority = this.toasts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      this.toasts = sortedByPriority.slice(0, this.maxToasts);
    }

    this.notify();
    return id;
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clearAllToasts() {
    this.toasts = [];
    this.notify();
  }

  success(title: string, description?: string, options?: Partial<ToastOptions>): string {
    return this.addToast({
      ...options,
      type: 'success',
      title,
      description
    });
  }

  error(title: string, description?: string, options?: Partial<ToastOptions>): string {
    return this.addToast({
      ...options,
      type: 'error',
      title,
      description,
      duration: options?.duration !== undefined ? options.duration : 8000,
      priority: options?.priority || 'high'
    });
  }

  warning(title: string, description?: string, options?: Partial<ToastOptions>): string {
    return this.addToast({
      ...options,
      type: 'warning',
      title,
      description,
      duration: options?.duration !== undefined ? options.duration : 6000,
      priority: options?.priority || 'medium'
    });
  }

  info(title: string, description?: string, options?: Partial<ToastOptions>): string {
    return this.addToast({
      ...options,
      type: 'info',
      title,
      description
    });
  }

  configure(options: { maxToasts?: number; defaultDuration?: number }) {
    if (options.maxToasts !== undefined) {
      this.maxToasts = options.maxToasts;
    }
    if (options.defaultDuration !== undefined) {
      this.defaultDuration = options.defaultDuration;
    }
  }
}

// 全局实例
export const toastService = new ToastService();

/**
 * 使用全局 Toast 服务的 Hook
 */
export function useGlobalToast() {
  const [toasts, setToasts] = React.useState<ToastNotification[]>([]);

  React.useEffect(() => {
    return toastService.subscribe(setToasts);
  }, []);

  return {
    toasts,
    ...toastService
  };
}

/**
 * 便捷的全局 Toast 函数
 */
export const toast = {
  success: (title: string, description?: string, options?: Partial<ToastOptions>) => 
    toastService.success(title, description, options),
  error: (title: string, description?: string, options?: Partial<ToastOptions>) => 
    toastService.error(title, description, options),
  warning: (title: string, description?: string, options?: Partial<ToastOptions>) => 
    toastService.warning(title, description, options),
  info: (title: string, description?: string, options?: Partial<ToastOptions>) => 
    toastService.info(title, description, options),
  dismiss: (id: string) => toastService.removeToast(id),
  clear: () => toastService.clearAllToasts()
};

export default useToastNotification;