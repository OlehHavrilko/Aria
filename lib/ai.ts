import { GoogleGenerativeAI } from "@google/generative-ai";

export type ProviderType = 'gemini' | 'anthropic' | 'openai' | 'groq';

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
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'dangerously-allow-custom-headers': 'true'
    },
    body: JSON.stringify({
      model,
      system: systemInstruction,
      messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      tools: ARIA_TOOLS_SPEC.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters
      })),
      max_tokens: 4096
    })
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  let text = '';
  const toolCalls: ToolCall[] = [];

  data.content.forEach((c: any) => {
    if (c.type === 'text') text += c.text;
    if (c.type === 'tool_use') {
      toolCalls.push({
        name: c.name,
        args: c.input,
        id: c.id
      });
    }
  });

  return { text, toolCalls };
}

async function chatOpenAICompatible(provider: ProviderType, apiKey: string, model: string, messages: Message[], systemInstruction: string): Promise<UnifiedResponse> {
  const baseUrl = provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages.map(m => ({ 
          role: m.role === 'assistant' ? 'assistant' : 'user', 
          content: m.content 
        }))
      ],
      tools: ARIA_TOOLS_SPEC.map(t => ({
        type: 'function',
        function: t
      })),
      tool_choice: 'auto'
    })
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const choice = data.choices[0];
  const toolCalls: ToolCall[] = choice.message.tool_calls?.map((tc: any) => ({
    name: tc.function.name,
    args: JSON.parse(tc.function.arguments),
    id: tc.id
  })) || [];

  return {
    text: choice.message.content || '',
    toolCalls
  };
}
