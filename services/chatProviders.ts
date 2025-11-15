import { GoogleGenAI, Chat } from '@google/genai';
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

/**
 * An implementation of the ChatProvider for Google's Gemini models.
 * This provider is stateful, managed by the GoogleGenAI SDK.
 */
class GeminiChatProvider implements ChatProvider {
  private chat: Chat;

  constructor(model: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });
  }

  async *sendMessageStream(message: string): AsyncGenerator<string> {
    const stream = await this.chat.sendMessageStream({ message });
    for await (const chunk of stream) {
      yield chunk.text;
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
  protected abstract readonly apiKey: string | undefined;
  protected abstract readonly apiUrl: string;
  protected readonly model: string;

  constructor(model: string) {
    this.model = model;
    this.history = [{ role: 'system', content: SYSTEM_PROMPT }];
  }
  
  async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error(`API key for ${this.constructor.name.replace('ChatProvider', '')} is not set.`);
    }

    this.history.push({ role: 'user', content: message });

    const response = await fetch(this.apiUrl, {
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
  protected readonly apiKey = process.env.OPENAI_API_KEY;
  protected readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
}

/**
 * Chat provider for DeepSeek models.
 */
class DeepSeekChatProvider extends FetchStreamChatProvider {
  protected readonly apiKey = process.env.DEEPSEEK_API_KEY;
  protected readonly apiUrl = 'https://api.deepseek.com/chat/completions';
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
    case 'openai':
        return new OpenAIChatProvider(modelId);
    case 'deepseek':
        return new DeepSeekChatProvider(modelId);
    case 'echobot':
      return new EchoBotProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}