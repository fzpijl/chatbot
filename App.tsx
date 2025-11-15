
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-ai-message',
      text: "Hello! I'm your friendly AI assistant. How can I help you today?",
      sender: 'ai',
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
      if (!chatRef.current) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: 'You are a helpful and creative AI assistant. Provide clear, concise, and friendly responses.',
          },
        });
      }

      const stream = await chatRef.current.sendMessageStream({ message: messageText });

      let aiResponseText = '';
      const aiMessageId = `ai-${Date.now()}`;
      
      // Add a placeholder for the AI message
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, text: '', sender: 'ai' },
      ]);

      for await (const chunk of stream) {
        aiResponseText += chunk.text;
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
      <Header />
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
    </div>
  );
};

export default App;
