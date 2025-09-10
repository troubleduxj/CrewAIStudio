import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { CrewCard } from '@/components/crews/CrewCard';
import { ExecutionDialog } from '@/components/crews/ExecutionDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Play, Settings, History } from 'lucide-react';
import { useCrewStore } from '@/stores/crewStore';
import type { Crew } from '@/types/crew';

interface CrewsDetailPageProps {
  crewId: string;
}

/**
 * Crew 详情页面组件
 * 显示特定 Crew 的详细信息和操作选项
 */
export default function CrewsDetailPage({ crewId }: CrewsDetailPageProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [crew, setCrew] = useState<Crew | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);

  const { fetchCrewById } = useCrewStore();

  useEffect(() => {
    if (crewId) {
      loadCrew(crewId);
    }
  }, [crewId]);

  const loadCrew = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const crewData = await fetchCrewById(id);
      setCrew(crewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载团队失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/crews');
  };

  const handleRunCrew = () => {
    setShowExecutionDialog(true);
  };

  const handleEditCrew = () => {
    router.push(`/crews/${crewId}/edit`);
  };

  const handleViewHistory = () => {
    router.push(`/crews/${crewId}/history`);
  };

  const handleExecute = (input: any) => {
    // TODO: 实现执行逻辑
    console.log('Executing crew with input:', input);
    setShowExecutionDialog(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载团队信息中...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回团队列表
            </Button>
          </div>
          <div className="text-center py-10">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              重试
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!crew) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回团队列表
            </Button>
          </div>
          <div className="text-center py-10">
            <p className="text-muted-foreground">团队不存在</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回团队列表
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {crew.name}
              </h1>
              <p className="text-muted-foreground">
                {crew.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleViewHistory}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              查看历史
            </Button>
            <Button
              variant="outline"
              onClick={handleEditCrew}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              编辑配置
            </Button>
            <Button
              onClick={handleRunCrew}
              className="gap-2"
              disabled={crew.status !== 'READY'}
            >
              <Play className="h-4 w-4" />
              运行团队
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6">
          <CrewCard
            crew={crew}
            onRun={handleRunCrew}
            onEdit={handleEditCrew}
            onViewHistory={handleViewHistory}
            showActions={false}
          />
        </div>
        
        {showExecutionDialog && (
          <ExecutionDialog
            crew={crew}
            open={showExecutionDialog}
            onClose={() => setShowExecutionDialog(false)}
            onExecute={handleExecute}
          />
        )}
      </div>
    </MainLayout>
  );
}