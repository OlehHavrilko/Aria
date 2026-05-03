'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Activity, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Terminal,
  Cpu
} from 'lucide-react';
import { useState } from 'react';

export interface AuditEntry {
  id: string;
  type: 'command' | 'system' | 'error';
  content: string;
  timestamp: Date;
  status?: 'success' | 'error' | 'running';
  duration?: number;
}

export default function AuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([
    { id: '1', type: 'system', content: 'Core Initialized', timestamp: new Date(), status: 'success' },
    { id: '2', type: 'command', content: 'ls -la /workspace', timestamp: new Date(), status: 'success', duration: 120 },
  ]);

  return (
    <div className="h-full flex flex-col border-l border-brand-line bg-black/40">
      <div className="px-6 h-12 flex items-center justify-between border-b border-brand-line bg-black/60">
        <div className="flex items-center gap-2">
          <History size={14} className="opacity-40" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Audit Trail</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono opacity-30">
          <span className="flex items-center gap-1"><Cpu size={10} /> 4%</span>
          <span className="flex items-center gap-1"><Database size={10} /> 12MB</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {entries.map((entry) => (
          <div key={entry.id} className="p-3 border border-brand-line bg-black/20 group hover:border-brand-accent/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {entry.type === 'command' ? <Terminal size={10} className="text-brand-accent" /> : <Activity size={10} className="text-brand-warning" />}
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-30">{entry.type}</span>
              </div>
              <div className="flex items-center gap-2">
                 {entry.status === 'success' && <CheckCircle2 size={10} className="text-brand-success" />}
                 {entry.status === 'error' && <XCircle size={10} className="text-brand-error" />}
                 <span className="text-[8px] font-mono opacity-20">{entry.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
            <p className="text-[10px] font-mono leading-relaxed opacity-80 break-all">{entry.content}</p>
            {entry.duration && (
              <div className="mt-2 flex items-center gap-1 text-[8px] font-mono opacity-20">
                <Clock size={8} /> {entry.duration}ms
              </div>
            )}
          </div>
        ))}

        {entries.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10 text-center py-20">
            <History size={32} className="mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No activities logged</p>
          </div>
        )}
      </div>
    </div>
  );
}
