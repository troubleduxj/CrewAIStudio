"use client";

import type { Agent, Tool } from '@/lib/types';
import { Cog, Pencil, PlusCircle, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    role: 'Data Analyst',
    goal: 'Analyze sales data to find key performance indicators',
    backstory: 'An expert in data analysis and visualization, with a knack for finding hidden patterns in large datasets.',
    tools: ['file_reader', 'calculator'],
    llm: 'deepseek-chat',
  },
  {
    id: 'agent-2',
    role: 'Web Researcher',
    goal: 'Find market trends and competitor strategies',
    backstory: 'A skilled operative in the digital world, capable of sifting through vast amounts of web data to find actionable intelligence.',
    tools: ['browser'],
    llm: 'deepseek-chat',
  },
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setEditingAgent(null);
    setIsSheetOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAgentData: Omit<Agent, 'id'> = {
      role: formData.get('role') as string,
      goal: formData.get('goal') as string,
      backstory: formData.get('backstory') as string,
      tools: formData.getAll('tools') as Tool[],
      llm: 'deepseek-chat',
    };

    const newAgent: Agent = {
      id: editingAgent?.id || `agent-${Date.now()}`,
      ...newAgentData,
    }

    if (editingAgent) {
      setAgents(agents.map(a => (a.id === newAgent.id ? newAgent : a)));
    } else {
      setAgents([...agents, newAgent]);
    }
    setIsSheetOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users /> 
            <div>
              <CardTitle>Agent 面板</CardTitle>
              <CardDescription>在这里管理和配置您的 AI Agent。</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> 新增 Agent
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map(agent => (
              <div
                key={agent.id}
                className="p-4 rounded-lg border bg-card flex items-start justify-between transition-all hover:border-primary/50"
              >
                <div>
                  <h3 className="font-semibold text-primary">{agent.role}</h3>
                  <p className="text-sm text-muted-foreground">{agent.goal}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Cog className="w-4 h-4 text-muted-foreground" />
                    {agent.tools.map(tool => (
                      <Badge
                        key={tool}
                        variant="secondary"
                        className="flex items-center gap-1.5 pl-2"
                      >
                        {toolIcons[tool]}
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <AgentEditorSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        agent={editingAgent}
        onSave={handleSave}
      />
    </>
  );
}

function AgentEditorSheet({
  isOpen,
  setIsOpen,
  agent,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agent: Agent | null;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="bg-background border-l-border/60 sm:max-w-[525px]">
        <SheetHeader>
          <SheetTitle>{agent ? '编辑 Agent' : '创建新 Agent'}</SheetTitle>
          <SheetDescription>
            配置您的 Agent 属性，完成后点击保存。
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSave} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Input
              id="role"
              name="role"
              defaultValue={agent?.role}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="goal" className="text-right mt-2">
              Goal
            </Label>
            <Textarea
              id="goal"
              name="goal"
              defaultValue={agent?.goal}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="backstory" className="text-right mt-2">
              Backstory
            </Label>
            <Textarea
              id="backstory"
              name="backstory"
              defaultValue={agent?.backstory}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Tools</Label>
            <div className="col-span-3 space-y-2">
              {Object.keys(toolIcons).map(tool => (
                <div key={tool} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`tool-${tool}`}
                    name="tools"
                    value={tool}
                    defaultChecked={agent?.tools.includes(tool as Tool)}
                    className="accent-primary h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <Label htmlFor={`tool-${tool}`} className="capitalize font-normal">
                    {tool.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
            <Button type="submit">保存</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
