
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
    role: 'AI Research Specialist',
    goal: 'Identify the latest trends and technologies in AI Agents by conducting thorough web research and analysis.',
    backstory: 'An expert in AI, with a knack for identifying emerging patterns and technologies in the field.',
    tools: ['browser'],
  },
  {
    id: 'agent-2',
    role: 'Insightful Content Strategist',
    goal: 'Develop a compelling content strategy based on the research findings to attract a tech-savvy audience.',
    backstory: 'A creative strategist who translates complex technical information into engaging and accessible content.',
    tools: [],
  },
];

const mockTasks: Task[] = [
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
