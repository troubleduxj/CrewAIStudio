import React, { useState, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { Search, Plus, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CrewListProps, Crew, CrewStatus } from '@/types/crew';
import { EmptyState, SkeletonList } from '@/components/shared/LoadingStates';
import { StatusIndicator } from '@/components/shared/StatusIndicator';
import { CrewCard } from './CrewCard';

interface CrewStats {
  total: number;
  active: number;
  ready: number;
  running: number;
  disabled: number;
  avgSuccessRate: number;
}

type SortField = 'name' | 'createdAt' | 'lastExecutionAt' | 'successRate';
type SortOrder = 'asc' | 'desc';

export function CrewList({
  crews,
  loading,
  onCreateCrew,
  onRunCrew,
  onEditCrew,
  onViewHistory,
}: CrewListProps) {
  const { t } = useTranslation();
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CrewStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 计算统计信息
  const stats = useMemo((): CrewStats => {
    const crewsArray = crews || [];
    const total = crewsArray.length;
    const active = crewsArray.filter(crew => crew.status !== 'DISABLED').length;
    const ready = crewsArray.filter(crew => crew.status === 'READY').length;
    const running = crewsArray.filter(crew => crew.status === 'RUNNING').length;
    const disabled = crewsArray.filter(crew => crew.status === 'DISABLED').length;
    const avgSuccessRate = total > 0 
      ? crewsArray.reduce((sum, crew) => sum + crew.successRate, 0) / total 
      : 0;

    return {
      total,
      active,
      ready,
      running,
      disabled,
      avgSuccessRate,
    };
  }, [crews]);

  // 筛选和排序逻辑
  const filteredAndSortedCrews = useMemo(() => {
    const crewsArray = crews || [];
    let filtered = crewsArray;

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(crew =>
        crew.name.toLowerCase().includes(query) ||
        crew.description.toLowerCase().includes(query) ||
        crew.workflowTemplateName.toLowerCase().includes(query)
      );
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(crew => crew.status === statusFilter);
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'lastExecutionAt':
          aValue = a.lastExecutionAt ? new Date(a.lastExecutionAt) : new Date(0);
          bValue = b.lastExecutionAt ? new Date(b.lastExecutionAt) : new Date(0);
          break;
        case 'successRate':
          aValue = a.successRate;
          bValue = b.successRate;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [crews, searchQuery, statusFilter, sortField, sortOrder]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 统计卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
        
        {/* 列表骨架 */}
        <SkeletonList count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('crews.title')}</h1>
          <p className="text-muted-foreground">{t('crews.description')}</p>
        </div>
        <Button onClick={onCreateCrew} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          {t('crews.createCrew')}
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('crews.stats.totalCrews')}
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('crews.stats.activeCrews')}
                </p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <StatusIndicator status="READY" showText={false} size="lg" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('crews.stats.runningCrews')}
                </p>
                <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
              </div>
              <StatusIndicator status="RUNNING" showText={false} size="lg" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('crews.stats.successRate')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.avgSuccessRate.toFixed(1)}%
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选工具栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('crews.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 状态筛选 */}
            <Select value={statusFilter} onValueChange={(value: CrewStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('crews.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('crews.allStatuses')}</SelectItem>
                <SelectItem value="READY">{t('crews.status.ready')}</SelectItem>
                <SelectItem value="RUNNING">{t('crews.status.running')}</SelectItem>
                <SelectItem value="DISABLED">{t('crews.status.disabled')}</SelectItem>
              </SelectContent>
            </Select>

            {/* 排序选择 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  {getSortIcon(sortField)}
                  {t(`crews.sortBy.${sortField}`)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSortChange('name')}>
                  {getSortIcon('name')}
                  {t('crews.sortBy.name')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('createdAt')}>
                  {getSortIcon('createdAt')}
                  {t('crews.sortBy.createdAt')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('lastExecutionAt')}>
                  {getSortIcon('lastExecutionAt')}
                  {t('crews.sortBy.lastExecutionAt')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('successRate')}>
                  {getSortIcon('successRate')}
                  {t('crews.sortBy.successRate')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 活动筛选标签 */}
          {(searchQuery || statusFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {t('crews.activeFilters')}:
              </span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  {t('crews.search')}: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {t('crews.status')}: {t(`crews.status.${statusFilter.toLowerCase()}`)}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crew 列表 */}
      {filteredAndSortedCrews.length === 0 ? (
        <EmptyState
          title={searchQuery || statusFilter !== 'all' 
            ? t('crews.noCrewsFound') 
            : t('crews.noCrews')
          }
          description={searchQuery || statusFilter !== 'all'
            ? t('crews.noCrewsFoundDescription')
            : t('crews.noCrewsDescription')
          }
          action={searchQuery || statusFilter !== 'all' 
            ? undefined 
            : {
                label: t('crews.createCrew'),
                onClick: onCreateCrew,
              }
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCrews.map((crew) => (
            <CrewCard
              key={crew.id}
              crew={crew}
              onRun={onRunCrew}
              onEdit={onEditCrew}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
      )}

      {/* 结果统计 */}
      {filteredAndSortedCrews.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {searchQuery || statusFilter !== 'all' ? (
            t('crews.showingResults', { 
              count: filteredAndSortedCrews.length, 
              total: crews.length 
            })
          ) : (
            t('crews.totalCrews', { count: crews.length })
          )}
        </div>
      )}
    </div>
  );
}