"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import WorkflowNodeEditor from '@/components/workflow/workflow-node-editor';
import { cn } from '@/lib/utils';
import type { Agent, Task, Tool, Node } from '@/lib/types';
import { Cog, ListChecks, User, Network } from 'lucide-react';
import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import { Badge } from '../ui/badge';

type Vector2 = { x: number; y: number };

const initialAgents: Agent[] = [
  {
    id: 'agent-1',
    role: 'Data Analyst',
    goal: 'Analyze sales data',
    backstory: 'An expert in data analysis and visualization.',
    tools: ['file_reader', 'calculator'],
  },
  {
    id: 'agent-2',
    role: 'Web Researcher',
    goal: 'Find market trends',
    backstory: 'Skilled in browsing the web for information.',
    tools: ['browser'],
  },
];

const initialTasks: Task[] = [
    {
        id: 'task-1',
        agentId: 'agent-1',
        name: 'Load Sales Data',
        instructions: 'Load the sales data from `sales_data.csv`.',
        dependencies: [],
        status: 'completed',
        progress: 100,
        logs: [],
      },
      {
        id: 'task-2',
        agentId: 'agent-1',
        name: 'Calculate Q1 Revenue',
        instructions: 'Calculate the total revenue for the first quarter.',
        dependencies: ['task-1'],
        status: 'completed',
        progress: 100,
        logs: [],
      },
      {
        id: 'task-3',
        agentId: 'agent-2',
        name: 'Research Competitors',
        instructions: 'Research top 3 competitors in the market.',
        dependencies: [],
        status: 'in_progress',
        progress: 50,
        logs: [],
      },
]

const initialNodes: Node[] = [
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 150, y: 100 },
    data: initialAgents[0],
  },
  {
    id: 'agent-2',
    type: 'agent',
    position: { x: 150, y: 350 },
    data: initialAgents[1],
  },
  {
      id: 'task-1',
      type: 'task',
      position: {x: 450, y: 50},
      data: initialTasks[0]
  },
  {
      id: 'task-2',
      type: 'task',
      position: {x: 450, y: 180},
      data: initialTasks[1]
  },
  {
      id: 'task-3',
      type: 'task',
      position: {x: 450, y: 350},
      data: initialTasks[2]
  }
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
};

const Handle = ({ id, position }) => (
    <div
      id={id}
      className={cn(
        "absolute w-3 h-3 rounded-full bg-primary/70 border-2 border-background hover:bg-primary hover:scale-110 transition-all",
        position
      )}
    />
  );
  

export default function WorkflowVisualizer() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const dragOffset = useRef<Vector2>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    setIsEditorOpen(!!selectedNodeId);
  }, [selectedNodeId]);

  const getNode = (id: string) => {
    return nodes.find(n => n.id === id);
  };

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleSave = (updatedNode: Node) => {
    setNodes(prevNodes => prevNodes.map(n => n.id === updatedNode.id ? updatedNode : n));
    setSelectedNodeId(null);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();

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
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getConnections = () => {
    const connections = [];
    const tasksWithAgents = initialTasks.filter(t => t.agentId);
    tasksWithAgents.forEach(task => {
        if(task.agentId) {
            connections.push({source: task.agentId, target: task.id});
        }
    });
    return connections;
  }

  const connections = getConnections();

  const getPath = (sourceNode, targetNode) => {
    if (!sourceNode || !targetNode) return '';
    const sourcePos = sourceNode.position;
    const targetPos = targetNode.position;
    return `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + 100} ${sourcePos.y} ${targetPos.x - 100} ${targetPos.y} ${targetPos.x} ${targetPos.y}`;
  }


  return (
    <>
      <Card className="h-full min-h-[600px] bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Network
              className="w-6 h-6 text-accent"
              style={{ filter: 'drop-shadow(0 0 5px hsl(var(--accent)))' }}
            />
            <div>
              <CardTitle>工作流面板</CardTitle>
              <CardDescription>
                可视化 AI Agent 工作流，可拖动节点进行编排。
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={containerRef}
            className="relative w-full h-[500px] bg-background/50 rounded-lg border border-border/40 overflow-hidden select-none"
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
              {connections.map(({source, target}) => {
                const sourceNode = getNode(source);
                const targetNode = getNode(target);
                if (!sourceNode || !targetNode) return null;
                const path = getPath(sourceNode, targetNode);
                return (
                    <path key={`${source}-${target}`} d={path} stroke="hsl(var(--primary))" strokeWidth="2" fill="none" markerEnd='url(#arrowhead)' />
                )
              })}
            </svg>
            {nodes.map(node => (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                className={cn(
                  'absolute p-4 rounded-lg shadow-lg transition-all border-2 bg-card cursor-grab',
                  selectedNodeId === node.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary' : 'border-border/60',
                  draggingNode === node.id && 'cursor-grabbing shadow-2xl scale-105',
                  node.type === 'agent' ? 'w-64' : 'w-72'
                )}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {node.type === 'agent' && 'data' in node && (
                  <>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div className="font-bold text-primary">{(node.data as Agent).role}</div>
                    </div>
                     <div className="flex items-center gap-2 mt-2">
                        <Cog className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {(node.data as Agent).tools.map(tool => (
                            <Badge key={tool} variant="secondary" className="flex items-center gap-1.5 pl-2">
                              {toolIcons[tool]}
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    <Handle id={`${node.id}-bottom`} position="-bottom-1.5 left-1/2 -translate-x-1/2" />
                  </>
                )}
                {node.type === 'task' && 'data' in node && (
                    <>
                        <div className="flex items-center gap-3">
                            <ListChecks className="w-5 h-5 text-primary" />
                            <div className="font-bold text-primary">{(node.data as Task).name}</div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{(node.data as Task).instructions}</p>
                        <Handle id={`${node.id}-top`} position="-top-1.5 left-1/2 -translate-x-1/2" />
                        <Handle id={`${node.id}-left`} position="-left-1.5 top-1/2 -translate-y-1/2" />
                        <Handle id={`${node.id}-right`} position="-right-1.5 top-1/2 -translate-y-1/2" />
                    </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {selectedNode && (
        <WorkflowNodeEditor
          node={selectedNode}
          isOpen={isEditorOpen}
          setIsOpen={(open) => {
            if (!open) setSelectedNodeId(null);
            setIsEditorOpen(open);
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
}
