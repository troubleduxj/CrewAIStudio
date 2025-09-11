'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/main-layout';
import { VisualEditor } from '@/components/workflow-templates/VisualEditor';
import { ResourcePanel } from '@/components/workflow-templates/ResourcePanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useWorkflowTemplateStore } from '@/stores/workflowTemplateStore';
import type { WorkflowTemplate } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';

/**
 * 编辑工作流模板页面
 * 提供可视化编辑器用于编辑现有的工作流模板
 */
export default function EditWorkflowTemplatePage() {
  const t = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const id = (params?.id ?? '') as string;
  const { toast } = useToast();
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const { fetchTemplateById, updateTemplateById } = useWorkflowTemplateStore();

  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      setError(null);
      const templateData = await fetchTemplateById(templateId);
      setTemplate(templateData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/workflow-templates');
  };

  const handleSave = async (updatedTemplate: WorkflowTemplate) => {
    try {
      if (!id) return;
      
      await updateTemplateById(id, { ...template, ...updatedTemplate });
      toast({
        title: t('success'),
        description: t('workflow_template_saved_successfully'),
      });
    } catch (err) {
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : t('failed_to_save_workflow_template'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-10">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => loadTemplate(id)} className="mt-4">
            {t('retry')}
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!template) {
    return (
      <MainLayout>
        <div className="text-center py-10">
          <p>{t('template_not_found')}</p>
        </div>
      </MainLayout>
    );
  }

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
              {t('save')}
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
    </MainLayout>
  );
}
