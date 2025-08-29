import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Container /> Resources
        </CardTitle>
        <CardDescription>
          Manage your external resources and data sources.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Resources content to be implemented.</p>
      </CardContent>
    </Card>
  );
}
