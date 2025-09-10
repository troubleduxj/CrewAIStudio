'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/main-layout';
import { VisualEditor } from '@/components/workflow-templates/VisualEditor';
import { ResourcePanel } from '@/components/workflow-templates/ResourcePanel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { WorkflowTemplate, WorkflowDefinition } from '@/types/workflow';
import { workflowTemplateService } from '@/services/workflowTemplateService';
import { useToast } from '@/hooks/use-toast';

/**
 * 创建工作流模板页面
 * 提供可视化编辑器用于创建新的工作流模板
 */
export default function CreateWorkflowTemplatePage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [template, setTemplate] = useState<WorkflowTemplate>({
    id: 'new',
    name: t('new_workflow_template_name'),
    description: t('new_workflow_template_description'),
    definition: {
      agents: [],
      tasks: [],
      connections: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  });
  const [nameForSave, setNameForSave] = useState('');
  const [descriptionForSave, setDescriptionForSave] = useState('');
  const [definitionForSave, setDefinitionForSave] = useState<WorkflowDefinition | null>(null);

  const handleCancel = () => {
    router.push('/workflow-templates');
  };

  // This function will now open the dialog
  const handleSave = (updatedTemplate: WorkflowTemplate) => {
    if (template.id === 'new') {
      setDefinitionForSave(updatedTemplate.definition);
      setNameForSave(template.name); // Keep the current name as default in dialog
      setDescriptionForSave(template.description);
      setIsDialogOpen(true);
    } else {
      // Logic for updating an existing template would go here
      console.log("Updating existing template:", updatedTemplate);
    }
  };

  const handleConfirmSave = async () => {
    if (!nameForSave) {
      toast({
        title: t('error'),
        description: t('template_name_required'),
        variant: 'destructive',
      });
      return;
    }

    if (!definitionForSave) return;

    try {
      const newTemplate = await workflowTemplateService.createTemplate({
        name: nameForSave,
        description: descriptionForSave,
        definition: definitionForSave,
      });
      toast({
        title: t('success'),
        description: t('workflow_template_saved_successfully'),
      });
      setIsDialogOpen(false);
      setTemplate(newTemplate); // Update the main template state
      // Update the URL to the edit page for the new template
      router.replace(`/workflow-templates/${newTemplate.id}/edit`);
    } catch (error) {
      console.error('Failed to save workflow template:', error);
      toast({
        title: t('error'),
        description: t('failed_to_save_workflow_template'),
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout noPadding={true}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center p-2 border-b h-14">
          <h1 className="text-lg font-semibold px-2">
            {template.name}
          </h1>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back_to_list')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSave(template)}>
              <Save className="h-4 w-4 mr-2" />
              {t('common.save')}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}>
              {isRightPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Visual Editor */}
          <div className="flex-1 relative">
            <VisualEditor
              template={template}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
          
          {/* Resource Panel */}
          {isRightPanelOpen && (
            <div className="w-[350px] border-l bg-white p-4 transition-all duration-300 ease-in-out">
              <ResourcePanel />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('save_workflow_template')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">{t('template_name')}</Label>
              <Input
                id="template-name"
                value={nameForSave}
                onChange={(e) => setNameForSave(e.target.value)}
                placeholder={t('enter_template_name')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">{t('description')}</Label>
              <Textarea
                id="template-description"
                value={descriptionForSave}
                onChange={(e) => setDescriptionForSave(e.target.value)}
                placeholder={t('enter_template_description')}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('cancel')}</Button>
            </DialogClose>
            <Button onClick={handleConfirmSave}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
