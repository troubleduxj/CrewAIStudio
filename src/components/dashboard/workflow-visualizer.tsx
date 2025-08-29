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
import { Agent, Task, Tool } from '@/lib/types';
import { Cog, ListChecks, User, GripVertical } from 'lucide-react';
import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import { Badge } from '../ui/badge';

type Vector2 = { x: number; y: number };

export interface Node {
  id: string;
  pos: Vector2;
  data: Agent;
}

const initialAgents: Agent[] = [
  {
    id: 'agent-1',
    role: 'Data Analyst',
    goal: 'Analyze sales data',
    backstory: 'An expert in data analysis and visualization.',
    tools: ['file_reader', 'calculator'],
    tasks: [
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
    ],
  },
  {
    id: 'agent-2',
    role: 'Web Researcher',
    goal: 'Find market trends',
    backstory: 'Skilled in browsing the web for information.',
    tools: ['browser'],
    tasks: [
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
    ],
  },
];

const initialNodes: Node[] = [
  {
    id: 'agent-1',
    pos: { x: 250, y: 180 },
    data: initialAgents[0],
  },
  {
    id: 'agent-2',
    pos: { x: 650, y: 180 },
    data: initialAgents[1],
  },
];

const nodeWidth = 300;
const nodeHeight = "auto";

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

    handleNodeClick(nodeId);

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setDraggingNode(nodeId);
    dragOffset.current = {
      x: e.clientX - containerRect.left - node.pos.x,
      y: e.clientY - containerRect.top - node.pos.y,
    };

    const handleMouseMove = (me: globalThis.MouseEvent) => {
      if (!containerRect) return;
      const newX = me.clientX - containerRect.left - dragOffset.current.x;
      const newY = me.clientY - containerRect.top - dragOffset.current.y;

      setNodes(prevNodes =>
        prevNodes.map(n =>
          n.id === nodeId ? { ...n, pos: { x: newX, y: newY } } : n
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

  return (
    <>
      <Card className="h-full min-h-[500px] bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <User
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
            className="relative w-full h-[400px] bg-background/50 rounded-lg border border-border/40 overflow-hidden select-none"
            onClick={() => setSelectedNodeId(null)}
          >
            {nodes.map(node => (
              <div
                key={node.id}
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                className={cn(
                  'absolute flex flex-col gap-3 p-3 rounded-lg shadow-lg transition-all border-2 bg-card',
                  selectedNodeId === node.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary' : 'border-primary/50',
                )}
                style={{
                  left: node.pos.x,
                  top: node.pos.y,
                  width: `${nodeWidth}px`,
                  height: nodeHeight,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  className={cn(
                    'flex items-center gap-3 cursor-grab',
                    draggingNode === node.id ? 'cursor-grabbing' : 'cursor-grab',
                  )}
                >
                  <GripVertical className="text-muted-foreground" />
                  <User className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-bold text-primary">{node.data.role}</div>
                  </div>
                </div>

                <div className="space-y-2 pl-4">
                  <div className="flex items-center gap-2">
                    <Cog className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {node.data.tools.map(tool => (
                        <Badge key={tool} variant="secondary" className="flex items-center gap-1.5 pl-2">
                          {toolIcons[tool]}
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <ListChecks className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex flex-col gap-1 w-full">
                      {node.data.tasks.map(task => (
                        <div key={task.id} className="text-xs bg-background/50 p-1.5 rounded">
                          {task.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
