
"use client";

import type { Task, TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const initialTasks: Task[] = [
  {
    id: 'task-1',
    agentId: 'agent-1',
    name: 'Load Sales Data',
    instructions: '',
    dependencies: [],
    status: 'completed',
    progress: 100,
    startTime: Date.now() - 20000,
    endTime: Date.now() - 15000,
    logs: [],
  },
  {
    id: 'task-2',
    agentId: 'agent-1',
    name: 'Calculate Q1 Revenue',
    instructions: '',
    dependencies: ['task-1'],
    status: 'completed',
    progress: 100,
    startTime: Date.now() - 15000,
    endTime: Date.now() - 10000,
    logs: [],
  },
  {
    id: 'task-3',
    agentId: 'agent-2',
    name: 'Research Competitors',
    instructions: '',
    dependencies: [],
    status: 'in_progress',
    progress: 20,
    startTime: Date.now() - 10000,
    logs: [],
  },
  {
    id: 'task-4',
    agentId: 'agent-1',
    name: 'Generate Sales Report',
    instructions: '',
    dependencies: ['task-2'],
    status: 'pending',
    progress: 0,
    logs: [],
  },
];

const statusConfig: Record<TaskStatus, { dot: string; text: string }> = {
  pending: { dot: 'bg-yellow-400', text: 'text-yellow-300' },
  in_progress: { dot: 'bg-accent animate-pulse', text: 'text-accent' },
  completed: { dot: 'bg-green-400', text: 'text-green-300' },
  error: { dot: 'bg-destructive', text: 'text-destructive' },
};

export default function StatusMonitor() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [time, setTime] = useState(() => Date.now());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTasks(initialTasks.map(t => ({
      ...t,
      startTime: t.startTime ? t.startTime - (initialTasks[0].startTime! - time) : undefined,
      endTime: t.endTime ? t.endTime - (initialTasks[0].startTime! - time) : undefined,
    })));

    const timer = setInterval(() => {
      setTime(Date.now());
      setTasks(currentTasks =>
        currentTasks.map(task => {
          if (task.status === 'in_progress' && task.progress < 100) {
            const newProgress = Math.min(task.progress + Math.random() * 10, 100);
            if (newProgress >= 100) {
              return {
                ...task,
                progress: 100,
                status: 'completed',
                endTime: Date.now(),
              };
            }
            return { ...task, progress: newProgress };
          }
          return task;
        }),
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const getDuration = (task: Task) => {
    if (!task.startTime) return '-';
    const endTime = task.endTime || time;
    const duration = Math.round((endTime - task.startTime) / 1000);
    return `${duration}s`;
  };

  if (!isClient) {
    return null;
  }

  return (
    <Card className="h-full bg-card/60 backdrop-blur-sm border-border/40">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Activity
            className="w-6 h-6 text-accent"
            style={{ filter: 'drop-shadow(0 0 5px hsl(var(--accent)))' }}
          />
          <div>
            <CardTitle>Real-time Status</CardTitle>
            <CardDescription>Monitor the progress of each task.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="font-medium">{task.name}</div>
                  <Progress
                    value={task.progress}
                    className="h-1.5 mt-1 [&>div]:bg-accent"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn('h-2.5 w-2.5 rounded-full', statusConfig[task.status].dot)}
                    />
                    <span
                      className={cn('capitalize', statusConfig[task.status].text)}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {getDuration(task)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
