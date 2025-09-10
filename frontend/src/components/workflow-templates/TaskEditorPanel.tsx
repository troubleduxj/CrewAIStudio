import React from 'react';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TaskDefinition } from '@/types/workflow';
import { Save } from 'lucide-react';

interface TaskEditorPanelProps {
  task: TaskDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskDefinition) => void;
}

export function TaskEditorPanel({ task, isOpen, onClose, onSave }: TaskEditorPanelProps) {
  const { t } = useTranslation();
  const [editedTask, setEditedTask] = React.useState<TaskDefinition | null>(task);

  React.useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!editedTask) {
    return null;
  }

  const handleSave = () => {
    if (editedTask) {
      onSave(editedTask);
    }
  };

  const handleFieldChange = (field: keyof TaskDefinition, value: any) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, [field]: value });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg w-[500px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b flex-shrink-0 flex flex-row justify-between items-center">
          <SheetTitle>{t('task.edit_task', 'Editing New Task')}</SheetTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {t('common.save', 'Save')}
            </Button>
          </div>
        </SheetHeader>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="name">{t('task.name', 'Name')}</Label>
            <Input
              id="name"
              value={editedTask.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('task.description', 'Description')}</Label>
            <Textarea
              id="description"
              value={editedTask.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expected-output">{t('task.expected_output', 'Expected Output')}</Label>
            <Textarea
              id="expected-output"
              value={editedTask.expectedOutput}
              onChange={(e) => handleFieldChange('expectedOutput', e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex items-center justify-between pt-4">
            <div>
              <Label htmlFor="async-execution">{t('task.async_execution', 'Async Execution')}</Label>
              <p className="text-xs text-gray-500">{t('task.async_execution_hint', 'Whether the task should be executed asynchronously.')}</p>
            </div>
            <Switch
              id="async-execution"
              checked={editedTask.asyncExecution}
              onCheckedChange={(checked) => handleFieldChange('asyncExecution', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="markdown-output">{t('task.markdown_output', 'Markdown Output')}</Label>
              <p className="text-xs text-gray-500">{t('task.markdown_output_hint', 'Instruct the agent to return the final answer formatted in Markdown')}</p>
            </div>
            <Switch
              id="markdown-output"
              checked={!!editedTask.markdownOutput}
              onCheckedChange={(checked) => handleFieldChange('markdownOutput', checked)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
