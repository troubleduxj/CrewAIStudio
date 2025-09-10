import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { VisualEditor } from '@/components/workflow-templates/VisualEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useWorkflowTemplateStore } from '@/stores/workflowTemplateStore';
import type { WorkflowTemplate } from '@/types/workflow';

interface WorkflowTemplatesEditPageProps {
  templateId: string;
}

/**
 * 编辑工作流模板页面组件
 * 提供可视化编辑器用于编辑现有的工作流模板
 */
export default function WorkflowTemplatesEditPage({ templateId }: WorkflowTemplatesEditPageProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchTemplateById, updateTemplate } = useWorkflowTemplateStore();

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const templateData = await fetchTemplateById(id);
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
      if (!templateId) return;
      
      await updateTemplate(templateId, updatedTemplate);
      router.push('/workflow-templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存模板失败');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载模板中...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回模板列表
            </Button>
          </div>
          <div className="text-center py-10">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              重试
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!template) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回模板列表
            </Button>
          </div>
          <div className="text-center py-10">
            <p className="text-muted-foreground">模板不存在</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回模板列表
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                编辑工作流模板
              </h1>
              <p className="text-muted-foreground">
                {template.name} - {template.description}
              </p>
            </div>
          </div>
        </div>
        
        <VisualEditor
          template={template}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </MainLayout>
  );
}