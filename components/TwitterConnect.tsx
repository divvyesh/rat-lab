import React, { useState } from 'react';
import { X, Twitter, Loader2 } from 'lucide-react';

interface TwitterConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (accessToken: string) => void;
}

const TwitterConnect: React.FC<TwitterConnectProps> = ({
  isOpen,
  onClose,
  onConnected
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate OAuth flow
    // In production, this would redirect to Twitter OAuth
    setTimeout(() => {
      // Mock access token
      const mockToken = `twitter_token_${Date.now()}`;
      setIsConnecting(false);
      onConnected(mockToken);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/10 rounded-xl border border-white/10">
                <Twitter className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Connect X (Twitter)</h2>
                <p className="text-xs text-zinc-500">Connect your X account to create a personal sample population</p>
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

        {/* Content */}
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
                <span>Your followers list</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                <span>Your public tweets</span>
              </li>
            </ul>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-sm text-zinc-300">
              We'll use this data to create personas based on your followers and generate your author profile.
            </p>
          </div>
        </div>

        {/* Footer */}
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
            className="px-4 py-2 bg-black hover:bg-zinc-900 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Connecting...
              </>
            ) : (
              <>
                <Twitter size={16} />
                Connect X
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwitterConnect;


