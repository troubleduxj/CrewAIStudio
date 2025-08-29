
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeminiLogo, OpenAIColorLogo, DeepseekLogo } from '@/components/ui/logos';
import { BrainCircuit } from 'lucide-react';
import React from 'react';

const ConnectionForm = ({
  children,
  onSubmit,
}: {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-6"
  >
    {children}
    <div className="flex justify-end">
      <Button type="submit">Save Configuration</Button>
    </div>
  </form>
);

const ApiKeyField = ({ id, label = "API Key" }: { id: string, label?: string }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="password"
      placeholder="••••••••••••••••••••••••"
    />
  </div>
);


export default function LLMConnectionsPage() {
  
  const handleSubmit = (provider: string) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`Configuration saved for ${provider}`);
    // Here you would typically handle the form submission,
    // e.g., send data to your backend.
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit /> LLM Connections
        </CardTitle>
        <CardDescription>
          Manage and configure your connections to various Large Language Models.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gemini" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gemini">
              <GeminiLogo className="w-5 h-5 mr-2" />
              Gemini
            </TabsTrigger>
            <TabsTrigger value="openai">
                <OpenAIColorLogo className="w-5 h-5 mr-2" />
              OpenAI
            </TabsTrigger>
            <TabsTrigger value="deepseek">
                <DeepseekLogo className="w-5 h-5 mr-2" />
              Deepseek
            </TabsTrigger>
          </TabsList>
          <TabsContent value="gemini">
            <Card className="mt-4 border-border/60">
              <CardHeader>
                <CardTitle>Google Gemini Configuration</CardTitle>
                <CardDescription>
                  Enter your Google AI Studio API key to connect to Gemini models.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectionForm onSubmit={handleSubmit('Gemini')}>
                    <ApiKeyField id="gemini-api-key" />
                </ConnectionForm>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="openai">
            <Card className="mt-4 border-border/60">
              <CardHeader>
                <CardTitle>OpenAI Configuration</CardTitle>
                <CardDescription>
                  Configure your connection to OpenAI models like GPT-4, GPT-3.5, etc.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectionForm onSubmit={handleSubmit('OpenAI')}>
                    <ApiKeyField id="openai-api-key" />
                    <div className="space-y-2">
                        <Label htmlFor="openai-org-id">Organization ID (Optional)</Label>
                        <Input id="openai-org-id" placeholder="org-..." />
                    </div>
                </ConnectionForm>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="deepseek">
            <Card className="mt-4 border-border/60">
              <CardHeader>
                <CardTitle>Deepseek Configuration</CardTitle>
                <CardDescription>
                    Provide your API key to connect to Deepseek models.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectionForm onSubmit={handleSubmit('Deepseek')}>
                    <ApiKeyField id="deepseek-api-key" />
                </ConnectionForm>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
