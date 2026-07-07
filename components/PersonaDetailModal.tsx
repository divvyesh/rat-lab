import React, { useState } from 'react';
import { X, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import { Persona } from '../types';
import PersonaChat from './PersonaChat';

interface PersonaDetailModalProps {
  personaId: string;
  persona?: Persona;
  onClose: () => void;
}

const PersonaDetailModal: React.FC<PersonaDetailModalProps> = ({
  personaId,
  persona,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'reactions'>('details');

  if (!persona) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-400">
                  {persona.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{persona.name}</h2>
                <p className="text-sm text-zinc-400">{persona.occupation} • {persona.location}</p>
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

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-white/5">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'details'
                ? 'text-white border-b-2 border-indigo-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'chat'
                ? 'text-white border-b-2 border-indigo-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              Chat
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reactions')}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'reactions'
                ? 'text-white border-b-2 border-indigo-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Reactions
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Bio */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Bio
                </h3>
                <p className="text-white leading-relaxed">{persona.bio}</p>
              </div>

              {/* Psychographics */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Psychographics
                </h3>
                <p className="text-white leading-relaxed">{persona.psychographics}</p>
              </div>

              {/* Spending Habits */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Spending Habits
                </h3>
                <p className="text-white leading-relaxed">{persona.spendingHabits}</p>
              </div>

              {/* Behavioral Traits */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">
                  Behavioral Traits
                </h3>
                <div className="space-y-3">
                  <TraitBar label="Risk Aversion" value={persona.traits.riskAversion} />
                  <TraitBar label="Loss Aversion" value={persona.traits.lossAversion} />
                  <TraitBar label="Price Sensitivity" value={persona.traits.priceSensitivity} />
                  <TraitBar label="Cognitive Reflection" value={persona.traits.cognitiveReflection} />
                  <TraitBar label="Social Conformity" value={persona.traits.socialConformity} />
                  <TraitBar label="Novelty Seeking" value={persona.traits.noveltySeeking} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <PersonaChat personaId={personaId} persona={persona} />
          )}

          {activeTab === 'reactions' && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">
                Reaction history will appear here after running experiments with this persona.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TraitBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-sm font-bold text-white">{value}/100</span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default PersonaDetailModal;


