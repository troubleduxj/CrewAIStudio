import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Users,
  Activity,
  Settings,
  FileText,
  Zap,
} from 'lucide-react';
import { CrewWizardProps, CreateCrewRequest, AgentConfig } from '@/types/crew';
import { WorkflowTemplate, AgentDefinition } from '@/types/workflow';
import { StatusProgress } from '@/components/shared/StatusIndicator';
import { LoadingSpinner } from '@/components/shared/LoadingStates';
import { AgentConfigForm } from './AgentConfigForm';
import { cn } from '@/lib/utils';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'current' | 'completed';
}

interface CrewWizardState {
  currentStep: number;
  selectedTemplate: WorkflowTemplate | null;
  crewName: string;
  crewDescription: string;
  agentsConfig: AgentConfig[];
  errors: Record<string, string>;
  isValid: boolean;
}

// 模拟可用的 LLM 模型
const AVAILABLE_LLMS = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'gemini-pro',
];

// 模拟可用的工具
const AVAILABLE_TOOLS = [
  { toolId: 'web-search', toolName: 'Web Search', enabled: true, config: {} },
  { toolId: 'file-reader', toolName: 'File Reader', enabled: true, config: {} },
  { toolId: 'calculator', toolName: 'Calculator', enabled: true, config: {} },
  { toolId: 'email-sender', toolName: 'Email Sender', enabled: false, config: {} },
];

export function CrewWizard({
  open,
  onClose,
  onComplete,
  initialData,
  mode = 'create',
  loading: externalLoading = false,
}: CrewWizardProps) {
  const { t } = useTranslation();

  // 模拟工作流模板数据
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const [state, setState] = useState<CrewWizardState>({
    currentStep: 0,
    selectedTemplate: null,
    crewName: initialData?.name || '',
    crewDescription: initialData?.description || '',
    agentsConfig: initialData?.agentsConfig || [],
    errors: {},
    isValid: false,
  });

  const steps: WizardStep[] = mode === 'edit' ? [
    {
      id: 'agents',
      title: t('crews.wizard.configureAgents'),
      description: t('crews.wizard.configureAgentsDescription'),
      icon: Users,
      status: state.currentStep === 0 ? 'current' : state.currentStep > 0 ? 'completed' : 'pending',
    },
    {
      id: 'details',
      title: t('crews.wizard.crewDetails'),
      description: t('crews.wizard.crewDetailsDescription'),
      icon: Settings,
      status: state.currentStep === 1 ? 'current' : state.currentStep > 1 ? 'completed' : 'pending',
    },
  ] : [
    {
      id: 'template',
      title: t('crews.wizard.selectTemplate'),
      description: t('crews.wizard.selectTemplateDescription'),
      icon: FileText,
      status: state.currentStep === 0 ? 'current' : state.currentStep > 0 ? 'completed' : 'pending',
    },
    {
      id: 'agents',
      title: t('crews.wizard.configureAgents'),
      description: t('crews.wizard.configureAgentsDescription'),
      icon: Users,
      status: state.currentStep === 1 ? 'current' : state.currentStep > 1 ? 'completed' : 'pending',
    },
    {
      id: 'details',
      title: t('crews.wizard.crewDetails'),
      description: t('crews.wizard.crewDetailsDescription'),
      icon: Settings,
      status: state.currentStep === 2 ? 'current' : state.currentStep > 2 ? 'completed' : 'pending',
    },
  ];

  // 模拟获取模板数据
  useEffect(() => {
    if (open) {
      setLoading(true);
      // 模拟 API 调用
      setTimeout(() => {
        const mockTemplates: WorkflowTemplate[] = [
          {
            id: '1',
            name: 'Content Creation Workflow',
            description: 'A workflow for creating and reviewing content with multiple agents',
            definition: {
              agents: [
                {
                  id: 'writer',
                  name: 'Content Writer',
                  role: 'Writer',
                  goal: 'Create engaging content',
                  backstory: 'Expert content creator with years of experience',
                  position: { x: 0, y: 0 },
                  requiredTools: ['web-search', 'file-reader'],
                },
                {
                  id: 'reviewer',
                  name: 'Content Reviewer',
                  role: 'Reviewer',
                  goal: 'Review and improve content quality',
                  backstory: 'Experienced editor and content strategist',
                  position: { x: 200, y: 0 },
                  requiredTools: ['file-reader'],
                },
              ],
              tasks: [],
              connections: [],
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 5,
          },
          {
            id: '2',
            name: 'Research & Analysis',
            description: 'Research workflow with data analysis capabilities',
            definition: {
              agents: [
                {
                  id: 'researcher',
                  name: 'Research Agent',
                  role: 'Researcher',
                  goal: 'Conduct thorough research',
                  backstory: 'Academic researcher with expertise in data gathering',
                  position: { x: 0, y: 0 },
                  requiredTools: ['web-search', 'calculator'],
                },
              ],
              tasks: [],
              connections: [],
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 3,
          },
        ];
        setTemplates(mockTemplates);
        
        // 如果是编辑模式且有初始数据，自动选择对应的模板
        if (mode === 'edit' && initialData?.workflowTemplateId) {
          const selectedTemplate = mockTemplates.find(t => t.id === initialData.workflowTemplateId);
          if (selectedTemplate) {
            setState(prev => ({ 
              ...prev, 
              selectedTemplate,
              currentStep: 0 // 编辑模式从Agent配置开始
            }));
          }
        }
        
        setLoading(false);
      }, 1000);
    }
  }, [open, mode, initialData]);

  // 重置状态
  const resetState = () => {
    setState({
      currentStep: 0,
      selectedTemplate: null,
      crewName: initialData?.name || '',
      crewDescription: initialData?.description || '',
      agentsConfig: initialData?.agentsConfig || [],
      errors: {},
      isValid: false,
    });
  };

  // 处理关闭
  const handleClose = () => {
    resetState();
    onClose();
  };

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (mode === 'edit') {
      switch (state.currentStep) {
        case 0: // Agent 配置 (编辑模式)
          if (state.agentsConfig.length === 0) {
            errors.agents = t('crews.wizard.errors.agentsRequired');
          } else {
            state.agentsConfig.forEach((config, index) => {
              if (!config.llmModel) {
                errors[`agent_${index}_llm`] = t('crews.wizard.errors.llmRequired');
              }
            });
          }
          break;

        case 1: // Crew 详情 (编辑模式)
          if (!state.crewName.trim()) {
            errors.crewName = t('crews.wizard.errors.nameRequired');
          } else if (state.crewName.length > 100) {
            errors.crewName = t('crews.wizard.errors.nameTooLong');
          }
          break;
      }
    } else {
      switch (state.currentStep) {
        case 0: // 模板选择 (创建模式)
          if (!state.selectedTemplate) {
            errors.template = t('crews.wizard.errors.templateRequired');
          }
          break;

        case 1: // Agent 配置 (创建模式)
          if (state.agentsConfig.length === 0) {
            errors.agents = t('crews.wizard.errors.agentsRequired');
          } else {
            state.agentsConfig.forEach((config, index) => {
              if (!config.llmModel) {
                errors[`agent_${index}_llm`] = t('crews.wizard.errors.llmRequired');
              }
            });
          }
          break;

        case 2: // Crew 详情 (创建模式)
          if (!state.crewName.trim()) {
            errors.crewName = t('crews.wizard.errors.nameRequired');
          } else if (state.crewName.length > 100) {
            errors.crewName = t('crews.wizard.errors.nameTooLong');
          }
          break;
      }
    }

    setState(prev => ({ ...prev, errors, isValid: Object.keys(errors).length === 0 }));
    return Object.keys(errors).length === 0;
  };

  // 下一步
  const handleNext = () => {
    if (validateCurrentStep()) {
      if (mode === 'create' && state.currentStep === 0 && state.selectedTemplate) {
        // 初始化 Agent 配置 (仅在创建模式)
        const agentsConfig: AgentConfig[] = state.selectedTemplate.definition.agents.map(agent => ({
          agentId: agent.id,
          agentName: agent.name,
          llmModel: '',
          temperature: 0.7,
          maxTokens: 2000,
          tools: AVAILABLE_TOOLS.filter(tool => 
            agent.requiredTools.includes(tool.toolId)
          ),
          apiKeys: {},
        }));
        setState(prev => ({ ...prev, agentsConfig, currentStep: prev.currentStep + 1 }));
      } else {
        setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      }
    }
  };

  // 上一步
  const handlePrevious = () => {
    setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  };

  // 完成创建/编辑
  const handleComplete = () => {
    if (validateCurrentStep() && state.selectedTemplate) {
      if (mode === 'edit') {
        const updateData: UpdateCrewRequest = {
          name: state.crewName,
          description: state.crewDescription,
          agentsConfig: state.agentsConfig,
        };
        onComplete(updateData);
      } else {
        const crewData: CreateCrewRequest = {
          name: state.crewName,
          description: state.crewDescription,
          workflowTemplateId: state.selectedTemplate.id,
          agentsConfig: state.agentsConfig,
        };
        onComplete(crewData);
      }
      handleClose();
    }
  };

  // 选择模板
  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
  };

  // 更新 Agent 配置
  const handleAgentConfigChange = (index: number, config: AgentConfig) => {
    setState(prev => ({
      ...prev,
      agentsConfig: prev.agentsConfig.map((item, i) => i === index ? config : item),
    }));
  };

  const currentStepData = steps[state.currentStep];
  const progress = ((state.currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {mode === 'edit' ? t('crews.wizard.editTitle') : t('crews.wizard.title')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? t('crews.wizard.editDescription') : t('crews.wizard.description')}
          </DialogDescription>
        </DialogHeader>

        {/* 进度指示器 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('crews.wizard.step')} {state.currentStep + 1} {t('crews.wizard.of')} {steps.length}
            </span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* 步骤导航 */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === state.currentStep;
              const isCompleted = index < state.currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-green-500 bg-green-500 text-white",
                    !isActive && !isCompleted && "border-muted bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-green-600",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 步骤内容 */}
        <div className="flex-1 overflow-auto">
          {state.currentStep === 0 && mode === 'create' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
                <p className="text-muted-foreground mb-4">{currentStepData.description}</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner text={t('crews.wizard.loadingTemplates')} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        state.selectedTemplate?.id === template.id && "ring-2 ring-primary border-primary"
                      )}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{template.definition.agents.length} {t('common.agents')}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {template.usageCount} {t('workflowTemplates.usages')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {state.errors.template && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.errors.template}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {((mode === 'create' && state.currentStep === 1) || (mode === 'edit' && state.currentStep === 0)) && state.selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
                <p className="text-muted-foreground mb-4">{currentStepData.description}</p>
              </div>

              <div className="space-y-6">
                {state.selectedTemplate.definition.agents.map((agentDef, index) => {
                  const config = state.agentsConfig[index];
                  if (!config) return null;

                  return (
                    <AgentConfigForm
                      key={agentDef.id}
                      agentDefinition={agentDef}
                      config={config}
                      onChange={(newConfig) => handleAgentConfigChange(index, newConfig)}
                      availableLLMs={AVAILABLE_LLMS}
                      availableTools={AVAILABLE_TOOLS}
                    />
                  );
                })}
              </div>

              {state.errors.agents && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.errors.agents}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {((mode === 'create' && state.currentStep === 2) || (mode === 'edit' && state.currentStep === 1)) && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
                <p className="text-muted-foreground mb-4">{currentStepData.description}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="crewName">{t('crews.wizard.crewName')}</Label>
                  <Input
                    id="crewName"
                    value={state.crewName}
                    onChange={(e) => setState(prev => ({ ...prev, crewName: e.target.value }))}
                    placeholder={t('crews.wizard.crewNamePlaceholder')}
                    className={state.errors.crewName ? 'border-destructive' : ''}
                  />
                  {state.errors.crewName && (
                    <p className="text-sm text-destructive">{state.errors.crewName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crewDescription">{t('crews.wizard.crewDescription')}</Label>
                  <Textarea
                    id="crewDescription"
                    value={state.crewDescription}
                    onChange={(e) => setState(prev => ({ ...prev, crewDescription: e.target.value }))}
                    placeholder={t('crews.wizard.crewDescriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                {/* 配置摘要 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('crews.wizard.configurationSummary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">{t('crews.wizard.selectedTemplate')}</p>
                      <p className="text-sm text-muted-foreground">{state.selectedTemplate?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('crews.wizard.configuredAgents')}</p>
                      <div className="space-y-1">
                        {state.agentsConfig.map((config) => (
                          <div key={config.agentId} className="text-sm text-muted-foreground">
                            {config.agentName} - {config.llmModel}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={state.currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('common.previous')}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            
            {state.currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!state.isValid}>
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={!state.isValid || externalLoading}>
                {externalLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {mode === 'edit' ? t('crews.wizard.updateCrew') : t('crews.wizard.createCrew')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}