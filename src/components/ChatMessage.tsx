import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  const UserAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0">
      U
    </div>
  );

  const AiAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-white"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.707 5.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 5.293z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser ? <UserAvatar /> : <AiAvatar />}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-lg shadow ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        <div
          className="prose prose-sm prose-invert max-w-none text-sm break-words 
                        [&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0
                        [&_ul]:list-disc [&_ul]:pl-5
                        [&_ol]:list-decimal [&_ol]:pl-5
                        [&_pre]:bg-gray-800 [&_pre]:p-2 [&_pre]:rounded-md
                        [&_code]:text-sm [&_code]:font-mono
                        [&_a]:text-indigo-400 [&_a]:underline"
        >
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
