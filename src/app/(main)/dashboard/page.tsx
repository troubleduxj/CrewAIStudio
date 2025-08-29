import AgentEditor from '@/components/dashboard/agent-editor';
import DynamicTaskAdjuster from '@/components/dashboard/dynamic-task-adjuster';
import LogViewer from '@/components/dashboard/log-viewer';
import StatusMonitor from '@/components/dashboard/status-monitor';
import TaskEditor from '@/components/dashboard/task-editor';

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <StatusMonitor />
      </div>
      <div className="lg:col-span-1">
        <AgentEditor />
      </div>
      <div className="lg:col-span-1">
        <TaskEditor />
      </div>
      <div className="lg:col-span-2">
        <LogViewer />
      </div>
      <div className="lg:col-span-2">
        <DynamicTaskAdjuster />
      </div>
    </div>
  );
}
