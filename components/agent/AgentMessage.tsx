'use client';

import { ShieldAlert, Bot, Command } from 'lucide-react';

interface AgentMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AgentMessage({ role, content }: AgentMessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-sm flex items-center justify-center border border-brand-line ${isUser ? 'bg-brand-accent/10 border-brand-accent/20' : 'bg-black/40'}`}>
        {isUser ? <Command size={12} className="text-brand-accent" /> : <Bot size={12} className="opacity-40" />}
      </div>
      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : ''}`}>
        <div className="text-[9px] font-bold uppercase tracking-widest opacity-20 px-1">
          {isUser ? 'Operator' : 'Neural Core'}
        </div>
        <div className={`px-4 py-3 rounded-sm text-xs leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-brand-accent/5 border border-brand-accent/20' : 'border border-brand-line bg-black/20'}`}>
          {isSystem && <span className="text-brand-error font-bold flex items-center gap-2 italic"><ShieldAlert size={12} /> {content}</span>}
          {!isSystem && content}
        </div>
      </div>
    </div>
  );
}
