
import React, { useState } from 'react';
import { simulateParticipantSurvey } from '../services/geminiService';
import { Persona, SimulationResult, StudyType, Question, QuestionType, PersonaSegment, Asset, User } from '../types';
import { 
  Play, Loader2, ListTodo, Plus, Trash2, 
  Target, FlaskConical, ClipboardList
} from 'lucide-react';
import InfoModal, { InfoButton } from './InfoModal';

interface ExperimentLabProps {
  personas: Persona[];
  segments: PersonaSegment[];
  results: SimulationResult[];
  setResults: (results: SimulationResult[] | ((prev: SimulationResult[]) => SimulationResult[])) => void;
  onNavigateToAnalysis: () => void;
  assets: Asset[];
  user: User;
  context: string;
  setContext: (context: string) => void;
  taskPrompt: string;
  setTaskPrompt: (prompt: string) => void;
}

const ExperimentLab: React.FC<ExperimentLabProps> = ({ 
    personas, segments, results, setResults, onNavigateToAnalysis, assets, user,
    context, setContext, taskPrompt, setTaskPrompt
}) => {
  const [studyType, setStudyType] = useState<StudyType>(StudyType.MESSAGE_TEST);
  const [questions, setQuestions] = useState<Question[]>([
      { id: 'q1', type: QuestionType.LIKERT_SCALE, text: 'How much do you trust this product claim?' },
      { id: 'q2', type: QuestionType.SHORT_RESPONSE, text: 'What is your single biggest concern when looking at this?' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [help, setHelp] = useState<{ title: string; content: string } | null>(null);

  const addQuestion = () => {
      setQuestions([...questions, { id: `q_${Date.now()}`, type: QuestionType.MULTIPLE_CHOICE, text: 'New Question' }]);
  };

  const removeQuestion = (id: string) => {
      setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, text: string) => {
      setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const handleRunSimulation = async () => {
    if (personas.length === 0 || questions.length === 0) return;
    setIsRunning(true);
    setProgress(0);
    
    // Strict Isolated execution
    const allResults: SimulationResult[] = [];
    for (let i = 0; i < personas.length; i++) {
      const p = personas[i];
      try {
        const result = await simulateParticipantSurvey(p, studyType, questions, context, assets);
        allResults.push(result);
        setProgress(Math.round(((i + 1) / personas.length) * 100));
      } catch (err) { console.error(err); }
    }
    
    setResults(prev => [...prev, ...allResults]);
    setIsRunning(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in h-full flex flex-col relative pb-32">
      <InfoModal 
        isOpen={!!help} 
        onClose={() => setHelp(null)} 
        title={help?.title || ""} 
        content={help?.content || ""} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-6">
        <div>
          <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight italic">Research Sandbox</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em]">Isolated Survey Isolation & Stimulus Testing</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto relative">
            <button 
                onClick={handleRunSimulation} 
                disabled={isRunning || personas.length === 0} 
                className={`flex-1 md:flex-none px-10 py-3 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-2xl ${isRunning ? 'bg-zinc-900 text-zinc-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-95'}`}
            >
                {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                {isRunning ? 'Executing Batch...' : 'Launch Simulation'}
            </button>
            <InfoButton 
                className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-900 border border-indigo-500/50"
                onClick={() => setHelp({
                    title: "Simulation Launch",
                    content: "Launching a simulation triggers the independent reasoning engine for every persona. Each agent reviews the context and stimuli, simulates their reaction based on their biases, and records their answers. This happens in total isolation to prevent collective bias."
                })}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0">
        {/* Designer Panel */}
        <div className="lg:col-span-5 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Context & Assets */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 space-y-6">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <FlaskConical size={14} /> Phase 1: Context Calibration
                    <InfoButton onClick={() => setHelp({
                        title: "Context Calibration",
                        content: "The context sets the scene for the persona. For instance, 'You are frustrated by your current internet speed and looking for alternatives.' This framed experience is critical for accurate behavioral response simulation."
                    })} />
                </label>
                <textarea 
                    value={context} 
                    onChange={(e) => setContext(e.target.value)} 
                    placeholder="Set the scenario (e.g. 'You are scrolling your mobile feed at night...')" 
                    className="w-full h-24 bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 outline-none resize-none font-mono placeholder:text-zinc-800"
                />
                <div className="flex items-center justify-between text-[10px] text-zinc-600 font-bold uppercase">
                    <span className="flex items-center gap-2">
                        <Target size={12} /> Study Type
                        <InfoButton onClick={() => setHelp({
                            title: "Study Types",
                            content: "Choosing a study type tells the AI how to weigh different factors. For example, 'Pricing' focus increases the importance of mental accounting and loss aversion."
                        })} />
                    </span>
                    <select 
                        value={studyType} 
                        onChange={(e) => setStudyType(e.target.value as StudyType)}
                        className="bg-transparent border-none outline-none text-indigo-400 cursor-pointer"
                    >
                        {Object.values(StudyType).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                </div>
            </div>

            {/* Questionnaire Builder */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <ListTodo size={14} /> Phase 2: Instrument Design
                        <InfoButton onClick={() => setHelp({
                            title: "Questionnaire Design",
                            content: "Research instruments (questions) are the way you extract data from personas. Different formats like Likert Scales (1-10) or Open Responses capture different facets of human sentiment."
                        })} />
                    </label>
                    <button onClick={addQuestion} className="text-zinc-600 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>

                <div className="space-y-4">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 group relative">
                            <div className="flex justify-between mb-3">
                                <span className="text-[10px] font-mono text-zinc-700 uppercase flex items-center gap-2">
                                    Q{idx + 1} • {q.type.replace('_', ' ')}
                                    <InfoButton onClick={() => setHelp({
                                        title: "Question Type: " + q.type,
                                        content: "Likert scales measure intensity of agreement. Multiple choice measures distinct preferences. Short response measures deep rationalization."
                                    })} />
                                </span>
                                <button onClick={() => removeQuestion(q.id)} className="text-zinc-800 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                            </div>
                            <input 
                                value={q.text} 
                                onChange={(e) => updateQuestion(q.id, e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-xs text-zinc-300 font-medium"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Execution Log */}
        <div className="lg:col-span-7 flex flex-col space-y-8 overflow-hidden">
            <div className="bg-zinc-900/40 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col flex-1 shadow-2xl relative bg-noise">
                <div className="px-8 py-5 bg-zinc-950/50 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                         <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            Isolated Latent Execution Engine
                            <InfoButton onClick={() => setHelp({
                                title: "Isolation Principle",
                                content: "In social sciences, herd behavior is a risk. Our Latent Engine ensures agents are unaware of other participants, ensuring that the aggregate data is an honest sum of individual reflections."
                            })} />
                         </span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                    {results.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-800">
                             <ClipboardList size={64} className="mb-6 opacity-5" />
                             <p className="text-[10px] font-black uppercase tracking-[0.4em]">System Idle • Ready for Deployment</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {results.slice().reverse().map((r, i) => (
                                <div key={i} className="p-8 bg-zinc-950/50 border border-white/5 rounded-[2.5rem] hover:border-indigo-500/20 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Response Ledger</div>
                                            <h4 className="text-lg font-bold text-white tracking-tighter italic">{r.personaName}</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <InfoButton onClick={() => setHelp({
                                                title: "Persona Rationalization",
                                                content: "This result is a distillation of the persona's digital 'thinking budget'. It shows not just the 'what' (answer), but the 'why' based on their psychological profile."
                                            })} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {r.responses.slice(0, 1).map((resp, ri) => (
                                            <div key={ri}>
                                                <p className="text-zinc-400 text-xs italic leading-relaxed">"{resp.answer}"</p>
                                                <div className="mt-4 flex gap-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-zinc-700 font-bold uppercase">Utility</span>
                                                        <span className="text-xs font-mono text-zinc-200">{resp.numericValue || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-zinc-700 font-bold uppercase">Sentiment</span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-tight ${resp.sentiment === 'Positive' ? 'text-emerald-500' : 'text-red-500'}`}>{resp.sentiment}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isRunning && (
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-black/80 backdrop-blur-xl border-t border-indigo-500/20 animate-in slide-in-from-bottom-full duration-500">
                         <div className="flex justify-between text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-[0.3em]">
                            <span>Processing Agent Internal Monologue</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentLab;
