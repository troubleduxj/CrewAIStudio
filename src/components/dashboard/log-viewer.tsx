"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const initialLogs = [
  '[INFO] Crew starting...',
  '[AGENT:Data Analyst] Starting task: Load Sales Data',
  '[TOOL:file_reader] Reading file `sales_data.csv`...',
  '[TOOL:file_reader] Successfully read 10,000 rows.',
  '[AGENT:Data Analyst] Task completed: Load Sales Data',
  '[AGENT:Data Analyst] Starting task: Calculate Q1 Revenue',
  '[TOOL:calculator] Calculating sum of `revenue` column for Q1...',
  '[TOOL:calculator] Result: $1,254,300.50',
  '[AGENT:Data Analyst] Task completed: Calculate Q1 Revenue',
  '[AGENT:Web Researcher] Starting task: Research Competitors',
  '[TOOL:browser] Searching for "top E-commerce competitors 2024"',
];

export default function LogViewer() {
  const [logs, setLogs] = useState<string[]>(initialLogs);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logTimer = setInterval(() => {
      setLogs(prev => [
        ...prev,
        `[TOOL:browser] Browsing page... https://site.com/${Math.random().toString(36).substring(7)}`,
      ]);
    }, 3000);
    return () => clearInterval(logTimer);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Terminal
            className="w-6 h-6 text-accent"
            style={{ filter: 'drop-shadow(0 0 5px hsl(var(--accent)))' }}
          />
          <div>
            <CardTitle>Log Viewer</CardTitle>
            <CardDescription>
              Detailed logs of agent activity and task execution.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full rounded-md border border-border/50 bg-background/50 p-4 font-mono">
          <div ref={scrollAreaRef}>
          {logs.map((log, index) => (
            <div key={index} className="text-xs">
              <span className="text-accent/70 mr-2">
                {new Date().toLocaleTimeString()}
              </span>
              <span
                dangerouslySetInnerHTML={{
                  __html: log
                    .replace(/\[(.*?)\]/g, '<span class="text-primary/80">[$1]</span>')
                    .replace(/`([^`]+)`/g, '<span class="text-accent/90">`$1`</span>'),
                }}
              />
            </div>
          ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
