/**
 * Crew实例卡片组件
 * 用于在Dashboard中显示Crew实例的状态和基础信息
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Square,
  Users,
  CheckSquare,
  Clock,
  AlertCircle,
  MoreVertical,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { crewService } from '@/services/crewService';
import { Crew } from '@/types/crew';

/**
 * Crew实例卡片组件属性接口
 */
interface CrewInstanceCardProps {
  /** Crew实例数据 */
  crew: Crew;
  /** 点击查看详情的回调函数 */
  onViewDetails?: (crewId: string) => void;
  /** 停止Crew执行的回调函数 */
  onStopCrew?: (crewId: string) => void;
  /** 卡片点击事件 */
  onClick?: () => void;
}

/**
 * Crew实例卡片组件
 * @param props 组件属性
 * @returns JSX元素
 */
export const CrewInstanceCard: React.FC<CrewInstanceCardProps> = ({
  crew,
  onViewDetails,
  onStopCrew,
  onClick
}) => {
  /**
   * 获取状态图标
   * @param status Crew状态
   * @returns 状态图标组件
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
      case 'running':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'READY':
      case 'idle':
        return <Square className="h-4 w-4" />;
      case 'completed':
        return <CheckSquare className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  /**
   * 格式化时间显示
   * @param dateString 时间字符串
   * @returns 格式化的时间
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  /**
   * 处理停止Crew操作
   */
  const handleStopCrew = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStopCrew) {
      onStopCrew(crew.id);
    }
  };

  /**
   * 处理查看详情操作
   */
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(crew.id);
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-semibold">{crew.name}</CardTitle>
            <Badge 
              variant="secondary" 
              className="border-0"
            >
              {getStatusIcon(crew.status)}
              <span className="ml-1">{crew.status}</span>
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              {crew.status === 'RUNNING' && (
                <DropdownMenuItem onClick={handleStopCrew}>
                  <Square className="mr-2 h-4 w-4" />
                  停止执行
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CardDescription className="text-sm text-muted-foreground">
          {crew.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 进度条 */}
        {crew.status === 'RUNNING' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>执行进度</span>
              <span>{(crew as any).execution_progress || 0}%</span>
            </div>
            <Progress value={(crew as any).execution_progress || 0} className="h-2" />
          </div>
        )}
        
        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Agents:</span>
            <span className="font-medium">{crew.agentsConfig?.length || 0}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tasks:</span>
            <span className="font-medium">
              {(crew as any).completed_tasks || 0}/{(crew as any).total_tasks || 0}
            </span>
          </div>
        </div>
        
        {/* 当前执行信息 */}
        {crew.status === 'RUNNING' && ((crew as any).current_agent || (crew as any).current_task) && (
          <div className="space-y-1 text-sm">
            {(crew as any).current_agent && (
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">当前Agent:</span>
                <span className="font-medium text-blue-600">{(crew as any).current_agent}</span>
              </div>
            )}
            {(crew as any).current_task && (
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">当前Task:</span>
                <span className="font-medium text-green-600">{(crew as any).current_task}</span>
              </div>
            )}
          </div>
        )}
        
        {/* 时间信息 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>创建于 {formatTime(crew.createdAt)}</span>
          </div>
          
          {(crew as any).execution_time && (
            <span>
              执行时长: {crewService.formatExecutionTime((crew as any).execution_time)}
            </span>
          )}
        </div>
        
        {/* 失败任务提示 */}
        {(crew as any).failed_tasks && (crew as any).failed_tasks > 0 && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{(crew as any).failed_tasks} 个任务执行失败</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrewInstanceCard;