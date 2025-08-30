"use client"

import type { Node, Agent, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';

interface WorkflowNodeEditorProps {
  node: Node | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (node: Node) => void;
}

export default function WorkflowNodeEditor({
  node,
  isOpen,
  setIsOpen,
  onSave,
}: WorkflowNodeEditorProps) {
  const [formData, setFormData] = useState(node?.data || {});

  useEffect(() => {
    if (node) {
      // Set defaults if they are missing
      const defaults = node.type === 'agent' 
        ? { memory: true }
        : { verbose: true, cache: true };
      setFormData({ ...defaults, ...node.data });
    }
  }, [node]);
  
  if (!node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...node, data: formData as Agent | Task });
    setIsOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({...prev, [name]: checked}));
  }
  
  const isAgentNode = node.type === 'agent';

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="bg-background border-l-border/60 sm:max-w-[525px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit {isAgentNode ? 'Agent' : 'Task'} Node</SheetTitle>
          <SheetDescription>
            Modify the properties of your selected node.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-6">
          {isAgentNode ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" value={(formData as Agent).role || ''} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal">Goal</Label>
                <Textarea id="goal" name="goal" value={(formData as Agent).goal || ''} onChange={handleInputChange} rows={3} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="backstory">Backstory</Label>
                <Textarea id="backstory" name="backstory" value={(formData as Agent).backstory || ''} onChange={handleInputChange} rows={4} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="memory">Memory</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow agent to access short-term memory.
                  </p>
                </div>
                <Switch
                  id="memory"
                  checked={(formData as Agent).memory ?? true}
                  onCheckedChange={(checked) => handleSwitchChange('memory', checked)}
                />
              </div>
            </>
          ) : (
            <>
               <div className="grid gap-2">
                <Label htmlFor="name">Task Name</Label>
                <Input id="name" name="name" value={(formData as Task).name || ''} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea id="instructions" name="instructions" value={(formData as Task).instructions || ''} onChange={handleInputChange} rows={4} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                    <Label htmlFor="verbose">Verbose</Label>
                    <p className="text-xs text-muted-foreground">
                        Log task execution steps and output.
                    </p>
                    </div>
                    <Switch
                    id="verbose"
                    checked={(formData as Task).verbose ?? true}
                    onCheckedChange={(checked) => handleSwitchChange('verbose', checked)}
                    />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                    <Label htmlFor="cache">Cache</Label>
                    <p className="text-xs text-muted-foreground">
                        Cache task results to avoid re-running.
                    </p>
                    </div>
                    <Switch
                    id="cache"
                    checked={(formData as Task).cache ?? true}
                    onCheckedChange={(checked) => handleSwitchChange('cache', checked)}
                    />
                </div>
              </div>
            </>
          )}
          
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
