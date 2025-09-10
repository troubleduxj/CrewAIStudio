import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/main-layout';
import { CrewWizard } from '@/components/crews/CrewWizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * 创建 Crew 页面组件
 * 提供分步向导用于创建新的 Crew
 */
export default function CrewsCreatePage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const handleCancel = () => {
    router.push('/crews');
  };

  const handleComplete = (crew: any) => {
    // TODO: 实现创建逻辑
    console.log('Creating crew:', crew);
    router.push('/crews');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回团队列表
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                创建执行团队
              </h1>
              <p className="text-muted-foreground">
                基于工作流模板创建您的 AI 执行团队
              </p>
            </div>
          </div>
        </div>
        
        <CrewWizard
          open={true}
          onClose={handleCancel}
          onComplete={handleComplete}
        />
      </div>
    </MainLayout>
  );
}