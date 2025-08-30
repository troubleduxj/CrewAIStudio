import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import MainLayout from '@/components/layout/main-layout';
import { Wrench, Plus, Zap, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WorkflowToolPanel from '@/components/workflow/workflow-tool-panel';

/**
 * 工具面板页面组件
 * 用于管理和配置各种工具
 * @returns 工具页面JSX元素
 */
export default function Tools() {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">工具面板</h1>
            <p className="text-muted-foreground">
              管理和配置您的工具集合
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            添加工具
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                活跃工具
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                当前可用的工具
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                工具类别
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">
                不同类型的工具分类
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                使用频率
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground">
                工具平均使用率
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>内置工具</CardTitle>
              <CardDescription>
                系统预装的常用工具
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">文本处理工具</p>
                      <p className="text-sm text-muted-foreground">处理和分析文本内容</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">配置</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">数据分析工具</p>
                      <p className="text-sm text-muted-foreground">分析和可视化数据</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">配置</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 工具面板 */}
          <WorkflowToolPanel />
        </div>
      </div>
    </MainLayout>
  );
}

/**
 * 获取静态属性，用于国际化
 * @param context - Next.js上下文
 * @returns 静态属性
 */
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};