import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

export default function TasksPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks /> Task 面板
        </CardTitle>
        <CardDescription>
          在这里管理和配置您的 Task。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Task 面板内容待填充。</p>
      </CardContent>
    </Card>
  );
}
