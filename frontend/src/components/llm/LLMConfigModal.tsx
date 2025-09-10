import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, TestTube } from 'lucide-react';
import { llmService, LLMConfig, LLMProvider, ConnectionTestResult } from '@/services/llmService';

/**
 * 测试连接状态
 */
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

/**
 * 组件属性接口
 */
interface LLMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: LLMProvider;
  config?: LLMConfig;
  onSave: (config: LLMConfig) => void;
}

/**
 * 提供商配置模板
 */
const PROVIDER_CONFIGS = {
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-3.5-turbo',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
    requiresApiKey: true,
    requiresApiBase: false,
    defaultApiBase: 'https://api.openai.com/v1',
    description: 'OpenAI GPT模型配置'
  },
  deepseek: {
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
    requiresApiKey: true,
    requiresApiBase: false,
    defaultApiBase: 'https://api.deepseek.com/v1',
    description: 'DeepSeek AI模型配置'
  },
  anthropic: {
    name: 'Anthropic',
    defaultModel: 'claude-3-sonnet-20240229',
    models: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    requiresApiKey: true,
    requiresApiBase: false,
    defaultApiBase: 'https://api.anthropic.com',
    description: 'Anthropic Claude模型配置'
  },
  ollama: {
    name: 'Ollama',
    defaultModel: 'llama2',
    models: ['llama2', 'codellama', 'mistral', 'neural-chat'],
    requiresApiKey: false,
    requiresApiBase: true,
    defaultApiBase: 'http://localhost:11434',
    description: 'Ollama本地模型配置'
  },
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-pro',
    models: ['gemini-pro', 'gemini-pro-vision'],
    requiresApiKey: true,
    requiresApiBase: false,
    defaultApiBase: 'https://generativelanguage.googleapis.com/v1',
    description: 'Google Gemini模型配置'
  }
};

/**
 * LLM配置模态框组件
 * 用于配置各种LLM提供商的连接信息
 */
export const LLMConfigModal: React.FC<LLMConfigModalProps> = ({
  isOpen,
  onClose,
  provider,
  config,
  onSave
}) => {
  const [formData, setFormData] = useState<LLMConfig>({
    provider,
    name: '',
    api_key: '',
    api_base: '',
    model: '',
    temperature: 0.7,
    max_tokens: 2048,
    description: '',
    is_active: true
  });

  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const providerConfig = PROVIDER_CONFIGS[provider];

  /**
   * 初始化表单数据
   */
  useEffect(() => {
    if (config) {
      setFormData(config);
    } else {
      setFormData({
        provider,
        name: `${providerConfig.name} 配置`,
        api_key: '',
        api_base: providerConfig.defaultApiBase,
        model: providerConfig.defaultModel,
        temperature: 0.7,
        max_tokens: 2048,
        description: providerConfig.description,
        is_active: true
      });
    }
  }, [config, provider, providerConfig]);

  /**
   * 处理表单字段变化
   */
  const handleFieldChange = (field: keyof LLMConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 测试LLM连接
   */
  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const result = await llmService.testConnection({
        provider: formData.provider,
        name: formData.name,
        api_key: formData.api_key,
        api_base: formData.api_base,
        model: formData.model
      });

      if (result.success) {
        setTestStatus('success');
        setTestMessage('连接测试成功！');
      } else {
        setTestStatus('error');
        setTestMessage(result.message || '连接测试失败');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('网络错误，请检查连接');
    }
  };

  /**
   * 保存配置
   */
  const handleSave = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      return;
    }

    if (providerConfig.requiresApiKey && !formData.api_key?.trim()) {
      return;
    }

    if (providerConfig.requiresApiBase && !formData.api_base?.trim()) {
      return;
    }

    if (!formData.model.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      let result;
      if (config) {
        result = await llmService.updateConfig(formData.provider, formData);
      } else {
        result = await llmService.createConfig(formData);
      }

      onSave(result);
      onClose();
    } catch (error) {
      // 错误处理
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 获取测试状态图标
   */
  const getTestStatusIcon = () => {
    switch (testStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            配置 {providerConfig.name} 模型
          </DialogTitle>
          <DialogDescription>
            {providerConfig.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">配置名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="输入配置名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">模型 *</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => handleFieldChange('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerConfig.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="输入配置描述"
                rows={2}
              />
            </div>
          </div>

          {/* API配置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">API 配置</h3>
            
            {providerConfig.requiresApiKey && (
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => handleFieldChange('api_key', e.target.value)}
                  placeholder="输入API Key"
                />
              </div>
            )}

            {(providerConfig.requiresApiBase || !providerConfig.requiresApiKey) && (
              <div className="space-y-2">
                <Label htmlFor="api_base">
                  API Base URL {providerConfig.requiresApiBase ? '*' : ''}
                </Label>
                <Input
                  id="api_base"
                  value={formData.api_base}
                  onChange={(e) => handleFieldChange('api_base', e.target.value)}
                  placeholder="输入API Base URL"
                />
              </div>
            )}
          </div>

          {/* 模型参数 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">模型参数</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  min="1"
                  max="32768"
                  value={formData.max_tokens}
                  onChange={(e) => handleFieldChange('max_tokens', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* 连接测试 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">连接测试</h3>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="flex items-center gap-2"
              >
                {getTestStatusIcon()}
                {testStatus === 'testing' ? '测试中...' : '测试连接'}
              </Button>
            </div>

            {testMessage && (
              <Alert className={testStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={testStatus === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {testMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? '保存中...' : (config ? '更新配置' : '保存配置')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LLMConfigModal;
