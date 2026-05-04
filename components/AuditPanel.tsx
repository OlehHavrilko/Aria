'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Activity, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Terminal,
  Cpu
} from 'lucide-react';
import { useAgentStore } from '@/lib/store';

export default function AuditPanel() {
  const terminalEntries = useAgentStore((s) => s.terminalEntries);

  return (
    <div className="h-full flex flex-col border-l border-brand-line bg-black/40">
      <div className="px-6 h-12 flex items-center justify-between border-b border-brand-line bg-black/60">
        <div className="flex items-center gap-2">
          <History size={14} className="opacity-40" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Audit Trail</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {terminalEntries.map((entry, i) => (
          <div key={i} className="p-3 border border-brand-line bg-black/20 group hover:border-brand-accent/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {entry.type === 'command' ? <Terminal size={10} className="text-brand-accent" /> : <Activity size={10} className="text-brand-warning" />}
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-30">{entry.type}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[8px] font-mono opacity-20">{entry.timestamp}</span>
              </div>
            </div>
            <p className="text-[10px] font-mono leading-relaxed opacity-80 break-all truncate line-clamp-2">{entry.content}</p>
          </div>
        ))}

        {terminalEntries.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10 text-center py-20">
            <History size={32} className="mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No activities logged</p>
          </div>
        )}
      </div>
    </div>
  );
}
