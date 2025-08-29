
"use client";

import { handleResearch } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ResearchOutput } from '@/lib/types';
import { Bot, Search } from 'lucide-react';
import { useState } from 'react';

export default function ResearchAnalystDemo() {
  const [topic, setTopic] = useState(
    'Analyze the contributor activity for the Genkit repository on GitHub (firebase/genkit)'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);
    const response = await handleResearch({ topic });
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot
            className="w-6 h-6 text-accent"
            style={{ filter: 'drop-shadow(0 0 5px hsl(var(--accent)))' }}
          />
          <div>
            <CardTitle>AI Research Analyst Demo</CardTitle>
            <CardDescription>
              An agent that uses tools to research and answer questions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="topic">Research Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Analyze the Genkit repository..."
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            <Search className="mr-2" />
            {isLoading ? 'Researching...' : 'Start Research'}
          </Button>
        </form>

        {(isLoading || result || error) && (
            <div className="p-4 rounded-lg bg-background/50 border border-border/50 min-h-[200px]">
                <h4 className="font-semibold mb-2 text-primary">Research Output</h4>
                {isLoading && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground animate-pulse">
                        Agent is thinking... this may take a moment.
                    </p>
                    {/* You can add a skeleton loader here for better UX */}
                </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {result && (
                <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: result.result }}
                />
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
