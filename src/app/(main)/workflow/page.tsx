
"use client";

import WorkflowVisualizer from '@/components/dashboard/workflow-visualizer';
import WorkflowToolPanel from '@/components/workflow/workflow-tool-panel';
import { useSidebar } from '@/components/ui/sidebar';
import { createContext, useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Eye, Play, Rocket } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WorkflowExecutionEvents from '@/components/workflow/workflow-execution-events';
import { Button } from '@/components/ui/button';
import { startCrewExecution } from '@/lib/crew-executor';
import {
  initialAgents,
  initialTasks,
} from '@/components/dashboard/workflow-visualizer';
import type { ExecutionEvent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const WorkflowContext = createContext<{
  events: ExecutionEvent[];
  isExecuting: boolean;
}>({
  events: [],
  isExecuting: false,
});

export const useWorkflowContext = () => useContext(WorkflowContext);

export default function WorkflowPage() {
  const { setOpen } = useSidebar();
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const [viewMode, setViewMode] = useState('editor');
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  const handleEvent = (event: ExecutionEvent) => {
    setEvents(prevEvents => [...prevEvents, event]);
  };

  const handleStartExecution = async () => {
    setViewMode('execution');
    setIsExecuting(true);
    setEvents([]); // Clear previous events

    try {
      await startCrewExecution({ agents: initialAgents, tasks: initialTasks }, handleEvent);
      toast({
        title: "Workflow Completed",
        description: "The crew has finished all tasks successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      handleEvent({
          type: 'error',
          timestamp: new Date().toLocaleTimeString(),
          details: `Workflow failed: ${errorMessage}`,
          event: "Workflow Error"
      });
      toast({
        title: "Workflow Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <WorkflowContext.Provider value={{ events, isExecuting }}>
      <Tabs
        value={viewMode}
        onValueChange={setViewMode}
        className="flex flex-col h-[calc(100vh-theme(spacing.14))]"
      >
        <header className="flex-shrink-0 p-4 border-b border-border/40 flex justify-between items-center">
          <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
            <TabsTrigger value="editor" disabled={isExecuting}>
              <Eye className="mr-2" />
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="execution">
              <Play className="mr-2" />
              Execution
            </TabsTrigger>
          </TabsList>
          <Button onClick={handleStartExecution} disabled={isExecuting}>
            <Rocket className="mr-2" />
            {isExecuting ? 'Executing...' : 'Start Execution'}
          </Button>
        </header>
        <div className="flex-1 overflow-hidden">
          <TabsContent value="editor" className="h-full m-0">
            <div className="flex h-full">
              <div className="flex-1 h-full">
                <WorkflowVisualizer />
              </div>
              <div
                className={cn(
                  'relative h-full border-l border-border/40 transition-all duration-300',
                  isToolboxOpen ? 'w-1/3 max-w-[350px]' : 'w-0'
                )}
              >
                <button
                  onClick={() => setIsToolboxOpen(!isToolboxOpen)}
                  className="absolute z-10 top-1/2 -left-[15px] -translate-y-1/2 w-8 h-16 rounded-l-md bg-card border border-r-0 border-border/40 flex items-center justify-center hover:bg-muted"
                  aria-label={
                    isToolboxOpen ? 'Collapse toolbox' : 'Expand toolbox'
                  }
                >
                  <ChevronLeft
                    className={cn(
                      'h-6 w-6 transition-transform',
                      isToolboxOpen && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'h-full transition-opacity duration-200',
                    isToolboxOpen ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {isToolboxOpen && <WorkflowToolPanel />}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="execution" className="h-full m-0 p-4">
            <WorkflowExecutionEvents />
          </TabsContent>
        </div>
      </Tabs>
    </WorkflowContext.Provider>
  );
}
