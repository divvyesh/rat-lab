
import React, { useState, useRef } from 'react';
import { generatePersonasBatch, generatePersonaVoice, fetchGroundingSources } from '../services/geminiService';
import { Persona, PersonaSegment, User, TrainingFile, GroundingSource } from '../types';
import { Users, Loader2, Plus, Trash2, MapPin, Mic, Database, FileUp, FileType, FileText, Image, X, Settings2, ChevronDown, ChevronUp, Globe, Search, RefreshCw, BarChart } from 'lucide-react';
import InfoModal, { InfoButton } from './InfoModal';

interface PersonaBuilderProps {
  personas: Persona[];
  setPersonas: (personas: Persona[]) => void;
  segments: PersonaSegment[];
  setSegments: (segments: PersonaSegment[]) => void;
  user: User;
  transactionalData: string;
  setTransactionalData: (data: string) => void;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

const PersonaBuilder: React.FC<PersonaBuilderProps> = ({ 
    personas, setPersonas, 
    segments, setSegments, 
    user, 
    transactionalData, setTransactionalData 
}) => {
  const [trainingFiles, setTrainingFiles] = useState<TrainingFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrounding, setIsGrounding] = useState(false);
  const [progress, setProgress] = useState('');
  const [help, setHelp] = useState<{ title: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New Segment Input State
  const [newSegName, setNewSegName] = useState('');
  const [newSegCount, setNewSegCount] = useState(10);
  const [newSegDesc, setNewSegDesc] = useState('');
  const [newSegBrief, setNewSegBrief] = useState('');
  const [isNewSegConfigExpanded, setIsNewSegConfigExpanded] = useState(false);
  
  const [newSegGrounding, setNewSegGrounding] = useState({
      useSearch: true,
      useMaps: false,
      sources: [] as GroundingSource[]
  });

  const [newSegTraits, setNewSegTraits] = useState({
      riskAversion: 50,
      lossAversion: 50,
      priceSensitivity: 50,
      cognitiveReflection: 50,
      socialConformity: 50,
      noveltySeeking: 50
  });

  const handleFetchGrounding = async () => {
      if (!newSegBrief) return;
      setIsGrounding(true);
      const sources = await fetchGroundingSources(newSegBrief);
      setNewSegGrounding(prev => ({ ...prev, sources }));
      setIsGrounding(false);
  };

  const addSegment = () => {
    if (!newSegName || !newSegDesc) return;
    const newSegment: PersonaSegment = {
      id: crypto.randomUUID(),
      name: newSegName,
      count: newSegCount,
      description: newSegDesc,
      color: COLORS[segments.length % COLORS.length],
      grounding: { ...newSegGrounding, brief: newSegBrief },
      traits: { ...newSegTraits },
      isExpanded: false
    };
    setSegments([...segments, newSegment]);
    setNewSegName('');
    setNewSegDesc('');
    setNewSegBrief('');
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const handleGenerateCohort = async () => {
    if (segments.length === 0) return;
    setIsGenerating(true);
    let allNewPersonas: Persona[] = [];

    try {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        setProgress(`Grounding ${seg.name}...`);
        const generated = await generatePersonasBatch(seg, transactionalData, trainingFiles);
        allNewPersonas = [...allNewPersonas, ...generated];
      }
      setPersonas([...personas, ...allNewPersonas]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <InfoModal 
        isOpen={!!help} 
        onClose={() => setHelp(null)} 
        title={help?.title || ""} 
        content={help?.content || ""} 
      />

      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight italic">Cohort Orchestration</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em]">Behavioral Agent Synthesis & Web Grounding</p>
        </div>
        <div className="flex gap-10">
             <div className="text-right">
                <div className="text-2xl font-black text-white italic">{personas.length}</div>
                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Active Agents</div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Configuration */}
        <div className="lg:col-span-5 space-y-8">
            
            {/* Market Brief Ingestion */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Globe size={14} /> Phase 1: Market Research Brief 
                        <InfoButton onClick={() => setHelp({
                          title: "Grounding Brief",
                          content: "Enter descriptive details about the market, competitor URLs, or specific trends. The system uses this to perform real-time web research, ensuring the generated personas are aware of the current competitive landscape and category norms."
                        })} />
                    </label>
                    {isGrounding && <Loader2 size={12} className="animate-spin text-indigo-400" />}
                </div>
                
                <textarea 
                    value={newSegBrief} 
                    onChange={(e) => setNewSegBrief(e.target.value)} 
                    placeholder="Describe the category, competitor URLs, or specific market trends (e.g. 'Gen Z sentiment on subscription fatigue in streaming')" 
                    className="w-full h-24 bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 focus:border-indigo-500/50 outline-none resize-none transition-all placeholder:text-zinc-800 font-mono"
                />
                
                <button 
                    onClick={handleFetchGrounding}
                    disabled={!newSegBrief || isGrounding}
                    className="w-full py-2.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30"
                >
                    Extract Grounding Data
                </button>

                {newSegGrounding.sources.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                          Grounding Sources Identified
                          <InfoButton onClick={() => setHelp({
                            title: "Web Sources",
                            content: "These are the actual web documents the AI 'read' to inform the knowledge base of your personas. By grounding personas in these sources, we reduce 'hallucination' and increase market relevance."
                          })} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {newSegGrounding.sources.map(s => (
                                <div key={s.id} className="px-2 py-1 bg-zinc-950 border border-white/5 rounded-md text-[9px] text-zinc-500 flex items-center gap-2 max-w-[140px] truncate">
                                    <Search size={8} /> {s.title}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Segment Definition */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 space-y-6">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Users size={14} /> Phase 2: Agent Specification
                    <InfoButton onClick={() => setHelp({
                      title: "Agent Specs",
                      content: "Define the core label and behavioral assumptions for this segment. For example, 'Power Users' might have high novelty-seeking scores and low price sensitivity."
                    })} />
                </label>

                <div className="space-y-4">
                    <div className="flex gap-4">
                        <input 
                            value={newSegName} 
                            onChange={(e) => setNewSegName(e.target.value)} 
                            placeholder="Segment Label (e.g. Early Adopters)" 
                            className="flex-1 bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:border-indigo-500/50 outline-none" 
                        />
                        <div className="flex flex-col gap-1 relative">
                            <input 
                                type="number" 
                                value={newSegCount} 
                                onChange={(e) => setNewSegCount(parseInt(e.target.value))} 
                                className="w-20 bg-zinc-950 border border-white/10 rounded-2xl px-2 py-3 text-xs text-white text-center" 
                            />
                            <span className="text-[8px] text-center text-zinc-600 uppercase font-black">Quantity</span>
                            <InfoButton className="absolute -top-2 -right-2" onClick={() => setHelp({
                              title: "Population Size",
                              content: "Increasing the number of agents per segment improves statistical significance and reliability of your analysis, but consumes more inference tokens."
                            })} />
                        </div>
                    </div>
                    <textarea 
                        value={newSegDesc} 
                        onChange={(e) => setNewSegDesc(e.target.value)} 
                        placeholder="Core assumptions & behaviors (e.g. 'Highly price-sensitive, rarely buys on first visit')" 
                        className="w-full h-20 bg-zinc-950 border border-white/10 rounded-2xl p-4 text-xs text-zinc-400 outline-none resize-none font-mono" 
                    />
                    
                    <button 
                        onClick={() => setIsNewSegConfigExpanded(!isNewSegConfigExpanded)}
                        className="w-full text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 py-2 hover:text-white transition-colors"
                    >
                        {isNewSegConfigExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        Traits & Variance
                    </button>

                    {isNewSegConfigExpanded && (
                        <div className="space-y-4 p-4 bg-zinc-950/40 rounded-2xl border border-white/5 animate-in slide-in-from-top-4">
                            {[
                                { label: 'Risk Aversion', key: 'riskAversion' as const, help: 'A measure of how much an agent avoids uncertainty. High risk aversion leads to preference for incumbents.' },
                                // FIX: Use double quotes for the help string to avoid conflict with internal single quotes around 'status quo'
                                { label: 'Loss Aversion', key: 'lossAversion' as const, help: "The psychological pain of losing is twice as powerful as the joy of gaining. This drives 'status quo' bias." },
                                { label: 'Price Sensitivity', key: 'priceSensitivity' as const, help: 'How strongly a price change impacts the purchase probability.' },
                                { label: 'Cognitive Reflection', key: 'cognitiveReflection' as const, help: 'Tendency to use System 2 (slow, logical) over System 1 (fast, intuitive) thinking.' }
                            ].map(t => (
                                <div key={t.key} className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                        <span className="flex items-center gap-2">
                                          {t.label} 
                                          <InfoButton onClick={() => setHelp({ title: t.label, content: t.help })} />
                                        </span>
                                        <span>{newSegTraits[t.key]}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="100" 
                                        value={newSegTraits[t.key]} 
                                        onChange={(e) => setNewSegTraits(prev => ({ ...prev, [t.key]: parseInt(e.target.value) }))}
                                        className="w-full h-1 bg-zinc-900 rounded-full appearance-none accent-indigo-500" 
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <button 
                        onClick={addSegment} 
                        disabled={!newSegName || !newSegDesc}
                        className="w-full py-3 bg-white hover:bg-zinc-200 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 disabled:opacity-10"
                    >
                        Lock In Segment
                    </button>
                </div>
            </div>

            {/* Launch Button */}
            <div className="relative">
              <button 
                  onClick={handleGenerateCohort} 
                  disabled={isGenerating || segments.length === 0} 
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all disabled:opacity-20"
              >
                  {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <BarChart size={20} />}
                  {isGenerating ? 'Synthesizing Agents...' : 'Initiate Batch Generation'}
              </button>
              <InfoButton 
                className="absolute -top-3 -right-3 w-8 h-8 bg-black border-2 border-indigo-500 text-indigo-500"
                onClick={() => setHelp({
                  title: "Batch Generation",
                  content: "This process uses high-power inference to generate individual bios, occupations, and grounding assumptions for every persona in your segments. It builds the digital brain for your study."
                })}
              />
            </div>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-7 h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar pb-20">
             {personas.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-950/20">
                     <Users size={64} className="mb-6 opacity-5" />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Active Agents Found</p>
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personas.map((p) => {
                        const parentSeg = segments.find(s => s.id === p.segmentId);
                        const color = parentSeg?.color || '#cbd5e1';
                        return (
                            <div key={p.id} className="group bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 hover:bg-zinc-900 hover:border-indigo-500/20 transition-all shadow-xl">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all ring-2 ring-white/5">
                                            <img src={`https://picsum.photos/seed/${p.avatarId}/200/200`} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-base tracking-tighter italic">{p.name}</h4>
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{p.age} • {p.occupation}</div>
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full" style={{ background: color }}></div>
                                </div>
                                
                                <p className="text-[11px] text-zinc-400 leading-relaxed italic mb-6">"{p.bio}"</p>

                                <div className="p-4 bg-zinc-950/50 rounded-2xl border border-white/5 mb-6">
                                    <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Globe size={10} /> Grounded Assumptions
                                        <InfoButton onClick={() => setHelp({
                                          title: "Persona Grounding",
                                          content: "Each persona rationalizes their specific world view based on the market grounding research. This section explains how *this specific individual* interprets the category."
                                        })} />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 italic leading-relaxed">{p.groundingAssumption}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
                                        <MapPin size={10} /> {p.location}
                                    </div>
                                    <button onClick={() => {}} className="text-zinc-700 hover:text-indigo-400 transition-colors"><Mic size={14} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default PersonaBuilder;
