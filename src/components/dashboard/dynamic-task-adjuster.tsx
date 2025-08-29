"use client";

import { handleAdjustTaskParameters } from '@/app/actions';
import type { AdjustTaskParametersOutput } from '@/ai/flows/adjust-task-parameters';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required.'),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters.'),
  agentPerformance: z
    .string()
    .min(10, 'Agent performance metrics are required.'),
});

export default function DynamicTaskAdjuster() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdjustTaskParametersOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskId: 'task-3',
      feedback:
        'The agent is taking too long to find relevant information and seems to be stuck in a loop visiting the same sites.',
      agentPerformance:
        'Task progress at 20% after 10 minutes. Expected progress was 50%. High number of repeated web requests to the same domain.',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    const response = await handleAdjustTaskParameters(values);
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wand2
            className="w-6 h-6 text-accent"
            style={{ filter: 'drop-shadow(0 0 5px hsl(var(--accent)))' }}
          />
          <div>
            <CardTitle>Dynamic Task Adjustment</CardTitle>
            <CardDescription>
              AI-powered optimization for task parameters.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="taskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., task-3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Real-time Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Agent is performing slowly..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agentPerformance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Performance Metrics</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Progress at 20%..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Optimizing...' : 'Adjust Parameters'}
              </Button>
            </form>
          </Form>

          <div className="p-4 rounded-lg bg-background/50 border border-border/50 min-h-[200px]">
            <h4 className="font-semibold mb-2">AI Suggestions</h4>
            {isLoading && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Generating suggestions...
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {result && (
              <div className="space-y-4 text-sm font-mono">
                <div>
                  <h5 className="font-medium text-primary mb-1">
                    Adjusted Parameters
                  </h5>
                  <pre className="mt-1 p-3 bg-black/30 rounded-md text-accent text-xs">
                    {JSON.stringify(result.adjustedParameters, null, 2)}
                  </pre>
                </div>
                <div>
                  <h5 className="font-medium text-primary mb-1">Reasoning</h5>
                  <p className="mt-1 text-muted-foreground font-sans">
                    {result.reasoning}
                  </p>
                </div>
              </div>
            )}
            {!isLoading && !result && !error && (
              <p className="text-sm text-muted-foreground">
                Suggestions will appear here after optimization.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
