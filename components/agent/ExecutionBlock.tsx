'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface ExecutionBlockProps {
  command: string;
  output?: string;
  status: 'running' | 'success' | 'error';
}

export default function ExecutionBlock({ command, output, status }: ExecutionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="execution-block rounded-sm overflow-hidden my-4 border border-brand-line/30 bg-black/40">
      <div 
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <TerminalIcon size={12} className="text-brand-accent opacity-60 flex-shrink-0" />
          <code className="text-[10px] font-mono opacity-80 font-bold truncate">$ {command}</code>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-brand-line">
            {status === 'running' && <Loader2 size={8} className="animate-spin text-brand-accent" />}
            {status === 'success' && <CheckCircle2 size={8} className="text-brand-success" />}
            {status === 'error' && <XCircle size={8} className="text-brand-error" />}
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{status}</span>
          </div>
          {isExpanded ? <ChevronDown size={12} className="opacity-20" /> : <ChevronRight size={12} className="opacity-20" />}
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-brand-line/20 bg-black/60 overflow-hidden"
          >
            <div className="p-4 overflow-x-auto">
               <pre className="text-[10px] font-mono leading-relaxed opacity-60 whitespace-pre-wrap">{output || 'Waiting for stdout...'}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
