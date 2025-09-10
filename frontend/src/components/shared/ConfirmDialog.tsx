"use client"

import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  Power, 
  AlertCircle,
  Info,
  HelpCircle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'question';
export type ConfirmDialogSize = 'sm' | 'md' | 'lg';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: ConfirmDialogType;
  size?: ConfirmDialogSize;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  destructive?: boolean;
  showCancel?: boolean;
  autoFocus?: 'confirm' | 'cancel';
  className?: string;
}

/**
 * 确认对话框组件
 * 支持不同类型的确认操作，包括危险操作、警告、信息确认等
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  type = 'question',
  size = 'md',
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  icon,
  children,
  destructive,
  showCancel = true,
  autoFocus = 'cancel',
  className
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  // 获取类型配置
  const getTypeConfig = (type: ConfirmDialogType) => {
    const configs = {
      danger: {
        icon: AlertTriangle,
        iconColor: 'text-red-600 dark:text-red-400',
        confirmVariant: 'destructive' as const,
        confirmText: '删除',
        cancelText: '取消'
      },
      warning: {
        icon: AlertCircle,
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        confirmVariant: 'default' as const,
        confirmText: '确认',
        cancelText: '取消'
      },
      info: {
        icon: Info,
        iconColor: 'text-blue-600 dark:text-blue-400',
        confirmVariant: 'default' as const,
        confirmText: '确定',
        cancelText: '取消'
      },
      question: {
        icon: HelpCircle,
        iconColor: 'text-gray-600 dark:text-gray-400',
        confirmVariant: 'default' as const,
        confirmText: '确认',
        cancelText: '取消'
      }
    };
    return configs[type];
  };

  const config = getTypeConfig(type);
  const IconComponent = icon ? () => icon : config.icon;

  // 获取尺寸类名
  const getSizeClasses = (size: ConfirmDialogSize) => {
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg'
    };
    return sizes[size];
  };

  const handleConfirm = async () => {
    if (disabled || isConfirming) return;

    try {
      setIsConfirming(true);
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirm action failed:', error);
      // 错误处理可以通过 toast 显示
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    if (isConfirming) return;
    onCancel?.();
    onOpenChange(false);
  };

  // 键盘快捷键支持
  useKeyboardShortcuts([
    {
      key: 'Escape',
      callback: () => {
        if (!isConfirming) {
          handleCancel();
        }
      },
      description: '取消操作',
      disabled: isConfirming
    },
    {
      key: 'Enter',
      callback: () => {
        if (autoFocus === 'confirm' && !isConfirming) {
          handleConfirm();
        }
      },
      description: '确认操作',
      disabled: isConfirming || autoFocus !== 'confirm'
    }
  ], { enabled: open });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent 
        className={cn(getSizeClasses(size), className)}
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className="flex-shrink-0">
                <IconComponent className={cn("h-6 w-6", config.iconColor)} />
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle 
                id="confirm-dialog-title"
                className="text-left"
              >
                {title}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription 
            id="confirm-dialog-description"
            className="text-left mt-2"
          >
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {children && (
          <div className="py-4">
            {children}
          </div>
        )}

        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          {showCancel && (
            <AlertDialogCancel 
              onClick={handleCancel}
              disabled={isConfirming}
              autoFocus={autoFocus === 'cancel'}
            >
              {cancelText || config.cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={disabled || isConfirming}
            autoFocus={autoFocus === 'confirm'}
            className={cn(
              destructive || type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : ''
            )}
          >
            {isConfirming && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText || config.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * 删除确认对话框
 */
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName: string;
  itemType?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  additionalWarning?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  itemName,
  itemType = '项目',
  onConfirm,
  onCancel,
  loading = false,
  additionalWarning
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      type="danger"
      title={title || `删除${itemType}`}
      description={`确定要删除"${itemName}"吗？${additionalWarning ? ` ${additionalWarning}` : '此操作无法撤销。'}`}
      confirmText="删除"
      cancelText="取消"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
      destructive
      icon={<Trash2 className="h-6 w-6" />}
    />
  );
}

/**
 * 重置确认对话框
 */
interface ResetConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function ResetConfirmDialog({
  open,
  onOpenChange,
  title = '重置设置',
  description = '确定要重置所有设置吗？这将清除您的自定义配置并恢复默认设置。',
  onConfirm,
  onCancel,
  loading = false
}: ResetConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      type="warning"
      title={title}
      description={description}
      confirmText="重置"
      cancelText="取消"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
      icon={<RefreshCw className="h-6 w-6" />}
    />
  );
}

/**
 * 停用/启用确认对话框
 */
interface ToggleStatusConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  currentStatus: 'active' | 'inactive';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function ToggleStatusConfirmDialog({
  open,
  onOpenChange,
  itemName,
  currentStatus,
  onConfirm,
  onCancel,
  loading = false
}: ToggleStatusConfirmDialogProps) {
  const isActivating = currentStatus === 'inactive';
  
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      type={isActivating ? 'info' : 'warning'}
      title={isActivating ? '启用项目' : '停用项目'}
      description={`确定要${isActivating ? '启用' : '停用'}"${itemName}"吗？${
        isActivating 
          ? '启用后该项目将可以正常使用。' 
          : '停用后该项目将无法使用，但不会删除相关数据。'
      }`}
      confirmText={isActivating ? '启用' : '停用'}
      cancelText="取消"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
      icon={<Power className="h-6 w-6" />}
    />
  );
}

export default ConfirmDialog;