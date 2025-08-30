import { Bot, Moon, Sun, Globe } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { useTranslation } from 'next-i18next';
import { Button } from '../ui/button';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

/**
 * 页面头部组件
 * 显示应用标题和状态信息
 * @returns 头部组件
 */
export default function Header() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };
  return (
    <header className="flex items-center justify-between p-4 h-14 border-b border-border/40 bg-card/20 backdrop-blur-lg sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <Bot
          className="w-8 h-8 text-primary"
          style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)))' }}
        />
        <h1 className="text-2xl font-bold text-foreground">CrewView</h1>
      </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('zh')}>
                中文
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
    </header>
  );
}
