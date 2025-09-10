"use client"

import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPriority = 'low' | 'medium' | 'high';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  priority: ToastPriority;
  duration?: number; // 自动消失时间（毫秒），0 表示不自动消失
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  persistent?: boolean; // 是否持久化显示
  timestamp: number;
}

interface ToastItemProps {
  toast: ToastNotification;
  onClose: (id: string) => void;
  onAction?: (id: string, action: () => void) => void;
}

/**
 * 单个 Toast 通知组件
 */
function ToastItem({ toast, onClose, onAction }: ToastItemProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  // 获取图标和样式配置
  const getToastConfig = (type: ToastType) => {
    const configs = {
      success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400',
        titleColor: 'text-green-900 dark:text-green-100',
        descColor: 'text-green-700 dark:text-green-300'
      },
      error: {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        titleColor: 'text-red-900 dark:text-red-100',
        descColor: 'text-red-700 dark:text-red-300'
      },
      warning: {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        titleColor: 'text-yellow-900 dark:text-yellow-100',
        descColor: 'text-yellow-700 dark:text-yellow-300'
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        titleColor: 'text-blue-900 dark:text-blue-100',
        descColor: 'text-blue-700 dark:text-blue-300'
      }
    };
    return configs[type];
  };

  const config = getToastConfig(toast.type);
  const Icon = config.icon;

  // 处理自动消失
  React.useEffect(() => {
    setIsVisible(true);

    if (toast.duration && toast.duration > 0 && !toast.persistent) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, toast.duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toast.duration, toast.persistent]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
      toast.onClose?.();
    }, 300); // 等待退出动画完成
  };

  const handleAction = () => {
    if (toast.action && onAction) {
      onAction(toast.id, toast.action.onClick);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-in-out",
        config.bgColor,
        config.borderColor,
        isVisible && !isExiting && "animate-in slide-in-from-right-full",
        isExiting && "animate-out slide-out-to-right-full fade-out-80"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={cn("text-sm font-medium", config.titleColor)}>
              {toast.title}
            </p>
            {toast.description && (
              <p className={cn("mt-1 text-sm", config.descColor)}>
                {toast.description}
              </p>
            )}
            {toast.action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAction}
                  className="text-xs"
                >
                  {toast.action.label}
                </Button>
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className={cn(
                "inline-flex rounded-md p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2",
                config.iconColor
              )}
              onClick={handleClose}
              aria-label="关闭通知"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* 进度条（如果有持续时间） */}
      {toast.duration && toast.duration > 0 && !toast.persistent && (
        <div className="h-1 bg-black/10 dark:bg-white/10">
          <div
            className={cn(
              "h-full transition-all ease-linear",
              toast.type === 'success' && "bg-green-500",
              toast.type === 'error' && "bg-red-500",
              toast.type === 'warning' && "bg-yellow-500",
              toast.type === 'info' && "bg-blue-500"
            )}
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastNotification[];
  onClose: (id: string) => void;
  onAction?: (id: string, action: () => void) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

/**
 * Toast 容器组件
 */
export function ToastContainer({ 
  toasts, 
  onClose, 
  onAction,
  position = 'top-right',
  maxToasts = 5
}: ToastContainerProps) {
  // 按优先级和时间排序
  const sortedToasts = React.useMemo(() => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...toasts]
      .sort((a, b) => {
        // 首先按优先级排序
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        // 然后按时间排序（新的在前）
        return b.timestamp - a.timestamp;
      })
      .slice(0, maxToasts);
  }, [toasts, maxToasts]);

  const getPositionClasses = (position: string) => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
    };
    return positions[position as keyof typeof positions] || positions['top-right'];
  };

  if (sortedToasts.length === 0) {
    return null;
  }

  return (
    <>
      {/* 添加进度条动画的 CSS */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      <div
        className={cn(
          "fixed z-50 flex flex-col space-y-2 pointer-events-none",
          getPositionClasses(position)
        )}
        aria-live="polite"
        aria-label="通知"
      >
        {sortedToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={onClose}
            onAction={onAction}
          />
        ))}
      </div>
    </>
  );
}

export default ToastContainer;