"use client";

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import WorkflowNodeEditor from '@/components/workflow/workflow-node-editor';
import { cn } from '@/lib/utils';
import type { Agent, Task, Tool, Node } from '@/lib/types';
import { Cog, ListChecks, User, BrainCircuit, GripVertical, Trash2, Pencil, Check, X } from 'lucide-react';
import React, { useState, useRef, MouseEvent, useEffect, DragEvent } from 'react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type Vector2 = { x: number; y: number };

export const initialAgents: Agent[] = [
  {
    id: 'agent-1',
    role: 'AI Research Specialist',
    goal: 'Identify the latest trends and technologies in AI Agents by conducting thorough web research and analysis.',
    backstory: 'An expert in AI, with a knack for identifying emerging patterns and technologies in the field.',
    tools: ['browser'],
    llm: 'deepseek-chat',
  },
  {
    id: 'agent-2',
    role: 'Insightful Content Strategist',
    goal: 'Develop a compelling content strategy based on the research findings to attract a tech-savvy audience.',
    backstory: 'A creative strategist who translates complex technical information into engaging and accessible content.',
    tools: [],
    llm: 'deepseek-chat',
  },
];

export const initialTasks: Task[] = [
    {
        id: 'task-1',
        agentId: 'agent-1',
        name: 'Research AI Agent Trends',
        instructions: 'Investigate and summarize the top 3 emerging trends in AI Agent technology for 2024. Focus on new architectures, capabilities, and popular use cases.',
        dependencies: [],
        status: 'pending',
        progress: 0,
        logs: [],
      },
      {
        id: 'task-2',
        agentId: 'agent-2',
        name: 'Formulate Content Strategy',
        instructions: 'Using the research on AI Agent trends, create a content plan for a blog and social media. The plan should include 3 blog post ideas with brief outlines and 5 social media post concepts.',
        dependencies: ['task-1'],
        status: 'pending',
        progress: 0,
        logs: [],
      },
]

export const initialNodes: Node[] = [
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 400, y: 150 },
    data: initialAgents[0],
  },
  {
    id: 'task-1',
    type: 'task',
    position: {x: 400, y: 400},
    data: initialTasks[0]
  },
  {
    id: 'agent-2',
    type: 'agent',
    position: { x: 800, y: 150 },
    data: initialAgents[1],
  },
  {
      id: 'task-2',
      type: 'task',
      position: {x: 800, y: 400},
      data: initialTasks[1]
  },
];

const toolIcons: Record<Tool, React.ReactNode> = {
  browser: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  calculator: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <line x1="16" x2="12" y1="14" y2="14" />
      <line x1="12" x2="12" y1="14" y2="18" />
      <line x1="8" x2="8" y1="14" y2="18" />
      <line x1="12" x2="8" y1="10" y2="10" />
    </svg>
  ),
  file_reader: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  database: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  code_executor: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  api_client: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
};

const Handle = ({ id, position }: { id: string, position: string }) => (
    <div
      id={id}
      className={cn(
        "absolute w-3 h-3 rounded-full bg-primary/70 border-2 border-background hover:bg-primary hover:scale-110 transition-all",
        position
      )}
    />
  );
  

interface WorkflowVisualizerProps {
  nodes?: Node[];
  onNodesChange?: (nodes: Node[]) => void;
  selectedNode?: Node | null;
  onNodeSelect?: (node: Node | null) => void;
  onNodeUpdate?: (node: Node) => void;
  onNodeDelete?: (nodeId: string) => void;
  isDragging?: boolean;
  isToolDragging?: boolean;
}

export default function WorkflowVisualizer({
  nodes: externalNodes,
  onNodesChange,
  selectedNode: externalSelectedNode,
  onNodeSelect,
  onNodeUpdate,
  onNodeDelete,
  isDragging = false,
  isToolDragging = false
}: WorkflowVisualizerProps = {}) {

  const [internalNodes, setInternalNodes] = useState<Node[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);
  const dragOffset = useRef<Vector2>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const wasDragged = useRef(false);

  // 使用外部传入的nodes或内部state
  const nodes = externalNodes || internalNodes;
  const setNodes = onNodesChange || setInternalNodes;

  // 同步外部选中的节点
  useEffect(() => {
    if (externalSelectedNode) {
      setSelectedNodeId(externalSelectedNode.id);
    } else if (externalSelectedNode === null) {
      setSelectedNodeId(null);
    }
  }, [externalSelectedNode]);

  useEffect(() => {
    // If a node is selected, the editor opens.
    // If no node is selected, the editor closes.
    // This is managed separately from just clicking to handle cases where a node is deleted.
    setIsEditorOpen(!!selectedNodeId && isEditorOpen);
  }, [selectedNodeId, isEditorOpen]);

  const getNode = (id: string) => {
    return nodes.find(n => n.id === id);
  };

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;

  const handleNodeClick = (nodeId: string) => {
    if (wasDragged.current) {
        return;
    }
    const node = getNode(nodeId);
    setSelectedNodeId(nodeId);
    if (onNodeSelect && node) {
      onNodeSelect(node);
    }
  };
  
  /**
   * 处理删除节点 - 第一次点击显示确认按钮，第二次点击确认删除
   * @param e 鼠标事件
   * @param nodeId 节点ID
   */
  const handleDeleteNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation(); // Prevent click from bubbling to the node
    
    if (pendingDeleteNodeId === nodeId) {
      // 第二次点击，确认删除
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      if(selectedNodeId === nodeId) {
        setSelectedNodeId(null);
        setIsEditorOpen(false); // Close editor if the deleted node was being edited
        if (onNodeSelect) {
          onNodeSelect(null);
        }
      }
      if (onNodeDelete) {
        onNodeDelete(nodeId);
      }
      setPendingDeleteNodeId(null);
    } else {
      // 第一次点击，显示确认状态
      setPendingDeleteNodeId(nodeId);
    }
  }
  
  /**
   * 确认删除节点
   * @param e 鼠标事件
   * @param nodeId 节点ID
   */
  const handleConfirmDelete = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    if(selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setIsEditorOpen(false);
      if (onNodeSelect) {
        onNodeSelect(null);
      }
    }
    if (onNodeDelete) {
      onNodeDelete(nodeId);
    }
    setPendingDeleteNodeId(null);
  }
  
  /**
   * 取消删除
   * @param e 鼠标事件
   */
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteNodeId(null);
  }


  const handleSave = (updatedNode: Node) => {
    setNodes(prevNodes => prevNodes.map(n => n.id === updatedNode.id ? updatedNode : n));
    setIsEditorOpen(false);
    setSelectedNodeId(null);
    if (onNodeUpdate) {
      onNodeUpdate(updatedNode);
    }
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  };
  
  const handleEditClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setIsEditorOpen(true);
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, nodeId: string) => {
    // Prevent drag from starting on input elements
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).closest('[data-radix-select-trigger]')) {
        return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    wasDragged.current = false;
    
    const node = getNode(nodeId);
    if (!node) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setDraggingNode(nodeId);
    dragOffset.current = {
      x: e.clientX - containerRect.left - node.position.x,
      y: e.clientY - containerRect.top - node.position.y,
    };

    const handleMouseMove = (me: globalThis.MouseEvent) => {
      if (!containerRect) return;
      // Set wasDragged to true if mouse moves more than a few pixels
      if (Math.abs(me.clientX - e.clientX) > 5 || Math.abs(me.clientY - e.clientY) > 5) {
        wasDragged.current = true;
      }

      const newX = me.clientX - containerRect.left - dragOffset.current.x;
      const newY = me.clientY - containerRect.top - dragOffset.current.y;

      setNodes(prevNodes =>
        prevNodes.map(n =>
          n.id === nodeId ? { ...n, position: { x: newX, y: newY } } : n
        )
      );
    };

    const handleMouseUp = () => {
      setDraggingNode(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Use a timeout to reset wasDragged, allowing click to fire if it wasn't a drag
      setTimeout(() => {
          wasDragged.current = false;
      }, 0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getConnections = () => {
    const connections: {source: string, target: string}[] = [];
    const tasks = nodes.filter(n => n.type === 'task').map(n => n.data as Task);
    
    tasks.forEach(task => {
        if(task.agentId) {
            connections.push({source: task.agentId, target: task.id});
        }
        if(task.dependencies) {
            task.dependencies.forEach(depId => {
                connections.push({source: depId, target: task.id})
            })
        }
    });

    return connections;
  }

  const connections = getConnections();

  const getPath = (sourceNode: Node, targetNode: Node) => {
    if (!sourceNode || !targetNode) return '';
  
    const sourceIsAgent = sourceNode.type === 'agent';
    const sourceNodeWidth = 288; // w-72
    const sourceNodeHeight = sourceIsAgent ? 228 : 76;
  
    const targetIsTask = targetNode.type === 'task';
    const targetNodeWidth = 288; // w-72
    const targetNodeHeight = 76;
  
    const sourceHandle = {
      x: sourceNode.position.x,
      y: sourceNode.position.y + sourceNodeHeight / 2,
    };
  
    const targetHandle = {
      x: targetNode.position.x,
      y: targetNode.position.y - targetNodeHeight / 2,
    };
  
    if (sourceIsAgent && targetIsTask) {
      // Connect agent's bottom to task's top
      sourceHandle.x = sourceNode.position.x;
      sourceHandle.y = sourceNode.position.y + sourceNodeHeight / 2;
      targetHandle.x = targetNode.position.x;
      targetHandle.y = targetNode.position.y - targetNodeHeight / 2;
    } else {
      // Task-to-Task connection (side to side)
      sourceHandle.x = sourceNode.position.x + sourceNodeWidth / 2;
      sourceHandle.y = sourceNode.position.y;
      targetHandle.x = targetNode.position.x - targetNodeWidth / 2;
      targetHandle.y = targetNode.position.y;
    }
  
    let C1_X, C1_Y, C2_X, C2_Y;
  
    if (sourceIsAgent && targetIsTask) {
      // Vertical curve
      C1_X = sourceHandle.x;
      C1_Y = sourceHandle.y + 80;
      C2_X = targetHandle.x;
      C2_Y = targetHandle.y - 80;
    } else {
      // Horizontal curve
      C1_X = sourceHandle.x + 80;
      C1_Y = sourceHandle.y;
      C2_X = targetHandle.x - 80;
      C2_Y = targetHandle.y;
    }
  
    return `M ${sourceHandle.x} ${sourceHandle.y} C ${C1_X} ${C1_Y} ${C2_X} ${C2_Y} ${targetHandle.x} ${targetHandle.y}`;
  };



  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  const handleDrop = (e: DragEvent, targetNodeId: string) => {
    e.preventDefault();
    e.stopPropagation(); // 总是阻止事件冒泡到画布

    const toolData = e.dataTransfer.getData("application/json");
    if(!toolData) return;

    try {
      const draggedData = JSON.parse(toolData);
      
      // 只有当拖拽的是工具类型且目标是Agent节点时才处理
      if (draggedData.type === 'tool') {
        const toolName = draggedData.name;
        setNodes(prevNodes => prevNodes.map(node => {
          if (node.id === targetNodeId && node.type === 'agent') {
            const agentData = node.data as Agent;
            // 确保tools数组存在，如果不存在则初始化为空数组
            const currentTools = agentData.tools || [];
            if (!currentTools.includes(toolName)) {
              const newTools = [...currentTools, toolName];
              return {
                ...node,
                data: { ...agentData, tools: newTools }
              }
            }
          }
          return node;
        }));
        return; // 确保工具拖拽处理完成后直接返回
      }
      // 如果不是工具类型，不处理
    } catch (error) {
      console.warn('Failed to parse drag data:', error);
    }
  }


  return (
    <>
      <div className="h-full overflow-hidden shadow-none rounded-none border-0">
        <CardContent className="p-0 h-full">
          <div
            ref={containerRef}
            className="relative w-full h-full min-h-[calc(100vh-8rem)] bg-background/50 overflow-auto"
            onClick={() => setSelectedNodeId(null)}
          >
            <svg className="absolute w-full h-full" pointerEvents="none">
              <defs>
                <marker
                    id="arrowhead"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
                </marker>
              </defs>
              {connections.map(({source, target}, index) => {
                const sourceNode = getNode(source);
                const targetNode = getNode(target);
                if (!sourceNode || !targetNode) return null;
                const path = getPath(sourceNode, targetNode);
                return (
                    <path key={`${source}-${target}-${index}`} d={path} stroke="hsl(var(--primary))" strokeWidth="2" fill="none" markerEnd='url(#arrowhead)' />
                )
              })}
            </svg>
            {nodes.map(node => (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                className={cn(
                  'absolute p-4 rounded-lg shadow-lg transition-all duration-300 border-2 bg-card cursor-grab hover:shadow-2xl hover:scale-110 hover:border-primary/50 hover:bg-card/90 hover:-translate-y-2',
                  selectedNodeId === node.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary' : 'border-border/60',
                  draggingNode === node.id && 'cursor-grabbing shadow-2xl scale-105 z-10',
                  node.type === 'agent' ? 'w-72' : 'w-72',
                  isToolDragging && node.type === 'agent' && 'scale-110 shadow-2xl -translate-y-2'
                )}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {selectedNodeId === node.id && (
                  <div className="absolute -top-3 -right-3 z-20 flex gap-1">
                    <button
                      onClick={(e) => handleDeleteNode(e, node.id)}
                      className="bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 transition-colors shadow-md"
                      aria-label="Delete Node"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {pendingDeleteNodeId === node.id && (
                      <>
                        <button
                          onClick={(e) => handleConfirmDelete(e, node.id)}
                          className="bg-green-600 text-white rounded-full p-1.5 hover:bg-green-700 transition-colors shadow-md"
                          aria-label="Confirm Delete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleCancelDelete(e)}
                          className="bg-gray-600 text-white rounded-full p-1.5 hover:bg-gray-700 transition-colors shadow-md"
                          aria-label="Cancel Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                <button 
                  onClick={(e) => handleEditClick(e, node.id)}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-secondary text-secondary-foreground rounded-full p-1.5 hover:bg-primary hover:text-primary-foreground transition-colors shadow-md"
                  aria-label="Edit Node"
                >
                    <Pencil className="w-4 h-4" />
                </button>


                {node.type === 'agent' && 'data' in node && (
                  <div className='space-y-3'>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div className="font-bold text-primary flex-1 truncate">{(node.data as Agent).role}</div>
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    </div>
                    
                    <div className="space-y-2">
                       <div className='flex items-center gap-2 text-sm'>
                         <BrainCircuit className="w-4 h-4 text-muted-foreground" />
                         <span className="text-muted-foreground">LLM</span>
                       </div>
                       <Select defaultValue={(node.data as Agent).llm || 'deepseek-chat'}>
                         <SelectTrigger className='h-8 text-xs'>
                           <SelectValue placeholder="Select LLM" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="gemini-1.5-flash-latest">gemini-1.5-flash-latest</SelectItem>
                           <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                           <SelectItem value="deepseek-chat">deepseek-chat</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div className="space-y-2">
                       <div className='flex items-center gap-2 text-sm'>
                         <Cog className="w-4 h-4 text-muted-foreground" />
                         <span className="text-muted-foreground">Tools</span>
                       </div>
                       <div>
                         {(node.data as Agent).tools && (node.data as Agent).tools.length > 0 ? (
                           <div 
                             className={cn(
                               "mt-2 p-2 min-h-[72px] rounded-md border-2 flex flex-wrap gap-2 items-center justify-start bg-background/50 transition-all",
                               isToolDragging ? "border-dashed border-blue-500 animate-pulse" : "border-solid border-border/50"
                             )}
                             onDragOver={handleDragOver} 
                             onDrop={(e) => handleDrop(e, node.id)}
                           >
                             {(node.data as Agent).tools.map(tool => (
                               <div 
                                 key={tool} 
                                 className="p-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
                                 title={tool}
                               >
                                 {toolIcons[tool]}
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div 
                             className={cn(
                               'mt-2 h-16 rounded-md border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground bg-background/50 transition-all',
                               isToolDragging ? 'border-blue-500 animate-pulse' : 'border-border/50'
                             )}
                             onDragOver={handleDragOver} 
                             onDrop={(e) => handleDrop(e, node.id)}
                           >
                             Drag tools here
                           </div>
                         )}
                       </div>
                     </div>
                    <Handle id={`${node.id}-bottom`} position="-bottom-1.5 left-1/2 -translate-x-1/2" />
                  </div>
                )}
                {node.type === 'task' && 'data' in node && (
                    <>
                        <div className="flex items-center gap-3">
                            <ListChecks className="w-5 h-5 text-primary" />
                            <div className="font-bold text-primary flex-1 truncate">{(node.data as Task).name}</div>
                            <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{(node.data as Task).instructions}</p>
                        <Handle id={`${node.id}-top`} position="-top-1.5 left-1/2 -translate-x-1/2" />
                        <Handle id={`${node.id}-left`} position="-left-1.5 top-1/2 -translate-y-1/2" />
                        <Handle id={`${node.id}-right`} position="right-[-7px] top-1/2 -translate-y-1/2" />
                    </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </div>
      {selectedNode && (
        <WorkflowNodeEditor
          node={selectedNode}
          isOpen={isEditorOpen}
          setIsOpen={(open) => {
            if (!open) {
                setSelectedNodeId(null);
            }
            setIsEditorOpen(open);
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
}
