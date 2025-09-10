import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  Key,
  Zap,
  Brain,
  Thermometer,
  Hash,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AgentConfigFormProps, AgentConfig, ToolConfig } from '@/types/crew';
import { cn } from '@/lib/utils';

export function AgentConfigForm({
  agentDefinition,
  config,
  onChange,
  availableLLMs,
  availableTools,
}: AgentConfigFormProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // 更新配置
  const updateConfig = (updates: Partial<AgentConfig>) => {
    onChange({ ...config, ...updates });
  };

  // 更新工具配置
  const updateToolConfig = (toolId: string, updates: Partial<ToolConfig>) => {
    const updatedTools = config.tools.map(tool =>
      tool.toolId === toolId ? { ...tool, ...updates } : tool
    );
    updateConfig({ tools: updatedTools });
  };

  // 更新 API Key
  const updateApiKey = (key: string, value: string) => {
    updateConfig({
      apiKeys: { ...config.apiKeys, [key]: value }
    });
  };

  // 获取 LLM 显示名称
  const getLLMDisplayName = (model: string) => {
    const displayNames: Record<string, string> = {
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-3-opus': 'Claude 3 Opus',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'gemini-pro': 'Gemini Pro',
    };
    return displayNames[model] || model;
  };

  // 获取温度描述
  const getTemperatureDescription = (temp: number) => {
    if (temp <= 0.3) return t('crews.agent.temperature.conservative');
    if (temp <= 0.7) return t('crews.agent.temperature.balanced');
    return t('crews.agent.temperature.creative');
  };

  // 获取需要 API Key 的工具
  const toolsNeedingApiKeys = config.tools.filter(tool => 
    ['web-search', 'email-sender'].includes(tool.toolId) && tool.enabled
  );

  return (
    <TooltipProvider>
      <Card className="w-full">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agentDefinition.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {agentDefinition.role}
                      </Badge>
                      {config.llmModel && (
                        <Badge variant="secondary" className="text-xs">
                          {getLLMDisplayName(config.llmModel)}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!config.llmModel && (
                    <Badge variant="destructive" className="text-xs">
                      {t('crews.agent.configurationRequired')}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Agent 信息预览 */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{t('crews.agent.agentInfo')}</h4>
                  <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        {t('crews.agent.viewDetails')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{agentDefinition.name}</DialogTitle>
                        <DialogDescription>{agentDefinition.role}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">{t('crews.agent.goal')}</h5>
                          <p className="text-sm text-muted-foreground">{agentDefinition.goal}</p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">{t('crews.agent.backstory')}</h5>
                          <p className="text-sm text-muted-foreground">{agentDefinition.backstory}</p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">{t('crews.agent.requiredTools')}</h5>
                          <div className="flex flex-wrap gap-2">
                            {agentDefinition.requiredTools.map(toolId => (
                              <Badge key={toolId} variant="outline" className="text-xs">
                                {availableTools.find(t => t.toolId === toolId)?.toolName || toolId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {agentDefinition.goal}
                </p>
              </div>

              {/* LLM 配置 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <h4 className="font-medium">{t('crews.agent.llmConfiguration')}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LLM 模型选择 */}
                  <div className="space-y-2">
                    <Label htmlFor={`llm-${config.agentId}`}>
                      {t('crews.agent.llmModel')} *
                    </Label>
                    <Select
                      value={config.llmModel}
                      onValueChange={(value) => updateConfig({ llmModel: value })}
                    >
                      <SelectTrigger id={`llm-${config.agentId}`}>
                        <SelectValue placeholder={t('crews.agent.selectLLM')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLLMs.map((model) => (
                          <SelectItem key={model} value={model}>
                            {getLLMDisplayName(model)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 最大 Token 数 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`tokens-${config.agentId}`}>
                        {t('crews.agent.maxTokens')}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            {t('crews.agent.maxTokensTooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <Slider
                        id={`tokens-${config.agentId}`}
                        min={100}
                        max={8000}
                        step={100}
                        value={[config.maxTokens]}
                        onValueChange={([value]) => updateConfig({ maxTokens: value })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>100</span>
                        <span className="font-medium">{config.maxTokens}</span>
                        <span>8000</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 温度设置 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    <Label htmlFor={`temp-${config.agentId}`}>
                      {t('crews.agent.temperature')}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          {t('crews.agent.temperatureTooltip')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    <Slider
                      id={`temp-${config.agentId}`}
                      min={0}
                      max={2}
                      step={0.1}
                      value={[config.temperature]}
                      onValueChange={([value]) => updateConfig({ temperature: value })}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">0.0</span>
                      <div className="text-center">
                        <div className="font-medium">{config.temperature.toFixed(1)}</div>
                        <div className="text-muted-foreground">
                          {getTemperatureDescription(config.temperature)}
                        </div>
                      </div>
                      <span className="text-muted-foreground">2.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 工具配置 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <h4 className="font-medium">{t('crews.agent.toolsConfiguration')}</h4>
                </div>

                <div className="space-y-3">
                  {config.tools.map((tool) => (
                    <div
                      key={tool.toolId}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-lg transition-colors",
                        tool.enabled ? "bg-green-50 border-green-200" : "bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={(enabled) => 
                            updateToolConfig(tool.toolId, { enabled })
                          }
                        />
                        <div>
                          <p className="font-medium text-sm">{tool.toolName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t(`crews.tools.${tool.toolId}.description`)}
                          </p>
                        </div>
                      </div>
                      {agentDefinition.requiredTools.includes(tool.toolId) && (
                        <Badge variant="secondary" className="text-xs">
                          {t('crews.agent.required')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* API Keys 配置 */}
              {toolsNeedingApiKeys.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <h4 className="font-medium">{t('crews.agent.apiKeysConfiguration')}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKeys(!showApiKeys)}
                    >
                      {showApiKeys ? (
                        <EyeOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      {showApiKeys ? t('common.hide') : t('common.show')}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {toolsNeedingApiKeys.map((tool) => (
                      <div key={tool.toolId} className="space-y-2">
                        <Label htmlFor={`api-${tool.toolId}-${config.agentId}`}>
                          {tool.toolName} API Key
                        </Label>
                        <Input
                          id={`api-${tool.toolId}-${config.agentId}`}
                          type={showApiKeys ? "text" : "password"}
                          value={config.apiKeys[tool.toolId] || ''}
                          onChange={(e) => updateApiKey(tool.toolId, e.target.value)}
                          placeholder={t('crews.agent.enterApiKey')}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">{t('crews.agent.apiKeyNotice')}</p>
                        <p>{t('crews.agent.apiKeyNoticeDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 配置预览 */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h5 className="font-medium text-sm mb-3">{t('crews.agent.configurationPreview')}</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('crews.agent.model')}:</span>
                    <span className="ml-2 font-medium">
                      {config.llmModel ? getLLMDisplayName(config.llmModel) : t('common.notSet')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('crews.agent.temperature')}:</span>
                    <span className="ml-2 font-medium">{config.temperature}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('crews.agent.maxTokens')}:</span>
                    <span className="ml-2 font-medium">{config.maxTokens}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('crews.agent.enabledTools')}:</span>
                    <span className="ml-2 font-medium">
                      {config.tools.filter(t => t.enabled).length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}