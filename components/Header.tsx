import React from 'react';

interface Model {
  id: string;
  name: string;
}

interface HeaderProps {
    models: Model[];
    currentModel: string;
    onModelChange: (modelId: string) => void;
}

const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 18c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4zm-4-6h8v-2H8v2zm-2-2c0-1.1.9-2 2-2s2 .9 2 2H6zm8 0c0-1.1.9-2 2-2s2 .9 2 2h-4z"/>
    </svg>
);


const Header: React.FC<HeaderProps> = ({ models, currentModel, onModelChange }) => {
  return (
    <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-4">
            <BotIcon />
            <div>
                <h1 className="text-xl font-bold text-white">AI Chatbot</h1>
                <p className="text-sm text-green-400">● Online</p>
            </div>
        </div>
        <div className="relative">
             <select
                id="model-select"
                value={currentModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="bg-gray-700 text-white text-sm rounded-md pl-3 pr-8 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
                {models.map((model) => (
                <option key={model.id} value={model.id}>
                    {model.name}
                </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
            </div>
        </div>
    </header>
  );
};

export default Header;