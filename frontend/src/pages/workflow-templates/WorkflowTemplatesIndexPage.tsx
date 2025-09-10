import { useTranslation } from 'next-i18next';
import MainLayout from '@/components/layout/main-layout';
import { TemplateList } from '@/components/workflow-templates/TemplateList';

/**
 * 工作流模板列表页面组件
 * 显示所有可用的工作流模板
 */
export default function WorkflowTemplatesIndexPage() {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('workflowTemplates.title', '工作流模板')}
            </h1>
            <p className="text-muted-foreground">
              {t('workflowTemplates.description', '设计和管理可复用的工作流蓝图')}
            </p>
          </div>
        </div>
        
        <TemplateList />
      </div>
    </MainLayout>
  );
}