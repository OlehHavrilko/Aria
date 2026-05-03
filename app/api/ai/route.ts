import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { provider, model, messages, systemInstruction, apiKey } = await req.json();

    let url = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: any = {};

    const providers: Record<string, string> = {
      anthropic: 'https://api.anthropic.com/v1/messages',
      openai: 'https://api.openai.com/v1/chat/completions',
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      mistral: 'https://api.mistral.ai/v1/chat/completions',
      cerebras: 'https://api.cerebras.ai/v1/chat/completions',
      ollama: 'http://localhost:11434/v1/chat/completions'
    };

    url = providers[provider];
    if (!url) return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });

    if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model,
        system: systemInstruction,
        messages: messages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        max_tokens: 4096,
        tools: [
          {
            name: 'execute_command',
            description: 'Execute a shell command in the sandbox environment',
            input_schema: {
              type: 'object',
              properties: {
                command: { type: 'string', description: 'The shell command to run' }
              },
              required: ['command']
            }
          }
        ]
      };
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
      body = {
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'execute_command',
              description: 'Execute a shell command in the sandbox environment',
              parameters: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'The shell command to run' }
                },
                required: ['command']
              }
            }
          }
        ]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message || data.error }, { status: 400 });

    let text = '';
    let toolCalls: any[] = [];

    if (provider === 'anthropic') {
      data.content.forEach((c: any) => {
        if (c.type === 'text') text += c.text;
        if (c.type === 'tool_use') toolCalls.push({ name: c.name, args: c.input, id: c.id });
      });
    } else {
      const choice = data.choices[0];
      text = choice.message.content || '';
      toolCalls = choice.message.tool_calls?.map((tc: any) => ({
        name: tc.function.name,
        args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments,
        id: tc.id
      })) || [];
    }

    return NextResponse.json({ text, toolCalls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
