import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface FacebookConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (accessToken: string) => void;
}

const FacebookConnect: React.FC<FacebookConnectProps> = ({
  isOpen,
  onClose,
  onConnected
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate OAuth flow
    setTimeout(() => {
      const mockToken = `facebook_token_${Date.now()}`;
      setIsConnecting(false);
      onConnected(mockToken);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <span className="text-white text-xl font-bold">f</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Connect Facebook</h2>
                <p className="text-xs text-zinc-500">Connect your Facebook account</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-zinc-950/50 border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-2">What we'll access:</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                <span>Your profile information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                <span>People who react to your posts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                <span>Your friends list</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all"
            disabled={isConnecting}
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Connecting...
              </>
            ) : (
              'Connect Facebook'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacebookConnect;
