import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/main-layout';
import { Wrench, Plus, Zap, Package, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toolService, Tool } from '@/services/toolService';

/**
 * 工具面板页面组件
 * 用于管理和配置各种工具
 * @returns 工具页面JSX元素
 */
export default async function ToolsPage() {
  const t = useTranslations('common');
  const tools = await toolService.getAvailableTools();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('tools.title')}</h1>
            <p className="text-muted-foreground">
              {t('tools.description')}
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('tools.add_tool')}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('tools.available_tools')}
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tools.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('tools.total_available_tools')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('tools.custom_tools')}
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tools.filter(t => t.type !== 'system').length}</div>
              <p className="text-xs text-muted-foreground">
                {t('tools.in_app_custom_tools')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('tools.usage_frequency')}
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground">
                {t('tools.average_tool_usage')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('tools.available_tools_list')}</CardTitle>
              <CardDescription>
                {t('tools.all_available_tools_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <div key={tool.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tool.name}</p>
                          <Badge variant={
                            tool.type === 'system' ? 'secondary' :
                            tool.type === 'api' ? 'destructive' :
                            tool.type === 'mcp' ? 'outline' :
                            'default'
                          }>
                            {t(`tools.types.${tool.type}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tool.description || t('tools.core_tool_description')}</p>
                      </div>
                    </div>
                    {/* TODO: 实现工具详情弹窗或页面 */}
                    <Button variant="outline" size="sm" disabled>{t('common.details')}</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
