"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ListChecks, Network, User } from 'lucide-react';

const agents = [
  { id: 'agent-1', role: 'Data Analyst', pos: { x: 100, y: 120 } },
  { id: 'agent-2', role: 'Web Researcher', pos: { x: 100, y: 320 } },
];

const tasks = [
  {
    id: 'task-1',
    name: 'Load Sales Data',
    agentId: 'agent-1',
    deps: [],
    pos: { x: 350, y: 50 },
  },
  {
    id: 'task-2',
    name: 'Calculate Q1 Revenue',
    agentId: 'agent-1',
    deps: ['task-1'],
    pos: { x: 600, y: 120 },
  },
  {
    id: 'task-3',
    name: 'Research Competitors',
    agentId: 'agent-2',
    deps: [],
    pos: { x: 350, y: 320 },
  },
  {
    id: 'task-4',
    name: 'Generate Sales Report',
    agentId: 'agent-1',
    deps: ['task-2', 'task-3'],
    pos: { x: 850, y: 220 },
  },
];

export default function WorkflowVisualizer() {
  const getNodePos = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) return agent.pos;
    const task = tasks.find(t => t.id === id);
    if (task) return task.pos;
    return { x: 0, y: 0 };
  };

  const nodeWidth = 220;
  const nodeHeight = 68;

  return (
    <Card className="h-full min-h-[500px] bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Network
            className="w-6 h-6 text-accent"
            style={{ filter: 'drop-shadow(0 0 5px hsl(var(--accent)))' }}
          />
          <div>
            <CardTitle>Workflow Visualization</CardTitle>
            <CardDescription>
              Visual graph of the agent workflow and task dependencies.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[400px]">
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
            {/* Agent to Task lines */}
            {tasks.map(task => {
              const fromPos = getNodePos(task.agentId);
              const toPos = getNodePos(task.id);
              return (
                <line
                  key={`${task.agentId}-${task.id}`}
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
            {/* Task dependency lines */}
            {tasks.flatMap(task =>
              task.deps.map(depId => {
                const fromPos = getNodePos(depId);
                const toPos = getNodePos(task.id);
                return (
                  <path
                    key={`${depId}-${task.id}`}
                    d={`M ${fromPos.x + nodeWidth / 2},${fromPos.y} C ${
                      fromPos.x + nodeWidth / 2 + 50
                    },${fromPos.y} ${toPos.x - nodeWidth / 2 - 50},${toPos.y} ${
                      toPos.x - nodeWidth / 2
                    },${toPos.y}`}
                    stroke="hsl(var(--border))"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                );
              }),
            )}
          </svg>

          {agents.map(agent => (
            <div
              key={agent.id}
              className="absolute flex items-center gap-3 p-3 rounded-lg border-2 border-primary bg-card shadow-lg"
              style={{
                left: agent.pos.x,
                top: agent.pos.y,
                width: `${nodeWidth}px`,
                height: `${nodeHeight}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <User className="w-5 h-5 text-primary" />
              <div>
                <div className="font-bold text-sm text-primary/80">AGENT</div>
                <div className="text-foreground">{agent.role}</div>
              </div>
            </div>
          ))}

          {tasks.map(task => (
            <div
              key={task.id}
              className="absolute flex items-center gap-3 p-3 rounded-lg border border-accent bg-card shadow-lg"
              style={{
                left: task.pos.x,
                top: task.pos.y,
                width: `${nodeWidth}px`,
                height: `${nodeHeight}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <ListChecks className="w-5 h-5 text-accent" />
              <div>
                <div className="font-bold text-xs text-accent/80">TASK</div>
                <div className="text-foreground text-sm">{task.name}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
