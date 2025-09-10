"use client"

import React from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useGlobalConfirmDialog } from '@/hooks/useConfirmDialog';

interface GlobalConfirmDialogProviderProps {
  children: React.ReactNode;
}

/**
 * 全局确认对话框提供者组件
 * 在应用根部使用，提供全局确认对话框功能
 */
export function GlobalConfirmDialogProvider({ children }: GlobalConfirmDialogProviderProps) {
  const { state, handleConfirm, handleCancel, close } = useGlobalConfirmDialog();

  return (
    <>
      {children}
      {state.options && (
        <ConfirmDialog
          open={state.open}
          onOpenChange={close}
          type={state.options.type}
          title={state.options.title}
          description={state.options.description}
          confirmText={state.options.confirmText}
          cancelText={state.options.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={state.loading}
          destructive={state.options.destructive}
          showCancel={state.options.showCancel}
          autoFocus={state.options.autoFocus}
          icon={state.options.icon}
        />
      )}
    </>
  );
}

export default GlobalConfirmDialogProvider;