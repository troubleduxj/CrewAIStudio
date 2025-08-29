"use client";

import WorkflowVisualizer from '@/components/dashboard/workflow-visualizer';
import WorkflowToolPanel from '@/components/workflow/workflow-tool-panel';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

export default function WorkflowPage() {
  const { setOpen } = useSidebar();
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);

  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14))]">
      <div className="flex-1 h-full">
        <WorkflowVisualizer />
      </div>
      <div
        className={cn(
          "relative h-full border-l border-border/40 transition-all duration-300",
          isToolboxOpen ? "w-1/3 max-w-[350px]" : "w-0"
        )}
      >
        <button 
          onClick={() => setIsToolboxOpen(!isToolboxOpen)}
          className="absolute z-10 top-1/2 -left-[15px] -translate-y-1/2 w-8 h-16 rounded-l-md bg-card border border-r-0 border-border/40 flex items-center justify-center hover:bg-muted"
          aria-label={isToolboxOpen ? "Collapse toolbox" : "Expand toolbox"}
        >
          <ChevronLeft className={cn("h-6 w-6 transition-transform", !isToolboxOpen && "rotate-180")} />
        </button>
        <div className={cn("h-full transition-opacity duration-200", isToolboxOpen ? "opacity-100" : "opacity-0")}>
         {isToolboxOpen && <WorkflowToolPanel />}
        </div>
      </div>
    </div>
  );
}
