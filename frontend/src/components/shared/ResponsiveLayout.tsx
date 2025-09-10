"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

/**
 * 响应式布局组件
 * 支持移动端、平板端、桌面端适配
 * 集成侧边栏折叠和展开功能
 */
export function ResponsiveLayout({ 
  sidebar, 
  main, 
  aside, 
  className 
}: ResponsiveLayoutProps) {
  return (
    <div className={cn("flex h-screen", className)}>
      {/* 侧边栏 - 在移动端隐藏 */}
      {sidebar && (
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
          {sidebar}
        </div>
      )}
      
      {/* 主内容区 */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden",
        sidebar && "lg:pl-64" // 为固定侧边栏留出空间
      )}>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {main}
        </main>
      </div>
      
      {/* 右侧面板 - 在小屏幕上隐藏 */}
      {aside && (
        <div className="hidden xl:flex xl:w-80 xl:flex-col xl:fixed xl:right-0 xl:inset-y-0 xl:z-40">
          {aside}
        </div>
      )}
    </div>
  );
}

/**
 * 移动端友好的响应式布局组件
 * 在移动端使用全屏布局，在桌面端使用多栏布局
 */
interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  className?: string;
}

export function MobileResponsiveLayout({
  children,
  sidebar,
  sidebarOpen = false,
  onSidebarToggle,
  className
}: MobileResponsiveLayoutProps) {
  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onSidebarToggle}
        />
      )}
      
      {/* 侧边栏 */}
      {sidebar && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebar}
        </div>
      )}
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/**
 * 简化的响应式容器组件
 * 提供标准的响应式间距和最大宽度
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function ResponsiveContainer({ 
  children, 
  maxWidth = 'full',
  className 
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6 lg:px-8",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}