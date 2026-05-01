'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Terminal as TerminalIcon, Sparkles, Cpu, ShieldAlert, Bot } from 'lucide-react';
import { chatWithARIA, DEFAULT_SYSTEM_INSTRUCTION, Message, ProviderType } from '@/lib/ai';

interface AgentPanelProps {
  onExecute?: (cmd: string) => void;
  keys?: Record<string, string>;
  yoloMode?: boolean;
}

const PROVIDERS = [
  { id: 'gemini', name: 'Gemini', color: '#3b82f6', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { id: 'anthropic', name: 'Claude', color: '#f97316', models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'] },
  { id: 'openai', name: 'OpenAI', color: '#10b981', models: ['gpt-4o', 'gpt-4o-mini'] },
  { id: 'groq', name: 'Groq', color: '#a855f7', models: ['llama-3.3-70b-specdec', 'mixtral-8x7b-32768'] },
];

export default function AgentPanel({ onExecute, keys = {}, yoloMode }: AgentPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<ProviderType>('gemini');
  const [activeModel, setActiveModel] = useState('gemini-2.0-flash');
  const scrollRef = useRef<HTMLDivElement>(null);

  const providerInfo = PROVIDERS.find(p => p.id === activeProvider)!;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Update model when provider changes
  const handleProviderChange = (p: ProviderType) => {
    setActiveProvider(p);
    const info = PROVIDERS.find(info => info.id === p)!;
    setActiveModel(info.models[0]);
  };

  const handleSend = async () => {
    const apiKey = keys[activeProvider];
    if (!input.trim() || !apiKey) return;

    const userMessage = input;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let currentMessages = [...newMessages];
      let loopCount = 0;
      const MAX_LOOPS = 10;

      while (loopCount < MAX_LOOPS) {
        const response = await chatWithARIA(
          activeProvider,
          apiKey,
          activeModel,
          currentMessages,
          DEFAULT_SYSTEM_INSTRUCTION + (yoloMode ? "\n\nYOLO MODE ACTIVE. EXECUTE DIRECTLY." : "")
        );

        if (response.text) {
          setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
          currentMessages.push({ role: 'assistant', content: response.text });
        }

        if (response.toolCalls && response.toolCalls.length > 0) {
          const toolOutputs = [];
          
          for (const call of response.toolCalls) {
            if (call.name === 'run_command') {
              const cmd = call.args.command;
              setMessages(prev => [...prev, { role: 'assistant', content: `[ACTION]: ${cmd}` }]);
              
              const shellRes = await fetch('/api/shell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd, yoloMode: true }),
              });
              const shellData = await shellRes.json();
              const output = shellData.stdout || shellData.stderr || "(Success)";
              
              toolOutputs.push(`Tool ${call.name} output: ${output}`);
              if (onExecute) onExecute(cmd);
            }
            
            if (call.name === 'list_files') {
              const path = call.args.path || '.';
              const res = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
              const data = await res.json();
              const files = data.files?.map((f: any) => f.name).join(', ') || 'No files found';
              toolOutputs.push(`Tool ${call.name} output: ${files}`);
            }
          }

          const toolMsg = `Execution Result:\n${toolOutputs.join('\n')}`;
          currentMessages.push({ role: 'user', content: toolMsg });
          loopCount++;
        } else {
          break; // No more tool calls
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'system', content: `Neural Fault: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-brand-line bg-black overflow-hidden relative">
      <div className="px-6 py-4 border-b border-brand-line flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <select 
            value={activeProvider}
            onChange={(e) => handleProviderChange(e.target.value as ProviderType)}
            className="bg-transparent text-[10px] uppercase tracking-widest font-black focus:outline-none opacity-40 hover:opacity-100 transition-opacity cursor-pointer appearance-none text-brand-accent"
          >
            {PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: providerInfo.color }} />
          <div className="h-4 w-px bg-brand-line" />
          <select 
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="bg-transparent text-[9px] uppercase tracking-widest font-bold focus:outline-none opacity-40 hover:opacity-100 transition-opacity cursor-pointer appearance-none"
          >
            {providerInfo.models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        {yoloMode && <span className="text-[9px] text-brand-error font-mono font-bold animate-pulse">YOLO</span>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-6">
            <div className="text-6xl font-black">Λ</div>
            <p className="text-xs uppercase tracking-widest">Awaiting Command Input</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className="text-[10px] uppercase tracking-widest opacity-30 mb-2 font-mono">
                  {m.role === 'user' ? 'Input' : m.content.startsWith('[ACTION]') ? 'Runtime' : 'ARIA'}
                </div>
                <div className={`
                  ${m.content.startsWith('[ACTION]') 
                    ? 'p-3 bg-brand-line/10 border border-brand-line text-[10px] font-mono opacity-60' 
                    : m.role === 'system'
                    ? 'text-brand-error text-xs font-bold italic'
                    : 'text-xs font-light leading-relaxed text-brand-ink/90 whitespace-pre-wrap'
                  }
                `}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex gap-1.5 opacity-20">
            <div className="w-1 h-1 bg-brand-accent animate-bounce" />
            <div className="w-1 h-1 bg-brand-accent animate-bounce [animation-delay:0.2s]" />
            <div className="w-1 h-1 bg-brand-accent animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      <div className="p-6 border-t border-brand-line bg-black">
        {!keys[activeProvider] ? (
          <div className="text-[9px] text-brand-error uppercase tracking-widest font-bold opacity-60 mb-2">
            No API key for {activeProvider.toUpperCase()}
          </div>
        ) : null}
        <div className="relative group flex items-end gap-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe intent..."
            className="flex-1 bg-transparent border-b border-brand-line focus:border-brand-accent py-2 resize-none focus:outline-none text-xs font-mono tracking-wide placeholder:opacity-20 transition-all min-h-[40px] max-h-[200px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !keys[activeProvider]}
            className="p-1 opacity-20 hover:opacity-100 disabled:opacity-0 transition-all text-brand-accent mb-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
