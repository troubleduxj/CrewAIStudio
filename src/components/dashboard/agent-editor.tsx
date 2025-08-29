
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';


export default function AgentEditor() {
  return (
    <Card className="h-full bg-card/60 backdrop-blur-sm border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <User
            className="w-6 h-6 text-accent"
            style={{ filter: 'drop-shadow(0 0 5px hsl(var(--accent)))' }}
          />
          <div>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>
              Define roles, goals, and tools for your AI agents.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center h-full -mt-6">
        <p className="text-muted-foreground mb-4">
          All agent management has been moved to the Agent Panel.
        </p>
        <Button asChild>
          <Link href="/agents">
            Go to Agent Panel <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
