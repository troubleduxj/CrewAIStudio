import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/main-layout';
import { CrewList } from '@/components/crews/CrewList';
import { useCrews, useExecuteCrew } from '@/hooks/useCrews';

/**
 * Crews 列表页面组件
 * 显示所有 Crew 实例的管理界面
 */
export default function CrewsIndexPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { crews, isLoading } = useCrews();
  const executeCrew = useExecuteCrew();

  const handleCreateCrew = () => {
    router.push('/crews/create');
  };

  const handleRunCrew = (crewId: string) => {
    executeCrew.mutate({
      crewId,
      input: {
        variables: {},
        priority: 'MEDIUM'
      }
    });
  };

  const handleEditCrew = (crewId: string) => {
    router.push(`/crews/${crewId}/edit`);
  };

  const handleViewHistory = (crewId: string) => {
    router.push(`/crews/${crewId}/detail`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('crews.title', '我的团队')}
            </h1>
            <p className="text-muted-foreground">
              {t('crews.description', '创建、配置并运行您的 AI 执行团队')}
            </p>
          </div>
        </div>
        
        <CrewList
          crews={crews || []}
          loading={isLoading}
          onCreateCrew={handleCreateCrew}
          onRunCrew={handleRunCrew}
          onEditCrew={handleEditCrew}
          onViewHistory={handleViewHistory}
        />
      </div>
    </MainLayout>
  );
}