import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AgentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users /> Agent 面板
        </CardTitle>
        <CardDescription>
          在这里管理和配置您的 AI Agent。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Agent 面板内容待填充。</p>
      </CardContent>
    </Card>
  );
}
