"use client"

import React from 'react';
import { ConfirmDialogType } from '@/components/shared/ConfirmDialog';

interface ConfirmDialogOptions {
  type?: ConfirmDialogType;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  showCancel?: boolean;
  autoFocus?: 'confirm' | 'cancel';
  icon?: React.ReactNode;
}

interface ConfirmDialogState {
  open: boolean;
  options: ConfirmDialogOptions | null;
  onConfirm: (() => void | Promise<void>) | null;
  onCancel: (() => void) | null;
  loading: boolean;
}

/**
 * 确认对话框管理 Hook
 * 提供程序化的方式来显示确认对话框
 */
export function useConfirmDialog() {
  const [state, setState] = React.useState<ConfirmDialogState>({
    open: false,
    options: null,
    onConfirm: null,
    onCancel: null,
    loading: false
  });

  // 显示确认对话框
  const confirm = React.useCallback((
    options: ConfirmDialogOptions,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    setState({
      open: true,
      options,
      onConfirm,
      onCancel: onCancel || null,
      loading: false
    });
  }, []);

  // 关闭对话框
  const close = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  // 处理确认
  const handleConfirm = React.useCallback(async () => {
    if (!state.onConfirm) return;

    try {
      setState(prev => ({ ...prev, loading: true }));
      await state.onConfirm();
      close();
    } catch (error) {
      console.error('Confirm action failed:', error);
      // 保持对话框打开，让用户重试
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.onConfirm, close]);

  // 处理取消
  const handleCancel = React.useCallback(() => {
    state.onCancel?.();
    close();
  }, [state.onCancel, close]);

  // 便捷方法：删除确认
  const confirmDelete = React.useCallback((
    itemName: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmDialogOptions>
  ) => {
    confirm({
      type: 'danger',
      title: '确认删除',
      description: `确定要删除"${itemName}"吗？此操作无法撤销。`,
      confirmText: '删除',
      cancelText: '取消',
      destructive: true,
      ...options
    }, onConfirm);
  }, [confirm]);

  // 便捷方法：重置确认
  const confirmReset = React.useCallback((
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmDialogOptions>
  ) => {
    confirm({
      type: 'warning',
      title: '确认重置',
      description: '确定要重置所有设置吗？这将清除您的自定义配置。',
      confirmText: '重置',
      cancelText: '取消',
      ...options
    }, onConfirm);
  }, [confirm]);

  // 便捷方法：危险操作确认
  const confirmDangerous = React.useCallback((
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmDialogOptions>
  ) => {
    confirm({
      type: 'danger',
      title,
      description,
      confirmText: '确认',
      cancelText: '取消',
      destructive: true,
      autoFocus: 'cancel',
      ...options
    }, onConfirm);
  }, [confirm]);

  // 便捷方法：信息确认
  const confirmInfo = React.useCallback((
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmDialogOptions>
  ) => {
    confirm({
      type: 'info',
      title,
      description,
      confirmText: '确定',
      cancelText: '取消',
      ...options
    }, onConfirm);
  }, [confirm]);

  return {
    // 状态
    isOpen: state.open,
    isLoading: state.loading,
    options: state.options,
    
    // 基础方法
    confirm,
    close,
    handleConfirm,
    handleCancel,
    
    // 便捷方法
    confirmDelete,
    confirmReset,
    confirmDangerous,
    confirmInfo
  };
}

/**
 * 全局确认对话框服务
 * 可以在任何地方使用，不需要 Hook 上下文
 */
class ConfirmDialogService {
  private listeners: Set<(state: ConfirmDialogState) => void> = new Set();
  private state: ConfirmDialogState = {
    open: false,
    options: null,
    onConfirm: null,
    onCancel: null,
    loading: false
  };

  subscribe(listener: (state: ConfirmDialogState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  confirm(
    options: ConfirmDialogOptions,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.state = {
        open: true,
        options,
        onConfirm: async () => {
          try {
            await onConfirm();
            resolve(true);
          } catch (error) {
            console.error('Confirm action failed:', error);
            throw error;
          }
        },
        onCancel: () => {
          onCancel?.();
          resolve(false);
        },
        loading: false
      };
      this.notify();
    });
  }

  close() {
    this.state = { ...this.state, open: false };
    this.notify();
  }

  async handleConfirm() {
    if (!this.state.onConfirm) return;

    try {
      this.state = { ...this.state, loading: true };
      this.notify();
      await this.state.onConfirm();
      this.close();
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      this.state = { ...this.state, loading: false };
      this.notify();
    }
  }

  handleCancel() {
    this.state.onCancel?.();
    this.close();
  }

  // 便捷方法
  confirmDelete(
    itemName: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmDialogOptions>
  ): Promise<boolean> {
    return this.confirm({
      type: 'danger',
      title: '确认删除',
      description: `确定要删除"${itemName}"吗？此操作无法撤销。`,
      confirmText: '删除',
      cancelText: '取消',
      destructive: true,
      ...options
    }, onConfirm);
  }

  confirmReset(
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmDialogOptions>
  ): Promise<boolean> {
    return this.confirm({
      type: 'warning',
      title: '确认重置',
      description: '确定要重置所有设置吗？这将清除您的自定义配置。',
      confirmText: '重置',
      cancelText: '取消',
      ...options
    }, onConfirm);
  }

  confirmDangerous(
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmDialogOptions>
  ): Promise<boolean> {
    return this.confirm({
      type: 'danger',
      title,
      description,
      confirmText: '确认',
      cancelText: '取消',
      destructive: true,
      autoFocus: 'cancel',
      ...options
    }, onConfirm);
  }

  confirmInfo(
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmDialogOptions>
  ): Promise<boolean> {
    return this.confirm({
      type: 'info',
      title,
      description,
      confirmText: '确定',
      cancelText: '取消',
      ...options
    }, onConfirm);
  }
}

// 全局实例
export const confirmDialogService = new ConfirmDialogService();

/**
 * 使用全局确认对话框服务的 Hook
 */
export function useGlobalConfirmDialog() {
  const [state, setState] = React.useState<ConfirmDialogState>({
    open: false,
    options: null,
    onConfirm: null,
    onCancel: null,
    loading: false
  });

  React.useEffect(() => {
    return confirmDialogService.subscribe(setState);
  }, []);

  return {
    state,
    ...confirmDialogService
  };
}

/**
 * 便捷的全局确认函数
 */
export const confirm = {
  delete: (itemName: string, onConfirm: () => void | Promise<void>, options?: Partial<ConfirmDialogOptions>) =>
    confirmDialogService.confirmDelete(itemName, onConfirm, options),
  reset: (onConfirm: () => void | Promise<void>, options?: Partial<ConfirmDialogOptions>) =>
    confirmDialogService.confirmReset(onConfirm, options),
  dangerous: (title: string, description: string, onConfirm: () => void | Promise<void>, options?: Partial<ConfirmDialogOptions>) =>
    confirmDialogService.confirmDangerous(title, description, onConfirm, options),
  info: (title: string, description: string, onConfirm: () => void | Promise<void>, options?: Partial<ConfirmDialogOptions>) =>
    confirmDialogService.confirmInfo(title, description, onConfirm, options),
  custom: (options: ConfirmDialogOptions, onConfirm: () => void | Promise<void>, onCancel?: () => void) =>
    confirmDialogService.confirm(options, onConfirm, onCancel)
};

export default useConfirmDialog;