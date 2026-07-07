import React, { useState, useEffect } from 'react';
import { Command, X, Search, Sparkles } from 'lucide-react';
import { AppView } from '../types';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  action: () => void;
  shortcut?: string;
  icon?: React.ReactNode;
}

interface QuickActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onCreateCohort?: () => void;
  onCreateSimulation?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onCreateCohort,
  onCreateSimulation
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const actions: QuickAction[] = [
    {
      id: 'create-cohort',
      label: 'Create New Cohort',
      description: 'Build AI personas for market segments',
      action: () => {
        if (onCreateCohort) {
          onCreateCohort();
        } else {
          onNavigate(AppView.PERSONA_BUILDER);
        }
        onClose();
      },
      shortcut: 'Ctrl+N',
      icon: <Sparkles size={18} />
    },
    {
      id: 'create-simulation',
      label: 'Create New Simulation',
      description: 'Design surveys and behavioral tests',
      action: () => {
        if (onCreateSimulation) {
          onCreateSimulation();
        } else {
          onNavigate(AppView.EXPERIMENT_LAB);
        }
        onClose();
      },
      shortcut: 'Ctrl+S',
      icon: <Sparkles size={18} />
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      description: 'View overview and metrics',
      action: () => {
        onNavigate(AppView.DASHBOARD);
        onClose();
      },
      shortcut: 'Ctrl+1'
    },
    {
      id: 'cohorts',
      label: 'Go to Cohorts',
      description: 'Manage persona segments',
      action: () => {
        onNavigate(AppView.PERSONA_BUILDER);
        onClose();
      },
      shortcut: 'Ctrl+2'
    },
    {
      id: 'sample-population',
      label: 'Go to Sample Population',
      description: 'View network relationships',
      action: () => {
        onNavigate(AppView.SOCIETIES);
        onClose();
      },
      shortcut: 'Ctrl+3'
    },
    {
      id: 'simulations',
      label: 'Go to Simulations',
      description: 'Run and manage experiments',
      action: () => {
        onNavigate(AppView.EXPERIMENT_LAB);
        onClose();
      },
      shortcut: 'Ctrl+4'
    },
    {
      id: 'analysis',
      label: 'Go to Analysis',
      description: 'View insights and reports',
      action: () => {
        onNavigate(AppView.ANALYSIS);
        onClose();
      },
      shortcut: 'Ctrl+5'
    },
    {
      id: 'assets',
      label: 'Go to Assets',
      description: 'Manage images and files',
      action: () => {
        onNavigate(AppView.ASSETS);
        onClose();
      },
      shortcut: 'Ctrl+6'
    },
    {
      id: 'api-playground',
      label: 'Go to API Playground',
      description: 'Test API endpoints',
      action: () => {
        onNavigate(AppView.API_PLAYGROUND);
        onClose();
      },
      shortcut: 'Ctrl+7',
      icon: <Sparkles size={18} />
    }
  ];

  const filteredActions = searchQuery
    ? actions.filter(
        action =>
          action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : actions;

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Command className="text-indigo-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quick Actions</h2>
              <p className="text-xs text-zinc-500">Press Ctrl+K to open</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search actions..."
              className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Actions List */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <p>No actions found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredActions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="w-full p-4 bg-zinc-950/50 hover:bg-zinc-950 border border-white/5 hover:border-indigo-500/30 rounded-xl mb-2 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    {action.icon && (
                      <div className="text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        {action.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white mb-1">{action.label}</div>
                      <div className="text-xs text-zinc-500">{action.description}</div>
                    </div>
                    {action.shortcut && (
                      <div className="px-2 py-1 bg-zinc-800 text-xs text-zinc-400 rounded border border-white/5 font-mono">
                        {action.shortcut}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-zinc-950/50">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-zinc-800 rounded border border-white/5">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-zinc-800 rounded border border-white/5">Enter</kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-zinc-800 rounded border border-white/5">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;

