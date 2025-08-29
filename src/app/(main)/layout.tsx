"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Wrench, Settings, Bot, Spline, BrainCircuit, Container } from 'lucide-react';

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
import { Button } from '@/components/ui/button';

const menuItems = {
  build: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/agents', label: 'Agent 面板', icon: Users },
    { href: '/tools', label: '工具面板', icon: Wrench },
  ],
  operate: [
    { href: '/traces', label: 'Traces', icon: Spline },
    { href: '/llm-connections', label: 'LLM Connections', icon: BrainCircuit },
  ],
  manage: [
    { href: '/settings', label: '设置面板', icon: Settings },
    { href: '/resources', label: 'Resources', icon: Container },
  ]
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Bot
              className="w-8 h-8 text-primary"
              style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)))' }}
            />
            <span className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">
              CrewView
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupLabel>Build</SidebarGroupLabel>
              {menuItems.build.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(href)}
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
              <SidebarGroupLabel>Operate</SidebarGroupLabel>
              {menuItems.operate.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(href)}
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
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              {menuItems.manage.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(href)}
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
              帮助
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
