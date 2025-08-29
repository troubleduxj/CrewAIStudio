"use client";

import WorkflowVisualizer from '@/components/dashboard/workflow-visualizer';
import WorkflowToolPanel from '@/components/workflow/workflow-tool-panel';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect } from 'react';

export default function WorkflowPage() {
  const { setOpen } = useSidebar();

  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14))]">
      <div className="flex-1 h-full">
        <WorkflowVisualizer />
      </div>
      <div className="w-1/3 max-w-[350px] h-full border-l border-border/40">
        <WorkflowToolPanel />
      </div>
    </div>
  );
}
