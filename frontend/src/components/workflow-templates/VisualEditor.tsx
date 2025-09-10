import React, { useCallback, useState, useMemo, useRef, DragEvent, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection as ReactFlowConnection,
  useNodesState,
  useEdgesState,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  MarkerType,
  ReactFlowProvider,
  ReactFlowInstance,
  useReactFlow,
  Controls,
  Handle,
  Position,
  getBezierPath,
  EdgeProps,
  EdgeLabelRenderer,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ChevronDown,
  Pencil,
  Edit,
  AlertTriangle,
  BrainCircuit,
  Save,
  X,
  Users,
  Activity,
  Trash2,
  Loader2,
  ZoomIn,
  ZoomOut,
  Locate,
  Lock,
  Unlock,
  PanelRightClose,
  PanelRightOpen,
  EyeOff,
  RefreshCw,
  Search,
  Calculator,
  FileText,
  Component,
  ClipboardCheck,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import {
  WorkflowTemplate,
  VisualEditorProps,
  AgentDefinition,
  TaskDefinition,
  Connection,
} from '@/types/workflow';
import { ResourcePanel } from './ResourcePanel';
import { AgentEditorPanel } from './AgentEditorPanel';
import { TaskEditorPanel } from './TaskEditorPanel';

// Custom Node Data Types
interface AgentNodeData {
  type: 'agent';
  agent: AgentDefinition;
  onDelete: (id: string) => void;
  onEdit: (agent: AgentDefinition) => void;
  onToolsChange: (agentId: string, tools: any[]) => void;
}

interface TaskNodeData {
  type: 'task';
  task: TaskDefinition;
  onDelete: (id: string) => void;
  onEdit: (task: TaskDefinition) => void;
}

const iconMap: { [key: string]: React.ElementType } = {
  search: Search,
  calculator: Calculator,
  file_reader: FileText,
  default: Component,
};

const getToolIcon = (iconName?: string) => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return iconMap.default;
};

// Agent Node Component
function AgentNode({ data, selected }: { data: AgentNodeData; selected?: boolean }) {
  const { t } = useTranslation();
  const { agent, onDelete, onEdit, onToolsChange } = data;
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [iconSize, setIconSize] = useState(24);

  const tools = agent.requiredTools || [];

  useEffect(() => {
    const calculateIconSize = () => {
      if (dropzoneRef.current && tools.length > 4) {
        const containerWidth = dropzoneRef.current.clientWidth;
        const numTools = tools.length;
        const gap = 4; // Corresponds to gap-1
        const padding = 6; // p-1.5 on each side
        const availableWidth = containerWidth - padding * 2;

        const calculatedSize = (availableWidth - (numTools - 1) * gap) / numTools;
        const newSize = Math.max(8, calculatedSize);
        
        setIconSize(newSize);
      } else {
        setIconSize(24);
      }
    };

    calculateIconSize();
    
    window.addEventListener('resize', calculateIconSize);
    return () => window.removeEventListener('resize', calculateIconSize);

  }, [tools.length]);


  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const toolData = event.dataTransfer.getData('application/json');
    if (toolData) {
      const tool = JSON.parse(toolData);
      const newTool = { ...tool, id: `${tool.id || 'tool'}-${Date.now()}` };
      onToolsChange(agent.id, [...tools, newTool]);
    }
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const borderClass = selected 
    ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
    : 'border-gray-200';

  return (
    <div className={`w-36 rounded-md bg-white shadow-sm hover:shadow-md relative group text-[11px] leading-snug transition-all duration-200 hover:-translate-y-0.5 ${borderClass} flex flex-col border`}>
      {selected && (
        <button
          className="absolute top-[-6px] right-[-6px] w-3.5 h-3.5 bg-white hover:bg-gray-100 rounded-full border border-gray-200 text-red-500 flex items-center justify-center transition-colors z-10"
          onClick={() => onDelete(agent.id)}
        >
          <Trash2 className="w-2 h-2" />
        </button>
      )}

      {/* Part 1: Agent Info */}
      <div className="p-1.5">
        <div className="flex items-start gap-1">
          <User className="w-3 h-3 text-indigo-500 mt-0.5" />
          <div className="flex-1">
            <div className="text-[11px] font-medium text-gray-800">{agent.role || t('agent.role_placeholder', 'Role of the agent')}</div>
            <div className="text-gray-500 text-[8px] mt-0.5 leading-tight">{agent.goal || t('agent.goal_placeholder', 'Goal of the agent')}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-100 mx-1.5" />

      {/* Part 2: LLM Model */}
      <div className="p-1.5">
        <div className="flex items-center gap-1 text-[9px] text-gray-500">
          <BrainCircuit className="w-3 h-3 text-gray-400" />
          <span>gpt-4o-mini</span>
        </div>
      </div>

      <div className="border-b border-gray-100 mx-1.5" />

      {/* Part 3: Tools Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="p-1.5"
      >
        <div ref={dropzoneRef} className="border border-dashed border-gray-200 rounded-sm p-1 min-h-[28px] flex flex-nowrap gap-1 items-center overflow-hidden">
          {tools.length === 0 ? (
            <span className="text-gray-400 w-full text-center text-[8px]">
              {t('agent.drop_tools_here', 'Drop tools here')}
            </span>
          ) : (
            tools.map(tool => (
              <div key={tool.id} className="group relative flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-gray-100 flex items-center justify-center p-0"
                  style={{ width: iconSize, height: iconSize }}
                >
                  {React.createElement(getToolIcon(tool.icon), { style: { width: iconSize * 0.6, height: iconSize * 0.6 } })}
                </Button>
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {tool.name}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Part 4: Footer */}
      <div className="flex justify-end items-center p-0.5 bg-gray-50/50 rounded-b-md h-5" />
      {selected && (
        <button
          className="absolute bottom-[-6px] right-[-6px] w-3.5 h-3.5 bg-white hover:bg-gray-100 rounded-full border border-gray-200 text-indigo-500 flex items-center justify-center transition-colors z-10"
          onClick={() => onEdit(agent)}
        >
          <Edit className="w-2 h-2" />
        </button>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-500"
        style={{ width: '6px', height: '6px' }}
      />
    </div>
  );
}

// Task Node Component
function TaskNode({ data, selected }: { data: TaskNodeData; selected?: boolean }) {
  const { t } = useTranslation();
  const { task, onDelete, onEdit } = data;

  const borderClass = selected 
    ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
    : 'border-gray-200';

  return (
    <div className={`w-36 rounded-md bg-white shadow-sm hover:shadow-md relative group text-[11px] leading-snug transition-all duration-200 hover:-translate-y-0.5 ${borderClass} flex flex-col border`}>
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-white !border-2 !border-indigo-400"
        style={{ width: '6px', height: '6px' }}
      />
      
      {selected && (
        <button
          className="absolute top-[-6px] right-[-6px] w-3.5 h-3.5 bg-white hover:bg-gray-100 rounded-full border border-gray-200 text-red-500 flex items-center justify-center transition-colors z-10"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="w-2 h-2" />
        </button>
      )}

      {/* Main Content */}
      <div className="p-1.5 flex-grow">
        <div className="flex items-start gap-1">
          <ClipboardCheck className="w-3 h-3 text-indigo-500 mt-0.5" />
          <div className="flex-1">
            <div className="text-[11px] font-medium text-gray-800">{task.name || t('task.name_placeholder', 'New Task')}</div>
            <div className="text-gray-500 text-[8px] mt-0.5 leading-tight">{task.description || t('task.description_placeholder', 'Task description')}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end items-center p-0.5 bg-gray-50/50 rounded-b-md border-t border-gray-100 h-5" />
      
      {selected && (
        <button
          className="absolute bottom-[-6px] right-[-6px] w-3.5 h-3.5 bg-white hover:bg-gray-100 rounded-full border border-gray-200 text-indigo-500 flex items-center justify-center transition-colors z-10"
          onClick={() => onEdit(task)}
        >
          <Edit className="w-2 h-2" />
        </button>
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-white !border-2 !border-indigo-400"
        style={{ width: '6px', height: '6px', left: '-3px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-indigo-500"
        style={{ width: '6px', height: '6px', right: '-3px' }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
  taskNode: TaskNode,
};

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { setEdges } = useReactFlow();

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <Button
              variant="outline"
              className="h-3 w-3 bg-white rounded-full hover:bg-gray-100 flex items-center justify-center"
              onClick={onEdgeClick}
              style={{
                color: style.stroke,
              }}
            >
              <X className="h-2 w-2" />
            </Button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = {
  custom: CustomEdge,
};


function VisualEditorComponent({ template, onSave, onCancel }: VisualEditorProps) {
  const { t } = useTranslation();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { zoomIn, zoomOut, fitView, getNodes } = useReactFlow();
  const [isInteractive, setIsInteractive] = useState(true);
  const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null);
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);

  const callbacks = useRef<any>({});

  const initialNodes: Node[] = useMemo(() => {
    if (!template?.definition) return [];
    const agentNodes = template.definition.agents?.map((agent) => ({
      id: agent.id,
      type: 'agentNode',
      position: agent.position,
      data: {
        type: 'agent',
        agent,
        onDelete: (id: string) => callbacks.current.deleteNode(id),
        onEdit: (agent: AgentDefinition) => callbacks.current.handleEditAgent(agent),
        onToolsChange: (agentId: string, tools: any[]) => callbacks.current.handleToolsChange(agentId, tools),
      },
    })) || [];
    const taskNodes = template.definition.tasks?.map((task) => ({
      id: task.id,
      type: 'taskNode',
      position: task.position,
      data: {
        type: 'task',
        task,
        onDelete: (id: string) => callbacks.current.deleteNode(id),
        onEdit: (task: TaskDefinition) => callbacks.current.handleEditTask(task),
      } as TaskNodeData,
    })) || [];
    return [...agentNodes, ...taskNodes];
  }, [template]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!template?.definition) return [];
    return template.definition.connections?.map((connection) => ({
      id: connection.id,
      source: connection.sourceId,
      target: connection.targetId,
      type: 'custom',
      markerEnd: { type: MarkerType.ArrowClosed },
    })) || [];
  }, [template]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleEditAgent = useCallback((agent: AgentDefinition) => {
    setEditingAgent(agent);
  }, []);

  const handleEditTask = useCallback((task: TaskDefinition) => {
    setEditingTask(task);
  }, []);

  const handleToolsChange = useCallback((agentId: string, tools: any[]) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === agentId) {
          const updatedAgent = { ...node.data.agent, requiredTools: tools };
          return { ...node, data: { ...node.data, agent: updatedAgent } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const addNode = useCallback((type: 'agent' | 'task', position: { x: number; y: number }) => {
    const id = `${type}-${Date.now()}`;
    let newNode: Node;
    if (type === 'agent') {
      const newAgent: AgentDefinition = { id, name: t('agent.newAgent'), role: '', goal: '', backstory: '', position, requiredTools: [] };
      newNode = { id, type: 'agentNode', position, data: { type: 'agent', agent: newAgent, onDelete: deleteNode, onEdit: handleEditAgent, onToolsChange: handleToolsChange } };
    } else {
      const newTask: TaskDefinition = { id, name: t('task.newTask'), description: '', expectedOutput: '', assignedAgentId: '', dependencies: [], position };
      newNode = { id, type: 'taskNode', position, data: { type: 'task', task: newTask, onDelete: deleteNode, onEdit: handleEditTask } as TaskNodeData };
    }
    setNodes((nds) => [...nds, newNode]);
  }, [t, setNodes, deleteNode, handleEditAgent, handleEditTask, handleToolsChange]);

  callbacks.current = { deleteNode, handleEditAgent, handleEditTask, handleToolsChange, addNode };

  const handleCloseAgentPanel = useCallback(() => {
    setEditingAgent(null);
  }, []);

  const handleSaveAgent = useCallback((updatedAgent: AgentDefinition) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === updatedAgent.id) {
          return { ...node, data: { ...node.data, agent: updatedAgent } };
        }
        return node;
      })
    );
    setEditingAgent(null);
  }, [setNodes]);

  const handleCloseTaskPanel = useCallback(() => {
    setEditingTask(null);
  }, []);

  const handleSaveTask = useCallback((updatedTask: TaskDefinition) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === updatedTask.id) {
          return { ...node, data: { ...node.data, task: updatedTask } };
        }
        return node;
      })
    );
    setEditingTask(null);
  }, [setNodes]);

  const toggleLock = () => setIsInteractive((interactive) => !interactive);

  const onConnect = useCallback((params: ReactFlowConnection) => {
    const newEdge = { ...params, type: 'custom', markerEnd: { type: MarkerType.ArrowClosed } };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const handleSave = useCallback(() => {
    const agents: AgentDefinition[] = [];
    const tasks: TaskDefinition[] = [];
    nodes.forEach((node) => {
      if (node.data.type === 'agent') agents.push({ ...node.data.agent, position: node.position });
      else if (node.data.type === 'task') tasks.push({ ...node.data.task, position: node.position });
    });
    const connections: Connection[] = edges.map(edge => ({
      id: edge.id!,
      sourceId: edge.source!,
      targetId: edge.target!,
      type: 'task-dependency',
    }));
    onSave({ ...template, definition: { agents, tasks, connections } });
  }, [nodes, edges, template, onSave]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type || !reactFlowInstance) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    callbacks.current.addNode(type as 'agent' | 'task', position);
  }, [reactFlowInstance]);

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <AgentEditorPanel
        agent={editingAgent}
        isOpen={!!editingAgent}
        onClose={handleCloseAgentPanel}
        onSave={handleSaveAgent}
      />
      <TaskEditorPanel
        task={editingTask}
        isOpen={!!editingTask}
        onClose={handleCloseTaskPanel}
        onSave={handleSaveTask}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedNode(null)}
        fitView
        className="bg-gray-50"
        nodesDraggable={isInteractive}
        nodesConnectable={isInteractive}
        elementsSelectable={isInteractive}
        zoomOnScroll={isInteractive}
        zoomOnDoubleClick={isInteractive}
        panOnDrag={isInteractive}
      >
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <Button variant="outline" size="icon" onClick={() => zoomIn()} className="bg-white">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => zoomOut()} className="bg-white">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => fitView()} className="bg-white">
            <Locate className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleLock} className="bg-white">
            {isInteractive ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </Button>
        </div>
      </ReactFlow>
    </div>
  );
}

export function VisualEditor({ template, onSave, onCancel }: VisualEditorProps) {
  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <VisualEditorComponent template={template} onSave={onSave} onCancel={onCancel} />
    </ReactFlowProvider>
  );
}
