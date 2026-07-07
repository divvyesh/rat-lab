
import React, { useState, useRef, useEffect } from 'react';
import { generatePersonasBatch, generatePersonaVoice, fetchGroundingSources } from '../services/geminiService';
import { Persona, PersonaSegment, User, TrainingFile, GroundingSource } from '../types';
import { Users, Loader2, Plus, Trash2, MapPin, Mic, Database, FileUp, FileType, FileText, Image, X, Settings2, ChevronDown, ChevronUp, Globe, Search, RefreshCw, BarChart, Briefcase, GraduationCap, TrendingUp, Target, Zap, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import InfoModal, { InfoButton } from './InfoModal';
import PersonasFAQ from './PersonasFAQ';
import PersonaDetailModal from './PersonaDetailModal';
import { validateSegment, validateAndSanitizeInput } from '../utils/validation';
import { withErrorHandling, createUserFriendlyError, logError } from '../utils/errorHandling';
import { DashboardSkeleton, PersonaCardSkeleton } from './LoadingSkeleton';
import ErrorDisplay from './ErrorDisplay';

interface PersonaBuilderProps {
  personas: Persona[];
  setPersonas: (personas: Persona[] | ((prev: Persona[]) => Persona[])) => void;
  segments: PersonaSegment[];
  setSegments: (segments: PersonaSegment[]) => void;
  user: User;
  transactionalData: string;
  setTransactionalData: (data: string) => void;
  onOpenConversationLab?: () => void;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

const PersonaBuilder: React.FC<PersonaBuilderProps> = ({ 
    personas, setPersonas, 
    segments, setSegments, 
    user, 
    transactionalData, setTransactionalData,
    onOpenConversationLab
}) => {
  const [trainingFiles, setTrainingFiles] = useState<TrainingFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrounding, setIsGrounding] = useState(false);
  const [progress, setProgress] = useState('');
  const [help, setHelp] = useState<{ title: string; content: string } | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cohort generation progress tracking
  const [cohortProgress, setCohortProgress] = useState<{
    segmentId: string;
    segmentName: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number; // 0-100
    estimatedTimeRemaining: number; // seconds
    startTime?: number;
  }[]>([]);
  
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
    setError(null);
    
    // Validate and sanitize inputs
    const nameValidation = validateAndSanitizeInput(newSegName, {
      required: true,
      minLength: 2,
      maxLength: 100
    });
    
    const descValidation = validateAndSanitizeInput(newSegDesc, {
      required: true,
      minLength: 10,
      maxLength: 500
    });
    
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid segment name');
      return;
    }
    
    if (!descValidation.valid) {
      setError(descValidation.error || 'Invalid segment description');
      return;
    }
    
    // Validate count
    if (newSegCount < 1 || newSegCount > 1000) {
      setError('Persona count must be between 1 and 1000');
      return;
    }
    
    // Create segment with validated data
    const newSegment: PersonaSegment = {
      id: crypto.randomUUID(),
      name: nameValidation.sanitized,
      count: newSegCount,
      description: descValidation.sanitized,
      color: COLORS[segments.length % COLORS.length],
            grounding: { ...newSegGrounding, brief: newSegBrief },
      traits: { ...newSegTraits },
      isExpanded: false
    };
    
    // Validate segment object
    const validation = validateSegment(newSegment);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    setSegments([...segments, newSegment]);
    // Clear segment-specific fields but keep market brief until batch generation completes
    setNewSegName('');
    setNewSegDesc('');
    // Don't clear newSegBrief here - it will be cleared after batch generation completes
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const handleGenerateCohort = async () => {
    setError(null);
    
    if (segments.length === 0) {
      setError('Please create at least one segment before generating personas');
      return;
    }
    
    // Validate all segments before generation
    const invalidSegments = segments.filter(seg => {
      const validation = validateSegment(seg);
      return !validation.valid;
    });
    
    if (invalidSegments.length > 0) {
      setError(`Invalid segments detected. Please check your segment configurations.`);
      return;
    }
    
    console.log(`🚀 Starting batch generation for ${segments.length} segments`);
    console.log(`📊 Current personas count: ${personas.length}`);
    
    setIsGenerating(true);
    let allNewPersonas: Persona[] = [];
    
    // Initialize progress tracking for all segments
    const initialProgress = segments.map(seg => ({
      segmentId: seg.id,
      segmentName: seg.name,
      status: 'pending' as const,
      progress: 0,
      estimatedTimeRemaining: seg.count * 2, // Estimate 2 seconds per persona
      startTime: undefined
    }));
    setCohortProgress(initialProgress);

    await withErrorHandling(async () => {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const startTime = Date.now();
        
        // Update status to processing
        setCohortProgress(prev => prev.map(p => 
          p.segmentId === seg.id 
            ? { ...p, status: 'processing', progress: 0, startTime, estimatedTimeRemaining: seg.count * 2 }
            : p
        ));
        
        setProgress(`Generating ${seg.count} agents for ${seg.name}...`);
        
        try {
          // Simulate progress updates during generation
          const progressInterval = setInterval(() => {
            setCohortProgress(prev => prev.map(p => {
              if (p.segmentId === seg.id && p.status === 'processing' && p.startTime) {
                const elapsed = (Date.now() - p.startTime) / 1000;
                const estimatedTotal = p.estimatedTimeRemaining;
                const newProgress = Math.min(95, (elapsed / estimatedTotal) * 100);
                const newEstimatedTime = Math.max(0, estimatedTotal - elapsed);
                return { ...p, progress: newProgress, estimatedTimeRemaining: newEstimatedTime };
              }
              return p;
            }));
          }, 500);

          console.log(`🔄 Calling generatePersonasBatch for ${seg.name}...`);
          const generated = await generatePersonasBatch(seg, transactionalData, trainingFiles);
          
          clearInterval(progressInterval);
          
          console.log(`✅ Generated ${generated.length} personas for ${seg.name}`, generated);
          
          if (generated.length === 0) {
            console.warn(`⚠️ No personas generated for ${seg.name}. Check API response.`);
            setCohortProgress(prev => prev.map(p => 
              p.segmentId === seg.id 
                ? { ...p, status: 'error', progress: 0, estimatedTimeRemaining: 0 }
                : p
            ));
            continue; // Skip to next segment
          }
          
          // Mark as completed
          setCohortProgress(prev => prev.map(p => 
            p.segmentId === seg.id 
              ? { ...p, status: 'completed', progress: 100, estimatedTimeRemaining: 0 }
              : p
          ));
          
          allNewPersonas = [...allNewPersonas, ...generated];
          
          // Update personas immediately after each segment completes
          console.log(`🔄 Updating personas state with ${generated.length} new personas...`);
          setPersonas(prev => {
            const updated = [...prev, ...generated];
            console.log(`📊 Total personas after ${seg.name}: ${updated.length}`, { 
              previous: prev.length, 
              new: generated.length, 
              total: updated.length,
              samplePersona: updated[0] 
            });
            return updated;
          });
          
          // Force a re-render check
          console.log(`✅ State update queued for ${seg.name}. Personas should appear now.`);
          
          // Small delay to show completion
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error generating cohort ${seg.name}:`, error);
          logError(error as Error, {
            component: 'PersonaBuilder',
            action: 'generate_cohort',
            metadata: { segmentId: seg.id, segmentName: seg.name }
          });
          setCohortProgress(prev => prev.map(p => 
            p.segmentId === seg.id 
              ? { ...p, status: 'error', progress: 0, estimatedTimeRemaining: 0 }
              : p
          ));
        }
      }
      
      // Final update - ensure all personas are included (in case some were added incrementally)
      console.log(`🔄 Final state update - allNewPersonas: ${allNewPersonas.length}`);
      setPersonas(prev => {
        // Merge and deduplicate by ID
        const existingIds = new Set(prev.map(p => p.id));
        const newPersonas = allNewPersonas.filter(p => !existingIds.has(p.id));
        const final = [...prev, ...newPersonas];
        console.log(`🎉 Batch generation complete!`, {
          previousCount: prev.length,
          newCount: newPersonas.length,
          totalCount: final.length,
          allPersonas: final.map(p => ({ id: p.id, name: p.name, segmentId: p.segmentId }))
        });
        
        // Verify personas are valid
        final.forEach((p, idx) => {
          if (!p.id || !p.name) {
            console.error(`❌ Invalid persona at index ${idx}:`, p);
          }
        });
        
        return final;
      });
      
      // Force a state check after a brief delay
      setTimeout(() => {
        console.log(`🔍 Post-generation state check - personas should be visible now`);
      }, 100);
      
      setProgress('');
      
      return allNewPersonas;
    }, {
      retries: 1,
      context: {
        component: 'PersonaBuilder',
        action: 'batch_generation',
        metadata: { segmentCount: segments.length }
      },
      onError: (error) => {
        const friendlyError = createUserFriendlyError(error, {
          component: 'PersonaBuilder',
          action: 'generate_cohort'
        });
        setError(friendlyError.message);
        logError(error, {
          component: 'PersonaBuilder',
          action: 'generate_cohort'
        });
      }
    }).catch((error: any) => {
      const friendlyError = createUserFriendlyError(error, {
        component: 'PersonaBuilder',
        action: 'generate_cohort'
      });
      setError(friendlyError.message);
      setProgress(`Error generating cohorts: ${friendlyError.message}`);
      logError(error, {
        component: 'PersonaBuilder',
        action: 'generate_cohort'
      });
    }).finally(() => {
      setIsGenerating(false);
      // Clear progress after a delay
      setTimeout(() => {
        setCohortProgress([]);
        setProgress('');
        // Clear market brief only after batch generation completes
        setNewSegBrief('');
        setNewSegGrounding({ useSearch: true, useMaps: false, sources: [] });
      }, 3000);
    });
  };

  // Debug: Log current state
  useEffect(() => {
    console.log(`🔍 PersonaBuilder render - personas: ${personas.length}, segments: ${segments.length}`);
    if (personas.length > 0) {
      console.log(`📋 Sample persona:`, personas[0]);
      console.log(`📋 All persona IDs:`, personas.map(p => p.id));
    }
  }, [personas, segments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <InfoModal 
        isOpen={!!help} 
        onClose={() => setHelp(null)} 
        title={help?.title || ""} 
        content={help?.content || ""} 
      />
      
      {/* Error Display */}
      {error && (
        <ErrorDisplay
          message={error}
          variant="banner"
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-1 uppercase tracking-tight italic">Cohort Orchestration</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em]">hidden sm:block Behavioral Agent Synthesis & Web Grounding</p>
        </div>
        <div className="flex gap-10">
             <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-white italic">{personas.length}</div>
                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Active Agents</div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Configuration */}
        <div className="lg:col-span-5 space-y-8">
            
            {/* Market Brief Ingestion */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 shadow-xl">
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
                <div className="text-[9px] text-zinc-600 italic flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                  Note: Sources are generated from AI model knowledge, not real-time web search
                </div>
                
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
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Users size={14} /> Phase 2: Agent Specification
                    <InfoButton onClick={() => setHelp({
                      title: "Agent Specs",
                      content: "Define the core label and behavioral assumptions for this segment. For example, 'Power Users' might have high novelty-seeking scores and low price sensitivity."
                    })} />
                </label>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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

            {/* Cohort Progress List */}
            {cohortProgress.length > 0 && (
              <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6 space-y-4">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                  Cohort Initialization Progress
                </div>
                <div className="space-y-3">
                  {cohortProgress.map((cohort) => (
                    <div key={cohort.segmentId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{cohort.segmentName}</span>
                        <span className="text-[10px] text-zinc-500">
                          {cohort.status === 'completed' && '✅ Complete'}
                          {cohort.status === 'processing' && `⏳ ${Math.round(cohort.estimatedTimeRemaining)}s remaining`}
                          {cohort.status === 'pending' && '⏸️ Pending'}
                          {cohort.status === 'error' && '❌ Error'}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            cohort.status === 'completed' ? 'bg-green-500' :
                            cohort.status === 'error' ? 'bg-red-500' :
                            'bg-indigo-500'
                          }`}
                          style={{ width: `${cohort.progress}%` }}
                        />
                      </div>
                      {cohort.status === 'processing' && (
                        <div className="text-[9px] text-zinc-600">
                          {Math.round(cohort.progress)}% complete
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
        <div className="lg:col-span-7 h-auto lg:h-[calc(100vh-250px)] overflow-y-auto pr-0 sm:pr-2 custom-scrollbar pb-20">
             {/* Segments List */}
             {segments.length > 0 && (
               <div className="mb-6 bg-zinc-900/30 border border-white/5 rounded-[2rem] p-6">
                 <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                   <Users size={14} /> Locked In Cohorts ({segments.length})
                 </div>
                 <div className="space-y-3">
                   {segments.map((seg, idx) => {
                     const segmentPersonas = personas.filter(p => p.segmentId === seg.id);
                     const cohortStatus = cohortProgress.find(p => p.segmentId === seg.id);
                     return (
                       <div 
                         key={seg.id} 
                         className="p-4 bg-zinc-950/50 border border-white/5 rounded-xl flex items-center justify-between hover:border-indigo-500/20 transition-all"
                       >
                         <div className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full" style={{ background: seg.color }}></div>
                           <div>
                             <div className="text-xs font-bold text-white">{seg.name}</div>
                             <div className="text-[9px] text-zinc-600">
                               {segmentPersonas.length > 0 
                                 ? `${segmentPersonas.length}/${seg.count} agents generated`
                                 : `${seg.count} agents pending`
                               }
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           {cohortStatus && (
                             <div className="text-[9px] text-zinc-500">
                               {cohortStatus.status === 'completed' && '✅'}
                               {cohortStatus.status === 'processing' && <RefreshCw size={12} className="animate-spin text-indigo-400" />}
                               {cohortStatus.status === 'error' && '❌'}
                             </div>
                           )}
                           <button
                             onClick={() => removeSegment(seg.id)}
                             className="text-zinc-600 hover:text-red-400 transition-colors"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}

             {/* Active Agents Display */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                   <Users size={14} /> Active Agents ({personas.length})
                 </div>
                 {personas.length > 0 && (
                   <div className="text-[9px] text-zinc-600">
                     Showing all generated personas
                   </div>
                 )}
                 {isGenerating && (
                   <div className="text-[9px] text-indigo-400 flex items-center gap-2">
                     <RefreshCw size={12} className="animate-spin" />
                     Generating...
                   </div>
                 )}
               </div>

               {personas.length === 0 && !isGenerating ? (
                 <div className="h-[400px] flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-950/20">
                     <Users size={64} className="mb-6 opacity-5" />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Active Agents Found</p>
                     {segments.length > 0 && (
                       <p className="text-[9px] text-zinc-700 mt-2">Click "Initiate Batch Generation" to create agents</p>
                     )}
                 </div>
               ) : personas.length === 0 && isGenerating ? (
                 <div className="h-[400px] flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-950/20">
                     <RefreshCw size={48} className="mb-6 opacity-20 animate-spin text-indigo-500" />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Generating Agents...</p>
                     <p className="text-[9px] text-zinc-700 mt-2">{progress || 'Please wait'}</p>
                 </div>
               ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {personas.filter(p => p && p.id && p.name).map((p, index) => {
                        const parentSeg = segments.find(s => s.id === p.segmentId);
                        const color = parentSeg?.color || '#cbd5e1';
                        
                        // Generate tags based on traits and psychographics
                        const getPersonaTags = (persona: Persona): string[] => {
                            const tags: string[] = [];
                            if (persona.traits.riskAversion > 70) tags.push('Risk-averse');
                            if (persona.traits.riskAversion < 30) tags.push('Risk-tolerant');
                            if (persona.traits.priceSensitivity > 70) tags.push('Price-sensitive');
                            if (persona.traits.priceSensitivity < 30) tags.push('Premium-focused');
                            if (persona.traits.cognitiveReflection > 70) tags.push('Analytical');
                            if (persona.traits.cognitiveReflection < 30) tags.push('Intuitive');
                            if (persona.traits.socialConformity > 70) tags.push('Social');
                            if (persona.traits.socialConformity < 30) tags.push('Independent');
                            if (persona.traits.noveltySeeking > 70) tags.push('Innovative');
                            if (persona.traits.noveltySeeking < 30) tags.push('Traditional');
                            
                            // Add psychographic-based tags
                            const psychLower = (persona.psychographics || '').toLowerCase();
                            if (psychLower.includes('creative') || psychLower.includes('artistic')) tags.push('Creative');
                            if (psychLower.includes('ambitious') || psychLower.includes('driven')) tags.push('Ambitious');
                            if (psychLower.includes('practical') || psychLower.includes('pragmatic')) tags.push('Practical');
                            
                            return tags.slice(0, 3); // Limit to 3 tags
                        };
                        
                        const tags = getPersonaTags(p);
                        
                        // Parse occupation to extract education info if available
                        const occupationParts = (p.occupation || '').split(' at ');
                        const jobTitle = occupationParts[0] || p.occupation || 'Unknown';
                        const education = occupationParts[1] || '';
                        
                        return (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedPersona(p)}
                                className="group relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-2 rounded-3xl p-6 hover:from-zinc-800/90 hover:to-zinc-900/90 transition-all duration-300 shadow-2xl hover:shadow-3xl cursor-pointer overflow-hidden hover:scale-[1.02]"
                                style={{ 
                                    borderColor: `${color}50`,
                                    boxShadow: `0 8px 32px ${color}15, 0 2px 8px rgba(0,0,0,0.4)`,
                                    aspectRatio: '1 / 1.2'
                                }}
                            >
                                {/* Subtle gradient overlay on hover */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                    style={{ background: `linear-gradient(135deg, ${color}05 0%, transparent 50%)` }}
                                />
                                {/* Profile Header */}
                                <div className="relative flex flex-col items-center mb-4">
                                    {/* Profile Picture */}
                                    <div className="relative mb-3">
                                        <div className="w-20 h-20 rounded-full overflow-hidden ring-4 transition-all duration-300" style={{ ringColor: `${color}60` }}>
                                            <img 
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatarId || p.id}&backgroundColor=${color.replace('#', '')}`}
                                                alt={p.name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=${color.replace('#', '')}&color=fff&size=200&bold=true`;
                                                }}
                                            />
                                        </div>
                                        {/* Segment indicator badge */}
                                        <div 
                                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-4 ring-zinc-900" 
                                            style={{ background: color }}
                                            title={parentSeg?.name}
                                        />
                                    </div>

                                    {/* Name */}
                                    <h3 className="font-bold text-white text-base mb-2 leading-tight text-center">
                                        {p.name}
                                    </h3>
                                    
                                    {/* Profession - 1 line */}
                                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 mb-1.5 w-full px-2">
                                        {education ? <GraduationCap size={11} className="flex-shrink-0" /> : <Briefcase size={11} className="flex-shrink-0" />}
                                        <span className="font-medium truncate">{education || jobTitle}</span>
                                    </div>
                                    
                                    {/* Location - 1 line */}
                                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 mb-3">
                                        <MapPin size={10} />
                                        <span>{p.location || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{p.age || 'N/A'} yrs</span>
                                    </div>
                                    
                                    {/* System 1/2 Toggle */}
                                    <div 
                                        className="flex items-center gap-1 bg-zinc-950/70 rounded-full p-1 border border-white/10"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPersonas(prev => prev.map(persona => 
                                                    persona.id === p.id ? { ...persona, thinkingSystem: 1 } : persona
                                                ));
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                                                (p.thinkingSystem || 1) === 1 
                                                    ? 'bg-yellow-500/90 text-black' 
                                                    : 'bg-transparent text-zinc-600 hover:text-zinc-400'
                                            }`}
                                            title="Fast, effortless, intuitive"
                                        >
                                            S1
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPersonas(prev => prev.map(persona => 
                                                    persona.id === p.id ? { ...persona, thinkingSystem: 2 } : persona
                                                ));
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                                                (p.thinkingSystem || 1) === 2 
                                                    ? 'bg-blue-500/90 text-white' 
                                                    : 'bg-transparent text-zinc-600 hover:text-zinc-400'
                                            }`}
                                            title="Slow, deliberate, effortful, controlled"
                                        >
                                            S2
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Tags */}
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                                        {tags.slice(0, 2).map((tag, idx) => (
                                            <span 
                                                key={idx}
                                                className="px-2 py-0.5 bg-zinc-800/70 border border-white/10 rounded text-[9px] text-zinc-400 font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Bio Preview */}
                                <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 text-center mb-3 px-2">
                                    {p.bio || 'No bio available.'}
                                </p>
                                
                                {/* Compact Details */}
                                <div className="space-y-3 pt-3 border-t border-white/10">
                                    {/* Top 3 Traits */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(p.traits || {}).slice(0, 3).map(([key, value]) => {
                                            const traitKey = key as keyof typeof p.traits;
                                            const traitName = String(traitKey).replace(/([A-Z])/g, ' $1').trim();
                                            const shortName = traitName.split(' ').map(w => w.charAt(0)).join(''); // Initials
                                            return (
                                                <div key={key} className="text-center py-2 bg-zinc-950/60 rounded-lg border border-white/5">
                                                    <div className="text-[8px] text-zinc-600 uppercase mb-0.5">{shortName}</div>
                                                    <div className="text-sm font-black text-white">{value}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Click to Expand */}
                                <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="text-[9px] text-indigo-400 uppercase tracking-wider font-bold">
                                        Click for full profile →
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {personas.filter(p => p && p.id && p.name).length === 0 && (
                      <div className="col-span-full p-8 text-center text-zinc-600">
                        <p className="text-sm">No valid personas to display</p>
                        <p className="text-xs text-zinc-700 mt-2">Check console for errors</p>
                      </div>
                    )}
                </div>
               )}
             </div>
        </div>
      </div>

      {/* Persona Detail Modal */}
      {selectedPersona && (
        <PersonaDetailModal 
          persona={selectedPersona}
          segment={segments.find(s => s.id === selectedPersona.segmentId)}
          onClose={() => setSelectedPersona(null)}
        />
      )}

      
      {/* Conversation Lab Button */}
      {personas.length > 0 && onOpenConversationLab && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={onOpenConversationLab}
            className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-600/30 flex items-center gap-2 transition-all"
            title="Open Conversation Lab"
          >
            <MessageSquare size={20} />
            <span className="text-sm font-bold">Conversations</span>
          </button>
        </div>
    )}
      {/* Personas FAQ Section */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Personas FAQ</h2>
          <p className="text-sm text-zinc-500">Learn how Rat Lab creates and uses AI personas</p>
        </div>
        <PersonasFAQ />
      </div>
    </div>
  );

};

export default PersonaBuilder;