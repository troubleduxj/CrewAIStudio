'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/main-layout';
import { TemplateList } from '@/components/workflow-templates/TemplateList';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';
import { workflowTemplateService } from '@/services/workflowTemplateService';

/**
 * 工作流模板列表页面
 * 显示所有可用的工作流模板
 */
export default function WorkflowTemplatesPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { templates, error, isLoading, mutate } = useWorkflowTemplates();

  // TODO: Add proper error handling UI
  if (error) {
    console.error('Failed to fetch templates:', error);
  }

  const handleCreateTemplate = () => {
    router.push('/workflow-templates/create');
  };

  const handleEditTemplate = (id: string) => {
    router.push(`/workflow-templates/${id}/edit`);
  };

  const handleCloneTemplate = (id: string) => {
    // TODO: 实现克隆逻辑
    console.log('Clone template:', id);
  };

  const handleCreateCrew = (templateId: string) => {
    router.push(`/crews/create?template=${templateId}`);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!templates) return;

    // Optimistic UI update
    mutate(
      templates.filter((t) => t.id !== id),
      false
    );

    try {
      await workflowTemplateService.deleteTemplate(id);
      // Re-fetch the data to ensure consistency
      mutate();
    } catch (error) {
      console.error('Failed to delete template:', error);
      // Rollback on error
      mutate(templates, false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('workflowTemplates.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('workflowTemplates.description')}
            </p>
          </div>
        </div>
        
        <TemplateList
          templates={templates || []}
          loading={isLoading}
          onCreateTemplate={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
          onCloneTemplate={handleCloneTemplate}
          onCreateCrew={handleCreateCrew}
          onDeleteTemplate={handleDeleteTemplate}
        />
      </div>
    </MainLayout>
  );
}
