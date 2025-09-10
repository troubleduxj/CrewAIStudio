import { createLazyPage } from '../shared/LazyPageWrapper';

// 懒加载工作流模板页面
export const LazyWorkflowTemplatesIndexPage = createLazyPage(
  () => import('../../pages/workflow-templates/WorkflowTemplatesIndexPage')
);

export const LazyWorkflowTemplatesCreatePage = createLazyPage(
  () => import('../../pages/workflow-templates/WorkflowTemplatesCreatePage')
);

export const LazyWorkflowTemplatesEditPage = createLazyPage(
  () => import('../../pages/workflow-templates/WorkflowTemplatesEditPage')
);