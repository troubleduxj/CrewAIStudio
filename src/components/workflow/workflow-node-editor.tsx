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
      setFormData(node.data);
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
  
  const isAgentNode = node.type === 'agent';

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="bg-background border-l-border/60 sm:max-w-[525px]">
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
