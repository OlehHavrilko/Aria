'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Database, 
  Cpu, 
  ShieldAlert, 
  Server, 
  Terminal, 
  Key, 
  ShieldCheck, 
  Trash2, 
  RefreshCcw,
  Zap,
  Lock
} from 'lucide-react';
import { ProviderType } from '@/lib/ai';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (settings: any) => void;
}

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', color: '#3b82f6' },
  { id: 'anthropic', name: 'Anthropic Claude', color: '#f97316' },
  { id: 'openai', name: 'OpenAI GPT', color: '#10b981' },
  { id: 'groq', name: 'Groq Llama', color: '#a855f7' },
];

export default function SettingsPanel({ isOpen, onClose, onUpdate }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'providers' | 'runtime' | 'agent'>('providers');
  const [settings, setSettings] = useState({
    keys: { gemini: '', anthropic: '', openai: '', groq: '' },
    runtime: 'sandbox',
    ssh: { host: '', port: '22', username: '', key: '' },
    agent: {
      systemPrompt: '',
      yoloMode: false,
      memory: true
    },
    passphrase: ''
  });

  const [isTesting, setIsTesting] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aria_full_settings');
    if (saved) {
      try {
        // In a real app, we would decrypt here using the passphrase
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load settings");
      }
    }
  }, []);

  const saveSettings = (newSettings = settings) => {
    setSettings(newSettings);
    // In a real app, we would encrypt here
    localStorage.setItem('aria_full_settings', JSON.stringify(newSettings));
    onUpdate(newSettings);
  };

  const testConnection = async (provider: string) => {
    setIsTesting(provider);
    // Simulate connection test
    setTimeout(() => {
      setIsTesting(null);
      alert(`${provider.toUpperCase()} connection established.`);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }} 
        className="relative w-full max-w-2xl h-[600px] border border-brand-line bg-black flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-brand-line flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-black text-brand-accent tracking-tighter">Λ</div>
            <div className="h-4 w-px bg-brand-line" />
            <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">System Configuration</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-20 hover:opacity-100 transition-opacity">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-line">
          <TabButton active={activeTab === 'providers'} onClick={() => setActiveTab('providers')} label="Providers" icon={<Key size={14} />} />
          <TabButton active={activeTab === 'runtime'} onClick={() => setActiveTab('runtime')} label="Runtime" icon={<Server size={14} />} />
          <TabButton active={activeTab === 'agent'} onClick={() => setActiveTab('agent')} label="Agent" icon={<Cpu size={14} />} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'providers' && (
              <motion.div key="providers" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-10">
                <div className="grid grid-cols-1 gap-8">
                  {PROVIDERS.map(p => (
                    <div key={p.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 font-mono">{p.name}</label>
                        </div>
                        <button 
                          onClick={() => testConnection(p.id)}
                          disabled={!settings.keys[p.id as keyof typeof settings.keys]}
                          className="text-[9px] font-bold uppercase tracking-widest text-brand-accent hover:opacity-60 disabled:opacity-10 transition-opacity flex items-center gap-2"
                        >
                          {isTesting === p.id ? <RefreshCcw size={10} className="animate-spin" /> : <ShieldCheck size={10} />}
                          Test Link
                        </button>
                      </div>
                      <input 
                        type="password"
                        value={settings.keys[p.id as keyof typeof settings.keys]}
                        onChange={(e) => {
                          const newKeys = { ...settings.keys, [p.id]: e.target.value };
                          saveSettings({ ...settings, keys: newKeys });
                        }}
                        placeholder={`ENTER ${p.name.toUpperCase()} API KEY...`}
                        className="w-full bg-black border border-brand-line px-4 py-3 focus:border-brand-accent outline-none text-[10px] font-mono tracking-widest placeholder:opacity-10"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'runtime' && (
              <motion.div key="runtime" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-12">
                <div className="grid grid-cols-2 gap-4">
                  <RuntimeOption 
                    active={settings.runtime === 'sandbox'} 
                    onClick={() => saveSettings({ ...settings, runtime: 'sandbox' })} 
                    icon={<Database size={18} />} 
                    label="Isolated Sandbox"
                    sub="Alpine Linux Container"
                  />
                  <RuntimeOption 
                    active={settings.runtime === 'ssh'} 
                    onClick={() => saveSettings({ ...settings, runtime: 'ssh' })} 
                    icon={<Terminal size={18} />} 
                    label="Custom SSH"
                    sub="Connect to your own shell"
                  />
                </div>

                {settings.runtime === 'ssh' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-6 pt-6 border-t border-brand-line">
                    <Field label="Host" value={settings.ssh.host} onChange={(v) => saveSettings({...settings, ssh: {...settings.ssh, host: v}})} />
                    <Field label="Port" value={settings.ssh.port} onChange={(v) => saveSettings({...settings, ssh: {...settings.ssh, port: v}})} />
                    <Field label="Username" value={settings.ssh.username} onChange={(v) => saveSettings({...settings, ssh: {...settings.ssh, username: v}})} />
                    <div className="col-span-2">
                       <Field label="Private Key" value={settings.ssh.key} onChange={(v) => saveSettings({...settings, ssh: {...settings.ssh, key: v}})} textarea />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'agent' && (
              <motion.div key="agent" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-12">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Directives</label>
                  <textarea 
                    value={settings.agent.systemPrompt}
                    onChange={(e) => saveSettings({ ...settings, agent: { ...settings.agent, systemPrompt: e.target.value }})}
                    placeholder="Override default character instructions..."
                    className="w-full bg-black border border-brand-line p-4 min-h-[120px] focus:border-brand-accent outline-none text-[10px] font-mono leading-relaxed"
                  />
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest">YOLO Protocols</p>
                       <p className="text-[9px] opacity-30 mt-1 italic font-mono">Bypass safety confirmation traps</p>
                     </div>
                     <Toggle 
                        active={settings.agent.yoloMode} 
                        onToggle={() => saveSettings({ ...settings, agent: { ...settings.agent, yoloMode: !settings.agent.yoloMode }})} 
                        danger
                      />
                   </div>

                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest">Neural Memory</p>
                       <p className="text-[9px] opacity-30 mt-1 italic font-mono">Retain context between sessions</p>
                     </div>
                     <Toggle 
                        active={settings.agent.memory} 
                        onToggle={() => saveSettings({ ...settings, agent: { ...settings.agent, memory: !settings.agent.memory }})} 
                      />
                   </div>
                </div>

                <div className="pt-8 border-t border-brand-line">
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                     <Lock size={12} /> Vault Encryption
                   </p>
                   <input 
                      type="password"
                      value={settings.passphrase}
                      onChange={(e) => saveSettings({ ...settings, passphrase: e.target.value })}
                      placeholder="SET MASTER PASSPHRASE FOR LOCAL ENCRYPTION..."
                      className="w-full bg-black border border-brand-line px-4 py-3 focus:border-brand-accent outline-none text-[10px] font-mono tracking-widest placeholder:opacity-10"
                   />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-brand-line flex justify-end gap-4 bg-black">
          <button 
            onClick={onClose}
            className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-brand-line transition-all"
          >
            Apply & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-3 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${active ? 'border-brand-accent text-brand-accent' : 'border-transparent opacity-20 hover:opacity-50'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function RuntimeOption({ active, onClick, icon, label, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 border flex flex-col items-center text-center gap-4 transition-all ${active ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-line hover:border-brand-line/60 bg-black'}`}
    >
      <div className={`${active ? 'text-brand-accent' : 'opacity-20'}`}>
        {icon}
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</p>
        <p className="text-[9px] opacity-20 font-mono italic">{sub}</p>
      </div>
    </button>
  );
}

function Toggle({ active, onToggle, danger }: { active: boolean; onToggle: () => void; danger?: boolean }) {
  return (
    <button 
      onClick={onToggle}
      className={`w-10 h-5 border transition-all relative ${active ? (danger ? 'bg-brand-error border-brand-error' : 'bg-brand-accent border-brand-accent') : 'border-brand-line bg-transparent'}`}
    >
      <motion.div 
        animate={{ x: active ? 20 : 0 }} 
        className="w-4 h-4 bg-white absolute top-0"
      />
    </button>
  );
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const Comp = textarea ? 'textarea' : 'input';
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase tracking-widest opacity-30 font-mono">{label}</label>
      <Comp 
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        className={`w-full bg-black border border-brand-line px-3 py-2 focus:border-brand-accent outline-none text-[10px] font-mono ${textarea ? 'min-h-[80px]' : ''}`}
      />
    </div>
  );
}
