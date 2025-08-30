import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import MainLayout from '@/components/layout/main-layout';
import { Spline, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import LogViewer from '@/components/dashboard/log-viewer';

/**
 * Traces页面组件
 * 用于查看和分析执行轨迹
 * @returns Traces页面JSX元素
 */
export default function Traces() {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Traces</h1>
            <p className="text-muted-foreground">
              查看和分析系统执行轨迹
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今日轨迹
              </CardTitle>
              <Spline className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +12% 比昨日
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                平均延迟
              </CardTitle>
              <Spline className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245ms</div>
              <p className="text-xs text-muted-foreground">
                -5% 比昨日
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                错误率
              </CardTitle>
              <Spline className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.12%</div>
              <p className="text-xs text-muted-foreground">
                -0.05% 比昨日
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                总轨迹数
              </CardTitle>
              <Spline className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45.2K</div>
              <p className="text-xs text-muted-foreground">
                历史累计轨迹
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>轨迹搜索</CardTitle>
            <CardDescription>
              搜索和查看详细的执行轨迹信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="搜索轨迹 ID、服务名称或操作..."
                  className="w-full"
                />
              </div>
              <Button>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* 实时日志查看器 */}
        <LogViewer />
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