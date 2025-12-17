
import React, { useEffect, useState } from 'react';
import { performStatisticalAnalysis, generateAudioReport } from '../services/geminiService';
import { SimulationResult, AnalysisReport, PersonaSegment, User, HypothesisResult } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import { 
  FileSearch, FileText, ShieldAlert, TrendingUp, 
  DollarSign, ArrowUpRight, BarChart3, Volume2, Loader2,
  Users, CheckCircle2, XCircle, Activity, X
} from 'lucide-react';
import InfoModal, { InfoButton } from './InfoModal';

interface AnalysisDashboardProps {
  results: SimulationResult[];
  segments: PersonaSegment[];
  context?: string;
  user: User;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ results, segments, context, user }) => {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  const [help, setHelp] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const generateReport = async () => {
      if (results.length === 0) return;
      setLoading(true);
      try {
        const analysis = await performStatisticalAnalysis(results, segments);
        setReport(analysis);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    if (results.length > 0 && !report) generateReport();
  }, [results, segments, report]);

  const handlePlayAudio = async () => {
    if (!report || audioLoading) return;
    setAudioLoading(true);
    const data = await generateAudioReport(report.summary);
    if (data) {
        const audio = new Audio(`data:audio/mp3;base64,${data}`);
        audio.play();
    }
    setAudioLoading(false);
  };

  if (results.length === 0) return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-950/20 p-20">
        <FileSearch size={64} className="mb-6 opacity-5" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Simulation Datasets</h3>
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

      {/* Strategic Intelligence Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/30 border border-white/5 p-10 rounded-[3rem] gap-8 backdrop-blur-2xl bg-noise">
          <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Strategic Decision Intelligence</h2>
              <div className="flex items-center gap-6 mt-3">
                 <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                   <Users size={12} /> {results.length} N-Inferences
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
               { icon: <ShieldAlert size={20}/>, val: `${report.reliabilityScore}%`, label: 'Reliability index', color: 'emerald', help: 'Reliability Index: Calculated based on n-size, persona diversity, and response consistency.' },
               { icon: <DollarSign size={20}/>, val: report.optimalPricePoint ? `$${report.optimalPricePoint}` : 'N/A', label: 'Optimal Pricing', color: 'indigo', help: 'Optimal Price: The point at which the predicted utility and adoption probability are maximized across all segments.' },
               { icon: <TrendingUp size={20}/>, val: `${report.marketResonance || 0}%`, label: 'Market Lift', color: 'amber', help: 'Market Lift: Measures the percentage shift in positive intent compared to current category benchmarks.' },
               { icon: <Activity size={20}/>, val: `${report.conversionProbability || 0}%`, label: 'Conversion Prob.', color: 'purple', help: 'Conversion Probability: The aggregate likelihood of the simulated audience completing the target call-to-action.' }
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
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-12 flex items-center gap-2">
                    Purchase Factor Weights
                    <InfoButton onClick={() => setHelp({
                        title: "Driver Weights",
                        content: "Using regression analysis, we identify which underlying persona traits (like cognitive reflection or risk aversion) were the primary drivers behind their responses."
                    })} />
                  </h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={report.driversRadar}>
                            <PolarGrid stroke="#222" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#444', fontSize: 10, fontWeight: 'bold' }} />
                            <Radar name="Active Cohort" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                        </RadarChart>
                    </ResponsiveContainer>
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

      {/* Segment Performance */}
      <div className="bg-zinc-900/20 border border-white/5 rounded-[3.5rem] p-16 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-16">
            <div>
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-2">
                  Segment Resonance Patterns
                  <InfoButton onClick={() => setHelp({
                      title: "Segment Resonance",
                      content: "This chart compares how well the tested scenario resonated across different audience segments. Gaps here indicate where positioning or product-market fit needs calibration."
                  })} />
                </h3>
                <p className="text-xs text-zinc-500">Comparative lift across identified Behavioral Agents</p>
            </div>
          </div>
          <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.segmentPerformance} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                      <XAxis dataKey="segment" stroke="#333" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#555', fontWeight: 'bold'}} />
                      <YAxis domain={[0, 10]} stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ background: '#000', border: 'none', borderRadius: '20px', color: '#fff' }} />
                      <Bar dataKey="avgScore" fill="#6366f1" radius={[15, 15, 0, 0]} barSize={60} animationDuration={2000} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
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
