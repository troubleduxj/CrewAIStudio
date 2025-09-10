import React, { memo, useMemo, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  Edit,
  History,
  MoreVertical,
  Users,
  Activity,
  Calendar,
  Clock,
  Zap,
  Settings,
} from 'lucide-react';
import { CrewCardProps } from '@/types/crew';
import { LiveStatusIndicator } from '@/components/shared/StatusIndicator';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';

export const CrewCard = memo(function CrewCard({
  crew,
  onRun,
  onEdit,
  onViewHistory,
  showActions = true,
}: CrewCardProps) {
  const { t, i18n } = useTranslation();
  
  // 性能监控
  usePerformanceMonitor('CrewCard');
  
  // 缓存计算结果
  const locale = useMemo(() => i18n.language === 'zh' ? zhCN : enUS, [i18n.language]);
  const isRunning = useMemo(() => crew.status === 'RUNNING', [crew.status]);
  const isDisabled = useMemo(() => crew.status === 'DISABLED', [crew.status]);
  const canRun = useMemo(() => crew.status === 'READY' && !isDisabled, [crew.status, isDisabled]);

  // 稳定的事件处理器
  const handleRun = useCallback(() => onRun(crew.id), [onRun, crew.id]);
  const handleEdit = useCallback(() => onEdit(crew.id), [onEdit, crew.id]);
  const handleViewHistory = useCallback(() => onViewHistory(crew.id), [onViewHistory, crew.id]);

  // 计算成功率颜色
  const successRateColor = useMemo(() => {
    const rate = crew.successRate;
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, [crew.successRate]);

  // 格式化最后执行时间
  const formattedLastExecution = useMemo(() => {
    if (!crew.lastExecutionAt) return t('crews.neverExecuted');
    return formatDistanceToNow(new Date(crew.lastExecutionAt), {
      addSuffix: true,
      locale,
    });
  }, [crew.lastExecutionAt, locale, t]);

  // 格式化创建时间
  const formattedCreatedAt = useMemo(() => 
    formatDistanceToNow(new Date(crew.createdAt), {
      addSuffix: true,
      locale,
    }), [crew.createdAt, locale]
  );

  return (
    <TooltipProvider>
      <Card className={cn(
        "group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border",
        isRunning && "ring-2 ring-blue-500/20 border-blue-200",
        isDisabled && "opacity-60"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-semibold truncate">
                  {crew.name}
                </CardTitle>
                <LiveStatusIndicator 
                  status={crew.status} 
                  lastUpdated={crew.lastExecutionAt ? new Date(crew.lastExecutionAt) : undefined}
                />
              </div>
              <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                {crew.description}
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('crews.editCrew')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewHistory}>
                  <History className="h-4 w-4 mr-2" />
                  {t('crews.viewHistory')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('crews.settings')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-4">
          {/* 工作流模板信息 */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {crew.workflowTemplateName}
            </Badge>
          </div>

          {/* Agent 配置信息 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{crew.agentsConfig.length} {t('common.agents')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {crew.agentsConfig.map((config) => (
                    <div key={config.agentId} className="text-xs">
                      {config.agentName} ({config.llmModel})
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>{crew.totalExecutions} {t('crews.executions')}</span>
            </div>
          </div>

          {/* 执行统计 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('crews.successRate')}</span>
              <span className={cn("font-medium", successRateColor)}>
                {crew.successRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={crew.successRate} 
              className={cn(
                "h-2",
                crew.successRate >= 80 && "[&>div]:bg-green-500",
                crew.successRate >= 60 && crew.successRate < 80 && "[&>div]:bg-yellow-500",
                crew.successRate < 60 && "[&>div]:bg-red-500"
              )}
            />
          </div>

          {/* 最后执行时间 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{t('crews.lastExecution')}: {formattedLastExecution}</span>
          </div>

          {/* 创建时间 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {t('crews.createdAt')}: {formattedCreatedAt}
            </span>
          </div>

          {/* 运行状态进度条 (仅在运行时显示) */}
          {isRunning && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">
                  {t('crews.executionInProgress')}
                </span>
                <div className="flex items-center gap-1 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs">{t('crews.running')}</span>
                </div>
              </div>
              <Progress value={65} className="h-2" />
              <div className="text-xs text-blue-600">
                {t('crews.estimatedTimeRemaining')}: 2 {t('common.minutes')}
              </div>
            </div>
          )}
        </CardContent>

        {showActions && (
          <CardFooter className="pt-3 border-t border-border/50">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex-1"
                disabled={isRunning}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleViewHistory}
                className="flex-1"
              >
                <History className="h-4 w-4 mr-2" />
                {t('crews.history')}
              </Button>

              <Button
                size="sm"
                onClick={handleRun}
                disabled={!canRun || isRunning}
                className={cn(
                  "flex-1",
                  isRunning && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isRunning ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('crews.running')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('crews.runCrew')}
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  );
});