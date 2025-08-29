"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, PlusCircle, Pencil } from 'lucide-react';
import type { Tool } from '@/lib/types';
import Image from 'next/image';

interface ToolDefinition {
  id: Tool;
  name: string;
  description: string;
  icon: string;
}

const availableTools: ToolDefinition[] = [
  {
    id: 'browser',
    name: 'Browser',
    description: 'A tool for browsing websites to gather information.',
    icon: 'https://placehold.co/40x40/6366f1/white?text=B',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'A tool for performing mathematical calculations.',
    icon: 'https://placehold.co/40x40/ec4899/white?text=C',
  },
  {
    id: 'file_reader',
    name: 'File Reader',
    description: 'A tool for reading the content of local files.',
    icon: 'https://placehold.co/40x40/22c55e/white?text=FR',
  },
];

export default function ToolsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench />
          <div>
            <CardTitle>工具面板</CardTitle>
            <CardDescription>
              在这里管理和配置您的 Agent 可以使用的工具。
            </CardDescription>
          </div>
        </div>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> 新增工具
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availableTools.map(tool => (
            <div
              key={tool.id}
              className="p-4 rounded-lg border bg-card flex items-center justify-between transition-all hover:border-primary/50"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={tool.icon}
                  alt={`${tool.name} icon`}
                  width={40}
                  height={40}
                  className="rounded-md"
                />
                <div>
                  <h3 className="font-semibold text-primary">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
