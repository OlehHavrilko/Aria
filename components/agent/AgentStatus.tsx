'use client';

import { useAgentStore, AgentState } from '@/lib/store';

export default function AgentStatus() {
  const state = useAgentStore((s) => s.state);

  const configs: Record<AgentState, { color: string; label: string; pulse?: boolean }> = {
    idle: { color: 'bg-brand-line', label: 'Inert' },
    thinking: { color: 'bg-brand-warning', label: 'Processing', pulse: true },
    executing: { color: 'bg-brand-accent', label: 'Running Subprocess', pulse: true },
    error: { color: 'bg-brand-error', label: 'Neural Fault' },
  };
  
  const config = configs[state];

  return (
    <div className="flex items-center gap-2 px-3 py-1 border border-brand-line bg-black/40 rounded-full select-none">
      <div className={`w-1.5 h-1.5 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-60 leading-none">{config.label}</span>
    </div>
  );
}
