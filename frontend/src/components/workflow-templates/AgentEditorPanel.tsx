import React from 'react';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AgentDefinition, Tool } from '@/types/workflow';
import { X, BrainCircuit, Save, Trash2, Component, Edit, ChevronUp, ChevronDown } from 'lucide-react';

interface AgentEditorPanelProps {
  agent: AgentDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: AgentDefinition) => void;
}

export function AgentEditorPanel({ agent, isOpen, onClose, onSave }: AgentEditorPanelProps) {
  const { t } = useTranslation();
  const [editedAgent, setEditedAgent] = React.useState<AgentDefinition | null>(agent);
  const [isAttributesOpen, setIsAttributesOpen] = React.useState(true);
  const [isModelOpen, setIsModelOpen] = React.useState(true);
  const [isToolsOpen, setIsToolsOpen] = React.useState(true);
  const [isLlmSettingsOpen, setIsLlmSettingsOpen] = React.useState(true);
  const [isAgentSettingsOpen, setIsAgentSettingsOpen] = React.useState(true);

  React.useEffect(() => {
    setEditedAgent(agent);
  }, [agent]);

  if (!editedAgent) {
    return null;
  }

  const handleSave = () => {
    if (editedAgent) {
      onSave(editedAgent);
    }
  };

  const handleFieldChange = (field: keyof AgentDefinition, value: any) => {
    if (editedAgent) {
      setEditedAgent({ ...editedAgent, [field]: value });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg w-[500px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b flex-shrink-0 flex flex-row justify-between items-center">
          <SheetTitle>{t('agent.edit_agent', 'Edit Agent')}</SheetTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {t('common.save', 'Save')}
            </Button>
          </div>
        </SheetHeader>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="role">{t('agent.role', 'Role')}</Label>
            <Input
              id="role"
              value={editedAgent.role}
              onChange={(e) => handleFieldChange('role', e.target.value)}
            />
          </div>

          {/* Attributes Section */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAttributesOpen(!isAttributesOpen)}>
              <h3 className="text-lg font-semibold">{t('agent.attributes', 'Attributes')}</h3>
              <Button variant="ghost" size="icon">
                {isAttributesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
            {isAttributesOpen && (
              <div className="space-y-4 pl-2">
                <div className="space-y-2">
                  <Label htmlFor="goal">{t('agent.goal', 'Goal')}</Label>
                  <Textarea
                    id="goal"
                    value={editedAgent.goal}
                    onChange={(e) => handleFieldChange('goal', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backstory">{t('agent.backstory', 'Backstory')}</Label>
                  <Textarea
                    id="backstory"
                    value={editedAgent.backstory}
                    onChange={(e) => handleFieldChange('backstory', e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            )}
          </div>
          {/* Model Section */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsModelOpen(!isModelOpen)}>
              <h3 className="text-lg font-semibold">{t('agent.model', 'Model')}</h3>
              <Button variant="ghost" size="icon">
                {isModelOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
            {isModelOpen && (
              <div className="pl-2">
                <Select defaultValue="gpt-4o-mini">
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {/* Tools Section */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsToolsOpen(!isToolsOpen)}>
              <h3 className="text-lg font-semibold">{t('agent.tools', 'Tools')}</h3>
              <Button variant="ghost" size="icon">
                {isToolsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
            {isToolsOpen && (
              <div className="p-2 border rounded-md min-h-[60px] pl-2">
                {(editedAgent.requiredTools && editedAgent.requiredTools.length > 0) ? (
                  <div className="space-y-2">
                    {editedAgent.requiredTools.map((tool: Tool) => (
                      <div key={tool.id} className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50">
                        <Component className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-sm text-gray-500">{tool.description || 'No description available.'}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-blue-600">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-gray-500 hover:text-red-600"
                            onClick={() => {
                              const newTools = editedAgent.requiredTools.filter(t => t.id !== tool.id);
                              handleFieldChange('requiredTools', newTools);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">{t('agent.no_tools_added', 'No tools added yet.')}</p>
                )}
              </div>
            )}
          </div>

          {/* LLM Settings */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsLlmSettingsOpen(!isLlmSettingsOpen)}>
              <h3 className="text-lg font-semibold">{t('agent.llm_settings', 'LLM Settings')}</h3>
              <Button variant="ghost" size="icon">
                {isLlmSettingsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
            {isLlmSettingsOpen && (
              <div className="space-y-2 pl-2">
                <Label htmlFor="temperature">{t('agent.temperature', 'Temperature')}</Label>
                <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[editedAgent.temperature ?? 0.7]}
                onValueChange={(value) => handleFieldChange('temperature', value[0])}
              />
              <div className="text-xs text-gray-500">
                {t('agent.temperature_hint_low', 'Lower (0.1 to 0.3) for factual responses.')}
                <br />
                {t('agent.temperature_hint_high', 'Higher (0.7 to 0.9) for creative tasks.')}
              </div>
            </div>
            )}
          </div>

          {/* Agent Settings */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAgentSettingsOpen(!isAgentSettingsOpen)}>
              <h3 className="text-lg font-semibold">{t('agent.agent_settings', 'Agent Settings')}</h3>
              <Button variant="ghost" size="icon">
                {isAgentSettingsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
            {isAgentSettingsOpen && (
              <div className="space-y-4 pl-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reasoning">{t('agent.reasoning', 'Reasoning')}</Label>
                  <p className="text-xs text-gray-500">{t('agent.reasoning_hint', 'Reflect on a task and create a plan before execution')}</p>
                </div>
                <Switch
                  id="reasoning"
                  checked={editedAgent.reasoning}
                  onCheckedChange={(checked) => handleFieldChange('reasoning', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-reasoning-attempts">{t('agent.max_reasoning_attempts', 'Max Reasoning Attempts')}</Label>
                <Input
                  id="max-reasoning-attempts"
                  type="number"
                  placeholder={t('agent.not_set', 'Not set')}
                  value={editedAgent.maxReasoningAttempts || ''}
                  onChange={(e) => handleFieldChange('maxReasoningAttempts', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <p className="text-xs text-gray-500">{t('agent.max_reasoning_attempts_hint', 'Maximum number of reasoning attempts before executing the task. If empty, will try until ready.')}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-delegation">{t('agent.allow_delegation', 'Allow Delegation')}</Label>
                  <p className="text-xs text-gray-500">{t('agent.allow_delegation_hint', 'Allow the agent to delegate tasks to other agents')}</p>
                </div>
                <Switch
                  id="allow-delegation"
                  checked={editedAgent.allowDelegation}
                  onCheckedChange={(checked) => handleFieldChange('allowDelegation', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-iterations">{t('agent.max_iterations', 'Max Iterations')}</Label>
                <Input
                  id="max-iterations"
                  type="number"
                  placeholder="25"
                  value={editedAgent.maxIterations || ''}
                  onChange={(e) => handleFieldChange('maxIterations', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <p className="text-xs text-gray-500">{t('agent.max_iterations_hint', 'Maximum iterations before the agent must provide its best answer')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-rpm">{t('agent.max_rpm', 'Max RPM')}</Label>
                <Input
                  id="max-rpm"
                  type="number"
                  placeholder={t('agent.request_per_minute', 'Request per minute')}
                  value={editedAgent.maxRpm || ''}
                  onChange={(e) => handleFieldChange('maxRpm', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <p className="text-xs text-gray-500">{t('agent.max_rpm_hint', 'Maximum requests per minute to avoid rate limits')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-execution-time">{t('agent.max_execution_time', 'Max Execution Time (seconds)')}</Label>
                <Input
                  id="max-execution-time"
                  type="number"
                  placeholder={t('agent.in_seconds', 'In seconds')}
                  value={editedAgent.maxExecutionTime || ''}
                  onChange={(e) => handleFieldChange('maxExecutionTime', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                  <p className="text-xs text-gray-500">{t('agent.max_execution_time_hint', 'Maximum time for task execution')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
