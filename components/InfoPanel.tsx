'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Globe, Info, Zap, Layers } from 'lucide-react';

export default function InfoPanel() {
  const [metrics, setMetrics] = useState({ cpu: '2%', mem: '128MB', ports: [] as number[] });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulated realtime metrics
      setMetrics(prev => ({
        ...prev,
        cpu: `${Math.floor(Math.random() * 5 + 1)}%`,
        mem: `${Math.floor(Math.random() * 20 + 200)}MB`
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col glass-panel rounded-none border-l-0">
      <div className="p-6 border-b border-brand-line flex items-center justify-between">
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">System Context</h3>
        <Activity className="w-3 h-3 text-brand-accent animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <Zap size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Realtime Usage</span>
          </div>
          <div className="space-y-4">
            <MetricBar label="CPU Load" value={metrics.cpu} progress={parseInt(metrics.cpu)} />
            <MetricBar label="Memory" value={metrics.mem} progress={30} />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <Globe size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Network Edge</span>
          </div>
          <div className="p-4 bg-white/5 border border-brand-line rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] opacity-40 font-mono">APP_URL</span>
              <span className="text-[9px] text-brand-accent font-mono truncate max-w-[120px]">aria-runtime.local</span>
            </div>
            <div className="text-[9px] opacity-40 italic">Inbound traffic isolated. Outbound enabled.</div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <Layers size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Runtime Environment</span>
          </div>
          <div className="space-y-2 text-[10px] font-mono">
            <EnvItem label="NODE_VERSION" value="v20.x" />
            <EnvItem label="SHELL" value="/bin/bash" />
            <EnvItem label="YOLO_ACTIVE" value="true" />
          </div>
        </section>

        <section className="pt-4 mt-8 border-t border-brand-line">
           <div className="text-[9px] opacity-30 leading-relaxed italic">
             "The observer is the observed. The plan is the action."
           </div>
        </section>
      </div>
    </div>
  );
}

function MetricBar({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="opacity-40">{label}</span>
        <span className="text-brand-accent">{value}</span>
      </div>
      <div className="h-0.5 bg-brand-line w-full relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute inset-y-0 left-0 bg-brand-accent"
        />
      </div>
    </div>
  );
}

function EnvItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="opacity-30">{label}</span>
      <span className="opacity-80">{value}</span>
    </div>
  );
}
