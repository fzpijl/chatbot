
import React from 'react';

const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 18c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4zm-4-6h8v-2H8v2zm-2-2c0-1.1.9-2 2-2s2 .9 2 2H6zm8 0c0-1.1.9-2 2-2s2 .9 2 2h-4z"/>
    </svg>
);


const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-md p-4 flex items-center space-x-4 sticky top-0 z-10">
        <BotIcon />
        <div>
            <h1 className="text-xl font-bold text-white">AI Chatbot</h1>
            <p className="text-sm text-green-400">● Online</p>
        </div>
    </header>
  );
};

export default Header;
