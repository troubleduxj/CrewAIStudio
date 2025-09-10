import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardList, Wrench } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toolService, Tool } from '@/services/toolService';

export const ResourcePanel = () => {
  const { t } = useTranslation('common');
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoading(true);
        const fetchedTools = await toolService.getAvailableTools();
        setTools(fetchedTools);
        setError(null);
      } catch (err) {
        setError(t('errors.fetch-tools-failed', 'Failed to fetch tools'));
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTools();
  }, [t]);

  const onDragStart = (event: React.DragEvent, type: string, data?: any) => {
    event.dataTransfer.setData('application/reactflow', type);
    if (data) {
      event.dataTransfer.setData('application/json', JSON.stringify(data));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 p-4">
      <h2 className="text-xl font-bold mb-4">{t('crew', 'Crew')}</h2>
      <div
        className="flex items-center gap-3 rounded-md border bg-white p-3 mb-2 transition-all hover:shadow-md cursor-grab"
        onDragStart={(event) => onDragStart(event, 'task')}
        draggable
      >
        <ClipboardList className="h-6 w-6" />
        <div className="font-semibold">{t('task', 'Task')}</div>
      </div>
      <div
        className="flex items-center gap-3 rounded-md border bg-white p-3 mb-4 transition-all hover:shadow-md cursor-grab"
        onDragStart={(event) => onDragStart(event, 'agent')}
        draggable
      >
        <Users className="h-6 w-6" />
        <div className="font-semibold">{t('agent', 'Agent')}</div>
      </div>

      <h2 className="text-xl font-bold mb-4">{t('tools', 'Tools')}</h2>
      {/* TODO: Implement Search and Filter */}
      <ScrollArea className="flex-grow">
        <div className="space-y-2">
          {isLoading && <p>{t('loading', 'Loading...')}</p>}
          {error && <p className="text-red-500">{error}</p>}
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center gap-3 rounded-md border bg-white p-3 transition-all hover:shadow-md cursor-grab"
              onDragStart={(event) => onDragStart(event, 'tool', tool)}
              draggable
            >
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-semibold">{tool.name}</div>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
