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
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  Settings,
  Clock,
  AlertTriangle,
  Info,
  Zap,
  Users,
  FileText,
  Variable,
  Timer,
  Flag,
} from 'lucide-react';
import { ExecutionDialogProps, ExecutionInput, ExecutionPriority } from '@/types/crew';
import { StatusIndicator } from '@/components/shared/StatusIndicator';
import { cn } from '@/lib/utils';

interface ExecutionVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  value: any;
  description?: string;
  required: boolean;
}

export function ExecutionDialog({
  crew,
  open,
  onClose,
  onExecute,
}: ExecutionDialogProps) {
  const { t } = useTranslation();

  // 执行参数状态
  const [variables, setVariables] = useState<ExecutionVariable[]>([]);
  const [priority, setPriority] = useState<ExecutionPriority>('MEDIUM');
  const [timeout, setTimeout] = useState<number>(3600); // 默认1小时
  const [customTimeout, setCustomTimeout] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化变量（模拟从工作流模板中提取）
  useEffect(() => {
    if (open && crew) {
      // 模拟从工作流模板定义中提取变量
      const mockVariables: ExecutionVariable[] = [
        {
          name: 'topic',
          type: 'string',
          value: '',
          description: t('crews.execution.variables.topic.description'),
          required: true,
        },
        {
          name: 'target_audience',
          type: 'string',
          value: '',
          description: t('crews.execution.variables.targetAudience.description'),
          required: false,
        },
        {
          name: 'word_count',
          type: 'number',
          value: 1000,
          description: t('crews.execution.variables.wordCount.description'),
          required: false,
        },
        {
          name: 'include_images',
          type: 'boolean',
          value: true,
          description: t('crews.execution.variables.includeImages.description'),
          required: false,
        },
      ];
      setVariables(mockVariables);
      setErrors({});
    }
  }, [open, crew, t]);

  // 重置状态
  const resetState = () => {
    setVariables([]);
    setPriority('MEDIUM');
    setTimeout(3600);
    setCustomTimeout(false);
    setErrors({});
    setIsSubmitting(false);
  };

  // 处理关闭
  const handleClose = () => {
    resetState();
    onClose();
  };

  // 更新变量值
  const updateVariable = (index: number, value: any) => {
    setVariables(prev => prev.map((variable, i) => 
      i === index ? { ...variable, value } : variable
    ));
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 验证必需变量
    variables.forEach((variable, index) => {
      if (variable.required && (!variable.value || variable.value === '')) {
        newErrors[`variable_${index}`] = t('crews.execution.errors.variableRequired', {
          name: variable.name
        });
      }

      // 验证数字类型
      if (variable.type === 'number' && variable.value !== '' && isNaN(Number(variable.value))) {
        newErrors[`variable_${index}`] = t('crews.execution.errors.invalidNumber');
      }

      // 验证 JSON 类型
      if (variable.type === 'json' && variable.value) {
        try {
          JSON.parse(variable.value);
        } catch {
          newErrors[`variable_${index}`] = t('crews.execution.errors.invalidJson');
        }
      }
    });

    // 验证超时时间
    if (customTimeout && (timeout < 60 || timeout > 86400)) {
      newErrors.timeout = t('crews.execution.errors.invalidTimeout');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理执行
  const handleExecute = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 构建变量对象
      const variablesObj: Record<string, any> = {};
      variables.forEach(variable => {
        if (variable.value !== '' && variable.value !== null) {
          let value = variable.value;
          
          // 类型转换
          switch (variable.type) {
            case 'number':
              value = Number(value);
              break;
            case 'boolean':
              value = Boolean(value);
              break;
            case 'json':
              try {
                value = JSON.parse(value);
              } catch {
                value = variable.value;
              }
              break;
          }
          
          variablesObj[variable.name] = value;
        }
      });

      const executionInput: ExecutionInput = {
        variables: variablesObj,
        priority,
        timeout: customTimeout ? timeout : undefined,
      };

      await onExecute(executionInput);
      handleClose();
    } catch (error) {
      console.error('Execution failed:', error);
      setErrors({
        general: error instanceof Error ? error.message : t('crews.execution.errors.executionFailed')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (p: ExecutionPriority) => {
    switch (p) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // 获取优先级描述
  const getPriorityDescription = (p: ExecutionPriority) => {
    switch (p) {
      case 'HIGH': return t('crews.execution.priority.high.description');
      case 'MEDIUM': return t('crews.execution.priority.medium.description');
      case 'LOW': return t('crews.execution.priority.low.description');
      default: return '';
    }
  };

  // 格式化超时时间
  const formatTimeout = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}${t('common.hours')}${minutes > 0 ? ` ${minutes}${t('common.minutes')}` : ''}`;
    }
    return `${minutes}${t('common.minutes')}`;
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              {t('crews.execution.title')}
            </DialogTitle>
            <DialogDescription>
              {t('crews.execution.description', { crewName: crew.name })}
            </DialogDescription>
          </DialogHeader>

          {/* Crew 信息卡片 */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{crew.name}</CardTitle>
                  <CardDescription>{crew.description}</CardDescription>
                </div>
                <StatusIndicator status={crew.status} variant="badge" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{crew.agentsConfig.length} {t('common.agents')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{crew.workflowTemplateName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>{crew.successRate.toFixed(1)}% {t('crews.successRate')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 overflow-auto">
            <Tabs defaultValue="variables" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="variables" className="flex items-center gap-2">
                  <Variable className="h-4 w-4" />
                  {t('crews.execution.variables.title')}
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('crews.execution.settings.title')}
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('crews.execution.preview.title')}
                </TabsTrigger>
              </TabsList>

              {/* 变量配置 */}
              <TabsContent value="variables" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t('crews.execution.variables.title')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t('crews.execution.variables.description')}
                  </p>
                </div>

                {variables.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {t('crews.execution.variables.noVariables')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {variables.map((variable, index) => (
                      <Card key={variable.name}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`var-${index}`} className="font-medium">
                                  {variable.name}
                                </Label>
                                {variable.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t('common.required')}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {variable.type}
                                </Badge>
                              </div>
                            </div>

                            {variable.description && (
                              <p className="text-sm text-muted-foreground">
                                {variable.description}
                              </p>
                            )}

                            <div className="space-y-2">
                              {variable.type === 'string' && (
                                <Input
                                  id={`var-${index}`}
                                  value={variable.value}
                                  onChange={(e) => updateVariable(index, e.target.value)}
                                  placeholder={t('crews.execution.variables.enterValue')}
                                  className={errors[`variable_${index}`] ? 'border-destructive' : ''}
                                />
                              )}

                              {variable.type === 'number' && (
                                <Input
                                  id={`var-${index}`}
                                  type="number"
                                  value={variable.value}
                                  onChange={(e) => updateVariable(index, e.target.value)}
                                  placeholder={t('crews.execution.variables.enterNumber')}
                                  className={errors[`variable_${index}`] ? 'border-destructive' : ''}
                                />
                              )}

                              {variable.type === 'boolean' && (
                                <Select
                                  value={variable.value.toString()}
                                  onValueChange={(value) => updateVariable(index, value === 'true')}
                                >
                                  <SelectTrigger id={`var-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">{t('common.yes')}</SelectItem>
                                    <SelectItem value="false">{t('common.no')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}

                              {variable.type === 'json' && (
                                <Textarea
                                  id={`var-${index}`}
                                  value={typeof variable.value === 'string' ? variable.value : JSON.stringify(variable.value, null, 2)}
                                  onChange={(e) => updateVariable(index, e.target.value)}
                                  placeholder={t('crews.execution.variables.enterJson')}
                                  rows={4}
                                  className={cn(
                                    "font-mono text-sm",
                                    errors[`variable_${index}`] && 'border-destructive'
                                  )}
                                />
                              )}

                              {errors[`variable_${index}`] && (
                                <p className="text-sm text-destructive">
                                  {errors[`variable_${index}`]}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 执行设置 */}
              <TabsContent value="settings" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t('crews.execution.settings.title')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t('crews.execution.settings.description')}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* 优先级设置 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        {t('crews.execution.priority.title')}
                      </CardTitle>
                      <CardDescription>
                        {t('crews.execution.priority.description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={priority} onValueChange={(value: ExecutionPriority) => setPriority(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HIGH">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              <span>{t('crews.execution.priority.high.label')}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                              <span>{t('crews.execution.priority.medium.label')}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="LOW">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span>{t('crews.execution.priority.low.label')}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className={cn("text-sm mt-2", getPriorityColor(priority))}>
                        {getPriorityDescription(priority)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 超时设置 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        {t('crews.execution.timeout.title')}
                      </CardTitle>
                      <CardDescription>
                        {t('crews.execution.timeout.description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="custom-timeout"
                          checked={customTimeout}
                          onChange={(e) => setCustomTimeout(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="custom-timeout">
                          {t('crews.execution.timeout.customTimeout')}
                        </Label>
                      </div>

                      {customTimeout && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>{t('crews.execution.timeout.timeoutValue')}</Label>
                            <Slider
                              min={60}
                              max={86400}
                              step={60}
                              value={[timeout]}
                              onValueChange={([value]) => setTimeout(value)}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>1{t('common.minute')}</span>
                              <span className="font-medium">{formatTimeout(timeout)}</span>
                              <span>24{t('common.hours')}</span>
                            </div>
                          </div>
                          {errors.timeout && (
                            <p className="text-sm text-destructive">{errors.timeout}</p>
                          )}
                        </div>
                      )}

                      {!customTimeout && (
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            {t('crews.execution.timeout.defaultTimeout')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* 执行预览 */}
              <TabsContent value="preview" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t('crews.execution.preview.title')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t('crews.execution.preview.description')}
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('crews.execution.preview.summary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('crews.execution.crew')}:</span>
                        <span className="ml-2 font-medium">{crew.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('crews.execution.priority.title')}:</span>
                        <span className={cn("ml-2 font-medium", getPriorityColor(priority))}>
                          {t(`crews.execution.priority.${priority.toLowerCase()}.label`)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('crews.execution.timeout.title')}:</span>
                        <span className="ml-2 font-medium">
                          {customTimeout ? formatTimeout(timeout) : t('crews.execution.timeout.default')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('crews.execution.variables.count')}:</span>
                        <span className="ml-2 font-medium">
                          {variables.filter(v => v.value !== '' && v.value !== null).length}
                        </span>
                      </div>
                    </div>

                    {variables.filter(v => v.value !== '' && v.value !== null).length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">{t('crews.execution.variables.configured')}</h5>
                        <div className="space-y-2">
                          {variables
                            .filter(v => v.value !== '' && v.value !== null)
                            .map((variable) => (
                              <div key={variable.name} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                <span className="font-medium text-sm">{variable.name}</span>
                                <span className="text-sm text-muted-foreground truncate max-w-xs">
                                  {variable.type === 'json' 
                                    ? '[JSON Object]' 
                                    : String(variable.value)
                                  }
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 警告信息 */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t('crews.execution.preview.warning')}
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>

          {/* 通用错误信息 */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {t('crews.execution.estimatedTime')}: ~5 {t('common.minutes')}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleExecute} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('crews.execution.starting')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('crews.execution.startExecution')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}