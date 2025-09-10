'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'select' | 'dropdown' | 'button';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
}

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

export function LanguageSwitcher({
  variant = 'dropdown',
  size = 'default',
  showIcon = true,
  showText = true,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('common');

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    // Store the language preference in localStorage for persistence
    localStorage.setItem('preferred-language', languageCode);
    
    // Change the route to the new locale
    const newPathname = pathname.replace(`/${locale}`, `/${languageCode}`);
    router.push(newPathname);
  };

  if (variant === 'select') {
    return (
      <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`w-auto ${size === 'sm' ? 'h-8' : size === 'lg' ? 'h-12' : 'h-10'}`}>
          {showIcon && <Globe className="h-4 w-4 mr-2" />}
          <SelectValue>
            {showText ? currentLanguage.nativeName : currentLanguage.code.toUpperCase()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span>{language.nativeName}</span>
                {language.name !== language.nativeName && (
                  <span className="text-muted-foreground text-sm">({language.name})</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'button') {
    return (
      <div className="flex gap-1">
        {languages.map((language) => (
          <Button
            key={language.code}
            variant={currentLanguage.code === language.code ? 'default' : 'ghost'}
            size={size}
            onClick={() => handleLanguageChange(language.code)}
            className="px-3"
          >
            {showIcon && <Globe className="h-4 w-4 mr-1" />}
            {showText ? language.nativeName : language.code.toUpperCase()}
          </Button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className="gap-2"
        >
          {showIcon && <Languages className="h-4 w-4" />}
          {showText && currentLanguage.nativeName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <div className="flex flex-col">
              <span>{language.nativeName}</span>
              {language.name !== language.nativeName && (
                <span className="text-xs text-muted-foreground">{language.name}</span>
              )}
            </div>
            {currentLanguage.code === language.code && (
              <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hook to get current language information
 */
export function useCurrentLanguage() {
  const locale = useLocale();
  
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
  
  return {
    code: currentLanguage.code,
    name: currentLanguage.name,
    nativeName: currentLanguage.nativeName,
    isRTL: false, // Add RTL support if needed in the future
  };
}