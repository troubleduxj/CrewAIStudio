/**
 * Custom i18n hooks with enhanced functionality
 * 增强功能的自定义国际化钩子
 */

import { useLocale, useTranslations } from 'next-intl';
import { formatDate, formatRelativeTime, formatNumber, formatPercentage, formatDuration } from '@/lib/i18n';

/**
 * Enhanced useTranslation hook with additional formatting utilities
 * 增强的 useTranslation 钩子，包含额外的格式化工具
 */
export function useI18n(namespace?: string) {
  const t = useTranslations(namespace);
  const currentLocale = useLocale();

  return {
    t,
    currentLocale,
    
    // Date formatting utilities
    formatDate: (date: string | Date, format?: string) => 
      formatDate(date, format, currentLocale),
    
    formatRelativeTime: (date: string | Date) => 
      formatRelativeTime(date, currentLocale),
    
    // Number formatting utilities
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => 
      formatNumber(value, currentLocale, options),
    
    formatPercentage: (value: number, decimals?: number) => 
      formatPercentage(value, currentLocale, decimals),
    
    formatDuration: (minutes: number) => 
      formatDuration(minutes, currentLocale),
    
    // Pluralization helper
    plural: (count: number, key: string, options?: any) => {
      return t(key, { count, ...options });
    },
    
    // Language utilities
    isRTL: currentLocale === 'ar' || currentLocale === 'he', // Add RTL languages as needed
    isZh: currentLocale === 'zh',
    isEn: currentLocale === 'en',
  };
}

/**
 * Hook for translating with interpolation and fallback
 * 用于翻译的钩子，支持插值和回退
 */
export function useTranslationWithFallback(namespace?: string) {
  const { t, ...rest } = useI18n(namespace);
  
  const tWithFallback = (key: string, fallback?: string, options?: any) => {
    const translated = t(key, options);
    
    // If translation is the same as key (not found), use fallback
    if (translated === key && fallback) {
      return fallback;
    }
    
    return translated;
  };
  
  return {
    t: tWithFallback,
    ...rest,
  };
}

/**
 * Helper function for pluralization
 * 复数形式辅助函数
 */
export function usePluralization() {
  const { t, currentLocale } = useI18n();
  
  const pluralize = (count: number, singular: string, plural?: string, options?: any) => {
    // For Chinese, we don't have plural forms, so we use count + singular
    if (currentLocale === 'zh') {
      return `${count} ${t(singular, options)}`;
    }
    
    // For English and other languages with plural forms
    if (count === 1) {
      return `${count} ${t(singular, options)}`;
    } else {
      return `${count} ${t(plural || `${singular}_plural`, options)}`;
    }
  };
  
  return { pluralize };
}

/**
 * Hook for dynamic translations (useful for user-generated content)
 * 动态翻译钩子（对用户生成的内容很有用）
 */
export function useDynamicTranslation() {
  const { t, currentLocale } = useI18n();
  
  const translateDynamic = (translations: Record<string, string>, fallback?: string) => {
    return translations[currentLocale] || translations['en'] || fallback || '';
  };
  
  return {
    translateDynamic,
    currentLocale,
  };
}

/**
 * Hook for form validation messages with i18n
 * 表单验证消息的国际化钩子
 */
export function useValidationMessages() {
  const { t } = useI18n();
  
  return {
    required: (field: string) => t('validation.required', { field }),
    minLength: (field: string, min: number) => t('validation.minLength', { field, min }),
    maxLength: (field: string, max: number) => t('validation.maxLength', { field, max }),
    email: () => t('validation.email'),
    url: () => t('validation.url'),
    number: () => t('validation.number'),
    positive: () => t('validation.positive'),
    range: (min: number, max: number) => t('validation.range', { min, max }),
  };
}

/**
 * Hook for common UI messages
 * 常用 UI 消息的钩子
 */
export function useCommonMessages() {
  const { t } = useI18n();
  
  return {
    loading: () => t('common.loading'),
    success: () => t('common.success'),
    error: () => t('common.error'),
    save: () => t('common.save'),
    cancel: () => t('common.cancel'),
    delete: () => t('common.delete'),
    edit: () => t('common.edit'),
    create: () => t('common.create'),
    update: () => t('common.update'),
    confirm: () => t('common.confirm'),
    close: () => t('common.close'),
    next: () => t('common.next'),
    previous: () => t('common.previous'),
    yes: () => t('common.yes'),
    no: () => t('common.no'),
  };
}