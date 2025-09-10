import React, { memo, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Edit, 
  Copy, 
  Users, 
  Trash2, 
  MoreVertical, 
  Calendar,
  Activity
} from 'lucide-react';
import { WorkflowTemplate } from '@/types/workflow';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { usePerformanceMonitor } from '@/hooks/usePerformanceOptimization';

interface TemplateCardProps {
  template: WorkflowTemplate;
  onEdit: (id: string) => void;
  onClone: (id: string) => void;
  onCreateCrew: (templateId: string) => void;
  onDelete: (id: string) => void;
}

export const TemplateCard = memo(function TemplateCard({ 
  template, 
  onEdit, 
  onClone, 
  onCreateCrew, 
  onDelete 
}: TemplateCardProps) {
  const { t, i18n } = useTranslation();
  
  // 性能监控
  usePerformanceMonitor('TemplateCard');
  
  // 缓存计算结果
  const locale = useMemo(() => i18n.language === 'zh' ? zhCN : enUS, [i18n.language]);
  const agentCount = useMemo(() => template.definition.agents.length, [template.definition.agents.length]);
  const taskCount = useMemo(() => template.definition.tasks.length, [template.definition.tasks.length]);
  
  // 缓存格式化的时间
  const formattedTime = useMemo(() => 
    formatDistanceToNow(new Date(template.updatedAt), { 
      addSuffix: true, 
      locale 
    }), [template.updatedAt, locale]
  );

  // 稳定的事件处理器
  const handleEdit = useCallback(() => onEdit(template.id), [onEdit, template.id]);
  const handleClone = useCallback(() => onClone(template.id), [onClone, template.id]);
  const handleCreateCrew = useCallback(() => onCreateCrew(template.id), [onCreateCrew, template.id]);
  const handleDelete = useCallback(() => onDelete(template.id), [onDelete, template.id]);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {template.description}
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
                {t('workflowTemplates.editTemplate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClone}>
                <Copy className="h-4 w-4 mr-2" />
                {t('workflowTemplates.cloneTemplate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-grow">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{agentCount} {t('common.agents')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span>{taskCount} {t('common.tasks')}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {formattedTime}
            </Badge>
            {template.usageCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {template.usageCount} {t('workflowTemplates.usages')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/50">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEdit}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
          <Button 
            size="sm" 
            onClick={handleCreateCrew}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            {t('workflowTemplates.createCrewFromTemplate')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});
