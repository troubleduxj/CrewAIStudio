import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import MainLayout from '@/components/layout/main-layout';
import { Brain, Plus, Settings, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * LLM连接页面组件
 * 用于管理和配置LLM模型连接
 * @returns LLM连接页面JSX元素
 */
export default function LLMConnections() {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">LLM Connections</h1>
            <p className="text-muted-foreground">
              管理和配置大语言模型连接
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            添加连接
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                活跃连接
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                正常运行中
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                总连接数
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                已配置的连接
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今日调用
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                +18% 比昨日
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                错误连接
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                需要检查
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI GPT-4</CardTitle>
              <CardDescription>
                OpenAI官方API连接
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  已连接
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>gpt-4-turbo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">延迟:</span>
                  <span>245ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>847</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Claude 3.5 Sonnet</CardTitle>
              <CardDescription>
                Anthropic Claude API连接
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  已连接
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>claude-3-5-sonnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">延迟:</span>
                  <span>312ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>400</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>本地模型</CardTitle>
              <CardDescription>
                本地部署的开源模型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  已连接
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>llama-3.1-8b</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">延迟:</span>
                  <span>156ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Azure OpenAI</CardTitle>
              <CardDescription>
                Azure平台的OpenAI服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  连接失败
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>gpt-4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <span className="text-red-600">API密钥无效</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>0</span>
                </div>
              </div>
            </CardContent>
          </Card>
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