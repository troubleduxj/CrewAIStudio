import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spline } from 'lucide-react';

export default function TracesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Spline /> Traces
        </CardTitle>
        <CardDescription>
          Review and analyze the execution traces of your agent workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Traces content to be implemented.</p>
      </CardContent>
    </Card>
  );
}
