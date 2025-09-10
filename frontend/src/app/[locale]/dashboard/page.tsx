"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResearchAnalystDemo from '@/components/dashboard/research-analyst-demo';
import MainLayout from '@/components/layout/main-layout';
import CrewInstanceCard from '@/components/dashboard/CrewInstanceCard';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { crewService } from '@/services/crewService';
import { Crew } from '@/types/crew';

/**
 * 仪表板页面组件
 * 显示研究分析师演示组件和Crew实例管理
 * @returns JSX元素
 */
export default function DashboardPage() {
  const router = useRouter();
  const [crews, setCrews] = useState<Crew[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * 获取Crew实例列表
   */
  const fetchCrews = async () => {
    try {
      const crewList = await crewService.getCrews();
      console.log('Received crew data:', crewList);
      
      // 确保crewList是数组
      if (Array.isArray(crewList)) {
        setCrews(crewList);
      } else {
        console.error('Crew list is not an array:', crewList);
        setCrews([]);
      }
    } catch (error) {
      console.error('获取Crew列表失败:', error);
      setCrews([]); // 设置为空数组以防止undefined错误
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * 刷新Crew列表
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCrews();
  };

  /**
   * 查看Crew详情
   */
  const handleViewDetails = (crewId: string) => {
    router.push(`/crews/${crewId}/detail`);
  };

  /**
   * 编辑Crew
   */
  const handleEditCrew = (crewId: string) => {
    router.push(`/crews/${crewId}/edit`);
  };

  /**
   * 停止Crew执行
   */
  const handleStopCrew = async (crewId: string) => {
    try {
      await crewService.stopCrew(crewId);
      // 刷新列表以更新状态
      await fetchCrews();
    } catch (error) {
      console.error('停止Crew执行失败:', error);
    }
  };

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    fetchCrews();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              管理和监控您的AI Crew实例
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">刷新</span>
            </Button>
            
            <Button size="sm">
              <Plus className="h-4 w-4" />
              <span className="ml-2">创建Crew</span>
            </Button>
          </div>
        </div>
        
        {/* Crew实例列表 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Crew实例</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
          ) : !crews || crews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">暂无Crew实例</p>
              <Button>
                <Plus className="h-4 w-4" />
                <span className="ml-2">创建第一个Crew</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crews && crews.map((crew) => (
                <CrewInstanceCard
                  key={crew.id}
                  crew={crew}
                  onViewDetails={handleViewDetails}
                  onStopCrew={handleStopCrew}
                  onClick={() => handleViewDetails(crew.id)}
                />
              ))}
            </div>
          )}
        </div>
        
        <ResearchAnalystDemo />
      </div>
    </MainLayout>
  );
}
