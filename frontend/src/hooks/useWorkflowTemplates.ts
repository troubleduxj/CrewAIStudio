import useSWR from 'swr';
import { workflowTemplateService } from '@/services/workflowTemplateService';
import { WorkflowTemplate } from '@/types/workflow';

export function useWorkflowTemplates() {
  const { data, error, isLoading, mutate } = useSWR<WorkflowTemplate[]>('/workflow-templates', () =>
    workflowTemplateService.getTemplates()
  );

  return {
    templates: data,
    error,
    isLoading,
    mutate,
  };
}
