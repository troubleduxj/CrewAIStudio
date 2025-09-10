import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/main-layout';
import { VisualEditor } from '@/components/workflow-templates/VisualEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * 创建工作流模板页面组件
 * 提供可视化编辑器用于创建新的工作流模板
 */
export default function WorkflowTemplatesCreatePage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const handleCancel = () => {
    router.push('/workflow-templates');
  };

  const handleSave = (template: any) => {
    // TODO: 实现保存逻辑
    console.log('Saving template:', template);
    router.push('/workflow-templates');
  };

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
                创建工作流模板
              </h1>
              <p className="text-muted-foreground">
                使用可视化编辑器设计您的工作流蓝图
              </p>
            </div>
          </div>
        </div>
        
        <VisualEditor
          template={null}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </MainLayout>
  );
}