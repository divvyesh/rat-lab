import React from 'react';
import { AppView } from '../types';
import { X, Users, FlaskConical, BarChart3, BookOpen, Zap } from 'lucide-react';

interface WelcomeProps {
  onClose: () => void;
  onNavigate: (view: AppView) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onClose, onNavigate }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 animate-in fade-in">
      <div className="bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="p-10">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tight">
              Welcome to Rat Lab
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your AI-powered behavioral research platform. Create personas, run simulations, and analyze results with advanced statistical models.
            </p>
          </div>

          {/* Quick Start Steps */}
          <div className="space-y-6 mb-8">
            <div className="flex gap-4 p-6 bg-zinc-950/50 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group"
                 onClick={() => { onNavigate(AppView.PERSONA_BUILDER); onClose(); }}>
              <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
                <Users size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">1. Create Cohorts</h3>
                <p className="text-sm text-zinc-500">
                  Build AI personas representing your target market segments. Define behavioral traits, demographics, and psychographics.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-zinc-950/50 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group"
                 onClick={() => { onNavigate(AppView.EXPERIMENT_LAB); onClose(); }}>
              <div className="p-3 bg-emerald-600/20 rounded-xl text-emerald-400 group-hover:bg-emerald-600/30 transition-colors">
                <FlaskConical size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">2. Run Simulations</h3>
                <p className="text-sm text-zinc-500">
                  Design surveys and behavioral tests. Present visual stimuli and measure how your personas react.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-zinc-950/50 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group"
                 onClick={() => { onNavigate(AppView.ANALYSIS); onClose(); }}>
              <div className="p-3 bg-purple-600/20 rounded-xl text-purple-400 group-hover:bg-purple-600/30 transition-colors">
                <BarChart3 size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">3. Analyze Results</h3>
                <p className="text-sm text-zinc-500">
                  Get statistical insights, GTM recommendations, and behavioral analysis powered by advanced models.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="border-t border-white/5 pt-8">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Key Features</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950/30 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-zinc-400 mb-1">AI-Powered Personas</div>
                <div className="text-[10px] text-zinc-600">Realistic behavioral agents with unique traits</div>
              </div>
              <div className="p-4 bg-zinc-950/30 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-zinc-400 mb-1">Statistical Analysis</div>
                <div className="text-[10px] text-zinc-600">Advanced GTM insights and hypothesis testing</div>
              </div>
              <div className="p-4 bg-zinc-950/30 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-zinc-400 mb-1">Isolated Simulations</div>
                <div className="text-[10px] text-zinc-600">Prevent LLM biases with isolated execution</div>
              </div>
              <div className="p-4 bg-zinc-950/30 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-zinc-400 mb-1">Cloud Sync</div>
                <div className="text-[10px] text-zinc-600">Automatic data persistence and collaboration</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => { onNavigate(AppView.PERSONA_BUILDER); onClose(); }}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <Users size={16} /> Get Started
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-zinc-950 text-zinc-400 hover:text-white rounded-xl text-sm font-bold transition-all"
            >
              Explore Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;



