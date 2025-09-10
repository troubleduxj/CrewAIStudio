"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Brain, Plus, Settings, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LLMConfigModal } from '@/components/llm/LLMConfigModal';
import { llmService, LLMConfig, LLMProvider, LLMStatus, LLMConnectionStats } from '@/services/llmService';

/**
 * LLM连接页面组件
 * 用于管理和配置LLM模型连接
 * @returns LLM连接页面JSX元素
 */
export default function LLMConnections() {
  // 状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<Record<LLMProvider, LLMStatus>>({} as any);
  const [stats, setStats] = useState<LLMConnectionStats>({ total_connections: 0, today_calls: 0 });
  
  const [configModal, setConfigModal] = useState<{
    isOpen: boolean;
    provider: 'openai' | 'deepseek' | 'anthropic' | 'ollama' | 'gemini' | null;
    config?: any;
  }>({ isOpen: false, provider: null });

  /**
   * 获取提供商的配置信息
   * @param provider 提供商名称
   * @returns 配置信息
   */
  const getProviderConfig = (provider: LLMProvider) => {
    return configs.find(config => config.provider === provider);
  };

  /**
   * 获取提供商的连接状态
   * @param provider 提供商名称
   * @returns 连接状态
   */
  const getProviderStatus = (provider: LLMProvider) => {
    return connectionStatus[provider] || {
      provider,
      is_connected: false,
      error_message: '未配置'
    };
  };

  /**
   * 渲染连接状态徽章
   * @param provider 提供商名称
   * @returns 状态徽章组件
   */
  const renderStatusBadge = (provider: LLMProvider) => {
    const status = getProviderStatus(provider);
    
    if (isLoading) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          检查中
        </Badge>
      );
    }
    
    if (status.is_connected) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          已连接
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertCircle className="mr-1 h-3 w-3" />
          {status.error_message || '连接失败'}
        </Badge>
      );
    }
  };

  // 数据获取
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [configsData, statusData, statsData] = await Promise.all([
          llmService.getConfigs(),
          llmService.getAllConnectionStatus(),
          llmService.getLLMConnectionStats(),
        ]);
        setConfigs(configsData);
        setConnectionStatus(statusData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load LLM data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
   }, []);

  // 计算派生状态
  const { activeConnections, errorConnections } = useMemo(() => {
    const statuses = Object.values(connectionStatus);
    return {
      activeConnections: statuses.filter(s => s.is_connected).length,
      errorConnections: statuses.filter(s => !s.is_connected).length,
    };
  }, [connectionStatus]);

  /**
   * 打开配置模态框
   */
  const openConfigModal = (provider: 'openai' | 'deepseek' | 'anthropic' | 'ollama' | 'gemini', config?: any) => {
    setConfigModal({ isOpen: true, provider, config });
  };

  /**
   * 关闭配置模态框
   */
  const closeConfigModal = () => {
    setConfigModal({ isOpen: false, provider: null });
  };

  /**
   * 保存配置
   */
  const handleSaveConfig = async (savedConfig: LLMConfig) => {
    console.log('保存配置:', savedConfig);

    // 重新加载所有配置以获取最新状态
    try {
      const [configsData, statusData] = await Promise.all([
        llmService.getConfigs(),
        llmService.getAllConnectionStatus()
      ]);
      setConfigs(configsData);
      setConnectionStatus(statusData);
      // 强制刷新页面以确保状态同步
      window.location.reload();
    } catch (error) {
      console.error('Failed to reload LLM data after save:', error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">LLM Connections</h1>
            <p className="text-muted-foreground">
              管理和配置大语言模型连接
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            添加连接
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                活跃连接
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeConnections}</div>
              <p className="text-xs text-muted-foreground">
                正常运行中
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                总连接数
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_connections}</div>
              <p className="text-xs text-muted-foreground">
                已配置连接
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今日调用
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today_calls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                24小时内调用总数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                错误连接
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorConnections}</div>
              <p className="text-xs text-muted-foreground">
                需要检查
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI GPT-4</CardTitle>
              <CardDescription>
                OpenAI官方API连接
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                {renderStatusBadge('openai')}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openConfigModal('openai', getProviderConfig('openai'))}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>{getProviderConfig('openai')?.model || '未配置'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">延迟:</span>
                  <span>245ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>847</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Claude 3.5 Sonnet</CardTitle>
              <CardDescription>
                Anthropic Claude API连接
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                {renderStatusBadge('anthropic')}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openConfigModal('anthropic', getProviderConfig('anthropic'))}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>{getProviderConfig('anthropic')?.model || '未配置'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <span className={getProviderStatus('anthropic').is_connected ? 'text-green-600' : 'text-red-600'}>
                    {getProviderStatus('anthropic').is_connected ? '正常运行' : '连接失败'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>400</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>本地模型</CardTitle>
              <CardDescription>
                本地部署的开源模型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                {renderStatusBadge('ollama')}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openConfigModal('ollama', getProviderConfig('ollama'))}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>{getProviderConfig('ollama')?.model || '未配置'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <span className={getProviderStatus('ollama').is_connected ? 'text-green-600' : 'text-red-600'}>
                    {getProviderStatus('ollama').is_connected ? '正常运行' : '服务未启动'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DeepSeek</CardTitle>
              <CardDescription>
                DeepSeek AI 大语言模型服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                {renderStatusBadge('deepseek')}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openConfigModal('deepseek', getProviderConfig('deepseek'))}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>{getProviderConfig('deepseek')?.model || '未配置'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <span className={getProviderStatus('deepseek').is_connected ? 'text-green-600' : 'text-red-600'}>
                    {getProviderStatus('deepseek').is_connected ? '正常运行' : '连接失败'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>45</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Gemini</CardTitle>
              <CardDescription>
                Google Gemini AI 模型服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                {renderStatusBadge('gemini')}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openConfigModal('gemini', getProviderConfig('gemini'))}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>{getProviderConfig('gemini')?.model || '未配置'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <span className={getProviderStatus('gemini').is_connected ? 'text-green-600' : 'text-red-600'}>
                    {getProviderStatus('gemini').is_connected ? '正常运行' : '连接失败'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>23</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Azure OpenAI</CardTitle>
              <CardDescription>
                Azure平台的OpenAI服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  连接失败
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  配置
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span>gpt-4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <span className={getProviderStatus('openai').is_connected ? 'text-green-600' : 'text-red-600'}>
                    {getProviderStatus('openai').is_connected ? '正常运行' : '连接失败'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">今日调用:</span>
                  <span>0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* LLM配置模态框 */}
      {configModal.provider && (
        <LLMConfigModal
          isOpen={configModal.isOpen}
          onClose={closeConfigModal}
          provider={configModal.provider}
          config={configModal.config}
          onSave={handleSaveConfig}
        />
      )}
    </MainLayout>
  );
}
