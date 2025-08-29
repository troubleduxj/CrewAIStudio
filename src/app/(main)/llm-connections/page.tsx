import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';

export default function LLMConnectionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit /> LLM Connections
        </CardTitle>
        <CardDescription>
          Manage connections to your large language models.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>LLM Connections content to be implemented.</p>
      </CardContent>
    </Card>
  );
}
