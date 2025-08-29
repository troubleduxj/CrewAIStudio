"use client";

import WorkflowVisualizer from '@/components/dashboard/workflow-visualizer';
import WorkflowToolPanel from '@/components/workflow/workflow-tool-panel';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
          "h-full border-l border-border/40 transition-all duration-300",
          isToolboxOpen ? "w-1/3 max-w-[350px]" : "w-[56px]"
        )}
      >
        <WorkflowToolPanel isOpen={isToolboxOpen} setIsOpen={setIsToolboxOpen} />
      </div>
    </div>
  );
}
