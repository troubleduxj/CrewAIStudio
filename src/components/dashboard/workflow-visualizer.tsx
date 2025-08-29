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
import { ListChecks, Network, User } from 'lucide-react';
import React, { useState, useRef, MouseEvent, useEffect } from 'react';

type Vector2 = { x: number; y: number };

export type Node = {
  id: string;
  pos: Vector2;
  type: 'agent' | 'task';
  data: any;
};

const initialAgents: Node[] = [
  { 
    id: 'agent-1', 
    type: 'agent',
    pos: { x: 100, y: 120 }, 
    data: { role: 'Data Analyst' } 
  },
  { 
    id: 'agent-2', 
    type: 'agent',
    pos: { x: 100, y: 320 }, 
    data: { role: 'Web Researcher' } 
  },
];

const initialTasks: Node[] = [
  {
    id: 'task-1',
    type: 'task',
    pos: { x: 350, y: 50 },
    data: { name: 'Load Sales Data', agentId: 'agent-1', deps: [] },
  },
  {
    id: 'task-2',
    type: 'task',
    pos: { x: 600, y: 120 },
    data: { name: 'Calculate Q1 Revenue', agentId: 'agent-1', deps: ['task-1'] },
  },
  {
    id: 'task-3',
    type: 'task',
    pos: { x: 350, y: 320 },
    data: { name: 'Research Competitors', agentId: 'agent-2', deps: [] },
  },
  {
    id: 'task-4',
    type: 'task',
    pos: { x: 850, y: 220 },
    data: { name: 'Generate Sales Report', agentId: 'agent-1', deps: ['task-2', 'task-3'] },
  },
];

const nodeWidth = 220;
const nodeHeight = 68;

export default function WorkflowVisualizer() {
  const [nodes, setNodes] = useState<Node[]>([...initialAgents, ...initialTasks]);
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
    if(!node) return;
    
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
          className="relative w-full h-[400px] bg-background/50 rounded-lg border border-border/40 overflow-hidden select-none"
          onClick={() => setSelectedNodeId(null)}
        >
          <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--border))" />
              </marker>
            </defs>
            {/* Task dependency lines */}
            {nodes.filter(n => n.type === 'task' && n.data.deps.length > 0).flatMap(taskNode =>
                taskNode.data.deps.map((depId: string) => {
                const fromNode = getNode(depId);
                const toNode = getNode(taskNode.id);
                if (!fromNode || !toNode) return null;
                const fromPos = fromNode.pos;
                const toPos = toNode.pos;

                const fromX = fromPos.x + nodeWidth / 2;
                const fromY = fromPos.y;
                const toX = toPos.x - nodeWidth / 2;
                const toY = toPos.y;
                
                return (
                  <path
                    key={`${depId}-${taskNode.id}`}
                    d={`M ${fromX},${fromY} C ${fromX + 50},${fromY} ${toX - 50},${toY} ${toX},${toY}`}
                    stroke="hsl(var(--border))"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                );
              }),
            )}
             {/* Agent to Task lines */}
            {nodes.filter(n => n.type === 'task').map(taskNode => {
              const fromNode = getNode(taskNode.data.agentId);
              const toNode = getNode(taskNode.id);
              if (!fromNode || !toNode) return null;
              const fromPos = fromNode.pos;
              const toPos = toNode.pos;
              
              return (
                <line
                  key={`${taskNode.data.agentId}-${taskNode.id}`}
                  x1={fromPos.x + nodeWidth / 2}
                  y1={fromPos.y}
                  x2={toPos.x - nodeWidth / 2}
                  y2={toPos.y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {nodes.map(node => (
            <div
              key={node.id}
              onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              className={cn(
                'absolute flex items-center gap-3 p-3 rounded-lg shadow-lg cursor-grab transition-all',
                draggingNode === node.id ? 'cursor-grabbing' : 'cursor-grab',
                selectedNodeId === node.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
                node.type === 'agent' ? 'border-2 border-primary bg-card' : 'border border-accent bg-card'
              )}
              style={{
                left: node.pos.x,
                top: node.pos.y,
                width: `${nodeWidth}px`,
                height: `${nodeHeight}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {node.type === 'agent' ? (
                <>
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-bold text-sm text-primary/80">AGENT</div>
                    <div className="text-foreground">{node.data.role}</div>
                  </div>
                </>
              ) : (
                <>
                  <ListChecks className="w-5 h-5 text-accent" />
                  <div>
                    <div className="font-bold text-xs text-accent/80">TASK</div>
                    <div className="text-foreground text-sm">{node.data.name}</div>
                  </div>
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
