"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

/**
 * 主题提供者组件
 * 为应用提供明暗模式切换功能
 * @param children - 子组件
 * @param props - 主题提供者属性
 * @returns 主题提供者组件
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}