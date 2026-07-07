import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Rat, X, ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import { SimulationResult, PersonaSegment, DocRatResponse } from '../types';
import { analyzeWithDocRat, getQuickAnalysisSuggestions } from '../services/docRatAnalysisService';
import { createUserFriendlyError, logError } from '../utils/errorHandling';
import FormulaRenderer from './FormulaRenderer';
import AnalysisGraph from './AnalysisGraph';

interface DocRatWorkspaceProps {
  results: SimulationResult[];
  segments: PersonaSegment[];
  personas?: any[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: DocRatResponse;
}

const DocRatWorkspace: React.FC<DocRatWorkspaceProps> = ({ results, segments, personas = [] }) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cac46868-3528-4ec7-b5cb-b47b9242b431',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocRatWorkspace.tsx:22',message:'Component mounted',data:{resultsCount:results.length,segmentsCount:segments.length,personasCount:personas.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm **Doc Rat**, your statistical analysis assistant. 🐭

I can help you analyze your persona simulation data by:
- Performing statistical tests (t-tests, ANOVA, regression, correlation)
- Calculating descriptive statistics with formulas
- Generating visualizations (bar charts, scatter plots, heatmaps)
- Analyzing both individual persona datasets and aggregated data

**Try asking me:**
- "What's the average response score for each segment?"
- "Perform a correlation analysis between risk aversion and purchase intent"
- "Show me a regression analysis of price sensitivity vs conversion"
- "Calculate the p-value for differences between segments"

What would you like to analyze?`,
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<'individual' | 'aggregated' | 'both'>('both');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestions = getQuickAnalysisSuggestions(results, segments);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cac46868-3528-4ec7-b5cb-b47b9242b431',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocRatWorkspace.tsx:57',message:'handleSend called',data:{input:input.trim(),loading,analysisType,resultsCount:results.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!input.trim() || loading) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/cac46868-3528-4ec7-b5cb-b47b9242b431',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocRatWorkspace.tsx:72',message:'Calling analyzeWithDocRat',data:{query:input,resultsCount:results.length,segmentsCount:segments.length,analysisType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const response = await analyzeWithDocRat(
        input,
        results,
        segments,
        personas,
        analysisType
      );
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/cac46868-3528-4ec7-b5cb-b47b9242b431',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocRatWorkspace.tsx:82',message:'analyzeWithDocRat response received',data:{hasAnalysis:!!response.analysis,formulasCount:response.formulas?.length||0,graphsCount:response.graphs?.length||0,testsCount:response.statisticalTests?.length||0,insightsCount:response.insights?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.analysis,
        timestamp: new Date(),
        response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/cac46868-3528-4ec7-b5cb-b47b9242b431',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocRatWorkspace.tsx:95',message:'Error in handleSend',data:{errorMessage:error.message,errorStack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const e = error instanceof Error ? error : new Error(String(error));
      const friendly = createUserFriendlyError(e, { component: 'DocRatWorkspace', action: 'handleSend' });
      logError(e, { component: 'DocRatWorkspace', action: 'handleSend' });
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: friendly.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  return (
    <div className="flex flex-col bg-zinc-900/30 border border-white/5 rounded-[3rem] overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-950/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center">
            <Rat className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Doc Rat Analytics</h2>
            <p className="text-xs text-zinc-500">AI-Powered Statistical Analysis</p>
          </div>
        </div>
        
        {/* Analysis Type Selector */}
        <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 rounded-xl p-1">
          <button
            onClick={() => setAnalysisType('individual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              analysisType === 'individual'
                ? 'bg-indigo-500 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setAnalysisType('aggregated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              analysisType === 'aggregated'
                ? 'bg-indigo-500 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Aggregated
          </button>
          <button
            onClick={() => setAnalysisType('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              analysisType === 'both'
                ? 'bg-indigo-500 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Both
          </button>
        </div>
      </div>
      
      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-2/5 border-r border-white/5 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Rat className="text-indigo-400" size={16} />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] rounded-xl p-4 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-950/60 border border-white/5 text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-50 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-zinc-800 border border-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-zinc-400">U</span>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center">
                  <Rat className="text-indigo-400" size={16} />
                </div>
                <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-4">
                  <Loader2 className="text-indigo-400 animate-spin" size={20} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Suggestions */}
          {suggestions.length > 0 && messages.length === 1 && (
            <div className="p-4 border-t border-white/5 bg-zinc-950/30">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quick Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-lg text-xs text-zinc-400 hover:text-white transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Input */}
          <div className="p-4 border-t border-white/5 bg-zinc-950/50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask Doc Rat to analyze your data..."
                className="flex-1 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Analysis Slate */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.filter(m => m.response).length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Rat className="text-zinc-600 mx-auto mb-4" size={48} />
                <p className="text-zinc-500 text-sm">Ask Doc Rat a question to see analysis results here</p>
              </div>
            </div>
          ) : (
            messages
              .filter(m => m.response)
              .map(message => {
                const response = message.response!;
                return (
                  <div key={message.id} className="space-y-6">
                    {/* Analysis Text */}
                    <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Analysis</h3>
                        <button
                          onClick={() => copyToClipboard(response.analysis)}
                          className="p-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-lg transition-all"
                        >
                          <Copy size={16} className="text-zinc-400" />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {response.analysis}
                      </p>
                    </div>
                    
                    {/* Formulas */}
                    {response.formulas && response.formulas.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleSection(`formulas-${message.id}`)}
                          className="w-full flex items-center justify-between p-4 bg-zinc-950/60 border border-white/5 rounded-xl hover:border-indigo-500/20 transition-all mb-4"
                        >
                          <h3 className="text-lg font-bold text-white">
                            Formulas ({response.formulas.length})
                          </h3>
                          {expandedSections.has(`formulas-${message.id}`) ? (
                            <ChevronUp className="text-zinc-400" size={20} />
                          ) : (
                            <ChevronDown className="text-zinc-400" size={20} />
                          )}
                        </button>
                        {expandedSections.has(`formulas-${message.id}`) && (
                          <div className="space-y-4">
                            {response.formulas.map(formula => (
                              <FormulaRenderer key={formula.id} formula={formula} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Graphs */}
                    {response.graphs && response.graphs.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleSection(`graphs-${message.id}`)}
                          className="w-full flex items-center justify-between p-4 bg-zinc-950/60 border border-white/5 rounded-xl hover:border-indigo-500/20 transition-all mb-4"
                        >
                          <h3 className="text-lg font-bold text-white">
                            Visualizations ({response.graphs.length})
                          </h3>
                          {expandedSections.has(`graphs-${message.id}`) ? (
                            <ChevronUp className="text-zinc-400" size={20} />
                          ) : (
                            <ChevronDown className="text-zinc-400" size={20} />
                          )}
                        </button>
                        {expandedSections.has(`graphs-${message.id}`) && (
                          <div className="space-y-6">
                            {response.graphs.map((graph, idx) => (
                              <AnalysisGraph key={idx} spec={graph} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Statistical Tests */}
                    {response.statisticalTests && response.statisticalTests.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleSection(`tests-${message.id}`)}
                          className="w-full flex items-center justify-between p-4 bg-zinc-950/60 border border-white/5 rounded-xl hover:border-indigo-500/20 transition-all mb-4"
                        >
                          <h3 className="text-lg font-bold text-white">
                            Statistical Tests ({response.statisticalTests.length})
                          </h3>
                          {expandedSections.has(`tests-${message.id}`) ? (
                            <ChevronUp className="text-zinc-400" size={20} />
                          ) : (
                            <ChevronDown className="text-zinc-400" size={20} />
                          )}
                        </button>
                        {expandedSections.has(`tests-${message.id}`) && (
                          <div className="space-y-4">
                            {response.statisticalTests.map((test, idx) => (
                              <div
                                key={idx}
                                className="bg-zinc-950/60 border border-white/5 rounded-xl p-6"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-base font-bold text-white">{test.name}</h4>
                                  {test.significant && (
                                    <CheckCircle2 className="text-emerald-400" size={20} />
                                  )}
                                </div>
                                <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-4 mb-4">
                                  <p className="text-xs text-zinc-400 font-mono">{test.formula}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs text-zinc-500 mb-1">Result</p>
                                    <p className="text-sm font-bold text-white font-mono">
                                      {test.result.toFixed(4)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-zinc-500 mb-1">p-Value</p>
                                    <p className={`text-sm font-bold font-mono ${
                                      test.pValue < 0.05 ? 'text-emerald-400' : 'text-zinc-400'
                                    }`}>
                                      {test.pValue.toFixed(4)}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-400 italic">{test.interpretation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Insights */}
                    {response.insights && response.insights.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-4">Key Insights</h3>
                        <div className="space-y-3">
                          {response.insights.map((insight, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-4 bg-zinc-950/60 border border-white/5 rounded-xl"
                            >
                              <div className="w-6 h-6 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs text-indigo-400 font-bold">{idx + 1}</span>
                              </div>
                              <p className="text-sm text-zinc-300 flex-1">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};

export default DocRatWorkspace;
