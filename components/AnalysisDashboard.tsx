
import React, { useEffect, useState } from 'react';
import { performStatisticalAnalysis, generateAudioReport } from '../services/geminiService';
import { SimulationResult, AnalysisReport, PersonaSegment, User, HypothesisResult, Persona } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter, ZAxis, Legend, Cell
} from 'recharts';
import { 
  FileSearch, FileText, ShieldAlert, TrendingUp, 
  DollarSign, ArrowUpRight, BarChart3, Volume2, Loader2,
  Users, CheckCircle2, XCircle, Activity, X
} from 'lucide-react';
import InfoModal, { InfoButton } from './InfoModal';
import IndividualInsights from './IndividualInsights';
import BehavioralModeling from './BehavioralModeling';
import { ChartSkeleton } from './LoadingSkeleton';
import { createUserFriendlyError, logError } from '../utils/errorHandling';
import ErrorDisplay from './ErrorDisplay';

interface AnalysisDashboardProps {
  results: SimulationResult[];
  segments: PersonaSegment[];
  context?: string;
  user: User;
  personas?: Persona[];
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ results, segments, context, user, personas = [] }) => {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<string[]>(segments.map(s => s.id));
  const [help, setHelp] = useState<{ title: string; content: string } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  
  // Get unique segments from results
  const availableSegments = segments.filter(seg => 
    results.some(r => r.segmentId === seg.id)
  );
  
  // Filter results based on selected segments
  const filteredResults = results.filter(r => 
    selectedSegments.includes(r.segmentId)
  );

  useEffect(() => {
    // Reset report when filtered results change
    setReport(null);
    
    const generateReport = async () => {
      if (filteredResults.length === 0) {
        setReport(null);
        return;
      }
      
      // Prevent multiple simultaneous calls
      if (loading) {
        console.log('⚠️ Analysis already in progress, skipping...');
        return;
      }
      
      setLoading(true);
      setAnalysisError(null);
      console.log(`🔄 Generating analysis for ${filteredResults.length} results across ${selectedSegments.length} segments...`);
      console.log(`📊 Results sample:`, {
        firstResult: filteredResults[0],
        totalResponses: filteredResults.reduce((sum, r) => sum + r.responses.length, 0)
      });
      
      try {
        const selectedSegmentsData = segments.filter(s => selectedSegments.includes(s.id));
        
        if (selectedSegmentsData.length === 0) {
          console.warn('⚠️ No segments selected for analysis');
          setReport(null);
          return;
        }
        
        console.log(`📊 Analysis input:`, {
          resultsCount: filteredResults.length,
          segmentsCount: selectedSegmentsData.length,
          segmentNames: selectedSegmentsData.map(s => s.name)
        });
        
        const analysis = await performStatisticalAnalysis(filteredResults, selectedSegmentsData);
        
        console.log(`✅ Analysis complete:`, {
          hasSummary: !!analysis.summary,
          hypothesesCount: analysis.hypotheses.length,
          recommendationsCount: analysis.recommendations.length,
          reliabilityScore: analysis.reliabilityScore,
          marketResonance: analysis.marketResonance,
          segmentPerformanceCount: analysis.segmentPerformance.length,
          standoutPersonasCount: analysis.standoutPersonas?.length || 0
        });
        
        // Ensure ALL segments are in segmentPerformance (fill missing with 0)
        const allSegmentsData = selectedSegmentsData.map(seg => {
          const existing = analysis.segmentPerformance.find(sp => sp.segment === seg.name);
          if (existing) return existing;
          
          // Calculate actual average for missing segments
          const segResults = filteredResults.filter(r => r.segmentId === seg.id);
          const avgScore = segResults.length > 0
            ? segResults.reduce((sum, r) => {
                const numericResponses = r.responses.filter(resp => resp.numericValue !== undefined && resp.numericValue !== null);
                const avg = numericResponses.length > 0
                  ? numericResponses.reduce((s, resp) => s + (resp.numericValue || 0), 0) / numericResponses.length
                  : 5;
                return sum + avg;
              }, 0) / segResults.length
            : 0;
          
          return {
            segment: seg.name,
            avgScore: Math.round(avgScore * 10) / 10,
            dominantTheme: segResults.length > 0 ? 'Response pattern detected' : 'No data'
          };
        });
        
        analysis.segmentPerformance = allSegmentsData;
        console.log(`📊 Segment performance updated to include all segments:`, allSegmentsData);
        
        setReport(analysis);
        setAnalysisError(null);
      } catch (err: any) { 
        const e = err instanceof Error ? err : new Error(String(err));
        const friendly = createUserFriendlyError(e, {
          component: 'AnalysisDashboard',
          action: 'generate_analysis'
        });
        logError(e, {
          component: 'AnalysisDashboard',
          action: 'generate_analysis',
          metadata: {
            resultsCount: filteredResults.length,
            segmentsCount: segments.length
          }
        });
        setAnalysisError(friendly.message);
        
        const errorMessage = err.message || 'Unknown error occurred';
        const isApiKeyError = errorMessage.includes('API_KEY') || errorMessage.includes('apiKey') || errorMessage.includes('api key');
        const helpText = isApiKeyError 
          ? 'Please ensure your OpenAI API key is configured in .env.local file.'
          : 'Please check console for details and try again.';
        
        setReport({
          summary: `⚠️ Analysis generation failed: ${errorMessage}. ${helpText}`,
          hypotheses: [],
          regressionSummary: `Error: ${errorMessage}`,
          keyDifferentiators: ['Analysis could not be completed due to an error'],
          recommendations: ['Check API configuration', 'Verify simulation data is valid', 'Review console logs for details'],
          reliabilityScore: 0,
          conversionProbability: 0,
          marketResonance: 0,
          sentimentBreakdown: [],
          segmentPerformance: [],
          driversRadar: [],
          trendData: []
        });
      } finally { 
        setLoading(false); 
      }
    };
    
    // Small delay to prevent rapid re-renders
    const timeoutId = setTimeout(() => {
      if (filteredResults.length > 0) {
        generateReport();
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [filteredResults.length, selectedSegments.join(','), segments.length]);

  const handlePlayAudio = async () => {
    if (!report || audioLoading) return;
    setAudioLoading(true);
    setTtsError(null);
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(report.summary);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice = voices.find(v => 
            v.lang.startsWith('en') && v.name.includes('Female')
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => setAudioLoading(false);
        utterance.onerror = () => {
          setAudioLoading(false);
          setTtsError('Speech synthesis failed. Please try again or use a different browser.');
        };
        
        speechSynthesis.speak(utterance);
      } else {
        setTtsError('Text-to-speech is not supported in your browser. Please use a modern browser.');
        setAudioLoading(false);
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setTtsError(createUserFriendlyError(e, { component: 'AnalysisDashboard', action: 'tts' }).message);
      logError(e, { component: 'AnalysisDashboard', action: 'tts' });
      setAudioLoading(false);
    }
  };

  if (results.length === 0) return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-950/20 p-20">
        <FileSearch size={64} className="mb-6 opacity-5" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Simulation Datasets</h3>
      </div>
  );
  
  if (filteredResults.length === 0 && results.length > 0) return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-950/20 p-20">
        <FileSearch size={64} className="mb-6 opacity-5" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">No Results for Selected Cohorts</h3>
        <p className="text-xs text-zinc-600">Select at least one cohort to analyze</p>
      </div>
  );

  if (loading || !report) return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="relative mb-10">
            <div className="w-24 h-24 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center"><BarChart3 className="text-indigo-400" size={32} /></div>
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-600">Executing Regression Models</h3>
      </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in pb-40">
      <InfoModal 
        isOpen={!!help} 
        onClose={() => setHelp(null)} 
        title={help?.title || ""} 
        content={help?.content || ""} 
      />

      {analysisError && (
        <ErrorDisplay
          message={analysisError}
          variant="banner"
          dismissible
          onDismiss={() => setAnalysisError(null)}
        />
      )}

      {/* Individual Insights & Behavioral Modeling - Unique Rat Lab Features */}
      <div className="space-y-6">
        <IndividualInsights results={filteredResults} personas={personas} />
        <BehavioralModeling personas={personas} segments={availableSegments} />
      </div>

      {/* Cohort Selection */}
      {availableSegments.length > 0 && (
        <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem]">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Users size={14} /> Select Cohorts for Analysis
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSegments(availableSegments.map(s => s.id))}
                className="text-[9px] text-zinc-500 hover:text-white transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedSegments([])}
                className="text-[9px] text-zinc-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableSegments.map(seg => {
              const segmentResults = results.filter(r => r.segmentId === seg.id);
              const isSelected = selectedSegments.includes(seg.id);
              return (
                <button
                  key={seg.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSegments(prev => prev.filter(id => id !== seg.id));
                    } else {
                      setSelectedSegments(prev => [...prev, seg.id]);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                    isSelected
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                      : 'bg-zinc-950/50 border-white/5 text-zinc-500 hover:border-white/10'
                  }`}
                  style={isSelected ? { borderColor: seg.color } : {}}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: seg.color }}></div>
                    <span>{seg.name}</span>
                    <span className="text-[10px] opacity-70">({segmentResults.length})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategic Intelligence Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/30 border border-white/5 p-10 rounded-[3rem] gap-8 backdrop-blur-2xl bg-noise">
          <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Strategic Decision Intelligence</h2>
              <div className="flex items-center gap-6 mt-3">
                 <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                   <Users size={12} /> {filteredResults.length} N-Inferences
                 </p>
                 <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                 <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                   <Activity size={12} /> Confidence Index: {report.reliabilityScore}%
                   <InfoButton onClick={() => setHelp({
                        title: "Confidence Index",
                        content: "The Reliability Score reflects the statistical robustness of the simulation. Higher scores indicate lower variance and higher cross-persona consistency, making the insights more dependable for GTM decisions."
                    })} />
                 </p>
              </div>
          </div>
          <div className="flex flex-col gap-2">
              <div className="flex gap-4">
                <button onClick={handlePlayAudio} className="p-4 bg-zinc-900 border border-white/10 text-white rounded-2xl hover:bg-zinc-800 transition-all shadow-xl">
                   {audioLoading ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />}
                </button>
                <button 
                  onClick={() => setShowExecutiveReport(true)}
                  className="px-8 py-4 bg-white hover:bg-zinc-200 text-black rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-2xl"
                >
                  Download Executive Brief
                </button>
              </div>
              {ttsError && (
                <ErrorDisplay
                  message={ttsError}
                  variant="compact"
                  dismissible
                  onDismiss={() => setTtsError(null)}
                />
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
               { icon: <ShieldAlert size={20}/>, val: `${report.reliabilityScore}%`, label: 'Reliability index', color: 'emerald', help: 'Reliability Index: Calculated based on n-size, persona diversity, and response consistency.' },
               { icon: <DollarSign size={20}/>, val: report.optimalPricePoint ? `$${report.optimalPricePoint}` : 'N/A', label: 'Optimal Pricing', color: 'indigo', help: 'Optimal Price: The point at which the predicted utility and adoption probability are maximized across all segments.' },
               { icon: <TrendingUp size={20}/>, val: `${report.marketResonance || 0}%`, label: 'Market Lift', color: 'amber', help: 'Market Lift: Measures the percentage shift in positive intent compared to current category benchmarks.' },
               { icon: <Activity size={20}/>, val: `${Math.round((report.conversionProbability || 0) * 100)}%`, label: 'Conversion Prob.', color: 'purple', help: 'Conversion Probability: The aggregate likelihood of the simulated audience completing the target call-to-action.' }
           ].map((kpi, idx) => (
                <div key={idx} className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-${kpi.color}-500/5 blur-3xl`}></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 bg-${kpi.color}-500/10 rounded-2xl text-${kpi.color}-400 border border-${kpi.color}-500/20 w-fit`}><Activity size={18} /></div>
                        <InfoButton onClick={() => setHelp({ title: kpi.label, content: kpi.help })} />
                    </div>
                    <div className="text-4xl font-black text-white italic tracking-tighter">{kpi.val}</div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">{kpi.label}</div>
                </div>
           ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Hypothesis Testing Ledger */}
          <div className="md:col-span-2 bg-zinc-900/20 border border-white/5 rounded-[3rem] p-12 flex flex-col shadow-inner backdrop-blur-sm">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                  <FileText size={18} className="text-indigo-400" /> Phase 4: Hypothesis Validation
                  <InfoButton onClick={() => setHelp({
                      title: "Hypothesis Validation",
                      content: "Our engine performs automated statistical testing (like t-tests and ANOVA) to determine if observed differences in responses are statistically significant or likely due to random variance."
                  })} />
              </h3>
              
              <div className="space-y-8">
                  {report.hypotheses.map((h, i) => (
                      <div key={i} className="group relative p-8 bg-zinc-950/40 rounded-[2rem] border border-white/5 hover:border-indigo-500/20 transition-all">
                          <div className="flex justify-between items-start mb-6">
                              <h4 className="text-lg font-bold text-white tracking-tighter leading-tight italic max-w-[80%]">"{h.statement}"</h4>
                              {h.validated ? <CheckCircle2 className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-6">
                               <div className="flex flex-col">
                                   <span className="text-[8px] font-black text-zinc-700 uppercase flex items-center gap-1">
                                      p-Value
                                      <InfoButton onClick={() => setHelp({
                                          title: "p-Value",
                                          content: "The probability that the observed results occurred by chance. Typically, a p-value < 0.05 means we reject the null hypothesis and accept the finding as significant."
                                      })} />
                                   </span>
                                   <span className={`text-xs font-mono font-bold ${h.p_value < 0.05 ? 'text-emerald-400' : 'text-zinc-500'}`}>{h.p_value.toFixed(4)}</span>
                               </div>
                               <div className="flex flex-col">
                                   <span className="text-[8px] font-black text-zinc-700 uppercase flex items-center gap-1">
                                      Effect Size
                                      <InfoButton onClick={() => setHelp({
                                          title: "Effect Size",
                                          content: "While p-value tells you IF there is an effect, Effect Size (e.g. Cohen's d) tells you HOW LARGE the effect is. High effect size means the stimulus caused a massive shift in behavior."
                                      })} />
                                   </span>
                                   <span className="text-xs font-mono font-bold text-zinc-200">{h.effectSize.toFixed(2)}</span>
                               </div>
                          </div>
                          <p className="text-xs text-zinc-500 italic leading-relaxed border-t border-white/5 pt-6">{h.interpretation}</p>
                      </div>
                  ))}
              </div>
          </div>

          {/* Utility Radar & Regression Summary */}
          <div className="space-y-10">
              <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] p-10 flex flex-col backdrop-blur-sm h-fit">
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                    Key Decision Drivers
                    <InfoButton onClick={() => setHelp({
                        title: "Decision Drivers",
                        content: "This radar chart shows which factors most influence participant decisions based on response analysis. Larger areas indicate stronger influence on outcomes. Derived from actual response mentions and sentiment analysis."
                    })} />
                  </h3>
                  <div className="text-xs text-zinc-500 mb-8">
                    Factors mentioned in responses: {report.driversRadar.reduce((sum, d) => sum + d.A, 0)} total mentions
                  </div>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={report.driversRadar}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis 
                              dataKey="subject" 
                              tick={{ fill: '#888', fontSize: 11, fontWeight: 'bold' }} 
                            />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#666', fontSize: 9 }} />
                            <Radar 
                              name="Importance Score" 
                              dataKey="A" 
                              stroke="#6366f1" 
                              fill="#6366f1" 
                              fillOpacity={0.4} 
                              strokeWidth={2}
                            />
                            <Tooltip 
                              contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 p-4 bg-zinc-950/50 rounded-xl border border-white/5">
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      <span className="font-bold text-white">Analysis Method:</span> Factors extracted from {results.length} individual responses. Scored by frequency and sentiment correlation.
                    </p>
                  </div>
              </div>

              <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] p-10 backdrop-blur-sm">
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-8">Regression Findings</h3>
                    <p className="text-xs text-zinc-400 italic leading-relaxed bg-zinc-950/40 p-6 rounded-2xl border border-white/5">
                        {report.regressionSummary}
                    </p>
              </div>
          </div>
      </div>

      {/* NEW: Individual Standout Personas */}
      {report.standoutPersonas && report.standoutPersonas.length > 0 && (
        <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] p-12 backdrop-blur-sm">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-8 flex items-center gap-2">
            <Users size={18} className="text-indigo-400" /> Individual-Level Insights
            <InfoButton onClick={() => setHelp({
                title: "Individual Insights",
                content: "These are standout individual participants whose responses revealed particularly valuable patterns or insights. This individual-level analysis helps identify nuanced behaviors that cohort averages might miss."
            })} />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {report.standoutPersonas.map((sp, idx) => (
              <div key={idx} className="bg-zinc-950/60 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{sp.personaName}</h4>
                    <p className="text-[10px] text-zinc-500">{sp.segment}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{sp.insight}</p>
                <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3 border-l-2 border-l-indigo-500">
                  <p className="text-[11px] text-zinc-300 italic">"{sp.quote}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW: Cross-Cohort Patterns */}
      {report.crossCohortInsights && report.crossCohortInsights.length > 0 && (
        <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] p-12 backdrop-blur-sm">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-8 flex items-center gap-2">
            <Activity size={18} className="text-purple-400" /> Cross-Cohort Behavioral Patterns
            <InfoButton onClick={() => setHelp({
                title: "Cross-Cohort Patterns",
                content: "These insights emerge when analyzing ALL participants together, regardless of segment. They reveal universal patterns and behaviors that transcend cohort boundaries."
            })} />
          </h3>
          <div className="space-y-4">
            {report.crossCohortInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-4 p-6 bg-zinc-950/40 rounded-2xl border border-white/5">
                <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 flex-shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-sm text-zinc-300 flex-1 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW: Regression Scatter Plot */}
      {report.regressionScatter && report.regressionScatter.length > 0 && (
        <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] p-12 backdrop-blur-sm">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-8 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-400" /> Behavioral Regression Analysis
            <InfoButton onClick={() => setHelp({
                title: "Regression Analysis",
                content: "This scatter plot shows the relationship between individual behavioral traits and outcomes. Each dot represents one participant. Clustering patterns reveal which traits predict positive or negative responses."
            })} />
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Trait Value" 
                  stroke="#666" 
                  label={{ value: 'Behavioral Trait Score', position: 'insideBottom', offset: -10, fill: '#999' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Outcome Score" 
                  stroke="#666"
                  label={{ value: 'Response Score', angle: -90, position: 'insideLeft', fill: '#999' }}
                />
                <ZAxis range={[60, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={(value: any, name: any, props: any) => {
                    if (name === 'x') return [`${value}`, 'Trait Score'];
                    if (name === 'y') return [`${value}`, 'Outcome'];
                    return [value, name];
                  }}
                  labelFormatter={(label: any) => {
                    const point = report.regressionScatter?.find(p => p.name === label);
                    return point ? `${point.name} (${point.segment})` : label;
                  }}
                />
                <Scatter name="Participants" data={report.regressionScatter} fill="#6366f1">
                  {report.regressionScatter.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={segments.find(s => s.name === entry.segment)?.color || '#6366f1'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-500 mt-4 text-center italic">
            Each point represents one participant. Color indicates segment. Position shows trait-outcome correlation.
          </p>
        </div>
      )}

      {/* Segment Performance */}
      <div className="bg-zinc-900/20 border border-white/5 rounded-[3.5rem] p-16 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-16">
            <div>
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-2">
                  Segment Resonance Patterns (All {segments.length} Cohorts)
                  <InfoButton onClick={() => setHelp({
                      title: "Segment Resonance",
                      content: "This chart compares how well the tested scenario resonated across ALL audience segments. Each bar represents one cohort's average response score. Gaps here indicate where positioning or product-market fit needs calibration."
                  })} />
                </h3>
                <p className="text-xs text-zinc-500">Comparative lift across all {filteredResults.length} participants in {segments.length} segments</p>
            </div>
          </div>
          <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.segmentPerformance} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                      <XAxis dataKey="segment" stroke="#333" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#555', fontWeight: 'bold'}} />
                      <YAxis domain={[0, 10]} stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ background: '#000', border: 'none', borderRadius: '20px', color: '#fff' }} />
                      <Bar dataKey="avgScore" radius={[15, 15, 0, 0]} barSize={60} animationDuration={2000}>
                        {report.segmentPerformance.map((entry, index) => {
                          const segment = segments.find(s => s.name === entry.segment);
                          return <Cell key={`cell-${index}`} fill={segment?.color || '#6366f1'} />;
                        })}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-500 mt-4 text-center">
            {report.segmentPerformance.length === segments.length 
              ? `✅ All ${segments.length} segments included` 
              : `⚠️ Showing ${report.segmentPerformance.length} of ${segments.length} segments`}
          </p>
      </div>

      {/* Executive Report Modal */}
      {showExecutiveReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 animate-in fade-in zoom-in duration-300">
               <div className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-12 border-b border-white/5 flex justify-between items-center bg-zinc-950/50">
                        <div>
                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2">Internal GTM Document • RAT LAB v2.1</div>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter">Strategic Execution Playbook</h2>
                        </div>
                        <button onClick={() => setShowExecutiveReport(false)} className="text-zinc-600 hover:text-white transition-all"><X size={32}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-16 space-y-12 custom-scrollbar font-serif">
                         <section className="space-y-6">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">Executive Summary</h3>
                            <p className="text-lg text-zinc-300 leading-relaxed italic border-l-4 border-indigo-500/30 pl-10 opacity-80">{report.summary}</p>
                         </section>

                         <div className="grid grid-cols-2 gap-16">
                            <section className="space-y-6">
                                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Growth Recommendations</h3>
                                <div className="space-y-4">
                                    {report.recommendations.map((r, i) => (
                                        <div key={i} className="flex gap-4 items-start text-zinc-400 text-sm italic">
                                            <ArrowUpRight size={16} className="text-emerald-500 shrink-0" /> {r}
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section className="space-y-6">
                                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Statistical Anchors</h3>
                                <div className="p-6 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-zinc-600 font-bold uppercase">Pricing Floor</span>
                                        <span className="text-white font-mono">${(report.optimalPricePoint || 0) * 0.8}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-zinc-600 font-bold uppercase">Optimal Price</span>
                                        <span className="text-white font-mono">${report.optimalPricePoint || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-zinc-600 font-bold uppercase">Market Churn Risk</span>
                                        <span className="text-white font-mono">{100 - (report.marketResonance || 0)}%</span>
                                    </div>
                                </div>
                            </section>
                         </div>
                    </div>
               </div>
          </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
