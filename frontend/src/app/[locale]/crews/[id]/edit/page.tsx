"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { CrewWizard } from '@/components/crews/CrewWizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCrewStore } from '@/stores/crewStore';
import { crewService } from '@/services/crewService';
import type { Crew, UpdateCrewRequest } from '@/types/crew';

/**
 * Crew 编辑页面
 * 允许用户编辑现有的 Crew 配置
 */
export default function CrewEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [crew, setCrew] = useState<Crew | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { fetchCrewById } = useCrewStore();

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadCrew(id);
    }
  }, [id]);

  const loadCrew = async (crewId: string) => {
    try {
      setLoading(true);
      setError(null);
      const crewData = await fetchCrewById(crewId);
      setCrew(crewData);
    } catch (err) {
      console.error('Failed to load crew:', err);
      
      // 检查是否是404错误
      if (err instanceof Error && err.message.includes('404')) {
        setError('团队不存在或已被删除');
        // 清理可能过期的缓存
        useCrewStore.getState().invalidateCache();
        
        // 自动重定向到团队列表页面（3秒后）
        setTimeout(() => {
          router.push('/crews');
        }, 3000);
      } else {
        setError(err instanceof Error ? err.message : '加载团队失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/crews');
  };

  const handleSave = async (updatedCrew: UpdateCrewRequest) => {
    if (!id || typeof id !== 'string') return;

    try {
      setSaving(true);
      await crewService.updateCrew(id, updatedCrew);
      
      // 显示成功消息
      // TODO: 添加toast通知
      
      // 返回到crew列表或详情页面
      router.push(`/crews/${id}/detail`);
    } catch (err) {
      console.error('Failed to update crew:', err);
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/crews/${id}/detail`);
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
    const is404Error = error.includes('团队不存在') || error.includes('404');
    
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
            <div className="max-w-md mx-auto">
              {is404Error ? (
                <>
                  <h2 className="text-xl font-semibold mb-2">团队不存在</h2>
                  <p className="text-muted-foreground mb-4">
                    您要编辑的团队可能已被删除或不存在。这可能是因为服务器重启导致的数据重置。
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleBack}>
                      返回团队列表
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/crews/create')}>
                      创建新团队
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-destructive mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => {
                      // 清理缓存并重试
                      useCrewStore.getState().invalidateCache();
                      window.location.reload();
                    }}>
                      清理缓存并重试
                    </Button>
                    <Button variant="outline" onClick={handleBack}>
                      返回团队列表
                    </Button>
                  </div>
                </>
              )}
            </div>
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
              编辑团队: {crew.name}
            </h1>
            <p className="text-muted-foreground">
              修改团队配置和Agent设置
            </p>
          </div>
        </div>
        
        <div className="max-w-4xl">
          <CrewWizard
            open={true}
            onClose={handleCancel}
            onComplete={handleSave}
            initialData={{
              name: crew.name,
              description: crew.description,
              workflowTemplateId: crew.workflowTemplateId,
              agentsConfig: crew.agentsConfig,
            }}
            mode="edit"
            loading={saving}
          />
        </div>
      </div>
    </MainLayout>
  );
}
