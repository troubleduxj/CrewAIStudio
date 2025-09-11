'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, User, Cpu, Wrench, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { llmService, LLMConfig } from '@/services/llmService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// 定义消息对象的结构
export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  type: 'message' | 'thought' | 'tool_usage';
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, model: string) => void;
  isAgentThinking: boolean;
}

// 单条消息的组件
const Message = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.sender === 'user';

  const getIcon = () => {
    if (isUser) return <User className="h-5 w-5" />;
    switch (msg.type) {
      case 'thought':
        return <Cpu className="h-5 w-5 text-gray-500" />;
      case 'tool_usage':
        return <Wrench className="h-5 w-5 text-blue-500" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const messageStyle = {
    container: `flex items-start gap-3 my-3 ${isUser ? 'justify-end' : ''}`,
    bubble: `p-3 rounded-lg max-w-lg ${
      isUser
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 dark:bg-gray-800'
    }`,
    content: `text-sm ${msg.type === 'thought' ? 'text-gray-500 italic' : ''}`,
  };

  return (
    <div className={messageStyle.container}>
      {!isUser && <div className="flex-shrink-0">{getIcon()}</div>}
      <div className={messageStyle.bubble}>
        <div className={messageStyle.content}>
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      </div>
      {isUser && <div className="flex-shrink-0">{getIcon()}</div>}
    </div>
  );
};

// Agent 状态指示器
const AgentStatus = ({ isThinking }: { isThinking: boolean }) => {
  if (!isThinking) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
      <Bot className="h-5 w-5 animate-pulse" />
      <span>Agent is thinking...</span>
    </div>
  );
};

export default function ChatPanel({ messages, onSendMessage, isAgentThinking }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [availableModels, setAvailableModels] = useState<LLMConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const configs = await llmService.getConfigs();
        const activeModels = configs.filter(c => c.is_active);
        setAvailableModels(activeModels);
        if (activeModels.length > 0) {
          setSelectedModel(activeModels[0].model);
        }
      } catch (error) {
        console.error("Failed to fetch LLM models:", error);
      }
    };
    fetchModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentThinking]);

  const handleSendMessage = () => {
    if (input.trim() && selectedModel) {
      onSendMessage(input, selectedModel);
      setInput('');
    }
  };

  return (
    <div className="w-1/2 border-r p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Chat Panel</h2>
        {availableModels.length > 0 && (
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((config) => (
                <SelectItem key={config.id} value={config.model}>
                  {config.name} ({config.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex-grow border rounded-md p-2 mb-4 overflow-y-auto">
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} />
        ))}
        <AgentStatus isThinking={isAgentThinking} />
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-grow border rounded-l-md p-2 dark:bg-gray-800"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-md flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </div>
    </div>
  );
}
