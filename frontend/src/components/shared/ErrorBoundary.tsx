"use client"

import React from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
  className?: string;
}

/**
 * 默认错误回退组件
 */
function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  className 
}: ErrorFallbackProps) {
  const handleReportError = () => {
    // 这里可以集成错误上报服务，如 Sentry
    console.error('Error reported:', error, errorInfo);
    
    // 示例：发送错误到监控服务
    if (typeof window !== 'undefined') {
      // 可以集成 Sentry、LogRocket 等错误监控服务
      try {
        // window.Sentry?.captureException(error, {
        //   contexts: {
        //     react: {
        //       componentStack: errorInfo?.componentStack
        //     }
        //   }
        // });
      } catch (reportError) {
        console.error('Failed to report error:', reportError);
      }
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[400px] p-8",
      className
    )}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">出现了一些问题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            页面遇到了意外错误，我们已经记录了这个问题。请尝试刷新页面或返回首页。
          </p>
          
          {/* 错误详情（开发环境显示） */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                查看错误详情
              </summary>
              <div className="mt-2 rounded-md bg-muted p-3">
                <pre className="text-xs text-muted-foreground overflow-auto">
                  <strong>错误信息:</strong> {error.message}
                  {'\n\n'}
                  <strong>错误堆栈:</strong>
                  {'\n'}
                  {error.stack}
                  {errorInfo?.componentStack && (
                    <>
                      {'\n\n'}
                      <strong>组件堆栈:</strong>
                      {'\n'}
                      {errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </div>
            </details>
          )}
          
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGoHome}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleReportError}
              className="w-full text-muted-foreground"
            >
              <Bug className="h-4 w-4 mr-2" />
              报告问题
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 简化的错误回退组件
 */
function SimpleErrorFallback({ error, resetError, className }: ErrorFallbackProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 text-center",
      className
    )}>
      <AlertCircle className="h-8 w-8 text-destructive mb-3" />
      <h3 className="text-lg font-semibold mb-2">出现错误</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {error.message || '页面遇到了意外错误'}
      </p>
      <Button onClick={resetError} size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        重试
      </Button>
    </div>
  );
}

/**
 * 错误边界组件
 * 捕获子组件中的 JavaScript 错误，显示友好的错误页面
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 更新状态以包含错误信息
    this.setState({
      error,
      errorInfo
    });

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 可以在这里集成错误上报服务
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 错误上报逻辑
    try {
      // 可以集成第三方错误监控服务
      if (typeof window !== 'undefined') {
        // 示例：Sentry 错误上报
        // window.Sentry?.captureException(error, {
        //   contexts: {
        //     react: {
        //       componentStack: errorInfo.componentStack
        //     }
        //   }
        // });

        // 或者发送到自己的错误收集服务
        // fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     message: error.message,
        //     stack: error.stack,
        //     componentStack: errorInfo.componentStack,
        //     timestamp: new Date().toISOString(),
        //     userAgent: navigator.userAgent,
        //     url: window.location.href
        //   })
        // }).catch(console.error);
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 页面级错误边界组件
 * 用于包装整个页面，提供完整的错误处理
 */
interface PageErrorBoundaryProps {
  children: React.ReactNode;
  className?: string;
}

export function PageErrorBoundary({ children, className }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary 
      fallback={DefaultErrorFallback}
      className={className}
      onError={(error, errorInfo) => {
        // 页面级错误的特殊处理
        console.error('Page error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * 组件级错误边界组件
 * 用于包装单个组件，提供轻量级的错误处理
 */
interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  className?: string;
}

export function ComponentErrorBoundary({ 
  children, 
  fallbackMessage = "此组件遇到了错误",
  className 
}: ComponentErrorBoundaryProps) {
  const CustomFallback = ({ error, resetError }: ErrorFallbackProps) => (
    <SimpleErrorFallback 
      error={error} 
      resetError={resetError}
      className={className}
    />
  );

  return (
    <ErrorBoundary fallback={CustomFallback}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook 用于在函数组件中处理错误
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error handled by useErrorHandler:', error);
    setError(error);
  }, []);

  // 如果有错误，抛出它以便被 ErrorBoundary 捕获
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}

/**
 * 异步错误处理 Hook
 * 用于处理 Promise 中的错误
 */
export function useAsyncError() {
  const { handleError } = useErrorHandler();

  return React.useCallback((error: Error) => {
    // 在下一个事件循环中抛出错误，确保被 ErrorBoundary 捕获
    setTimeout(() => {
      handleError(error);
    }, 0);
  }, [handleError]);
}

export default ErrorBoundary;