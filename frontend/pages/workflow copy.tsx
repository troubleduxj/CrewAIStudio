import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkflowVisualizer from '@/components/dashboard/workflow-visualizer';
import WorkflowToolPanel from '@/components/workflow/workflow-tool-panel';
import { Play, Save, Download, Upload, Settings, Plus, ChevronLeft, ChevronRight, Loader2, PanelRightOpen, PanelRightClose } from 'lucide-react';
import type { Agent, Task, Tool, Node } from '@/lib/types';

/**
 * 工作流编辑器组件 - 包含完整的ReactFlow功能
 */
function WorkflowEditor() {
  const [workflowName, setWorkflowName] = useState('未命名工作流');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'visual-editor' | 'execution'>('visual-editor');

  /**
   * 运行工作流
   */
  const runWorkflow = async () => {
    setIsExecuting(true);
    setExecutionLogs(prev => [...prev, '开始执行工作流...']);
    
    try {
      // 这里添加实际的工作流执行逻辑
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟执行
      setExecutionLogs(prev => [...prev, '工作流执行完成']);
    } catch (error) {
      setExecutionLogs(prev => [...prev, `执行失败: ${error}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * 保存工作流
   */
  const saveWorkflow = () => {
    console.log('保存工作流');
  };

  /**
   * 导出工作流
   */
  const exportWorkflow = () => {
    console.log('导出工作流');
  };

  /**
   * 导入工作流
   */
  const importWorkflow = () => {
    console.log('导入工作流');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 justify-between">
          {/* 左侧：工作流名称 */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{workflowName}</h1>
          </div>
          
          {/* 中间：视图切换按钮 */}
          <div className="flex items-center">
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'visual-editor' | 'execution')} className="">
              <TabsList className="flex">
                <TabsTrigger value="visual-editor">Visual Editor</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              onClick={runWorkflow}
              disabled={isExecuting}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isExecuting ? '执行中...' : '运行'}
            </Button>
            
            <Button
              variant="outline"
              onClick={saveWorkflow}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              保存
            </Button>
            
            <Button
              variant="outline"
              onClick={exportWorkflow}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              导出
            </Button>
            
            <Button
              variant="outline"
              onClick={importWorkflow}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              导入
            </Button>
            
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            
            {/* Tools面板切换按钮 - 只在Visual Editor视图显示 */}
            {currentView === 'visual-editor' && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsToolsPanelOpen(!isToolsPanelOpen)}
                className="ml-2"
              >
                {isToolsPanelOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visual Editor 视图 */}
        {currentView === 'visual-editor' && (
          <div className="flex-1 flex overflow-hidden relative">
            {/* 中央画布区域 - 始终铺满可用空间 */}
            <div className="flex-1 relative">
              <WorkflowVisualizer />
            </div>
            
            {/* 右侧可抽拉工具面板 - 只在打开时显示 */}
            {isToolsPanelOpen && (
              <div className="w-72 transition-all duration-300 border-l bg-background/50 flex flex-col flex-shrink-0">
                {/* 面板标题 */}
                <div className="flex items-center p-3 border-b">
                  <h3 className="text-sm font-semibold">Tools</h3>
                </div>
                
                {/* 面板内容 */}
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="agents" className="h-full">
                    <TabsList className="flex w-full mx-2 mt-2">
                      <TabsTrigger value="agents" className="text-xs flex-1">Agent</TabsTrigger>
                      <TabsTrigger value="tasks" className="text-xs flex-1">Task</TabsTrigger>
                      <TabsTrigger value="tools" className="text-xs flex-1">Tools</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="agents" className="h-full p-4 overflow-y-auto">
                      <div className="space-y-3">
                        <div className="text-sm font-medium mb-2">Agent 节点</div>
                        <div className="space-y-2">
                          <Card className="p-3 cursor-pointer hover:bg-accent" draggable>
                            <div className="font-medium text-sm">研究专家</div>
                            <div className="text-xs text-muted-foreground">信息收集和分析</div>
                          </Card>
                          
                          <Card className="p-3 cursor-pointer hover:bg-accent" draggable>
                            <div className="font-medium text-sm">内容策略师</div>
                            <div className="text-xs text-muted-foreground">内容规划和策略</div>
                          </Card>
                          
                          <Card className="p-3 cursor-pointer hover:bg-accent" draggable>
                            <div className="font-medium text-sm">通用智能体</div>
                            <div className="text-xs text-muted-foreground">自定义智能体</div>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tasks" className="h-full p-4 overflow-y-auto">
                      <div className="space-y-3">
                        <div className="text-sm font-medium mb-2">Task 节点</div>
                        <div className="space-y-2">
                          <Card className="p-3 cursor-pointer hover:bg-accent" draggable>
                            <div className="font-medium text-sm">研究任务</div>
                            <div className="text-xs text-muted-foreground">信息收集任务</div>
                          </Card>
                          
                          <Card className="p-3 cursor-pointer hover:bg-accent" draggable>
                            <div className="font-medium text-sm">分析任务</div>
                            <div className="text-xs text-muted-foreground">数据分析任务</div>
                          </Card>
                          
                          <Card className="p-3 cursor-pointer hover:bg-accent" draggable>
                            <div className="font-medium text-sm">生成任务</div>
                            <div className="text-xs text-muted-foreground">内容生成任务</div>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tools" className="h-full p-4 overflow-y-auto">
                      <WorkflowToolPanel />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Execution 视图 */}
        {currentView === 'execution' && (
          <div className="flex-1 flex overflow-hidden">
            {/* 执行事件流 */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Crew执行事件流</h3>
                  <div className="flex items-center gap-2">
                    {isExecuting && (
                      <Badge variant="default" className="animate-pulse">
                        执行中
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {executionLogs.map((log, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            事件 #{index + 1}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date().toLocaleTimeString()}
                          </div>
                          <div className="mt-2">
                            {log}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {executionLogs.length === 0 && (
                    <Card className="p-8">
                      <div className="text-center text-muted-foreground">
                        <div className="text-lg font-medium mb-2">暂无执行事件</div>
                        <div className="text-sm">点击"运行"按钮开始执行工作流</div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
            
            {/* 右侧日志明细 */}
            <div className="w-96 border-l bg-background/50 p-4 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">执行日志明细</h3>
                
                <div className="space-y-2">
                  {executionLogs.map((log, index) => (
                    <div key={index} className="text-xs p-3 bg-muted rounded font-mono">
                      <div className="text-muted-foreground mb-1">
                        [{new Date().toLocaleTimeString()}]
                      </div>
                      <div>{log}</div>
                    </div>
                  ))}
                  
                  {executionLogs.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      暂无详细日志
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 工作流页面主组件
 */
export default function Workflow() {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <WorkflowEditor />
    </MainLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common']))
    }
  };
};