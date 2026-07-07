import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', '1'], description: 'Go to Dashboard' },
        { keys: ['Ctrl', '2'], description: 'Go to Cohorts' },
        { keys: ['Ctrl', '3'], description: 'Go to Sample Population' },
        { keys: ['Ctrl', '4'], description: 'Go to Simulations' },
        { keys: ['Ctrl', '5'], description: 'Go to Analysis' },
        { keys: ['Ctrl', '6'], description: 'Go to Assets' }
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Open Quick Actions' },
        { keys: ['Ctrl', 'N'], description: 'Create New' },
        { keys: ['Ctrl', 'S'], description: 'Save' },
        { keys: ['Esc'], description: 'Close modal / Cancel' }
      ]
    },
    {
      category: 'General',
      items: [
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['Ctrl', '/'], description: 'Open command palette' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Keyboard className="text-indigo-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                <p className="text-xs text-zinc-500">Speed up your workflow</p>
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
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {shortcuts.map((category, catIdx) => (
            <div key={catIdx} className={catIdx > 0 ? 'mt-6' : ''}>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-3 bg-zinc-950/50 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all"
                  >
                    <span className="text-sm text-zinc-300">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded border border-white/5 font-mono">
                            {key}
                          </kbd>
                          {keyIdx < item.keys.length - 1 && (
                            <span className="text-zinc-600 mx-1">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-zinc-950/50 text-center">
          <p className="text-xs text-zinc-500">
            Press <kbd className="px-2 py-1 bg-zinc-800 rounded border border-white/5">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;



