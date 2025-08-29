
"use client";

import type { Agent, Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GitBranch, ListChecks, User, PlusCircle, Pencil } from 'lucide-react';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';

const mockAgents: Agent[] = [
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

const mockTasks: Task[] = [
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
  {
    id: 'task-4',
    agentId: 'agent-1',
    name: 'Generate Sales Report',
    instructions:
      'Generate a PDF report summarizing the sales data and Q1 revenue.',
    dependencies: ['task-2'],
    status: 'pending',
    progress: 0,
    logs: [],
  },
];

const statusConfig: Record<
  Task['status'],
  { badgeClass: string; label: string }
> = {
  pending: {
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    label: 'Pending',
  },
  in_progress: {
    badgeClass: 'bg-accent/20 text-accent border-accent/30',
    label: 'In Progress',
  },
  completed: {
    badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30',
    label: 'Completed',
  },
  error: {
    badgeClass: 'bg-destructive/20 text-destructive border-destructive/30',
    label: 'Error',
  },
};

export default function TaskEditor() {
  const [tasks] = useState<Task[]>(mockTasks);
  const getAgentRole = (agentId: string) =>
    mockAgents.find(a => a.id === agentId)?.role || 'Unknown Agent';

  return (
    <Card className="h-full bg-card/80">
       <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks />
            <div>
              <CardTitle>Task 面板</CardTitle>
              <CardDescription>在这里管理和配置您的 Task。</CardDescription>
            </div>
          </div>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> 新增 Task
          </Button>
        </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {tasks.map(task => (
            <AccordionItem value={task.id} key={task.id} className="border-border/50">
              <AccordionTrigger className="hover:no-underline font-medium text-base group">
                <div className="flex items-center gap-4 w-full">
                   <Badge
                    className={cn('w-28 justify-center', statusConfig[task.status].badgeClass)}
                  >
                    {statusConfig[task.status].label}
                  </Badge>
                  <span className="flex-1 text-left text-foreground">
                    {task.name}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pr-2">
                    <User className="h-4 w-4" />
                    <span>{getAgentRole(task.agentId)}</span>
                  </div>
                   <Button variant="ghost" size="icon" className='opacity-0 group-hover:opacity-100 transition-opacity'>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 bg-background/30 p-4 rounded-b-md">
                <p className="text-sm text-muted-foreground">
                  {task.instructions}
                </p>
                {task.dependencies.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    <span>Depends on: {task.dependencies.join(', ')}</span>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
