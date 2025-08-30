"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * 语言切换组件
 * 提供中英文切换功能
 * @returns 语言切换按钮组件
 */
export function LanguageToggle() {
  const router = useRouter()
  const { t, i18n } = useTranslation('common')
  const currentLocale = i18n.language

  /**
   * 切换语言
   * @param newLocale - 新的语言代码
   */
  const switchLanguage = (newLocale: string) => {
    // Use next-i18next to change language
    i18n.changeLanguage(newLocale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => switchLanguage('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          {t('english')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => switchLanguage('zh')}
          className={locale === 'zh' ? 'bg-accent' : ''}
        >
          {t('chinese')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}