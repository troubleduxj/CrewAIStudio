import React, { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingStates';

interface LazyPageWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 懒加载页面包装器
 * 提供加载状态和错误边界处理
 */
export function LazyPageWrapper({ children, fallback }: LazyPageWrapperProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">页面加载中...</p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * 创建懒加载页面的高阶组件
 */
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));
  
  return function WrappedComponent(props: P) {
    return (
      <LazyPageWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyPageWrapper>
    );
  };
}

/**
 * 创建动态导入的懒加载页面
 */
export function createLazyPage<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFn);
  
  return function LazyPage(props: P) {
    return (
      <LazyPageWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyPageWrapper>
    );
  };
}