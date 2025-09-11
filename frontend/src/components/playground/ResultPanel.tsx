'use client';

import { ChatMessage } from './ChatPanel';
import ReactMarkdown from 'react-markdown';

interface ResultPanelProps {
  messages: ChatMessage[];
}

export default function ResultPanel({ messages }: ResultPanelProps) {
  // Filter for final agent messages, not intermediate thoughts or tool usage
  const agentMessages = messages.filter(
    (msg) => msg.sender === 'agent' && msg.type === 'message'
  );

  // We can decide how to display results. For now, let's just show the final content.
  // In the future, this panel could have tabs for Code, Preview, etc.
  const finalContent = agentMessages.map((msg) => msg.content).join('\n\n---\n\n');

  return (
    <div className="w-1/2 p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Result Panel</h2>
      <div className="border rounded-md p-4 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 prose dark:prose-invert max-w-none">
        <ReactMarkdown>
          {finalContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
