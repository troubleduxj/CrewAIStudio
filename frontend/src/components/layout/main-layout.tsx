"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Users, Wrench, Settings, Bot, Spline, BrainCircuit, Container, ListChecks, Network, Store, Terminal } from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

// Menu items will be defined inside the component to use translations

/**
 * 主布局组件，包含侧边栏导航和头部
 * @param children - 子组件内容
 * @returns 主布局JSX元素
 */
export default function MainLayout({
  children,
  noPadding = false,
}: {
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations();

  const menuItems = {
    build: [
      { href: '/dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
      { href: '/workflow-templates', label: t('navigation.workflowTemplates'), icon: Network },
      { href: '/crews', label: t('navigation.crews'), icon: Users },
      { href: '/tools', label: t('navigation.tools'), icon: Wrench },
      { href: '/playground', label: t('navigation.playground'), icon: Terminal },
      { href: '/marketplace', label: t('navigation.marketplace'), icon: Store },
    ],
    operate: [
      { href: '/traces', label: t('navigation.traces'), icon: Spline },
      { href: '/llm-connections', label: t('navigation.llmConnections'), icon: BrainCircuit },
    ],
    manage: [
      { href: '/settings', label: t('navigation.settings'), icon: Settings },
      { href: '/resources', label: t('navigation.resources'), icon: Container },
    ]
  };

  // 更精确的路由匹配函数
  const isRouteActive = (href: string): boolean => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    
    // 对于其他路由，检查是否以该路径开头
    return pathname.startsWith(href);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Bot
              className="w-8 h-8 text-primary"
              style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)))' }}
            />
            <span className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">
              CrewAIStudio
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupLabel>{t('navigation.groups.build')}</SidebarGroupLabel>
              {menuItems.build.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isRouteActive(href)}
                    tooltip={{ children: label }}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('navigation.groups.operate')}</SidebarGroupLabel>
              {menuItems.operate.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isRouteActive(href)}
                    tooltip={{ children: label }}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('navigation.groups.manage')}</SidebarGroupLabel>
              {menuItems.manage.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isRouteActive(href)}
                    tooltip={{ children: label }}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className='group-data-[collapsible=icon]:hidden'>
          <div className="flex flex-col gap-2 p-2">
            <Button variant="outline" size="sm">
              {t('common.help')}
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col h-screen">
        <div className="flex items-center gap-4 p-4 h-14 border-b border-border/40 bg-card/20 backdrop-blur-lg sticky top-0 z-50 shrink-0 shadow-sm">
          <SidebarTrigger />
          <Breadcrumb />
          <div className="flex-1" />
          <Header />
        </div>
        <main className={`flex flex-col flex-1 ${noPadding ? '' : 'overflow-y-auto p-4 md:p-6 lg:p-8'}`}>
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
