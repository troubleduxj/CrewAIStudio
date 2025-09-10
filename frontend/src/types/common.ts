/**
 * 通用类型定义
 */

// API 响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error_code: string;
  error_message: string;
  error_details?: Record<string, any>;
  timestamp: string;
}

// 分页响应格式
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// 加载状态
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// 状态指示器类型
export type StatusType = 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DISABLED';

export interface StatusIndicatorProps {
  status: StatusType;
  showText?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

// 响应式布局类型
export interface ResponsiveLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  aside?: React.ReactNode;
}

// 加载组件类型
export interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg';
}

// 确认对话框类型
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

// Toast 通知类型
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

// 表单验证类型
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}