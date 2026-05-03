import { create } from 'zustand';

export type AgentState = 'idle' | 'thinking' | 'executing' | 'error';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type TerminalEntry = {
  type: 'command' | 'stdout' | 'stderr' | 'system';
  content: string;
  timestamp: string;
};

interface AgentStore {
  state: AgentState;
  messages: Message[];
  terminalEntries: TerminalEntry[];
  provider: string;
  model: string;
  
  setState: (state: AgentState) => void;
  addMessage: (msg: Message) => void;
  addTerminalEntry: (entry: Omit<TerminalEntry, 'timestamp'>) => void;
  setMessages: (msgs: Message[]) => void;
  setProvider: (p: string) => void;
  setModel: (m: string) => void;
  clearMessages: () => void;
  clearTerminal: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  state: 'idle',
  messages: [],
  terminalEntries: [],
  provider: 'gemini',
  model: 'gemini-2.0-flash',

  setState: (state) => set({ state }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  addTerminalEntry: (entry) => set((s) => ({ 
    terminalEntries: [...s.terminalEntries, { ...entry, timestamp: new Date().toLocaleTimeString([], { hour12: false }) }] 
  })),
  setMessages: (messages) => set({ messages }),
  setProvider: (provider) => set({ provider }),
  setModel: (model) => set({ model }),
  clearMessages: () => set({ messages: [] }),
  clearTerminal: () => set({ terminalEntries: [] }),
}));
