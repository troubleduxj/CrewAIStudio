import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import MainLayout from '@/components/layout/main-layout';
import { HardDrive, Cpu, MemoryStick, Activity, TrendingUp, AlertTriangle, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import StatusMonitor from '@/components/dashboard/status-monitor';

/**
 * 资源页面组件
 * 用于监控系统资源使用情况
 * @returns 资源页面JSX元素
 */
export default function Resources() {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground">
              监控系统资源使用情况和性能指标
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              导出报告
            </Button>
            <Button variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              实时监控
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                CPU使用率
              </CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45%</div>
              <Progress value={45} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                8核心 Intel i7-12700K
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                内存使用
              </CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4GB</div>
              <Progress value={77} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                16GB 总内存 (77%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                磁盘使用
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234GB</div>
              <Progress value={46} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                512GB SSD (46%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                网络流量
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2MB/s</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Upload className="h-3 w-3 text-green-600" />
                  <span className="text-xs">245KB/s</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3 text-blue-600" />
                  <span className="text-xs">955KB/s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>系统进程</CardTitle>
              <CardDescription>
                当前运行的主要系统进程
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">运行中</Badge>
                    <div>
                      <p className="font-medium">CrewAI Backend</p>
                      <p className="text-sm text-muted-foreground">主要后端服务</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">2.1GB</p>
                    <p className="text-sm text-muted-foreground">15% CPU</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">运行中</Badge>
                    <div>
                      <p className="font-medium">Next.js Frontend</p>
                      <p className="text-sm text-muted-foreground">前端开发服务器</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">512MB</p>
                    <p className="text-sm text-muted-foreground">8% CPU</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">运行中</Badge>
                    <div>
                      <p className="font-medium">PostgreSQL</p>
                      <p className="text-sm text-muted-foreground">数据库服务</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">1.8GB</p>
                    <p className="text-sm text-muted-foreground">12% CPU</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">空闲</Badge>
                    <div>
                      <p className="font-medium">Redis Cache</p>
                      <p className="text-sm text-muted-foreground">缓存服务</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">128MB</p>
                    <p className="text-sm text-muted-foreground">2% CPU</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>资源警报</CardTitle>
              <CardDescription>
                系统资源使用警报和建议
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium">内存使用率较高</p>
                    <p className="text-sm text-muted-foreground">
                      当前内存使用率为77%，建议关闭不必要的应用程序
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      2分钟前
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">CPU温度正常</p>
                    <p className="text-sm text-muted-foreground">
                      CPU温度保持在65°C，运行状态良好
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      5分钟前
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <HardDrive className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">磁盘空间充足</p>
                    <p className="text-sm text-muted-foreground">
                      磁盘使用率为46%，存储空间充足
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      10分钟前
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 系统状态监控 */}
        <StatusMonitor />
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