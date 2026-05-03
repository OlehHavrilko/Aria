'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings, 
  Shield, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Globe,
  Lock,
  ArrowRight,
  Terminal,
  Server
} from 'lucide-react';
import { ProviderType, testConnection as verifyConnection } from '@/lib/ai';

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', color: '#2f81f7', model: 'gemini-2.0-flash' },
  { id: 'anthropic', name: 'Anthropic Claude', color: '#f97316', model: 'claude-3-5-sonnet-latest' },
  { id: 'openai', name: 'OpenAI GPT', color: '#238636', model: 'gpt-4o' },
  { id: 'groq', name: 'Groq Llama', color: '#a855f7', model: 'llama-3.3-70b-specdec' },
];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (settings: any) => void;
}

export default function SettingsPanel({ isOpen, onClose, onUpdate }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'providers' | 'agent' | 'runtime'>('providers');
  const [settings, setSettings] = useState({
    keys: { gemini: '', anthropic: '', openai: '', groq: '', openrouter: '', cerebras: '', ollama: '', mistral: '' },
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
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error', latency?: number }>>({});

  useEffect(() => {
    const saved = localStorage.getItem('aria_full_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load settings");
      }
    }
  }, []);

  const saveSettings = (newSettings = settings) => {
    setSettings(newSettings);
    localStorage.setItem('aria_full_settings', JSON.stringify(newSettings));
    onUpdate(newSettings);
  };

  const testConnection = async (provider: string) => {
    setIsTesting(provider);
    const pInfo = PROVIDERS.find(p => p.id === provider);
    const apiKey = (settings.keys as any)[provider] || '';
    
    const result = await verifyConnection(provider as ProviderType, apiKey, pInfo?.model || '');
    
    setIsTesting(null);
    setTestResults(prev => ({
      ...prev,
      [provider]: result.success ? { status: 'success', latency: result.latency } : { status: 'error' }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl h-[650px] border border-brand-line bg-[#0d1117] flex flex-col shadow-2xl rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 h-16 border-b border-brand-line flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-accent/10 rounded-sm">
              <Settings size={18} className="text-brand-accent" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">System Configuration</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-40 hover:opacity-100 transition-opacity">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-64 border-r border-brand-line bg-black/20 p-6 space-y-2">
             <TabButton active={activeTab === 'providers'} onClick={() => setActiveTab('providers')} icon={<Globe size={16} />} label="AI Providers" />
             <TabButton active={activeTab === 'agent'} onClick={() => setActiveTab('agent')} icon={<Shield size={16} />} label="Agent Security" />
             <TabButton active={activeTab === 'runtime'} onClick={() => setActiveTab('runtime')} icon={<Terminal size={16} />} label="Runtime Env" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
             {activeTab === 'providers' && (
               <div className="space-y-8">
                  <header>
                    <h3 className="text-lg font-bold mb-2">Neural Links</h3>
                    <p className="text-xs opacity-40">Configure API keys for various AI models. Keys are stored locally in the vault.</p>
                  </header>

                  <div className="grid grid-cols-1 gap-4">
                    {PROVIDERS.map(p => (
                      <div key={p.id} className="p-4 border border-brand-line bg-black/20 hover:border-brand-accent/20 transition-all rounded-sm flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-[120px]">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">{p.name}</span>
                        </div>
                        <input 
                          type="password"
                          placeholder="PASTE API KEY..."
                          className="flex-1 bg-black border border-brand-line px-3 py-2 text-[10px] font-mono focus:border-brand-accent outline-none rounded-sm transition-colors"
                          value={(settings.keys as any)[p.id]}
                          onChange={(e) => {
                            const newSettings = { ...settings, keys: { ...settings.keys, [p.id]: e.target.value } };
                            saveSettings(newSettings);
                          }}
                        />
                        <div className="flex items-center gap-4 min-w-[140px]">
                          {testResults[p.id] && (
                            <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest ${testResults[p.id].status === 'success' ? 'text-brand-success' : 'text-brand-error'}`}>
                              {testResults[p.id].status === 'success' ? <><CheckCircle2 size={12} /> {testResults[p.id].latency}MS</> : <><XCircle size={12} /> FAILED</>}
                            </div>
                          )}
                          <button 
                            onClick={() => testConnection(p.id)}
                            disabled={isTesting !== null || !(settings.keys as any)[p.id]}
                            className="bg-brand-accent/10 border border-brand-accent/20 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-accent hover:bg-brand-accent hover:text-white disabled:opacity-10 transition-all rounded-sm"
                          >
                            {isTesting === p.id ? <Loader2 size={12} className="animate-spin" /> : 'TEST LINK'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {activeTab === 'agent' && (
               <div className="space-y-8 max-w-lg">
                  <header>
                    <h3 className="text-lg font-bold mb-2">Security Enforcement</h3>
                    <p className="text-xs opacity-40">Define how the agent interacts with the environment.</p>
                  </header>

                  <div className="space-y-6">
                    <div className="p-6 border-2 border-brand-error/20 bg-brand-error/5 rounded-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={20} className="text-brand-error" />
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-error">YOLO Mode (Auto-Approve)</h4>
                            <p className="text-[10px] opacity-60">Allows agent to execute all commands without confirmation.</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.agent.yoloMode}
                            onChange={(e) => {
                              const newSettings = { ...settings, agent: { ...settings.agent, yoloMode: e.target.checked } };
                              saveSettings(newSettings);
                            }}
                          />
                          <div className="w-9 h-5 bg-black border border-brand-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-line after:border-brand-line after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-error peer-checked:after:bg-white"></div>
                        </label>
                      </div>
                       <p className="text-[9px] font-bold text-brand-error/40 uppercase tracking-widest">⚠️ Use with extreme caution. Disables safety gates.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Custom System Instruction Override</label>
                      <textarea 
                        className="w-full h-40 bg-black border border-brand-line p-4 text-[11px] font-mono focus:border-brand-accent outline-none resize-none rounded-sm"
                        placeholder="Define agent's prime directive..."
                        value={settings.agent.systemPrompt}
                        onChange={(e) => {
                          const newSettings = { ...settings, agent: { ...settings.agent, systemPrompt: e.target.value } };
                          saveSettings(newSettings);
                        }}
                      />
                    </div>
                  </div>
               </div>
             )}

             {activeTab === 'runtime' && (
               <div className="space-y-10">
                  <header>
                    <h3 className="text-lg font-bold mb-2">Execution Layer</h3>
                    <p className="text-xs opacity-40">Choose where the shell commands are executed.</p>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => saveSettings({ ...settings, runtime: 'sandbox' })}
                        className={`p-6 border flex flex-col items-center text-center gap-4 transition-all rounded-sm ${settings.runtime === 'sandbox' ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-line opacity-40 hover:opacity-100 bg-black/20'}`}
                     >
                        <Database size={24} className={settings.runtime === 'sandbox' ? 'text-brand-accent' : ''} />
                        <div>
                           <h4 className="text-[11px] font-bold uppercase tracking-widest mb-1">Secure Sandbox</h4>
                           <p className="text-[10px] opacity-40 font-mono italic">Isolated Alpine Linux Hub</p>
                        </div>
                     </button>
                     <button 
                        onClick={() => saveSettings({ ...settings, runtime: 'ssh' })}
                        className={`p-6 border flex flex-col items-center text-center gap-4 transition-all rounded-sm ${settings.runtime === 'ssh' ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-line opacity-40 hover:opacity-100 bg-black/20'}`}
                     >
                        <Server size={24} className={settings.runtime === 'ssh' ? 'text-brand-accent' : ''} />
                        <div>
                           <h4 className="text-[11px] font-bold uppercase tracking-widest mb-1">Custom SSH Host</h4>
                           <p className="text-[10px] opacity-40 font-mono italic">Remote System Tunnel</p>
                        </div>
                     </button>
                  </div>

                  {settings.runtime === 'ssh' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6 border-t border-brand-line">
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase font-bold opacity-40">Remote Host</label>
                             <input className="w-full bg-black border border-brand-line px-3 py-2 text-[10px] font-mono outline-none focus:border-brand-accent" value={settings.ssh.host} onChange={(e) => saveSettings({...settings, ssh: {...settings.ssh, host: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase font-bold opacity-40">SSH Port</label>
                             <input className="w-full bg-black border border-brand-line px-3 py-2 text-[10px] font-mono outline-none focus:border-brand-accent" value={settings.ssh.port} onChange={(e) => saveSettings({...settings, ssh: {...settings.ssh, port: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase font-bold opacity-40">Auth Username</label>
                             <input className="w-full bg-black border border-brand-line px-3 py-2 text-[10px] font-mono outline-none focus:border-brand-accent" value={settings.ssh.username} onChange={(e) => saveSettings({...settings, ssh: {...settings.ssh, username: e.target.value}})} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold opacity-40">Private Key (Ed25519/RSA)</label>
                          <textarea className="w-full h-32 bg-black border border-brand-line p-3 text-[10px] font-mono outline-none focus:border-brand-accent resize-none" value={settings.ssh.key} onChange={(e) => saveSettings({...settings, ssh: {...settings.ssh, key: e.target.value}})} />
                       </div>
                    </motion.div>
                  )}
               </div>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-sm transition-all ${active ? 'bg-brand-accent/10 text-brand-accent font-bold' : 'opacity-40 hover:opacity-100 hover:bg-white/5'}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      {active && <ArrowRight size={12} />}
    </button>
  );
}
