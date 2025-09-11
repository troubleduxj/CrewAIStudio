import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { useTheme } from 'next-themes';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';

/**
 * 页面头部组件
 * 显示应用标题和状态信息
 * @returns 头部组件
 */
export default function Header() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center justify-end w-full">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent/90"></span>
          </span>
          <span className="text-sm text-muted-foreground">
            {t('systemStatus')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 语言切换 */}
          <LanguageSwitcher 
            variant="dropdown" 
            size="sm" 
            showIcon={true} 
            showText={false} 
          />
          
          {/* 主题切换 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </div>
  );
}
