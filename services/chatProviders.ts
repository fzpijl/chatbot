import type { Message } from '../types';

/**
 * Defines the common interface for any chat provider.
 * This allows the main application to interact with different AI services
 * through a consistent API.
 */
export interface ChatProvider {
  sendMessageStream: (message: string) => AsyncGenerator<string>;
}

// Common system prompt for consistency
const SYSTEM_PROMPT = 'You are a helpful and creative AI assistant. Provide clear, concise, and friendly responses. Use Markdown for formatting, such as lists, bold text, and code blocks, to enhance readability.';

type GeminiChatHistoryMessage = {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
};

/**
 * An implementation of the ChatProvider for Google's Gemini models using the fetch API.
 * This provider is stateless and respects the proxy configuration.
 */
class GeminiChatProvider implements ChatProvider {
  private history: GeminiChatHistoryMessage[];
  private readonly model: string;
  private readonly apiKey: string;
  
  constructor(model: string) {
    // Per requirements, the Google API key must come from the environment.
    if (!process.env.API_KEY) {
      throw new Error("Google API key is not configured. This is a platform issue and cannot be set by the user.");
    }
    this.model = model;
    this.apiKey = process.env.API_KEY;
    // For the REST API, the system prompt is best formatted as the first turn in the conversation.
    this.history = [
      { role: 'user', parts: [{ text: `System instruction: ${SYSTEM_PROMPT}` }] },
      { role: 'model', parts: [{ text: "Understood. I will follow these instructions and act as a helpful AI assistant." }] }
    ];
  }
  
  private getEndpoint(): string {
    const pattern = localStorage.getItem('proxy_url_pattern');
    const modelEndpoint = `/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;
    const defaultBase = 'https://generativelanguage.googleapis.com';

    if (!pattern) {
        return defaultBase + modelEndpoint;
    }
    
    const proxyBase = pattern.replace('{provider}', 'google');
    return proxyBase.replace(/\/$/, '') + modelEndpoint;
  }
  
  async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    this.history.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: this.history }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody?.error?.message || 'Unknown error'}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim().length < 3) continue; // Ignore empty lines or brackets
        let parsableLine = line.trim().replace(/^,/, '');
        try {
          const parsed = JSON.parse(parsableLine);
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            fullResponse += content;
            yield content;
          }
        } catch (e) {
          console.error('Failed to parse Gemini stream chunk:', parsableLine);
        }
      }
    }
    
    if (fullResponse) {
      this.history.push({ role: 'model', parts: [{ text: fullResponse }] });
    }
  }
}


type ChatHistoryMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Base class for stateless, fetch-based chat providers like OpenAI and DeepSeek.
 */
abstract class FetchStreamChatProvider implements ChatProvider {
  protected history: ChatHistoryMessage[];
  protected abstract readonly apiPath: string;
  protected readonly model: string;
  private readonly apiKey: string;
  private readonly providerName: 'openai' | 'deepseek';

  constructor(model: string, apiKey: string, providerName: 'openai' | 'deepseek') {
    this.model = model;
    this.apiKey = apiKey;
    this.providerName = providerName;
    this.history = [{ role: 'system', content: SYSTEM_PROMPT }];
  }
  
  protected getEndpoint(): string {
    const pattern = localStorage.getItem('proxy_url_pattern');
    const defaultBase = this.providerName === 'openai' ? 'https://api.openai.com' : 'https://api.deepseek.com';

    if (!pattern) {
        return defaultBase + this.apiPath;
    }

    const proxyBase = pattern.replace('{provider}', this.providerName);
    return proxyBase.replace(/\/$/, '') + this.apiPath;
  }

  async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    this.history.push({ role: 'user', content: message });

    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.history,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody?.error?.message || 'Unknown error'}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6);
          if (jsonStr === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              yield content;
            }
          } catch (e) {
            console.error('Failed to parse stream chunk:', jsonStr);
          }
        }
      }
    }
    
    if (fullResponse) {
        this.history.push({ role: 'assistant', content: fullResponse });
    }
  }
}

/**
 * Chat provider for OpenAI models.
 */
class OpenAIChatProvider extends FetchStreamChatProvider {
  protected readonly apiPath = '/v1/chat/completions';
  constructor(model: string, apiKey: string) {
    super(model, apiKey, 'openai');
  }
}

/**
 * Chat provider for DeepSeek models.
 */
class DeepSeekChatProvider extends FetchStreamChatProvider {
    protected readonly apiPath = '/chat/completions';
    constructor(model: string, apiKey: string) {
      super(model, apiKey, 'deepseek');
    }
}


/**
 * A mock implementation of the ChatProvider.
 * It simply echoes the user's message back in a streaming fashion.
 */
class EchoBotProvider implements ChatProvider {
  async *sendMessageStream(message: string): AsyncGenerator<string> {
    const responsePrefix = "Echo: ";
    yield responsePrefix;
    await new Promise(resolve => setTimeout(resolve, 100));

    const words = message.split(' ');
    for (const word of words) {
      yield `${word} `;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
}

/**
 * Factory function to create the appropriate chat provider based on the provider ID.
 * @param modelId The specific model identifier (e.g., 'gemini-2.5-flash').
 * @param provider The name of the provider (e.g., 'google', 'echobot').
 * @returns An instance of a class that implements the ChatProvider interface.
 */
export function createChatProvider(modelId: string, provider: 'google' | 'openai' | 'deepseek' | 'echobot' | string): ChatProvider {
  switch (provider) {
    case 'google':
      return new GeminiChatProvider(modelId);
    case 'openai': {
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please set it in the settings menu (gear icon).');
        }
        return new OpenAIChatProvider(modelId, apiKey);
    }
    case 'deepseek': {
        const apiKey = localStorage.getItem('deepseek_api_key');
        if (!apiKey) {
            throw new Error('DeepSeek API key not found. Please set it in the settings menu (gear icon).');
        }
        return new DeepSeekChatProvider(modelId, apiKey);
    }
    case 'echobot':
      return new EchoBotProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}