import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { WorkflowTemplate, TemplateListProps } from '@/types/workflow';
import { TemplateCard } from './TemplateCard';
import { SkeletonCard } from '@/components/shared/LoadingStates';
import { VirtualScrollList } from '@/components/shared/VirtualScrollList';
import { useDebounce, usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';

type SortField = 'name' | 'updatedAt' | 'usageCount';
type SortOrder = 'asc' | 'desc';

interface ExtendedTemplateListProps extends TemplateListProps {
  onDeleteTemplate?: (id: string) => void;
}

export const TemplateList = memo(function TemplateList({
  templates,
  loading,
  onCreateTemplate,
  onEditTemplate,
  onCloneTemplate,
  onCreateCrew,
  onDeleteTemplate
}: ExtendedTemplateListProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  // 性能监控
  usePerformanceMonitor('TemplateList');
  
  // 防抖搜索
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 搜索和排序逻辑
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates;

    // 搜索过滤 - 使用防抖后的搜索词
    if (debouncedSearchQuery && typeof debouncedSearchQuery === 'string' && debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = templates.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'usageCount':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [templates, debouncedSearchQuery, sortField, sortOrder]);

  // 稳定的事件处理器
  const handleDelete = useCallback((id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (templateToDelete && onDeleteTemplate) {
      onDeleteTemplate(templateToDelete);
    }
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  }, [templateToDelete, onDeleteTemplate]);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField, sortOrder]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  }, [sortField, sortOrder]);

  // 虚拟滚动渲染函数
  const renderTemplateItem = useCallback((template: WorkflowTemplate, index: number) => (
    <div className="p-3">
      <TemplateCard
        template={template}
        onEdit={onEditTemplate}
        onClone={onCloneTemplate}
        onCreateCrew={onCreateCrew}
        onDelete={handleDelete}
      />
    </div>
  ), [onEditTemplate, onCloneTemplate, onCreateCrew, handleDelete]);

  // 判断是否使用虚拟滚动
  const useVirtualScroll = filteredAndSortedTemplates.length > 50;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 加载状态的头部 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-md">
            <div className="h-10 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
            <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
          </div>
        </div>

        {/* 加载状态的卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('workflowTemplates.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* 排序选择器 */}
          <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-') as [SortField, SortOrder];
            setSortField(field);
            setSortOrder(order);
          }}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt-desc">
                {t('workflowTemplates.sortByUpdatedDesc')}
              </SelectItem>
              <SelectItem value="updatedAt-asc">
                {t('workflowTemplates.sortByUpdatedAsc')}
              </SelectItem>
              <SelectItem value="name-asc">
                {t('workflowTemplates.sortByNameAsc')}
              </SelectItem>
              <SelectItem value="name-desc">
                {t('workflowTemplates.sortByNameDesc')}
              </SelectItem>
              <SelectItem value="usageCount-desc">
                {t('workflowTemplates.sortByUsageDesc')}
              </SelectItem>
              <SelectItem value="usageCount-asc">
                {t('workflowTemplates.sortByUsageAsc')}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('workflowTemplates.createTemplate')}
          </Button>
        </div>
      </div>

      {/* 模板网格 */}
      {filteredAndSortedTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {debouncedSearchQuery ? t('workflowTemplates.noSearchResults') : t('workflowTemplates.noTemplates')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {debouncedSearchQuery 
              ? t('workflowTemplates.noSearchResultsDescription')
              : t('workflowTemplates.noTemplatesDescription')
            }
          </p>
          {!debouncedSearchQuery && (
            <Button onClick={onCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('workflowTemplates.createTemplate')}
            </Button>
          )}
        </div>
      ) : useVirtualScroll ? (
        // 大量数据时使用虚拟滚动
        <VirtualScrollList
          items={filteredAndSortedTemplates}
          itemHeight={280}
          containerHeight={600}
          renderItem={renderTemplateItem}
          className="border rounded-lg"
        />
      ) : (
        // 少量数据时使用普通网格
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={onEditTemplate}
              onClone={onCloneTemplate}
              onCreateCrew={onCreateCrew}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workflowTemplates.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workflowTemplates.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});