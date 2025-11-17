import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOpenaiKey(localStorage.getItem('openai_api_key') || '');
      setDeepseekKey(localStorage.getItem('deepseek_api_key') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('deepseek_api_key', deepseekKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <h2 className="text-xl font-bold text-white mb-4">Manage API Keys</h2>
        <p className="text-gray-400 text-sm mb-6">
          Your keys are stored securely in your browser's local storage.
        </p>
        <div className="space-y-6">
          <div className="p-4 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">OpenAI</h3>
            <div>
              <label htmlFor="openai-key" className="block text-sm font-medium text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                id="openai-key"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="sk-..."
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="p-4 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-teal-400 mb-3">DeepSeek</h3>
            <div>
              <label
                htmlFor="deepseek-key"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                API Key
              </label>
              <input
                type="password"
                id="deepseek-key"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ds-..."
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ApiKeyModal;
