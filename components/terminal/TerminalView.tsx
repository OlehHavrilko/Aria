'use client';

import { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Cpu, Shield } from 'lucide-react';

interface TerminalEntry {
  type: 'command' | 'stdout' | 'stderr' | 'system';
  content: string;
  timestamp: string;
}

interface TerminalViewProps {
  entries: TerminalEntry[];
}

export default function TerminalView({ entries }: TerminalViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="h-full flex flex-col font-mono text-[10px] bg-black">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" ref={scrollRef}>
        {entries.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
             <Cpu size={32} className="animate-pulse" />
             <span className="uppercase tracking-[0.4em] font-bold">Log Stream Offline</span>
          </div>
        )}
        
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-4 group">
            <span className="opacity-20 shrink-0 select-none">[{entry.timestamp}]</span>
            <div className="flex-1 min-w-0">
               {entry.type === 'command' && (
                 <span className="text-brand-accent font-bold">$ {entry.content}</span>
               )}
               {entry.type === 'stdout' && (
                 <span className="opacity-60 whitespace-pre-wrap break-all">{entry.content}</span>
               )}
               {entry.type === 'stderr' && (
                 <span className="text-brand-error/80 whitespace-pre-wrap break-all">{entry.content}</span>
               )}
               {entry.type === 'system' && (
                 <span className="text-brand-warning opacity-80 italic flex items-center gap-2">
                    <Shield size={10} /> {entry.content}
                 </span>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
