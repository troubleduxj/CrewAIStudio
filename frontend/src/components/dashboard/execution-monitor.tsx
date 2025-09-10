import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  FileText,
  ArrowRight,
  Loader2,
  Eye,
  Download
} from 'lucide-react';

/**
 * 执行状态枚举
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 执行类型枚举
 */
export enum ExecutionType {
  WORKFLOW = 'workflow',
  TASK = 'task',
  AGENT = 'agent'
}

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * 执行日志接口
 */
export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * 执行记录接口
 */
export interface ExecutionRecord {
  id: string;
  type: ExecutionType;
  status: ExecutionStatus;
  target_id: string;
  target_name: string;
  user_id?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  metadata?: Record<string, any>;
  started_at: string;
  completed_at?: string;
  duration?: number;
  progress: number;
  current_step?: string;
  total_steps?: number;
  error?: string;
  logs: ExecutionLog[];
}

/**
 * Agent执行详情接口
 */
export interface AgentExecutionDetail {
  agent_id: string;
  agent_name: string;
  role: string;
  goal: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration?: number;
  steps: AgentExecutionStep[];
}

/**
 * Agent执行步骤接口
 */
export interface AgentExecutionStep {
  id: string;
  name: string;
  description: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  logs: ExecutionLog[];
}

/**
 * 执行监控组件属性接口
 */
interface ExecutionMonitorProps {
  executionId?: string;
  isExecuting: boolean;
  onRefresh?: () => void;
  onStop?: () => void;
}

/**
 * 获取状态图标
 * @param status 执行状态
 * @returns 状态图标组件
 */
const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case ExecutionStatus.PENDING:
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case ExecutionStatus.RUNNING:
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case ExecutionStatus.COMPLETED:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case ExecutionStatus.FAILED:
      return <XCircle className="h-4 w-4 text-red-500" />;
    case ExecutionStatus.CANCELLED:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

/**
 * 获取状态颜色
 * @param status 执行状态
 * @returns 状态颜色类名
 */
const getStatusColor = (status: ExecutionStatus) => {
  switch (status) {
    case ExecutionStatus.PENDING:
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case ExecutionStatus.RUNNING:
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case ExecutionStatus.COMPLETED:
      return 'text-green-600 bg-green-50 border-green-200';
    case ExecutionStatus.FAILED:
      return 'text-red-600 bg-red-50 border-red-200';
    case ExecutionStatus.CANCELLED:
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

/**
 * 获取日志级别颜色
 * @param level 日志级别
 * @returns 日志级别颜色类名
 */
const getLogLevelColor = (level: LogLevel) => {
  switch (level) {
    case LogLevel.DEBUG:
      return 'text-gray-600 bg-gray-100';
    case LogLevel.INFO:
      return 'text-blue-600 bg-blue-100';
    case LogLevel.WARNING:
      return 'text-yellow-600 bg-yellow-100';
    case LogLevel.ERROR:
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * 格式化持续时间
 * @param duration 持续时间（毫秒）
 * @returns 格式化的持续时间字符串
 */
const formatDuration = (duration?: number) => {
  if (!duration) return '0s';
  
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * 执行监控组件
 * @param props 组件属性
 * @returns 执行监控组件
 */
export default function ExecutionMonitor({ 
  executionId, 
  isExecuting, 
  onRefresh, 
  onStop 
}: ExecutionMonitorProps) {
  const [executionRecord, setExecutionRecord] = useState<ExecutionRecord | null>(null);
  const [agentDetails, setAgentDetails] = useState<AgentExecutionDetail[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 获取执行详情
   */
  const fetchExecutionDetails = async () => {
    if (!executionId) {
      setExecutionRecord(null);
      setAgentDetails([]);
      return;
    }
    
    setIsLoading(true);
    try {
      // TODO: 调用API获取执行详情
      // const response = await fetch(`/api/v1/executions/${executionId}`);
      // const data = await response.json();
      // setExecutionRecord(data);
      
      // 模拟数据
      const mockData: ExecutionRecord = {
        id: executionId,
        type: ExecutionType.WORKFLOW,
        status: isExecuting ? ExecutionStatus.RUNNING : ExecutionStatus.COMPLETED,
        target_id: 'workflow-1',
        target_name: '数据分析工作流',
        user_id: 'user-1',
        inputs: {
          data_source: 'sales_data.csv',
          analysis_type: 'trend_analysis'
        },
        outputs: isExecuting ? undefined : {
          report_url: '/reports/analysis_2024.pdf',
          insights: ['销售趋势上升', '季度增长15%']
        },
        started_at: new Date(Date.now() - 300000).toISOString(),
        completed_at: isExecuting ? undefined : new Date().toISOString(),
        duration: isExecuting ? undefined : 300000,
        progress: isExecuting ? 65 : 100,
        current_step: isExecuting ? '数据分析中...' : '已完成',
        total_steps: 5,
        logs: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 250000).toISOString(),
            level: LogLevel.INFO,
            message: '开始执行工作流',
            source: 'workflow_engine'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 200000).toISOString(),
            level: LogLevel.INFO,
            message: '初始化数据收集Agent',
            source: 'agent_manager'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 150000).toISOString(),
            level: LogLevel.INFO,
            message: '数据收集完成，开始分析',
            source: 'data_collector'
          }
        ]
      };
      
      setExecutionRecord(mockData);
      
      // 模拟Agent执行详情
      const mockAgentDetails: AgentExecutionDetail[] = [
        {
          agent_id: 'agent-1',
          agent_name: '数据收集Agent',
          role: 'Data Collector',
          goal: '收集和预处理销售数据',
          inputs: {
            source: 'sales_data.csv',
            filters: ['2024', 'active_customers']
          },
          outputs: {
            processed_records: 15420,
            data_quality_score: 0.95
          },
          status: ExecutionStatus.COMPLETED,
          started_at: new Date(Date.now() - 250000).toISOString(),
          completed_at: new Date(Date.now() - 180000).toISOString(),
          duration: 70000,
          steps: [
            {
              id: 'step-1',
              name: '数据加载',
              description: '从CSV文件加载销售数据',
              status: ExecutionStatus.COMPLETED,
              started_at: new Date(Date.now() - 250000).toISOString(),
              completed_at: new Date(Date.now() - 230000).toISOString(),
              duration: 20000,
              inputs: { file: 'sales_data.csv' },
              outputs: { rows_loaded: 15420 },
              logs: [
                {
                  id: 'log-1',
                  timestamp: new Date(Date.now() - 245000).toISOString(),
                  level: LogLevel.INFO,
                  message: '开始加载CSV文件',
                  source: 'data_loader'
                }
              ]
            }
          ]
        },
        {
          agent_id: 'agent-2',
          agent_name: '数据分析Agent',
          role: 'Data Analyst',
          goal: '执行趋势分析和生成洞察',
          inputs: {
            processed_data: 'cleaned_sales_data',
            analysis_type: 'trend_analysis'
          },
          outputs: isExecuting ? undefined : {
            trends: ['上升趋势', '季度性波动'],
            growth_rate: 0.15
          },
          status: isExecuting ? ExecutionStatus.RUNNING : ExecutionStatus.COMPLETED,
          started_at: new Date(Date.now() - 180000).toISOString(),
          completed_at: isExecuting ? undefined : new Date(Date.now() - 50000).toISOString(),
          duration: isExecuting ? undefined : 130000,
          steps: []
        }
      ];
      
      setAgentDetails(mockAgentDetails);
    } catch (error) {
      console.error('获取执行详情失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutionDetails();
    
    // 如果正在执行，设置定时刷新
    if (isExecuting) {
      const interval = setInterval(fetchExecutionDetails, 2000);
      return () => clearInterval(interval);
    }
  }, [executionId, isExecuting]);

  if (!executionId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="text-lg font-medium mb-2">暂无执行记录</div>
          <div className="text-sm text-muted-foreground">请先执行工作流以查看执行详情</div>
        </div>
      </div>
    );
  }

  if (!executionRecord && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">加载执行详情...</div>
        </div>
      </div>
    );
  }

  // 如果executionRecord为null且不在加载状态，显示错误信息
  if (!executionRecord) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <div className="text-lg font-medium mb-2">加载失败</div>
          <div className="text-sm text-muted-foreground mb-4">无法获取执行详情</div>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              重新加载
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 执行概览卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(executionRecord.status)}
              <div>
                <CardTitle className="text-lg">{executionRecord.target_name}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  执行ID: {executionRecord.id}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(executionRecord.status)}>
                {executionRecord.status.toUpperCase()}
              </Badge>
              {isExecuting && onStop && (
                <Button variant="destructive" size="sm" onClick={onStop}>
                  <Square className="h-4 w-4 mr-1" />
                  停止
                </Button>
              )}
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <Activity className="h-4 w-4 mr-1" />
                  刷新
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">开始时间</div>
              <div className="font-medium">
                {new Date(executionRecord.started_at).toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">持续时间</div>
              <div className="font-medium">
                {executionRecord.duration ? 
                  formatDuration(executionRecord.duration) : 
                  formatDuration(Date.now() - new Date(executionRecord.started_at).getTime())
                }
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">进度</div>
              <div className="flex items-center gap-2">
                <Progress value={executionRecord.progress} className="flex-1" />
                <span className="text-sm font-medium">{executionRecord.progress}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">当前步骤</div>
              <div className="font-medium">{executionRecord.current_step || '未知'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细信息TAB */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="agents">Agent详情</TabsTrigger>
          <TabsTrigger value="logs">执行日志</TabsTrigger>
          <TabsTrigger value="io">输入输出</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agent执行状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Agent执行状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentDetails.map((agent) => (
                    <div key={agent.agent_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(agent.status)}
                        <div>
                          <div className="font-medium">{agent.agent_name}</div>
                          <div className="text-sm text-muted-foreground">{agent.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {agent.duration ? formatDuration(agent.duration) : '进行中'}
                        </div>
                        <Badge size="sm" className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 执行统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  执行统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总Agent数</span>
                    <span className="font-medium">{agentDetails.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已完成</span>
                    <span className="font-medium text-green-600">
                      {agentDetails.filter(a => a.status === ExecutionStatus.COMPLETED).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">执行中</span>
                    <span className="font-medium text-blue-600">
                      {agentDetails.filter(a => a.status === ExecutionStatus.RUNNING).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">失败</span>
                    <span className="font-medium text-red-600">
                      {agentDetails.filter(a => a.status === ExecutionStatus.FAILED).length}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">日志条数</span>
                    <span className="font-medium">{executionRecord.logs.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agent列表</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {agentDetails.map((agent) => (
                      <div 
                        key={agent.agent_id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAgent === agent.agent_id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedAgent(agent.agent_id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(agent.status)}
                            <span className="font-medium">{agent.agent_name}</span>
                          </div>
                          <Badge size="sm" className={getStatusColor(agent.status)}>
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">{agent.role}</div>
                        <div className="text-xs text-muted-foreground">{agent.goal}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Agent详情 */}
            {selectedAgent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agent详情</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const agent = agentDetails.find(a => a.agent_id === selectedAgent);
                    if (!agent) return null;
                    
                    return (
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">基本信息</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">名称:</span>
                                <span>{agent.agent_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">角色:</span>
                                <span>{agent.role}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">状态:</span>
                                <Badge size="sm" className={getStatusColor(agent.status)}>
                                  {agent.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">持续时间:</span>
                                <span>{agent.duration ? formatDuration(agent.duration) : '进行中'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-medium mb-2">目标</h4>
                            <p className="text-sm text-muted-foreground">{agent.goal}</p>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-medium mb-2">输入参数</h4>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(agent.inputs, null, 2)}
                              </pre>
                            </div>
                          </div>
                          
                          {agent.outputs && (
                            <div>
                              <h4 className="font-medium mb-2">输出结果</h4>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <pre className="text-xs overflow-x-auto">
                                  {JSON.stringify(agent.outputs, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {agent.steps.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">执行步骤</h4>
                              <div className="space-y-2">
                                {agent.steps.map((step) => (
                                  <div key={step.id} className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {getStatusIcon(step.status)}
                                        <span className="font-medium text-sm">{step.name}</span>
                                      </div>
                                      <Badge size="sm" className={getStatusColor(step.status)}>
                                        {step.status}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                                    <div className="text-xs text-muted-foreground">
                                      持续时间: {step.duration ? formatDuration(step.duration) : '进行中'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    );
                  })()
                  }
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  执行日志
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    导出日志
                  </Button>
                  <Button variant="outline" size="sm" onClick={onRefresh}>
                    <Activity className="h-4 w-4 mr-1" />
                    刷新
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {executionRecord.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Badge size="sm" className={getLogLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{log.source || '系统'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                        {log.metadata && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              查看元数据
                            </summary>
                            <div className="mt-1 bg-muted/50 p-2 rounded text-xs">
                              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="io" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 输入参数 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  输入参数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(executionRecord.inputs, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* 输出结果 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  输出结果
                </CardTitle>
              </CardHeader>
              <CardContent>
                {executionRecord.outputs ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(executionRecord.outputs, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p>执行完成后将显示输出结果</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}