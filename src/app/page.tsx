import AgentEditor from '@/components/dashboard/agent-editor';
import DynamicTaskAdjuster from '@/components/dashboard/dynamic-task-adjuster';
import LogViewer from '@/components/dashboard/log-viewer';
import StatusMonitor from '@/components/dashboard/status-monitor';
import TaskEditor from '@/components/dashboard/task-editor';
import WorkflowVisualizer from '@/components/dashboard/workflow-visualizer';
import Header from '@/components/layout/header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-5 xl:col-span-3">
            <WorkflowVisualizer />
          </div>
          <div className="lg:col-span-5 xl:col-span-2">
            <StatusMonitor />
          </div>
          <div className="lg:col-span-5 xl:col-span-2">
            <AgentEditor />
          </div>
          <div className="lg:col-span-5 xl:col-span-3">
            <TaskEditor />
          </div>
          <div className="lg:col-span-5 xl:col-span-3">
            <LogViewer />
          </div>
          <div className="lg:col-span-5 xl:col-span-2">
            <DynamicTaskAdjuster />
          </div>
        </div>
      </main>
    </div>
  );
}
