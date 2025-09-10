import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardList } from 'lucide-react';

/**
 * 工作流编辑器工具面板
 * 提供可拖拽到画布上的节点类型
 */
export const WorkflowToolPanel = () => {
  const { t } = useTranslation('common');

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="w-64 flex-shrink-0">
      <CardHeader>
        <CardTitle>{t('nodes', '节点')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('drag_nodes_to_canvas', '拖拽节点到画布上')}
        </p>
        
        <div
          className="flex items-center gap-3 rounded-md border bg-background p-4 transition-all hover:shadow-md cursor-grab"
          onDragStart={(event) => onDragStart(event, 'agent')}
          draggable
        >
          <Users className="h-6 w-6" />
          <div className="font-semibold">{t('agent_node', 'Agent 节点')}</div>
        </div>

        <div
          className="flex items-center gap-3 rounded-md border bg-background p-4 transition-all hover:shadow-md cursor-grab"
          onDragStart={(event) => onDragStart(event, 'task')}
          draggable
        >
          <ClipboardList className="h-6 w-6" />
          <div className="font-semibold">{t('task_node', 'Task 节点')}</div>
        </div>
      </CardContent>
    </Card>
  );
};
