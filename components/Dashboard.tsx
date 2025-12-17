
import React, { useState } from 'react';
import { Persona, SimulationResult, AppView } from '../types';
import { Users, FlaskConical, Activity, Plus, History, ClipboardList, BrainCircuit } from 'lucide-react';
import InfoModal, { InfoButton } from './InfoModal';

interface DashboardProps {
    personas: Persona[];
    results: SimulationResult[];
    onChangeView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ personas, results, onChangeView }) => {
    const [help, setHelp] = useState<{ title: string; content: string } | null>(null);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <InfoModal 
              isOpen={!!help} 
              onClose={() => setHelp(null)} 
              title={help?.title || ""} 
              content={help?.content || ""} 
            />

            {/* Hero Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight uppercase italic">
                        Lab Console
                    </h1>
                    <p className="text-zinc-400 max-w-xl text-sm leading-relaxed">
                        System ready. <span className="text-zinc-100 font-bold">{personas.length} personas</span> across <span className="text-zinc-100 font-bold">{new Set(personas.map(p => p.segmentId)).size} segments</span>. Total research ledger: <span className="text-zinc-100 font-bold">{results.length} entries</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <button 
                            onClick={() => onChangeView(AppView.PERSONA_BUILDER)}
                            className="px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-2xl shadow-white/10 active:scale-95 pr-10"
                        >
                            <Plus size={16} strokeWidth={3} /> New Cohort
                        </button>
                        <InfoButton 
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-200 text-zinc-600 hover:bg-black hover:text-white"
                            onClick={() => setHelp({
                                title: "New Cohort",
                                content: "A Cohort is a group of AI participants synthesized to represent a specific market segment. Creating a new cohort involves defining behavioral traits like risk aversion and price sensitivity, then grounding them in real-world market data."
                            })}
                        />
                    </div>
                    <div className="relative group">
                        <button 
                            onClick={() => onChangeView(AppView.EXPERIMENT_LAB)}
                            className="px-5 py-2.5 bg-zinc-900 text-white border border-white/10 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 active:scale-95 pr-10"
                        >
                            <FlaskConical size={16} /> Resume Lab
                        </button>
                        <InfoButton 
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setHelp({
                                title: "Experiment Lab",
                                content: "The Lab is where you design and run your simulations. You can create surveys, present visual stimuli, and test how your synthesized personas react to various scenarios in a controlled, 'black-box' environment."
                            })}
                        />
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                    onClick={() => onChangeView(AppView.PERSONA_BUILDER)}
                    className="group relative bg-zinc-900/30 p-6 rounded-3xl border border-white/5 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden shadow-sm"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all">
                                <Users size={24} />
                            </div>
                            <InfoButton 
                                onClick={() => setHelp({
                                    title: "Active Agents",
                                    content: "This represents the total population of AI personas you've generated. Each agent has unique biographical details and psychological biases that dictate how they interact with your research."
                                })}
                            />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-1 tracking-tight">{personas.length}</div>
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Total Agents</h3>
                        </div>
                    </div>
                </div>

                <div 
                    onClick={() => onChangeView(AppView.EXPERIMENT_LAB)}
                    className="group relative bg-zinc-900/30 p-6 rounded-3xl border border-white/5 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden shadow-sm"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all">
                                <ClipboardList size={24} />
                            </div>
                            <InfoButton 
                                onClick={() => setHelp({
                                    title: "Research Data Points",
                                    content: "Every time an AI persona answers a question or reacts to an asset, a data point is recorded in the ledger. This raw data is later processed using statistical models to generate GTM insights."
                                })}
                            />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-1 tracking-tight">{results.length}</div>
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Data Points</h3>
                        </div>
                    </div>
                </div>

                <div 
                    onClick={() => onChangeView(AppView.ANALYSIS)}
                    className="group relative bg-zinc-900/30 p-6 rounded-3xl border border-white/5 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden shadow-sm"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 group-hover:text-purple-400 group-hover:border-purple-500/20 transition-all">
                                <Activity size={24} />
                            </div>
                            <InfoButton 
                                onClick={() => setHelp({
                                    title: "Inference Status",
                                    content: "The 'Inference Engine' is the deep reasoning core powered by Gemini 3. When it's 'Ready', the system is capable of simulating complex human thought processes and long-form rationalization."
                                })}
                            />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-1 tracking-tight">Ready</div>
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Inference Engine</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Latest Findings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-8 backdrop-blur-sm shadow-inner">
                    <h3 className="text-xs font-bold text-zinc-500 mb-8 uppercase tracking-[0.2em] flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <History size={14} className="text-indigo-400" /> Latest Findings
                        </span>
                        <InfoButton 
                            onClick={() => setHelp({
                                title: "Findings History",
                                content: "This ledger displays the most recent individual interactions from your active simulations. It provides a real-time 'heartbeat' of how the AI population is reacting to your current tests."
                            })}
                        />
                    </h3>
                    
                    {results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-700 border border-dashed border-white/5 rounded-2xl">
                            <p className="text-[10px] font-bold uppercase tracking-widest">No active research history</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {results.slice().reverse().slice(0, 3).map((r, i) => (
                                <div key={i} className="p-5 bg-zinc-950/50 border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-zinc-900 transition-all">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 group-hover:text-indigo-400 border border-white/5 transition-all">
                                        <BrainCircuit size={18} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-xs font-bold text-zinc-200 truncate uppercase">{r.personaName}</div>
                                        <div className="text-[10px] text-zinc-500 truncate mt-0.5 line-clamp-1 italic">"{r.responses[0]?.answer}"</div>
                                    </div>
                                    <div className="text-[10px] font-mono text-emerald-500/80 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                                        {r.confidence}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                    <h3 className="text-xs font-bold text-zinc-500 mb-8 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> System Status
                    </h3>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between py-4 border-b border-white/5 hover:bg-white/5 px-2 rounded-xl transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-1 rounded-full bg-zinc-600 group-hover:bg-indigo-400"></div>
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Gemini 3.0 Pro Model</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-tighter">Verified</span>
                                <InfoButton 
                                    onClick={() => setHelp({
                                        title: "AI Model Tier",
                                        content: "Rat Lab uses Gemini 3 Pro for its superior reasoning and long-context capabilities, essential for simulating high-fidelity human personas and behavioral biases."
                                    })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-white/5 hover:bg-white/5 px-2 rounded-xl transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-1 rounded-full bg-zinc-600 group-hover:bg-indigo-400"></div>
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Cloud Sync Infrastructure</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-tighter">Synced</span>
                                <InfoButton 
                                    onClick={() => setHelp({
                                        title: "State Persistence",
                                        content: "All cohorts, experiments, and analysis results are automatically synced to the cloud, allowing for collaborative research and multi-device access."
                                    })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-4 hover:bg-white/5 px-2 rounded-xl transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-1 rounded-full bg-zinc-600 group-hover:bg-indigo-400"></div>
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Latent Space Simulation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-tighter">Operational</span>
                                <InfoButton 
                                    onClick={() => setHelp({
                                        title: "Isolated Execution",
                                        content: "Simulations are run in isolated latent environments, ensuring that one agent's response cannot influence others, which prevents common LLM biases and herd-mentality errors."
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
