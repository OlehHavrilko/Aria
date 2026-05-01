'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { Settings, Shield, Key, Database, Zap, HardDrive, Terminal as TerminalIcon, LayoutDashboard, Search, User, Bell, Sliders, Cpu, Sparkles, ShieldAlert, Layers, Command } from 'lucide-react';
import AgentPanel from '@/components/AgentPanel';
import { motion, AnimatePresence } from 'motion/react';

const Terminal = dynamic(() => import('@/components/Terminal'), { ssr: false });
const FileExplorer = dynamic(() => import('@/components/FileExplorer'), { ssr: false });
const InfoPanel = dynamic(() => import('@/components/InfoPanel'), { ssr: false });
const SettingsPanel = dynamic(() => import('@/components/SettingsPanel'), { ssr: false });

export default function Dashboard() {
  const [keys, setKeys] = useState<Record<string, string>>({
    gemini: '',
    anthropic: '',
    openai: '',
    groq: ''
  });
  const [yoloMode, setYoloMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('orchestrator');
  const [theme, setTheme] = useState('blue');

  useEffect(() => {
    const savedKeys = localStorage.getItem('aria_keys');
    const savedYolo = localStorage.getItem('omnishell_yolo') === 'true';
    const savedTheme = localStorage.getItem('aria_theme') || 'blue';
    
    if (savedKeys) {
      try {
        setKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error("Failed to parse keys");
      }
    }
    setYoloMode(savedYolo);
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const saveKeys = (newKeys: Record<string, string>) => {
    setKeys(newKeys);
    localStorage.setItem('aria_keys', JSON.stringify(newKeys));
  };

  const toggleYolo = () => {
    const newVal = !yoloMode;
    setYoloMode(newVal);
    localStorage.setItem('omnishell_yolo', String(newVal));
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'blue' ? 'red' : 'blue';
    setTheme(nextTheme);
    localStorage.setItem('aria_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <div className="flex h-screen bg-brand-bg text-brand-ink overflow-hidden font-sans">
      {/* Sidebar - Rail */}
      <aside className="w-16 flex flex-col items-center py-8 border-r border-brand-line bg-black z-50">
        <div className="mb-12 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
          <div className="text-3xl font-black text-brand-accent tracking-tighter transition-all group-hover:scale-110">Λ</div>
        </div>
        
        <nav className="flex-1 space-y-8">
          <NavItem icon={<TerminalIcon size={18} />} active={activeTab === 'orchestrator'} onClick={() => setActiveTab('orchestrator')} />
          <NavItem icon={<Search size={18} />} active={activeTab === 'explorer'} onClick={() => setActiveTab('explorer')} />
          <NavItem icon={<LayoutDashboard size={18} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        </nav>

        <div className="mt-auto space-y-8">
           <button onClick={toggleTheme} className="p-2 opacity-20 hover:opacity-100 transition-all">
             <div className={`w-3 h-3 rounded-full ${theme === 'blue' ? 'bg-blue-500' : 'bg-red-500'} border border-white/20`} />
           </button>
           <NavItem icon={<Settings size={18} />} onClick={() => setShowSettings(true)} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-[#0a0e1a]">
        {/* Top Navbar */}
        <header className="h-10 border-b border-brand-line flex items-center justify-between px-8 bg-black/40 z-40">
           <div className="flex items-center gap-6">
             <h2 className="text-[9px] font-bold tracking-[0.3em] uppercase opacity-30">ARIA / AUTONOMOUS RUNTIME</h2>
             <div className="h-2 w-px bg-brand-line" />
             <div className="flex items-center gap-3 text-[9px] font-mono opacity-20 select-none">
                <span className="flex items-center gap-1.5 font-bold">
                  <div className="w-1 h-1 bg-brand-accent rounded-full animate-pulse" />
                  CORE INITIALIZED
                </span>
             </div>
           </div>
           
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-mono opacity-20 italic">"I'm ready when you are."</span>
              <div className="h-2 w-px bg-brand-line" />
              <button 
                onClick={() => setShowSettings(true)} 
                className="hover:opacity-40 transition-opacity"
              >
                <Sliders size={12} className="opacity-20" />
              </button>
           </div>
        </header>

        {/* 4-Panel Architecture */}
        <section className="flex-1 relative overflow-hidden flex">
          <AnimatePresence mode="wait">
            {activeTab === 'orchestrator' && (
              <motion.div 
                key="orchestrator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 grid grid-cols-12 h-full"
              >
                {/* 1. Agent Panel (The Brain) */}
                <div className="col-span-12 lg:col-span-3 h-full border-r border-brand-line">
                  <AgentPanel keys={keys} yoloMode={yoloMode} />
                </div>
                
                {/* 2. Terminal (The Execution) */}
                <div className="col-span-12 lg:col-span-6 h-full flex flex-col bg-black/40">
                   <div className="flex-1 p-8">
                      <Terminal yoloMode={yoloMode} />
                   </div>
                </div>

                {/* 3. Context (The Info Panel) */}
                <div className="col-span-12 lg:col-span-3 h-full">
                  <InfoPanel />
                </div>
              </motion.div>
            )}

            {activeTab === 'explorer' && (
              <motion.div 
                key="explorer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-8"
              >
                <FileExplorer />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="max-w-md w-full">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-9xl font-black text-brand-accent mb-16 tracking-tighter select-none opacity-80"
                  >
                    Λ
                  </motion.div>
                  <h1 className="text-xl font-light tracking-[0.2em] uppercase mb-4">ARIA</h1>
                  <p className="text-brand-ink/30 text-sm mb-16 font-mono font-light italic">Universal Runtime Intelligence Agent.</p>
                  
                  <div className="grid grid-cols-1 gap-4 w-full">
                    <DashboardCTA 
                      label="Neural Orchestration" 
                      sub="Plan and act through the agent core"
                      icon={<Command size={16} />}
                      onClick={() => setActiveTab('orchestrator')}
                    />
                    <DashboardCTA 
                      label="Audit Environment" 
                      sub="Explore the isolated Linux sandbox"
                      icon={<Layers size={16} />}
                      onClick={() => setActiveTab('explorer')}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Initial Authorization */}
        {Object.values(keys).every(k => !k) && (
          <div className="absolute inset-0 bg-brand-bg/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 text-center">
             <div className="max-w-sm w-full p-12 border border-brand-line bg-black flex flex-col items-center">
                <div className="text-6xl font-black text-brand-accent mb-16 select-none">Λ</div>
                <h2 className="text-xs font-bold mb-12 tracking-[0.4em] uppercase opacity-40">System Lock</h2>
                <div className="w-full space-y-4 mb-8">
                  <KeyInput placeholder="GEMINI API KEY..." onSave={(val) => saveKeys({...keys, gemini: val})} />
                </div>
                <p className="text-[9px] opacity-20 italic mb-8 uppercase tracking-widest">Provide at least one core key to initialize</p>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-full border border-brand-line py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-accent hover:border-brand-accent hover:text-white transition-all"
                >
                  Configure Providers
                </button>
             </div>
          </div>
        )}

        {/* Global Configuration Modal */}
        <SettingsPanel 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          onUpdate={(s) => {
            setKeys(s.keys);
            setYoloMode(s.agent.yoloMode);
          }}
        />
      </main>
    </div>
  );
}

function NavItem({ icon, active, onClick }: { icon: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-1.5 transition-all relative ${active ? 'text-brand-accent opacity-100 scale-110' : 'opacity-20 hover:opacity-50'}`}
    >
      {icon}
      {active && <motion.div layoutId="rail-active" className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-0.5 h-4 bg-brand-accent" />}
    </button>
  );
}

function DashboardCTA({ label, sub, icon, onClick }: { label: string; sub: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group w-full p-6 border border-brand-line hover:border-brand-accent/40 bg-black/20 hover:bg-brand-accent/5 transition-all text-left flex items-center justify-between"
    >
      <div className="flex items-center gap-6">
        <div className="p-3 bg-brand-line/20 text-brand-accent transition-colors group-hover:bg-brand-accent/10">
          {icon}
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-1">{label}</h4>
          <p className="text-[10px] opacity-30 font-mono italic">{sub}</p>
        </div>
      </div>
    </button>
  );
}

function KeyInput({ placeholder, onSave }: { placeholder: string; onSave: (val: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <input 
      type="password" 
      placeholder={placeholder} 
      value={val}
      onChange={(e) => setVal(e.target.value)}
      className="w-full bg-black border border-brand-line px-4 py-4 focus:border-brand-accent outline-none text-[10px] font-mono text-center tracking-widest placeholder:opacity-10"
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(val);
      }}
    />
  );
}
