import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePerformanceMonitor, useThrottle } from '@/hooks/usePerformanceOptimization';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

/**
 * 虚拟滚动列表组件
 * 用于高效渲染大量列表项
 */
export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 性能监控
  usePerformanceMonitor('VirtualScrollList');

  // 节流滚动处理
  const handleScroll = useThrottle(
    useCallback((event: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = event.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    }, [onScroll]),
    16 // 60fps
  );

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 计算总高度
  const totalHeight = items.length * itemHeight;

  // 计算偏移量
  const offsetY = visibleRange.start * itemHeight;

  // 获取可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange.start, visibleRange.end]);

  // 滚动到指定项目
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current) return;

    let scrollTop: number;
    
    switch (align) {
      case 'start':
        scrollTop = index * itemHeight;
        break;
      case 'center':
        scrollTop = index * itemHeight - containerHeight / 2 + itemHeight / 2;
        break;
      case 'end':
        scrollTop = index * itemHeight - containerHeight + itemHeight;
        break;
    }

    containerRef.current.scrollTop = Math.max(0, Math.min(scrollTop, totalHeight - containerHeight));
  }, [itemHeight, containerHeight, totalHeight]);

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              className="virtual-scroll-item"
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 虚拟网格组件
 * 用于高效渲染大量网格项目
 */
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 0,
  overscan = 5,
  className = ''
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 性能监控
  usePerformanceMonitor('VirtualGrid');

  // 计算列数
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);

  // 节流滚动处理
  const handleScroll = useThrottle(
    useCallback((event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    }, []),
    16
  );

  // 计算可见行范围
  const visibleRowRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / (itemHeight + gap));
    const endRow = Math.min(
      startRow + Math.ceil(containerHeight / (itemHeight + gap)),
      rowsCount - 1
    );

    return {
      start: Math.max(0, startRow - overscan),
      end: Math.min(rowsCount - 1, endRow + overscan)
    };
  }, [scrollTop, itemHeight, gap, containerHeight, rowsCount, overscan]);

  // 获取可见项目
  const visibleItems = useMemo(() => {
    const startIndex = visibleRowRange.start * columnsCount;
    const endIndex = Math.min((visibleRowRange.end + 1) * columnsCount - 1, items.length - 1);
    
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      originalIndex: startIndex + index,
      row: Math.floor((startIndex + index) / columnsCount),
      col: (startIndex + index) % columnsCount
    }));
  }, [items, visibleRowRange, columnsCount]);

  const totalHeight = rowsCount * (itemHeight + gap) - gap;
  const offsetY = visibleRowRange.start * (itemHeight + gap);

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, originalIndex, row, col }) => (
            <div
              key={originalIndex}
              className="virtual-scroll-item absolute"
              style={{
                width: itemWidth,
                height: itemHeight,
                left: col * (itemWidth + gap),
                top: (row - visibleRowRange.start) * (itemHeight + gap),
              }}
            >
              {renderItem(item, originalIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}