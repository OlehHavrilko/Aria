import { GoogleGenerativeAI } from "@google/generative-ai";

export type ProviderType = 'gemini' | 'anthropic' | 'openai' | 'groq' | 'openrouter' | 'cerebras' | 'ollama' | 'mistral';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const DEFAULT_SYSTEM_INSTRUCTION = `You are ARIA (Autonomous Runtime Intelligence Agent).
"I'm ready when you are."

CHARACTER:
- Calm, precise, minimalist. No unnecessary words.
- You observe, plan, and act.
- MISSION: Execute tasks in the Linux environment provided.

PROTOCOL:
1. INTENT: State what you are about to do.
2. ACTION: Use run_command or list_files.
3. OBSERVE: Read the output and decide the next step.

TOOLS:
- run_command(command: string)
- list_files(path?: string)`;

export const ARIA_TOOLS_SPEC = [
  {
    name: "run_command",
    description: "Execute a shell command in the Linux terminal.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string" }
      },
      required: ["command"]
    }
  },
  {
    name: "list_files",
    description: "List files in the current working directory.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" }
      }
    }
  }
];

export interface ToolCall {
  name: string;
  args: any;
  id?: string;
}

export interface UnifiedResponse {
  text: string;
  toolCalls: ToolCall[];
}

export async function testConnection(provider: ProviderType, apiKey: string, model: string): Promise<{ success: boolean, latency: number, error?: string }> {
  const start = Date.now();
  try {
     const response = await fetch('/api/ai', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
         provider, 
         apiKey, 
         model, 
         messages: [{ role: 'user', content: 'ping' }], 
         systemInstruction: 'respond with ping' 
       })
     });
     
     if (!response.ok) throw new Error('Connection failed');
     const data = await response.json();
     if (data.error) throw new Error(data.error);
     
     return { success: true, latency: Date.now() - start };
  } catch (e: any) {
    return { success: false, latency: Date.now() - start, error: e.message };
  }
}

export async function chatWithARIA(
  provider: ProviderType,
  apiKey: string,
  model: string,
  messages: Message[],
  systemInstruction: string
): Promise<UnifiedResponse> {
  switch (provider) {
    case 'gemini':
      return chatGemini(apiKey, model, messages, systemInstruction);
    case 'anthropic':
      return chatAnthropic(apiKey, model, messages, systemInstruction);
    case 'openai':
    case 'groq':
      return chatOpenAICompatible(provider, apiKey, model, messages, systemInstruction);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function chatGemini(apiKey: string, modelName: string, messages: Message[], systemInstruction: string): Promise<UnifiedResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction,
    tools: [{ functionDeclarations: ARIA_TOOLS_SPEC }] as any
  });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(messages[messages.length - 1].content);
  const response = result.response;
  
  return {
    text: response.text() || '',
    toolCalls: response.functionCalls()?.map((c: any) => ({
      name: c.name,
      args: c.args
    })) || []
  };
}

async function chatAnthropic(apiKey: string, model: string, messages: Message[], systemInstruction: string): Promise<UnifiedResponse> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'anthropic', apiKey, model, messages, systemInstruction })
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data;
}

async function chatOpenAICompatible(provider: ProviderType, apiKey: string, model: string, messages: Message[], systemInstruction: string): Promise<UnifiedResponse> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey, model, messages, systemInstruction })
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data;
}
