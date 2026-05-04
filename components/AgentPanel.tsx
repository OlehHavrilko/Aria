'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { chatWithARIA, ProviderType } from '@/lib/ai';
import { BUILTIN_SKILLS } from '@/lib/skills';
import { useAgentStore } from '@/lib/store';
import ExecutionBlock from './agent/ExecutionBlock';
import AgentStatus from './agent/AgentStatus';
import AgentMessage from './agent/AgentMessage';

interface AgentPanelProps {
  onExecute?: (cmd: string) => void;
  keys?: Record<string, string>;
  yoloMode?: boolean;
}

const PROVIDERS = [
  { id: 'gemini', name: 'Gemini', color: '#2f81f7', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { id: 'anthropic', name: 'Claude', color: '#f97316', models: ['claude-3-5-sonnet-latest'] },
  { id: 'openai', name: 'OpenAI', color: '#238636', models: ['gpt-4o', 'o1-preview'] },
  { id: 'groq', name: 'Groq', color: '#a855f7', models: ['llama-3.3-70b-specdec'] },
  { id: 'openrouter', name: 'OpenRouter', color: '#7c3aed', models: ['google/gemini-2.0-flash-001', 'anthropic/claude-3.5-sonnet'] },
  { id: 'cerebras', name: 'Cerebras', color: '#ec4899', models: ['llama3.1-70b', 'llama3.1-8b'] },
  { id: 'mistral', name: 'Mistral', color: '#f59e0b', models: ['mistral-large-latest', 'pixtral-large-latest'] },
  { id: 'ollama', name: 'Ollama', color: '#4b5563', models: ['llama3', 'mistral', 'phi3'] },
];

export default function AgentPanel({ onExecute, keys = {}, yoloMode }: AgentPanelProps) {
  const { 
    state, messages, provider, model, 
    setState, addMessage, setProvider, setModel, setMessages 
  } = useAgentStore();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, state]);

  const handleProviderChange = (p: string) => {
    setProvider(p);
    const info = PROVIDERS.find(info => info.id === p)!;
    setModel(info.models[0]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const rawInput = input.trim();
    setInput('');
    setHistory(prev => [rawInput, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);

    // 1. Check for @provider switching
    if (rawInput.startsWith('@')) {
      const match = rawInput.match(/^@(\w+)\s*(.*)/);
      if (match) {
        const target = match[1].toLowerCase();
        if (PROVIDERS.some(p => p.id === target)) {
          handleProviderChange(target);
          if (!match[2]) return;
        }
      }
    }

    // 2. Check for skills
    if (rawInput.startsWith('/')) {
      const skill = BUILTIN_SKILLS.find(s => rawInput.startsWith(s.trigger));
      if (skill) {
          const args = rawInput.replace(skill.trigger, '').trim();
          if (skill.approval && !confirm(`EXECUTE SYSTEM SKILL: ${skill.name}?`)) return;
          
          setState('executing');
          for (const rawStep of skill.steps) {
              const step = rawStep.replace('{message}', args || 'auto-commit');
              addMessage({ role: 'assistant', content: `EXECUTE: ${step}` });
              useAgentStore.getState().addTerminalEntry({ type: 'command', content: step });
              
              const shellRes = await fetch('/api/shell', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: step, yoloMode: true }),
              });
              const shellData = await shellRes.json();
              const out = shellData.stdout || shellData.stderr || "(Success)";
              addMessage({ role: 'assistant', content: `OUTPUT: ${out}` });
              
              if (shellData.stdout) useAgentStore.getState().addTerminalEntry({ type: 'stdout', content: shellData.stdout });
              if (shellData.stderr) useAgentStore.getState().addTerminalEntry({ type: 'stderr', content: shellData.stderr });
          }
          setState('idle');
          return;
      }
    }

    const apiKey = keys[provider];
    if (!apiKey) {
      setState('error');
      addMessage({ role: 'system', content: `CRITICAL FAULT: Missing Credentials for ${provider.toUpperCase()}` });
      useAgentStore.getState().addTerminalEntry({ type: 'system', content: `Security Exception: No API key for ${provider}` });
      return;
    }

    const newMessages = [...messages, { role: 'user', content: rawInput }];
    setMessages(newMessages as any);
    setState('thinking');
    useAgentStore.getState().addTerminalEntry({ type: 'system', content: `User Intent Received: ${rawInput.substring(0, 30)}...` });

    try {
      let loopCount = 0;
      const currentMessages: any[] = [...newMessages];

      while (loopCount < 10) {
        const response = await chatWithARIA(
          provider as ProviderType,
          apiKey,
          model,
          currentMessages,
          "You are ARIA, a production-grade systems orchestrator. Use tool 'execute_command' for shell tasks. Be precise, technical, and secure."
        );

        if (response.text) {
          addMessage({ role: 'assistant', content: response.text });
          currentMessages.push({ role: 'assistant', content: response.text } as any);
        }

        if (response.toolCalls && response.toolCalls.length > 0) {
          setState('executing');
          for (const call of response.toolCalls) {
            if (call.name === 'execute_command') {
              const cmd = call.args.command;
              addMessage({ role: 'assistant', content: `EXECUTE: ${cmd}` });
              useAgentStore.getState().addTerminalEntry({ type: 'command', content: cmd });
              
              const shellRes = await fetch('/api/shell', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: cmd, yoloMode: true }),
              });
              const shellData = await shellRes.json();
              const output = shellData.stdout || shellData.stderr || "(Success)";
              addMessage({ role: 'assistant', content: `OUTPUT: ${output}` });
              
              if (shellData.stdout) useAgentStore.getState().addTerminalEntry({ type: 'stdout', content: shellData.stdout });
              if (shellData.stderr) useAgentStore.getState().addTerminalEntry({ type: 'stderr', content: shellData.stderr });

              currentMessages.push({ 
                role: 'user', 
                content: `Command executed: ${cmd}. Output: ${output}` 
              } as any);

              if (onExecute) onExecute(cmd);
            }
          }
          setState('thinking');
          loopCount++;
        } else {
          break;
        }
      }
      setState('idle');
    } catch (err: any) {
      setState('error');
      addMessage({ role: 'system', content: `NEURAL CORE FAULT: ${err.message.toUpperCase()}` });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'ArrowUp') {
       if (historyIndex < history.length - 1) {
          const next = historyIndex + 1;
          setHistoryIndex(next);
          setInput(history[next]);
       }
    }
    if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const next = historyIndex - 1;
        setHistoryIndex(next);
        setInput(history[next]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] relative">
      <div className="h-12 border-b border-brand-line flex items-center justify-between px-6 bg-black/20">
        <div className="flex items-center gap-4">
          <AgentStatus />
          <div className="h-3 w-px bg-brand-line" />
          <div className="flex items-center gap-2 opacity-40">
             <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Substrate Active</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="bg-black/40 border border-brand-line rounded-sm px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-accent focus:outline-none"
          >
            {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {yoloMode && <div className="text-[9px] bg-brand-error/10 text-brand-error border border-brand-error/20 px-2 py-0.5 rounded-sm font-black animate-pulse">YOLO</div>}
        </div>
      </div>

      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
            <Sparkles size={48} className="mb-6 animate-pulse" />
            <h4 className="text-sm font-bold uppercase tracking-[0.3em] mb-2">Neural Link Ready</h4>
            <p className="text-[10px] max-w-[200px] leading-relaxed font-mono italic">Awaiting Operator Intent Protocol...</p>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.content.startsWith('EXECUTE:')) {
             const cmd = m.content.replace('EXECUTE:', '').trim();
             const outputMsg = messages[i+1]?.content.startsWith('OUTPUT:') ? messages[i+1].content.replace('OUTPUT:', '').trim() : undefined;
             return <ExecutionBlock key={i} command={cmd} output={outputMsg} status={outputMsg ? 'success' : 'running'} />;
          }
          if (m.content.startsWith('OUTPUT:')) return null;

          return <AgentMessage key={i} role={m.role as any} content={m.content} />;
        })}
        
        {state === 'thinking' && (
           <div className="flex items-center gap-3 opacity-30 text-[10px] font-mono italic px-10">
              <Loader2 size={12} className="animate-spin" /> Async Processing...
           </div>
        )}
      </div>

      <div className="p-4 border-t border-brand-line bg-black/40">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-brand-accent transition-all">
            <ChevronRight size={14} />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="INPUT COMMAND OR TRIGGER (/) ..."
            className="w-full bg-black border border-brand-line rounded-sm pl-10 pr-12 py-3 focus:border-brand-accent outline-none text-xs font-mono tracking-tight placeholder:opacity-20 resize-none min-h-[48px] max-h-[200px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || state === 'thinking' || state === 'executing'}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 disabled:opacity-0 transition-all text-brand-accent"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
           <div className="flex gap-4 opacity-20 text-[8px] font-bold uppercase tracking-widest leading-none">
              <span>Shift+Enter Node</span>
              <span>↑/↓ Command History</span>
           </div>
           <div className="flex gap-4 opacity-40 text-[8px] font-bold uppercase tracking-widest leading-none">
              <span>{provider} context: {model}</span>
           </div>
        </div>
      </div>
    </div>
  );
}
