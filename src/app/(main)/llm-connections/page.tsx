
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
import { BrainCircuit, CheckCircle, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { saveApiKey, testApiKey } from '@/app/actions';

const ConnectionForm = ({
  children,
  onSubmit,
  isSaving,
  onTest,
  isTesting,
}: {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  onTest: () => void;
  isTesting: boolean;
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-6"
  >
    {children}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onTest} disabled={isTesting || isSaving}>
        {isTesting ? 'Testing...' : 'Test Connection'}
      </Button>
      <Button type="submit" disabled={isSaving || isTesting}>{isSaving ? 'Saving...' : 'Save Configuration'}</Button>
    </div>
  </form>
);

const ApiKeyField = ({ id, label = "API Key", value, onChange }: { id: string, label?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="password"
      placeholder="••••••••••••••••••••••••"
      value={value}
      onChange={onChange}
    />
  </div>
);


export default function LLMConnectionsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);


  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openAiApiKey, setOpenAiApiKey] = useState('');
  const [openAiOrgId, setOpenAiOrgId] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');

  
  const handleSubmit = (provider: 'gemini' | 'openai' | 'deepseek') => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    let result;
    if (provider === 'gemini') {
        result = await saveApiKey({ provider, apiKey: geminiApiKey });
    } else if (provider === 'openai') {
        result = await saveApiKey({ provider, apiKey: openAiApiKey, orgId: openAiOrgId });
    } else {
        result = await saveApiKey({ provider, apiKey: deepseekApiKey });
    }
    
    if (result.success) {
        toast({
            title: "Success",
            description: result.message,
        });
    } else {
        toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
        })
    }

    setIsSaving(false);
  };
  
  const handleTest = (provider: 'gemini' | 'openai' | 'deepseek') => async () => {
    setIsTesting(true);
    let apiKey, orgId;
    if (provider === 'gemini') {
        apiKey = geminiApiKey;
    } else if (provider === 'openai') {
        apiKey = openAiApiKey;
        orgId = openAiOrgId;
    } else {
        apiKey = deepseekApiKey;
    }

    if (!apiKey) {
        toast({
            title: "API Key Missing",
            description: `Please enter an API key for ${provider} to test the connection.`,
            variant: "destructive",
        });
        setIsTesting(false);
        return;
    }

    const result = await testApiKey({ provider, apiKey, orgId });

    if (result.success) {
        toast({
            title: (<div className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Connection Successful</div>),
            description: result.message,
        });
    } else {
        toast({
            title: (<div className="flex items-center gap-2"><XCircle className="text-red-500" /> Connection Failed</div>),
            description: result.error,
            variant: "destructive",
        });
    }

    setIsTesting(false);
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
                <ConnectionForm 
                    onSubmit={handleSubmit('gemini')} 
                    isSaving={isSaving}
                    onTest={handleTest('gemini')}
                    isTesting={isTesting}
                >
                    <ApiKeyField id="gemini-api-key" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} />
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
                <ConnectionForm 
                    onSubmit={handleSubmit('openai')} 
                    isSaving={isSaving}
                    onTest={handleTest('openai')}
                    isTesting={isTesting}
                >
                    <ApiKeyField id="openai-api-key" value={openAiApiKey} onChange={e => setOpenAiApiKey(e.target.value)} />
                    <div className="space-y-2">
                        <Label htmlFor="openai-org-id">Organization ID (Optional)</Label>
                        <Input id="openai-org-id" placeholder="org-..." value={openAiOrgId} onChange={e => setOpenAiOrgId(e.target.value)} />
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
                <ConnectionForm 
                    onSubmit={handleSubmit('deepseek')} 
                    isSaving={isSaving}
                    onTest={handleTest('deepseek')}
                    isTesting={isTesting}
                >
                    <ApiKeyField id="deepseek-api-key" value={deepseekApiKey} onChange={e => setDeepseekApiKey(e.target.value)} />
                </ConnectionForm>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
