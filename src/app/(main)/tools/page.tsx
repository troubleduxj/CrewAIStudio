import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function ToolsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench /> 工具面板
        </CardTitle>
        <CardDescription>
          在这里管理和配置您的 Agent 可以使用的工具。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>工具面板内容待填充。</p>
      </CardContent>
    </Card>
  );
}
