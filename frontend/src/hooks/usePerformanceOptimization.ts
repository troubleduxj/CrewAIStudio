import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * 防抖函数 Hook
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * 防抖值 Hook
 * @param value 要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流 Hook
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * 稳定的回调 Hook
 * 确保回调函数引用稳定，避免不必要的重渲染
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}

/**
 * 深度比较的 useMemo
 * 使用深度比较来决定是否重新计算
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const depsRef = useRef<React.DependencyList>();
  const valueRef = useRef<T>();

  const hasChanged = useMemo(() => {
    if (!depsRef.current) return true;
    
    return deps.some((dep, index) => {
      return !Object.is(dep, depsRef.current![index]);
    });
  }, deps);

  if (hasChanged) {
    depsRef.current = deps;
    valueRef.current = factory();
  }

  return valueRef.current!;
}

/**
 * 性能监控 Hook
 * 监控组件渲染性能
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const now = performance.now();
    
    if (lastRenderTimeRef.current > 0) {
      const renderTime = now - lastRenderTimeRef.current;
      
      // 在开发环境下记录性能信息
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} - Render #${renderCountRef.current}, Time: ${renderTime.toFixed(2)}ms`);
        
        // 警告渲染时间过长
        if (renderTime > 16) {
          console.warn(`[Performance Warning] ${componentName} render took ${renderTime.toFixed(2)}ms (>16ms)`);
        }
      }
    }
    
    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current,
    resetCounter: () => {
      renderCountRef.current = 0;
    }
  };
}

/**
 * 交集观察器 Hook
 * 用于实现懒加载和虚拟滚动
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  const callbackRef = useRef<(entry: IntersectionObserverEntry) => void>();

  const observe = useCallback((callback: (entry: IntersectionObserverEntry) => void) => {
    callbackRef.current = callback;
    
    if (elementRef.current && !observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (callbackRef.current) {
              callbackRef.current(entry);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
          ...options
        }
      );
      
      observerRef.current.observe(elementRef.current);
    }
  }, [options]);

  const unobserve = useCallback(() => {
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { elementRef, observe, unobserve };
}