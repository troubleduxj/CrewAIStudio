import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { X, Plus, Trash2, Users, Activity } from 'lucide-react';

import { AgentDefinition, TaskDefinition } from '@/types/workflow';

interface NodeEditorProps {
  node: AgentDefinition | TaskDefinition;
  type: 'agent' | 'task';
  onSave: (node: AgentDefinition | TaskDefinition) => void;
  onCancel: () => void;
}

// Agent 表单验证 schema
const agentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  role: z.string().min(1, 'Role is required'),
  goal: z.string().min(1, 'Goal is required'),
  backstory: z.string().min(1, 'Backstory is required'),
  requiredTools: z.array(z.string()).optional(),
});

// Task 表单验证 schema
const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Description is required'),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  assignedAgentId: z.string().min(1, 'Assigned agent is required'),
  dependencies: z.array(z.string()).optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;
type TaskFormData = z.infer<typeof taskSchema>;

export function NodeEditor({ node, type, onSave, onCancel }: NodeEditorProps) {
  const { t } = useTranslation();
  const [newTool, setNewTool] = useState('');
  const [newDependency, setNewDependency] = useState('');

  // Agent 表单
  const agentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: type === 'agent' ? {
      name: (node as AgentDefinition).name,
      role: (node as AgentDefinition).role,
      goal: (node as AgentDefinition).goal,
      backstory: (node as AgentDefinition).backstory,
      requiredTools: (node as AgentDefinition).requiredTools || [],
    } : undefined,
  });

  // Task 表单
  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: type === 'task' ? {
      name: (node as TaskDefinition).name,
      description: (node as TaskDefinition).description,
      expectedOutput: (node as TaskDefinition).expectedOutput,
      assignedAgentId: (node as TaskDefinition).assignedAgentId,
      dependencies: (node as TaskDefinition).dependencies || [],
    } : undefined,
  });

  const handleAgentSubmit = (data: AgentFormData) => {
    const updatedAgent: AgentDefinition = {
      ...(node as AgentDefinition),
      ...data,
      requiredTools: data.requiredTools || [],
    };
    onSave(updatedAgent);
  };

  const handleTaskSubmit = (data: TaskFormData) => {
    const updatedTask: TaskDefinition = {
      ...(node as TaskDefinition),
      ...data,
      dependencies: data.dependencies || [],
    };
    onSave(updatedTask);
  };

  const addTool = () => {
    if (newTool.trim() && type === 'agent') {
      const currentTools = agentForm.getValues('requiredTools') || [];
      if (!currentTools.includes(newTool.trim())) {
        agentForm.setValue('requiredTools', [...currentTools, newTool.trim()]);
        setNewTool('');
      }
    }
  };

  const removeTool = (toolToRemove: string) => {
    if (type === 'agent') {
      const currentTools = agentForm.getValues('requiredTools') || [];
      agentForm.setValue('requiredTools', currentTools.filter(tool => tool !== toolToRemove));
    }
  };

  const addDependency = () => {
    if (newDependency.trim() && type === 'task') {
      const currentDeps = taskForm.getValues('dependencies') || [];
      if (!currentDeps.includes(newDependency.trim())) {
        taskForm.setValue('dependencies', [...currentDeps, newDependency.trim()]);
        setNewDependency('');
      }
    }
  };

  const removeDependency = (depToRemove: string) => {
    if (type === 'task') {
      const currentDeps = taskForm.getValues('dependencies') || [];
      taskForm.setValue('dependencies', currentDeps.filter(dep => dep !== depToRemove));
    }
  };

  return (
    <Sheet open={true} onOpenChange={() => onCancel()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {type === 'agent' ? (
              <>
                <Users className="h-5 w-5" />
                {t('agent.editAgent')}
              </>
            ) : (
              <>
                <Activity className="h-5 w-5" />
                {t('task.editTask')}
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {type === 'agent' 
              ? t('agent.editAgentDescription')
              : t('task.editTaskDescription')
            }
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          {type === 'agent' ? (
            <Form {...agentForm}>
              <form onSubmit={agentForm.handleSubmit(handleAgentSubmit)} className="space-y-6">
                <FormField
                  control={agentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('agent.name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('agent.namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={agentForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('agent.role')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('agent.rolePlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('agent.roleDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={agentForm.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('agent.goal')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('agent.goalPlaceholder')} 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {t('agent.goalDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={agentForm.control}
                  name="backstory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('agent.backstory')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('agent.backstoryPlaceholder')} 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {t('agent.backstoryDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <Label>{t('agent.requiredTools')}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('agent.toolPlaceholder')}
                      value={newTool}
                      onChange={(e) => setNewTool(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
                    />
                    <Button type="button" variant="outline" onClick={addTool}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(agentForm.watch('requiredTools') || []).map((tool, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tool}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeTool(tool)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <SheetFooter>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('common.save')}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          ) : (
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="space-y-6">
                <FormField
                  control={taskForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('task.name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('task.namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('task.description')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('task.descriptionPlaceholder')} 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {t('task.descriptionDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="expectedOutput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('task.expectedOutput')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('task.expectedOutputPlaceholder')} 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {t('task.expectedOutputDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="assignedAgentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('task.assignedAgent')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('task.selectAgent')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="agent-1">Agent 1</SelectItem>
                          <SelectItem value="agent-2">Agent 2</SelectItem>
                          {/* 这里应该动态加载可用的 Agent */}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('task.assignedAgentDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <Label>{t('task.dependencies')}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('task.dependencyPlaceholder')}
                      value={newDependency}
                      onChange={(e) => setNewDependency(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDependency())}
                    />
                    <Button type="button" variant="outline" onClick={addDependency}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(taskForm.watch('dependencies') || []).map((dep, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {dep}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeDependency(dep)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <SheetFooter>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('common.save')}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}