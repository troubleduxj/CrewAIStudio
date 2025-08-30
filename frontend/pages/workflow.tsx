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
import WorkflowVisualizer, { initialNodes } from '@/components/dashboard/workflow-visualizer';
import WorkflowToolPanel from '@/components/workflow/workflow-tool-panel';
import { Play, Save, Download, Upload, Settings, Plus, ChevronLeft, ChevronRight, Loader2, PanelRightOpen, PanelRightClose, Activity, FileText } from 'lucide-react';
import type { Agent, Task, Tool, Node } from '@/lib/types';

/**
 * 工作流编辑器组件 - 包含完整的ReactFlow功能
 * @description 提供可视化工作流编辑界面，支持拖拽创建节点、连接线等操作
 * @returns {JSX.Element} 工作流编辑器组件
 */
function WorkflowEditor() {
  // 工作流基本状态
  const [workflowName, setWorkflowName] = useState('未命名工作流');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'visual-editor' | 'execution'>('visual-editor');
  
  // 工作流数据状态
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // 编辑器状态
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [isModified, setIsModified] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isToolDragging, setIsToolDragging] = useState(false);
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  /**
   * 运行工作流
   * @description 执行当前工作流，显示执行进度和日志
   */
  const runWorkflow = async () => {
    setIsExecuting(true);
    setExecutionLogs(prev => [...prev, '开始执行工作流...']);
    
    try {
      // 验证工作流配置
      if (nodes.length === 0) {
        throw new Error('工作流为空，请先添加节点');
      }
      
      setExecutionLogs(prev => [...prev, '验证工作流配置...']);
      
      // 模拟执行过程
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setExecutionLogs(prev => [...prev, `执行节点: ${node.data?.label || node.id}`]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setExecutionLogs(prev => [...prev, '工作流执行完成']);
    } catch (error) {
      setExecutionLogs(prev => [...prev, `执行失败: ${error}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * 保存工作流
   * @description 将当前工作流配置保存到后端
   */
  const saveWorkflow = useCallback(async () => {
    try {
      const workflowData = {
        name: workflowName,
        nodes,
        agents,
        tasks,
        tools,
        updatedAt: new Date().toISOString()
      };
      
      // 这里添加实际的保存逻辑
      console.log('保存工作流:', workflowData);
      
      setIsModified(false);
      setLastSaved(new Date());
      setExecutionLogs(prev => [...prev, '工作流已保存']);
    } catch (error) {
      console.error('保存失败:', error);
      setExecutionLogs(prev => [...prev, `保存失败: ${error}`]);
    }
  }, [workflowName, nodes, agents, tasks, tools]);

  /**
   * 导出工作流
   * @description 将工作流导出为JSON文件
   */
  const exportWorkflow = useCallback(() => {
    try {
      const workflowData = {
        name: workflowName,
        nodes,
        agents,
        tasks,
        tools,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const dataStr = JSON.stringify(workflowData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workflowName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      setExecutionLogs(prev => [...prev, '工作流已导出']);
    } catch (error) {
      console.error('导出失败:', error);
      setExecutionLogs(prev => [...prev, `导出失败: ${error}`]);
    }
  }, [workflowName, nodes, agents, tasks, tools]);

  /**
   * 导入工作流
   * @description 从JSON文件导入工作流配置
   */
  const importWorkflow = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  /**
   * 处理文件导入
   * @param {React.ChangeEvent<HTMLInputElement>} event - 文件选择事件
   */
  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflowData = JSON.parse(e.target?.result as string);
        
        // 验证导入的数据格式
        if (!workflowData.name || !Array.isArray(workflowData.nodes)) {
          throw new Error('无效的工作流文件格式');
        }
        
        setWorkflowName(workflowData.name);
        setNodes(workflowData.nodes || []);
        setAgents(workflowData.agents || []);
        setTasks(workflowData.tasks || []);
        setTools(workflowData.tools || []);
        setIsModified(true);
        
        setExecutionLogs(prev => [...prev, `工作流 "${workflowData.name}" 已导入`]);
      } catch (error) {
        console.error('导入失败:', error);
        setExecutionLogs(prev => [...prev, `导入失败: ${error}`]);
      }
    };
    
    reader.readAsText(file);
    
    // 清空文件输入
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  /**
   * 添加新节点
   * @param {string} type - 节点类型
   * @param {any} data - 节点数据
   */
  const addNode = useCallback((type: string, data: any) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: data.label || `新${type}`,
        ...data
      }
    };
    
    setNodes(prev => [...prev, newNode]);
    setIsModified(true);
  }, []);

  /**
   * 删除节点
   * @param {string} nodeId - 节点ID
   */
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    setIsModified(true);
  }, [selectedNode]);

  /**
   * 更新节点数据
   * @param {string} nodeId - 节点ID
   * @param {any} newData - 新的节点数据
   */
  const updateNode = useCallback((nodeId: string, newData: any) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    ));
    setIsModified(true);
  }, []);

  /**
   * 处理拖拽开始
   * @param {any} item - 拖拽的项目
   */
  const handleDragStart = useCallback((item: any) => {
    setIsDragging(true);
    setDraggedItem(item);
  }, []);

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
  }, []);

  /**
   * 处理画布拖放
   * @param {React.DragEvent} event - 拖放事件
   */
  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    let dragData = null;
    try {
      const dataTransferData = event.dataTransfer.getData('application/json');
      if (dataTransferData) {
        dragData = JSON.parse(dataTransferData);
      }
    } catch (error) {
      // 忽略解析错误
    }
    
    // 如果没有dataTransfer数据，使用draggedItem
    const itemData = dragData || draggedItem;
    if (!itemData) {
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    // 处理不同类型的拖拽数据
    if (itemData.type === 'tool') {
      // 工具类型不允许在画布上创建节点，直接返回
      return;
    } else {
      // Agent/Task类型：{type, label, description}
      addNode(itemData.type, {
        ...itemData,
        position
      });
    }
    
    handleDragEnd();
  }, [draggedItem, addNode, handleDragEnd]);

  /**
   * 处理画布拖拽悬停
   * @param {React.DragEvent} event - 拖拽事件
   */
  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            saveWorkflow();
            break;
          case 'e':
            event.preventDefault();
            exportWorkflow();
            break;
          case 'o':
            event.preventDefault();
            importWorkflow();
            break;
          case 'r':
            event.preventDefault();
            if (!isExecuting) {
              runWorkflow();
            }
            break;
        }
      }
      
      if (event.key === 'Delete' && selectedNode) {
        deleteNode(selectedNode.id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveWorkflow, exportWorkflow, importWorkflow, runWorkflow, isExecuting, selectedNode, deleteNode]);

  return (
    <div className="h-screen flex flex-col">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
      
      {/* 顶部工具栏 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 justify-between">
          {/* 左侧：工作流名称和状态 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                value={workflowName}
                onChange={(e) => {
                  setWorkflowName(e.target.value);
                  setIsModified(true);
                }}
                className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                placeholder="工作流名称"
              />
              {isModified && (
                <Badge variant="outline" className="text-xs">
                  未保存
                </Badge>
              )}
            </div>
            
            {lastSaved && (
              <div className="text-xs text-muted-foreground">
                上次保存: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {/* 中间：视图切换按钮 */}
          <div className="flex items-center">
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'visual-editor' | 'execution')} className="">
              <TabsList className="flex">
                <TabsTrigger value="visual-editor" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Visual Editor
                </TabsTrigger>
                <TabsTrigger value="execution" className="gap-2">
                  <Play className="h-4 w-4" />
                  Execution
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              onClick={runWorkflow}
              disabled={isExecuting || nodes.length === 0}
              className="gap-2"
              title="运行工作流 (Ctrl+R)"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isExecuting ? '执行中...' : '运行'}
            </Button>
            
            <Button
              variant="outline"
              onClick={saveWorkflow}
              disabled={!isModified}
              className="gap-2"
              title="保存工作流 (Ctrl+S)"
            >
              <Save className="h-4 w-4" />
              保存
            </Button>
            
            <Button
              variant="outline"
              onClick={exportWorkflow}
              className="gap-2"
              title="导出工作流 (Ctrl+E)"
            >
              <Download className="h-4 w-4" />
              导出
            </Button>
            
            <Button
              variant="outline"
              onClick={importWorkflow}
              className="gap-2"
              title="导入工作流 (Ctrl+O)"
            >
              <Upload className="h-4 w-4" />
              导入
            </Button>
            
            <Button variant="outline" size="icon" title="设置">
              <Settings className="h-4 w-4" />
            </Button>
            
            {/* Tools面板切换按钮 - 只在Visual Editor视图显示 */}
            {currentView === 'visual-editor' && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsToolsPanelOpen(!isToolsPanelOpen)}
                className="ml-2"
                title={isToolsPanelOpen ? '隐藏工具面板' : '显示工具面板'}
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
            <div 
              ref={canvasRef}
              className="flex-1 relative"
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
            >
              <WorkflowVisualizer 
                nodes={nodes}
                onNodesChange={setNodes}
                selectedNode={selectedNode}
                onNodeSelect={setSelectedNode}
                onNodeUpdate={updateNode}
                onNodeDelete={deleteNode}
                isDragging={isDragging}
                isToolDragging={isToolDragging}
              />
              
              {/* 画布状态指示器 */}
              {isDragging && (
                <div className="absolute top-4 left-4">
                  <Badge variant="default" className="bg-primary/80">
                    拖拽中...
                  </Badge>
                </div>
              )}
              
              {/* 空状态提示 */}
              {nodes.length === 0 && !isDragging && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-lg font-medium mb-2">开始创建您的工作流</div>
                    <div className="text-sm">从右侧工具面板拖拽组件到画布</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 右侧可抽拉工具面板 - 只在打开时显示 */}
            {isToolsPanelOpen && (
              <div className="w-80 transition-all duration-300 border-l bg-background/50 flex flex-col flex-shrink-0">
                {/* 面板标题 */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">工具面板</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {agents.length + tasks.length + tools.length} 项
                    </Badge>
                  </div>
                </div>
                
                {/* 面板内容 */}
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="agents" className="h-full">
                    <TabsList className="flex w-full mx-4 mt-4">
                      <TabsTrigger value="agents" className="text-sm flex-1">
                        Agent ({agents.length})
                      </TabsTrigger>
                      <TabsTrigger value="tasks" className="text-sm flex-1">
                        Task ({tasks.length})
                      </TabsTrigger>
                      <TabsTrigger value="tools" className="text-sm flex-1">
                        Tools ({tools.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="agents" className="h-full p-4 overflow-y-auto">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Agent 节点</div>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Plus className="h-3 w-3" />
                            新建
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {/* 预定义 Agent 模板 */}
                          <Card 
                            className="p-3 cursor-pointer hover:bg-accent transition-colors" 
                            draggable
                            onDragStart={() => handleDragStart({ type: 'agent', label: '研究专家', role: 'researcher' })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="font-medium text-sm">研究专家</div>
                            <div className="text-xs text-muted-foreground mt-1">专门负责信息收集和分析的智能体</div>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="secondary" className="text-xs">研究</Badge>
                              <Badge variant="secondary" className="text-xs">分析</Badge>
                            </div>
                          </Card>
                          
                          <Card 
                            className="p-3 cursor-pointer hover:bg-accent transition-colors" 
                            draggable
                            onDragStart={() => handleDragStart({ type: 'agent', label: '内容策略师', role: 'content_strategist' })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="font-medium text-sm">内容策略师</div>
                            <div className="text-xs text-muted-foreground mt-1">负责内容规划和策略制定</div>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="secondary" className="text-xs">策略</Badge>
                              <Badge variant="secondary" className="text-xs">内容</Badge>
                            </div>
                          </Card>
                          
                          <Card 
                            className="p-3 cursor-pointer hover:bg-accent transition-colors" 
                            draggable
                            onDragStart={() => handleDragStart({ type: 'agent', label: '通用智能体', role: 'general' })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="font-medium text-sm">通用智能体</div>
                            <div className="text-xs text-muted-foreground mt-1">可自定义配置的通用智能体</div>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="secondary" className="text-xs">通用</Badge>
                              <Badge variant="secondary" className="text-xs">自定义</Badge>
                            </div>
                          </Card>
                          
                          {/* 用户创建的 Agent */}
                          {agents.map((agent, index) => (
                            <Card key={index} className="p-3 cursor-pointer hover:bg-accent transition-colors" draggable>
                              <div className="font-medium text-sm">{agent.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">{agent.description}</div>
                              <div className="flex gap-1 mt-2">
                                <Badge variant="outline" className="text-xs">自定义</Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tasks" className="h-full p-4 overflow-y-auto">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Task 节点</div>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Plus className="h-3 w-3" />
                            新建
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {/* 预定义 Task 模板 */}
                          <Card 
                            className="p-3 cursor-pointer hover:bg-accent transition-colors" 
                            draggable
                            onDragStart={() => handleDragStart({ type: 'task', label: '研究任务', category: 'research' })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="font-medium text-sm">研究任务</div>
                            <div className="text-xs text-muted-foreground mt-1">执行信息收集和研究工作</div>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="secondary" className="text-xs">研究</Badge>
                              <Badge variant="secondary" className="text-xs">收集</Badge>
                            </div>
                          </Card>
                          
                          <Card 
                            className="p-3 cursor-pointer hover:bg-accent transition-colors" 
                            draggable
                            onDragStart={() => handleDragStart({ type: 'task', label: '分析任务', category: 'analysis' })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="font-medium text-sm">分析任务</div>
                            <div className="text-xs text-muted-foreground mt-1">对数据进行深入分析处理</div>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="secondary" className="text-xs">分析</Badge>
                              <Badge variant="secondary" className="text-xs">处理</Badge>
                            </div>
                          </Card>
                          
                          <Card 
                            className="p-3 cursor-pointer hover:bg-accent transition-colors" 
                            draggable
                            onDragStart={() => handleDragStart({ type: 'task', label: '生成任务', category: 'generation' })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="font-medium text-sm">生成任务</div>
                            <div className="text-xs text-muted-foreground mt-1">生成内容或执行创建操作</div>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="secondary" className="text-xs">生成</Badge>
                              <Badge variant="secondary" className="text-xs">创建</Badge>
                            </div>
                          </Card>
                          
                          {/* 用户创建的 Task */}
                          {tasks.map((task, index) => (
                            <Card key={index} className="p-3 cursor-pointer hover:bg-accent transition-colors" draggable>
                              <div className="font-medium text-sm">{task.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                              <div className="flex gap-1 mt-2">
                                <Badge variant="outline" className="text-xs">自定义</Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tools" className="h-full p-4 overflow-y-auto">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">工具库</div>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Plus className="h-3 w-3" />
                            添加
                          </Button>
                        </div>
                        
                        <WorkflowToolPanel 
                          tools={tools}
                          onToolSelect={(tool) => handleDragStart({ type: 'tool', ...tool })}
                          onDragStart={() => setIsToolDragging(true)}
                          onDragEnd={() => { handleDragEnd(); setIsToolDragging(false); }}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Execution 视图 */}
        {currentView === 'execution' && (
          <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-background to-muted/20">
            {/* 主要执行区域 */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-6">
                {/* 执行控制面板 */}
                <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Play className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">工作流执行</h2>
                          <p className="text-sm text-muted-foreground mt-1">监控和管理工作流的执行状态</p>
                        </div>
                      </div>
                      <Badge 
                        variant={isExecuting ? "default" : "secondary"} 
                        className={`gap-2 px-3 py-1 ${isExecuting ? 'animate-pulse' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          isExecuting ? 'bg-green-400 animate-pulse' : 'bg-current'
                        }`} />
                        {isExecuting ? '执行中' : '就绪'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={runWorkflow} 
                        disabled={isExecuting || nodes.length === 0}
                        className="gap-2 px-6"
                        size="lg"
                      >
                        <Play className="h-4 w-4" />
                        {isExecuting ? '执行中...' : '运行工作流'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => setExecutionLogs([])} 
                        disabled={isExecuting}
                        className="gap-2"
                      >
                        清空日志
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* 执行统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">总节点</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{nodes.length}</div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">已执行</div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {isExecuting ? Math.min(executionLogs.length - 1, nodes.length) : executionLogs.length > 0 ? nodes.length : 0}
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Loader2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">状态</div>
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {isExecuting ? '执行中' : executionLogs.length > 0 ? '已完成' : '待执行'}
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <ChevronRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">事件数</div>
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{executionLogs.length}</div>
                      </div>
                    </div>
                  </Card>
                </div>
                
                {/* 执行事件流 */}
                <div className="bg-card/30 backdrop-blur-sm border rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">执行事件流</h3>
                      <p className="text-muted-foreground mt-1">实时监控工作流执行状态和进度</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isExecuting && (
                        <Badge variant="default" className="animate-pulse gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          执行中
                        </Badge>
                      )}
                    </div>
                  </div>
                
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {executionLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-200 border border-border/50">
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${
                            index === executionLogs.length - 1 && isExecuting 
                              ? 'bg-green-500 animate-pulse' 
                              : 'bg-primary'
                          }`} />
                          {index < executionLogs.length - 1 && (
                            <div className="w-px h-8 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                #{index + 1}
                              </Badge>
                              <div className="text-sm font-medium">
                                执行事件
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {new Date().toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-sm leading-relaxed text-foreground/90">
                            {log}
                          </div>
                          {index === executionLogs.length - 1 && isExecuting && (
                            <div className="mt-3">
                              <Badge variant="default" className="text-xs gap-1 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                最新
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {executionLogs.length === 0 && (
                      <div className="text-center py-16">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-medium mb-2">暂无执行事件</div>
                        <div className="text-sm text-muted-foreground mb-6">点击"运行工作流"按钮开始执行</div>
                        <Button 
                          onClick={runWorkflow} 
                          disabled={isExecuting || nodes.length === 0}
                          className="gap-2"
                          size="lg"
                        >
                          <Play className="h-4 w-4" />
                          开始执行
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 右侧详细信息面板 */}
            <div className="w-96 border-l bg-card/30 backdrop-blur-sm flex flex-col">
              {/* 实时监控 */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">实时监控</h3>
                </div>
                
                {/* 执行进度条 */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">执行进度</span>
                      <span className="text-sm text-muted-foreground">
                        {nodes.length > 0 ? Math.round((executionLogs.length / Math.max(nodes.length, 1)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
                        style={{ 
                          width: `${nodes.length > 0 ? Math.min((executionLogs.length / nodes.length) * 100, 100) : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* 性能指标 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50">
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">成功率</div>
                      <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">100%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 border border-amber-200 dark:border-amber-800/50">
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">平均耗时</div>
                      <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                        {isExecuting ? '计算中' : '< 1s'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 详细日志 */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <FileText className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">详细日志</h3>
                </div>
                
                <div className="space-y-3">
                  {executionLogs.map((log, index) => (
                    <div key={index} className="group">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-all duration-200 border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                            LOG-{String(index + 1).padStart(3, '0')}
                          </Badge>
                          <div className="text-xs text-muted-foreground font-mono">
                            {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-xs font-mono leading-relaxed break-words text-foreground/90">
                          {log}
                        </div>
                        {index === executionLogs.length - 1 && isExecuting && (
                          <div className="mt-2 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">实时</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {executionLogs.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium mb-1">暂无日志记录</div>
                      <div className="text-xs text-muted-foreground">执行工作流后将显示详细日志</div>
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
 * @description 工作流管理页面的主要入口组件
 * @returns {JSX.Element} 工作流页面组件
 */
export default function Workflow() {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <WorkflowEditor />
    </MainLayout>
  );
}

/**
 * 静态属性获取函数
 * @description 为页面提供国际化支持
 * @param {object} context - Next.js 上下文对象
 * @returns {Promise<object>} 包含翻译资源的属性对象
 */
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common']))
    }
  };
};