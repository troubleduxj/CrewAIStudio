import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings /> 设置面板
        </CardTitle>
        <CardDescription>
          在这里管理应用的各项设置。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>设置面板内容待填充。</p>
      </CardContent>
    </Card>
  );
}
