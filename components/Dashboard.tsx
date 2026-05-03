'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AgentPanel from '@/components/AgentPanel';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, ShieldCheck } from 'lucide-react';

import AgentStatus from '@/components/agent/AgentStatus';

const Terminal = dynamic(() => import('@/components/Terminal'), { ssr: false });
const FileExplorer = dynamic(() => import('@/components/FileExplorer'), { ssr: false });
const AuditPanel = dynamic(() => import('@/components/AuditPanel'), { ssr: false });
const SettingsPanel = dynamic(() => import('@/components/SettingsPanel'), { ssr: false });

export default function Dashboard() {
  const [keys, setKeys] = useState<Record<string, string>>({
    gemini: '', anthropic: '', openai: '', groq: '', openrouter: '', cerebras: '', ollama: '', mistral: ''
  });
  const [yoloMode, setYoloMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('orchestrator');
  const [theme, setTheme] = useState('blue');

  useEffect(() => {
    const saved = localStorage.getItem('aria_full_settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setKeys(s.keys);
        setYoloMode(s.agent.yoloMode);
      } catch (e) {
        console.error("Failed to parse settings");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'blue' ? 'red' : 'blue';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <div className="flex h-screen bg-brand-bg text-brand-ink overflow-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSettingsClick={() => setShowSettings(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 flex flex-col relative bg-[#090b10]">
        {/* Top Navbar */}
        <header className="h-12 border-b border-brand-line flex items-center justify-between px-8 bg-black/40 z-40">
           <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
               <AgentStatus />
               <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">Neural Substrate v2.1.0</h2>
             </div>
             <div className="h-3 w-px bg-brand-line/50" />
             <div className="flex items-center gap-3 text-[9px] font-mono opacity-30 select-none">
                <span className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-brand-success animate-pulse" />
                  Kernel: Production-Grade Sandbox
                </span>
             </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-[9px] font-mono opacity-40">
                <span className="flex items-center gap-1 text-brand-accent tracking-tighter uppercase font-bold">Encrypted Link Active</span>
                <div className="h-3 w-px bg-brand-line" />
                <span className="flex items-center gap-1 text-brand-warning"><Cpu size={12} className="animate-pulse" /> Monitoring</span>
              </div>
           </div>
        </header>

        {/* Content Viewport */}
        <section className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'orchestrator' && (
              <motion.div 
                key="orchestrator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full w-full"
              >
                {/* Center Content: Agent + Terminal stack */}
                <div className="flex-1 flex min-w-0 h-full overflow-hidden">
                  {/* Agent Column */}
                  <div className="flex-1 border-r border-brand-line relative">
                    <AgentPanel keys={keys} yoloMode={yoloMode} />
                  </div>

                  {/* Context/Terminal Column */}
                  <div className="w-[450px] flex flex-col bg-black/20 overflow-hidden">
                    <div className="h-10 border-b border-brand-line flex items-center justify-between px-6 bg-black/40">
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">System Logs</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-[8px] font-bold uppercase opacity-40">Process Active</span>
                       </div>
                    </div>
                    <div className="flex-1 bg-[#0d1117] overflow-hidden">
                       <Terminal />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'explorer' && (
              <motion.div 
                key="explorer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full w-full p-8"
              >
                <div className="max-w-6xl mx-auto h-full execution-block p-1 bg-black/60">
                   <FileExplorer />
                </div>
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="max-w-md w-full">
                  <div className="text-8xl font-black text-brand-accent mb-12 tracking-tighter select-none opacity-20">Λ</div>
                  <h1 className="text-2xl font-bold tracking-[0.1em] uppercase mb-4 text-brand-ink">Aria Autonomous Runtime</h1>
                  <p className="text-brand-ink/40 text-xs mb-16 font-medium tracking-tight">The ultimate developer companion for the cloud frontier.</p>
                  
                  <div className="grid grid-cols-1 gap-3 w-full">
                    <DashboardCTA 
                      label="Launch Orchestrator" 
                      onClick={() => setActiveTab('orchestrator')}
                      sub="The central command for agent workflow"
                    />
                    <DashboardCTA 
                      label="Runtime Explorer" 
                      onClick={() => setActiveTab('explorer')}
                      sub="Full access to the sandboxed file system"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Empty State / Provider Wall */}
        {Object.values(keys).every(k => !k) && (
          <div className="absolute inset-0 bg-brand-bg/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 text-center">
             <div className="max-w-sm w-full p-12 border border-brand-line bg-brand-sidebar flex flex-col items-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50" />
                <div className="text-6xl font-black text-brand-accent mb-12 select-none opacity-20">Λ</div>
                <h3 className="text-lg font-bold mb-2 uppercase tracking-widest leading-none">Connect Provider</h3>
                <p className="text-[11px] opacity-40 mb-12 max-w-[240px] leading-relaxed">System core is locked. Add at least one AI provider to initialize the runtime neural link.</p>
                
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-full bg-brand-accent py-4 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all rounded-sm shadow-[0_0_20px_rgba(47,129,247,0.3)]"
                >
                  Configure Providers
                </button>
                <button 
                   className="w-full mt-4 text-[10px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
                >
                  Read Documentation
                </button>
             </div>
          </div>
        )}

        <SettingsPanel 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          onUpdate={(s: any) => {
            setKeys(s.keys);
            setYoloMode(s.agent.yoloMode);
          }}
        />
      </main>
    </div>
  );
}

function DashboardCTA({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group w-full p-6 border border-brand-line hover:border-brand-accent/40 bg-black/40 hover:bg-brand-accent/5 transition-all text-left flex items-center justify-between"
    >
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-brand-accent transition-colors">{label}</h4>
        <p className="text-[10px] opacity-30 font-medium italic">{sub}</p>
      </div>
      <div className="w-8 h-8 rounded-full border border-brand-line flex items-center justify-center opacity-20 group-hover:opacity-100 group-hover:bg-brand-accent group-hover:border-brand-accent transition-all group-hover:text-white">
        →
      </div>
    </button>
  );
}
