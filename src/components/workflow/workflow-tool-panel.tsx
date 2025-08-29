"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { User, ListChecks, Cog } from 'lucide-react';
import type { Tool } from '@/lib/types';
import { DragEvent } from 'react';

const availableAgents = [
    { id: 'agent-3', role: 'Financial Analyst' },
    { id: 'agent-4', role: 'Marketing Strategist' },
];

const availableTasks = [
    { id: 'task-5', name: 'Generate Financial Report' },
    { id: 'task-6', name: 'Create Marketing Plan' },
];

const availableTools: {name: Tool, label: string}[] = [
    { name: 'browser', label: 'Browser' },
    { name: 'calculator', label: 'Calculator' },
    { name: 'file_reader', label: 'File Reader' },
];

const handleDragStart = (e: DragEvent, tool: {name: Tool, label: string}) => {
  const toolData = JSON.stringify({ name: tool.name });
  e.dataTransfer.setData('application/json', toolData);
  e.dataTransfer.effectAllowed = 'move';
}

export default function WorkflowToolPanel() {
  return (
    <Card className="h-full flex flex-col rounded-none border-0 shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Toolbox</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={['agents', 'tasks', 'tools']} className="w-full">
          <AccordionItem value="agents">
            <AccordionTrigger>Agents</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {availableAgents.map(agent => (
                    <Button key={agent.id} variant="outline" className="w-full justify-start gap-2">
                        <User className="w-4 h-4" />
                        {agent.role}
                    </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tasks">
            <AccordionTrigger>Tasks</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {availableTasks.map(task => (
                    <Button key={task.id} variant="outline" className="w-full justify-start gap-2">
                        <ListChecks className="w-4 h-4" />
                        {task.name}
                    </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tools">
            <AccordionTrigger>Tools</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {availableTools.map(tool => (
                    <Button 
                      key={tool.name} 
                      variant="outline" 
                      className="w-full justify-start gap-2 cursor-grab"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, tool)}
                    >
                        <Cog className="w-4 h-4" />
                        {tool.label}
                    </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
