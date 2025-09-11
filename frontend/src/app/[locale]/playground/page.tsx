'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import ChatPanel, { ChatMessage } from '@/components/playground/ChatPanel';
import ResultPanel from '@/components/playground/ResultPanel';
import { v4 as uuidv4 } from 'uuid';

// 定义从后端接收的 WebSocket 消息的类型
type WebSocketMessage = {
  type: 'token' | 'thought' | 'tool_usage' | 'end' | 'error';
  content: string;
};

export default function PlaygroundPage() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      // TODO: The WebSocket URL should be configurable
      ws = new WebSocket('ws://localhost:8008/api/v1/interactive-session/ws');

      ws.onopen = () => {
        console.log('WebSocket connected');
        setSocket(ws);
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];

          switch (message.type) {
            case 'thought':
            case 'tool_usage':
              return [
                ...prevMessages,
                {
                  id: uuidv4(),
                  sender: 'agent',
                  type: message.type,
                  content: message.content,
                },
              ];
            
            case 'token':
              // If the last message was from the agent and was a standard message, append the token.
              // Otherwise, create a new agent message.
              if (lastMessage?.sender === 'agent' && lastMessage?.type === 'message') {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1] = {
                  ...lastMessage,
                  content: lastMessage.content + message.content,
                };
                return updatedMessages;
              } else {
                return [
                  ...prevMessages,
                  {
                    id: uuidv4(),
                    sender: 'agent',
                    type: 'message',
                    content: message.content,
                  },
                ];
              }

            case 'end':
              setIsAgentThinking(false);
              console.log('Stream ended');
              return prevMessages;

            case 'error':
              setIsAgentThinking(false);
              return [
                ...prevMessages,
                {
                  id: uuidv4(),
                  sender: 'agent',
                  type: 'message', // Or a new 'error' type if styled differently
                  content: `Error: ${message.content}`,
                },
              ];

            default:
              return prevMessages;
          }
        });
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...');
        setSocket(null);
        setIsAgentThinking(false);
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsAgentThinking(false);
        ws?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, []);

  const handleSendMessage = (message: string, model: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const newUserMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'user',
        type: 'message',
        content: message,
      };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setIsAgentThinking(true);
      
      const payload = JSON.stringify({
        message: message,
        model: model,
      });
      socket.send(payload);
    } else {
      console.error('WebSocket is not connected.');
      // Optionally, show an error to the user
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          sender: 'agent',
          type: 'message',
          content: "Connection lost. Please wait while we reconnect...",
        },
      ]);
    }
  };

  return (
    <MainLayout>
      <div className="flex h-full">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isAgentThinking={isAgentThinking}
        />
        <ResultPanel messages={messages} />
      </div>
    </MainLayout>
  );
}
