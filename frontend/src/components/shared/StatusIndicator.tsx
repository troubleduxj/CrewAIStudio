"use client"

import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Pause, 
  Play,
  Loader2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/useI18n';

/**
 * 状态类型定义
 */
export type StatusType = 
  | 'READY' 
  | 'RUNNING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'DISABLED'
  | 'PENDING'
  | 'PAUSED'
  | 'CANCELLED'
  | 'SUCCESS'
  | 'ERROR'
  | 'WARNING'
  | 'INFO';

/**
 * 状态配置（不包含文本，文本通过翻译获取）
 */
const statusConfig: Record<StatusType, {
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  animate?: boolean;
}> = {
  READY: {
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: CheckCircle,
  },
  RUNNING: {
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Loader2,
    animate: true,
  },
  COMPLETED: {
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: CheckCircle,
  },
  SUCCESS: {
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: CheckCircle,
  },
  FAILED: {
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
  ERROR: {
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
  DISABLED: {
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: Pause,
  },
  PENDING: {
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: Clock,
  },
  PAUSED: {
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    icon: Pause,
  },
  CANCELLED: {
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: XCircle,
  },
  WARNING: {
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: AlertCircle,
  },
  INFO: {
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Circle,
  },
};

/**
 * 基础状态指示器组件
 */
interface StatusIndicatorProps {
  status: StatusType;
  showText?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'dot' | 'badge' | 'card';
  customText?: string;
  className?: string;
  animate?: boolean;
}

export function StatusIndicator({
  status,
  showText = true,
  showIcon = false,
  size = 'default',
  variant = 'dot',
  customText,
  className,
  animate = true,
}: StatusIndicatorProps) {
  const { t } = useI18n();
  const config = statusConfig[status];
  const Icon = config.icon;
  
  // Get translated status text
  const getStatusText = (status: StatusType): string => {
    const statusKey = `status.${status.toLowerCase()}`;
    return t(statusKey, status);
  };
  
  const sizeClasses = {
    sm: {
      dot: 'w-2 h-2',
      icon: 'w-3 h-3',
      text: 'text-xs',
      gap: 'gap-1',
    },
    default: {
      dot: 'w-3 h-3',
      icon: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-2',
    },
    lg: {
      dot: 'w-4 h-4',
      icon: 'w-5 h-5',
      text: 'text-base',
      gap: 'gap-3',
    },
  };

  const sizes = sizeClasses[size];

  if (variant === 'badge') {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          config.bgColor,
          config.textColor,
          config.borderColor,
          "border",
          className
        )}
      >
        <div className={cn("flex items-center", sizes.gap)}>
          {showIcon && (
            <Icon className={cn(
              sizes.icon,
              config.animate && animate && "animate-spin"
            )} />
          )}
          <div className={cn(config.color, sizes.dot, "rounded-full")} />
          <span className={cn("font-medium", sizes.text)}>
            {customText || getStatusText(status)}
          </span>
        </div>
      </Badge>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex items-center p-3 rounded-lg border",
        config.bgColor,
        config.borderColor,
        className
      )}>
        {showIcon && (
          <Icon className={cn(
            sizes.icon,
            config.textColor,
            "mr-3",
            config.animate && animate && "animate-spin"
          )} />
        )}
        <div className={cn("flex items-center", sizes.gap)}>
          <div className={cn(
            config.color, 
            sizes.dot, 
            "rounded-full",
            config.animate && animate && "animate-pulse"
          )} />
          {showText && (
            <span className={cn("font-medium", config.textColor, sizes.text)}>
              {customText || getStatusText(status)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default dot variant
  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      {showIcon && (
        <Icon className={cn(
          sizes.icon,
          config.textColor,
          config.animate && animate && "animate-spin"
        )} />
      )}
      <div className={cn(
        config.color, 
        sizes.dot, 
        "rounded-full",
        config.animate && animate && "animate-pulse"
      )} />
      {showText && (
        <span className={cn("font-medium", config.textColor, sizes.text)}>
          {customText || getStatusText(status)}
        </span>
      )}
    </div>
  );
}

/**
 * 状态进度指示器
 */
interface StatusProgressProps {
  currentStatus: StatusType;
  steps: { status: StatusType; label: string }[];
  className?: string;
}

export function StatusProgress({ 
  currentStatus, 
  steps, 
  className 
}: StatusProgressProps) {
  const currentIndex = steps.findIndex(step => step.status === currentStatus);
  
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const config = statusConfig[step.status];
        
        return (
          <React.Fragment key={step.status}>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isActive && config.color + " border-current",
                isCompleted && "bg-green-500 border-green-500",
                !isActive && !isCompleted && "bg-gray-200 border-gray-300"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isActive ? "bg-white" : "bg-gray-400"
                  )} />
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                isActive && config.textColor,
                isCompleted && "text-green-700",
                !isActive && !isCompleted && "text-gray-500"
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 transition-all duration-300",
                index < currentIndex ? "bg-green-500" : "bg-gray-300"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * 状态统计组件
 */
interface StatusStatsProps {
  stats: { status: StatusType; count: number; label?: string }[];
  className?: string;
}

export function StatusStats({ stats, className }: StatusStatsProps) {
  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {stats.map((stat) => {
        const config = statusConfig[stat.status];
        const percentage = total > 0 ? (stat.count / total) * 100 : 0;
        
        return (
          <div
            key={stat.status}
            className={cn(
              "p-4 rounded-lg border",
              config.bgColor,
              config.borderColor
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <StatusIndicator 
                status={stat.status} 
                showText={false} 
                size="sm" 
              />
              <span className={cn("text-2xl font-bold", config.textColor)}>
                {stat.count}
              </span>
            </div>
            <div className="space-y-1">
              <p className={cn("text-sm font-medium", config.textColor)}>
                {stat.label || t(`status.${stat.status.toLowerCase()}`, stat.status)}
              </p>
              <p className="text-xs text-muted-foreground">
                {percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 实时状态指示器（带动画）
 */
interface LiveStatusIndicatorProps {
  status: StatusType;
  lastUpdated?: Date;
  showLastUpdated?: boolean;
  className?: string;
}

export function LiveStatusIndicator({
  status,
  lastUpdated,
  showLastUpdated = false,
  className
}: LiveStatusIndicatorProps) {
  const { t, formatRelativeTime } = useI18n();
  const config = statusConfig[status];
  
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className="relative">
        <StatusIndicator 
          status={status} 
          variant="dot" 
          size="default"
          animate={true}
        />
        {status === 'RUNNING' && (
          <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
        )}
      </div>
      <div className="flex flex-col">
        <span className={cn("font-medium text-sm", config.textColor)}>
          {t(`status.${status.toLowerCase()}`, status)}
        </span>
        {showLastUpdated && lastUpdated && (
          <span className="text-xs text-muted-foreground">
            {t('common.updatedAt', 'Updated')} {formatRelativeTime(lastUpdated)}
          </span>
        )}
      </div>
    </div>
  );
}