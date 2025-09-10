"use client"

import React from 'react';
import { ToastContainer } from '@/components/shared/ToastNotification';
import { useGlobalToast } from '@/hooks/useToastNotification';

interface GlobalToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

/**
 * 全局 Toast 提供者组件
 * 在应用根部使用，提供全局 Toast 通知功能
 */
export function GlobalToastProvider({ 
  children, 
  position = 'top-right',
  maxToasts = 5 
}: GlobalToastProviderProps) {
  const { toasts, removeToast } = useGlobalToast();

  const handleAction = (id: string, action: () => void) => {
    action();
    // 执行操作后可以选择关闭 toast
    // removeToast(id);
  };

  return (
    <>
      {children}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        onAction={handleAction}
        position={position}
        maxToasts={maxToasts}
      />
    </>
  );
}

export default GlobalToastProvider;