import React, { useState, useRef, useEffect } from 'react';
import type { Message } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import ApiKeyModal from './components/ApiKeyModal';
import { createChatProvider, ChatProvider } from './services/chatProviders';

const initialMessage: Message = {
  id: 'initial-ai-message',
  text: "Hello! I'm your AI assistant. Select a model from the dropdown and let's chat!",
  sender: 'ai',
};

const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o', provider: 'openai' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
  { id: 'echo-bot', name: 'Echo Bot (Mock)', provider: 'echobot' },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentModelId, setCurrentModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const chatProviderRef = useRef<ChatProvider | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleModelChange = (newModelId: string) => {
    if (newModelId !== currentModelId) {
        setCurrentModelId(newModelId);
        setMessages([initialMessage]);
        chatProviderRef.current = null; // Reset the chat session
        setError(null);
        setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    setIsLoading(true);
    setError(null);
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      if (!chatProviderRef.current) {
        const selectedModel = AVAILABLE_MODELS.find(m => m.id === currentModelId);
        if (!selectedModel) {
            throw new Error("Selected model not found.");
        }
        chatProviderRef.current = createChatProvider(selectedModel.id, selectedModel.provider);
      }

      const stream = await chatProviderRef.current.sendMessageStream(messageText);

      let aiResponseText = '';
      const aiMessageId = `ai-${Date.now()}`;
      
      // Add a placeholder for the AI message
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, text: '', sender: 'ai' },
      ]);

      for await (const textChunk of stream) {
        aiResponseText += textChunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, text: aiResponseText } : msg
          )
        );
      }

      if (!aiResponseText) {
         setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, text: "I'm sorry, I couldn't generate a response. Please try again." } : msg
          )
        );
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Error: ${errorMessage}`);
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, text: `Oops! Something went wrong. ${errorMessage}`, sender: 'ai' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-gray-900 text-white font-sans antialiased">
      <Header 
        models={AVAILABLE_MODELS}
        currentModel={currentModelId}
        onModelChange={handleModelChange}
        onOpenSettings={() => setIsModalOpen(true)}
      />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && <div className="text-red-400 p-2 text-center">{error}</div>}
      </main>
      <div className="sticky bottom-0">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
      <ApiKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default App;
