'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Terminal as TerminalIcon, Sparkles, Cpu, ShieldAlert, Bot } from 'lucide-react';
import { getAIClient, DEFAULT_SYSTEM_INSTRUCTION } from '@/lib/ai';

interface AgentPanelProps {
  onExecute?: (cmd: string) => void;
  apiKey?: string;
  yoloMode?: boolean;
}

export default function AgentPanel({ onExecute, apiKey, yoloMode }: AgentPanelProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = getAIClient(apiKey);
      const chat = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION + (yoloMode ? "\n\nCRITICAL: YOLO MODE ACTIVE. EXECUTE SILENTLY." : ""),
        }
      });

      const response = await chat.sendMessage({
          message: userMessage,
      });

      const text = response.text || "No response";
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'system', content: `Core Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-brand-line bg-black overflow-hidden relative">
      {/* Subtle Header */}
      <div className="p-6 border-b border-brand-line flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-brand-accent tracking-tighter">Λ</div>
          <div className="h-4 w-px bg-brand-line" />
          <h3 className="text-[10px] uppercase tracking-widest font-bold opacity-40">Intelligence Core</h3>
        </div>
        {yoloMode && <span className="text-[9px] text-brand-error font-bold tracking-widest uppercase px-2 py-0.5 border border-brand-error/30 animate-pulse">Yolo Active</span>}
      </div>

      {/* Message Stream */}
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
              <div className={`max-w-[90%] ${
                m.role === 'user' 
                ? 'text-right' 
                : m.role === 'system'
                ? 'text-brand-error italic'
                : 'text-left'
              }`}>
                <div className="text-[10px] uppercase tracking-widest opacity-30 mb-2">
                  {m.role === 'user' ? 'Direct Input' : 'ARIA Outcome'}
                </div>
                <div className={`prose prose-invert prose-sm text-brand-ink/80 leading-relaxed font-light ${m.role === 'assistant' ? 'font-mono text-xs' : ''}`}>
                  {m.content.split('\n').map((line, li) => (
                    <div key={li} className="mb-4 last:mb-0 flex items-start gap-4">
                      <span className="flex-1">{line}</span>
                      {line.trim().startsWith('`') && line.trim().endsWith('`') && (
                        <button 
                          onClick={() => onExecute?.(line.replace(/`/g, ''))}
                          className="mt-1 p-1.5 hover:bg-white/10 border border-white/20 transition-colors text-brand-accent"
                          title="Execute Command"
                        >
                          <TerminalIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Command Buffer */}
      <div className="p-6 border-t border-brand-line bg-black">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Instruction line..."
            className="w-full bg-transparent border-b border-brand-line focus:border-brand-accent px-0 py-4 resize-none focus:outline-none text-xs font-mono tracking-wide placeholder:opacity-20 transition-all"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-0 bottom-4 p-1 opacity-20 hover:opacity-100 disabled:opacity-0 transition-all text-brand-accent"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
