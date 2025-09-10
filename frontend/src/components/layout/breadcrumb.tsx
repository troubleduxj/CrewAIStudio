import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * 面包屑导航组件
 * 根据当前路由自动生成面包屑导航
 */
export function Breadcrumb() {
  const pathname = usePathname();

  // 根据路径生成面包屑项目
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // 跳过语言代码 (en, zh)
    const filteredSegments = pathSegments.filter((segment, index) => {
      if (index === 0 && (segment === 'en' || segment === 'zh')) {
        return false;
      }
      return true;
    });
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard' }
    ];

    // 根据路径段生成面包屑
    let currentPath = `/${pathSegments[0] || 'en'}`; // 包含语言代码
    filteredSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // 映射路径段到友好的标签
      const labelMap: Record<string, string> = {
        'dashboard': 'Dashboard',
        'workflow-templates': 'Workflow Templates',
        'crews': 'Crews',
        'tools': 'Tools',
        'marketplace': 'Marketplace',
        'traces': 'Traces',
        'llm-connections': 'LLM Connections',
        'settings': 'Settings',
        'resources': 'Resources',
        'create': 'Create',
        'edit': 'Edit',
        'detail': 'Detail',
        'history': 'History'
      };

      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        label,
        href: index === filteredSegments.length - 1 ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // 如果只有一个面包屑项目（Home），不显示面包屑
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground whitespace-nowrap">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "hover:text-foreground transition-colors",
                index === 0 && "flex items-center gap-1"
              )}
            >
              {index === 0 && <Home className="h-4 w-4" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
