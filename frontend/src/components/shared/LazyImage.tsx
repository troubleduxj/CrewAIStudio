import React, { useState, useRef, useEffect, memo } from 'react';
import { useIntersectionObserver } from '@/hooks/usePerformanceOptimization';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 懒加载图片组件
 * 支持占位符、错误回退和 WebP 格式优化
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  placeholder,
  fallback,
  className,
  containerClassName,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholder);
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { elementRef, observe } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  // 检测 WebP 支持
  const supportsWebP = useRef<boolean | null>(null);
  
  useEffect(() => {
    if (supportsWebP.current === null) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      supportsWebP.current = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
  }, []);

  // 优化图片 URL
  const getOptimizedSrc = (originalSrc: string): string => {
    // 如果支持 WebP 且原图不是 WebP，尝试获取 WebP 版本
    if (supportsWebP.current && !originalSrc.includes('.webp')) {
      // 这里可以根据实际的图片服务配置来转换 URL
      // 例如：return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return originalSrc;
  };

  // 设置交集观察器
  useEffect(() => {
    if (elementRef.current) {
      observe((entry) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      });
    }
  }, [observe, isInView]);

  // 当图片进入视口时开始加载
  useEffect(() => {
    if (isInView && imageStatus === 'loading') {
      const optimizedSrc = getOptimizedSrc(src);
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(optimizedSrc);
        setImageStatus('loaded');
        onLoad?.();
      };
      
      img.onerror = () => {
        if (fallback) {
          setImageSrc(fallback);
          setImageStatus('loaded');
        } else {
          setImageStatus('error');
        }
        onError?.();
      };
      
      img.src = optimizedSrc;
    }
  }, [isInView, src, fallback, imageStatus, onLoad, onError]);

  return (
    <div 
      ref={elementRef}
      className={cn('relative overflow-hidden', containerClassName)}
    >
      {imageStatus === 'loading' && placeholder && (
        <img
          src={placeholder}
          alt=""
          className={cn('absolute inset-0 w-full h-full object-cover blur-sm', className)}
          aria-hidden="true"
        />
      )}
      
      {imageStatus === 'error' && !fallback && (
        <div className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          'absolute inset-0 w-full h-full',
          className
        )}>
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
      
      {imageSrc && imageStatus !== 'error' && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
});

/**
 * 预加载图片的工具函数
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 批量预加载图片
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}