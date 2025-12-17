import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
  hasKey: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, hasKey }) => {
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
        setInputKey(''); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      onSave(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-[fadeIn_0.2s_ease-out]">
        
        <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-200 dark:border-slate-800 text-center">
             <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3 text-purple-900 dark:text-purple-400 shadow-inner">
                <i className="fas fa-key text-xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Configure API Key</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your Gemini API key to enable AI features.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Google Gemini API Key
                </label>
                <div className="relative">
                    <input 
                        type={showKey ? "text" : "password"}
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none text-slate-800 dark:text-white transition-all font-mono text-sm"
                        autoFocus
                    />
                    <button 
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    Your key is stored locally in your browser and never sent to our servers.
                </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg flex items-start space-x-3">
                <i className="fas fa-info-circle text-purple-600 dark:text-purple-400 mt-0.5 text-sm"></i>
                <div className="text-xs text-purple-900 dark:text-purple-300">
                    Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold hover:text-purple-700 dark:hover:text-purple-200">Get one here</a> for free from Google AI Studio.
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                {hasKey && (
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    type="submit"
                    disabled={!inputKey.trim()}
                    className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-900 to-purple-800 dark:from-purple-600 dark:to-purple-500 text-white shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Save Key
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;