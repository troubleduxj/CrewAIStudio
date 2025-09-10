"use client";

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/main-layout';
import { CrewList } from '@/components/crews/CrewList';
import { useCrews, useExecuteCrew } from '@/hooks/useCrews';

/**
 * Crew 列表页面
 * 显示所有已创建的 Crew 实例
 */
export default function CrewsPage() {
  const router = useRouter();
  const { crews, isLoading } = useCrews();
  const executeCrew = useExecuteCrew();

  const handleCreateCrew = () => {
    router.push('/crews/create');
  };

  const handleRunCrew = (crewId: string) => {
    // For now, just execute with empty input - this could be enhanced with a dialog
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
      <CrewList
        crews={crews || []}
        loading={isLoading}
        onCreateCrew={handleCreateCrew}
        onRunCrew={handleRunCrew}
        onEditCrew={handleEditCrew}
        onViewHistory={handleViewHistory}
      />
    </MainLayout>
  );
}
