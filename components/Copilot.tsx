
import React, { useState, useRef, useEffect } from 'react';
import { copilotChat } from '../services/geminiService';
import { X, Send, Sparkles, Loader2, Rat, ExternalLink, Settings, Info } from 'lucide-react';
import { User, AppView, AgentActions, CopilotLength, CopilotTone } from '../types';
import InfoModal, { InfoButton } from './InfoModal';
import { createUserFriendlyError, logError } from '../utils/errorHandling';

interface CopilotProps {
  user: User;
  context: string;
  onNavigate: (view: AppView) => void;
  agentActions: AgentActions;
}

const Copilot: React.FC<CopilotProps> = ({ user, context, onNavigate, agentActions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefLength, setPrefLength] = useState<CopilotLength>(CopilotLength.DEFAULT);
  const [prefTone, setPrefTone] = useState<CopilotTone>(CopilotTone.INTELLECTUAL);
  const [help, setHelp] = useState<{ title: string; content: string } | null>(null);

  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([
      { role: 'model', content: `Hello ${user.name}! 👋 I'm your RAT LAB Research Designer.

I can help you:
• **Create cohorts** - Build AI personas for market segments
• **Design experiments** - Set up surveys and behavioral tests  
• **Analyze results** - Get statistical insights and GTM recommendations
• **Run simulations** - Test pricing, messaging, adoption, and more

**Quick Start:**
1. Go to [Cohorts](NAV:PERSONA_BUILDER) to create your first segment
2. Use [Simulations](NAV:EXPERIMENT_LAB) to test with your personas
3. Check [Analysis](NAV:ANALYSIS) for statistical insights

What would you like to do first?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
        const reply = await copilotChat(messages, userMsg, context, prefLength, prefTone);
        
        let finalReply = reply;
        const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/) || reply.match(/```([\s\S]*?)```/);
        
        if (jsonMatch && jsonMatch[1]) {
            try {
                const plan = JSON.parse(jsonMatch[1]);
                if (plan.actions && Array.isArray(plan.actions)) {
                    plan.actions.forEach((action: any) => {
                        switch(action.type) {
                            case 'ADD_SEGMENT':
                                agentActions.addSegment(action.payload.name, action.payload.desc, action.payload.count);
                                break;
                            case 'SET_CONTEXT':
                                agentActions.setContext(action.payload.context);
                                break;
                            case 'SET_TASK_PROMPT':
                                agentActions.setTaskPrompt(action.payload.prompt);
                                break;
                        }
                    });
                    finalReply = `**Executed Plan:** ${plan.title}\n\n${plan.description}\n\n*System updated successfully.*`;
                }
            } catch (e) {
                const err = e instanceof Error ? e : new Error(String(e));
                logError(err, { component: 'Copilot', action: 'agent_plan_execution' });
                finalReply = createUserFriendlyError(err, { component: 'Copilot', action: 'agent_plan_execution' }).message;
            }
        }

        setMessages(prev => [...prev, { role: 'model', content: finalReply || "I couldn't process that." }]);
    } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        const friendly = createUserFriendlyError(err, { component: 'Copilot', action: 'copilot_chat' });
        logError(err, { component: 'Copilot', action: 'copilot_chat' });
        setMessages(prev => [...prev, { role: 'model', content: friendly.message }]);
    } finally {
        setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[.*?\]\(NAV:.*?\))/g);
    return parts.map((part, index) => {
        const linkMatch = part.match(/\[(.*?)\]\(NAV:(.*?)\)/);
        if (linkMatch) {
            const [_, label, view] = linkMatch;
            return (
                <button 
                    key={index}
                    onClick={() => onNavigate(view as AppView)}
                    className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 rounded text-indigo-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                    {label} <ExternalLink size={10} />
                </button>
            );
        }
        return <span key={index}>{parseFormatting(part)}</span>;
    });
  };

  const parseFormatting = (text: string) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
            return <strong key={bIdx} className="font-bold text-white">{bPart.slice(2, -2)}</strong>;
        }
        const italicParts = bPart.split(/(\*.*?\*)/g);
        return italicParts.map((iPart, iIdx) => {
             if (iPart.startsWith('*') && iPart.endsWith('*') && !iPart.startsWith('**')) {
                 return <em key={`${bIdx}-${iIdx}`} className="italic text-zinc-300">{iPart.slice(1, -1)}</em>;
             }
             return <span key={`${bIdx}-${iIdx}`}>{iPart}</span>;
        });
    });
  };

  if (!isOpen) {
    return (
        <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-white hover:bg-zinc-200 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center text-black transition-all z-50 hover:scale-105"
            title="Open Research Copilot"
        >
            <Sparkles size={24} />
        </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[650px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/80 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 font-sans">
        <InfoModal 
            isOpen={!!help} 
            onClose={() => setHelp(null)} 
            title={help?.title || ""} 
            content={help?.content || ""} 
        />

        {/* Header */}
        <div className="p-5 bg-zinc-950/50 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-lg flex items-center justify-center">
                    <Rat className="text-indigo-500" size={16} />
                </div>
                <div>
                    <div className="font-bold text-zinc-100 text-sm tracking-wide">RAT LAB Core</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Online
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className={`p-2 rounded-full transition-all ${showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}
                >
                    <Settings size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 p-2 rounded-full hover:bg-zinc-800">
                    <X size={16} />
                </button>
            </div>
        </div>

        {/* Settings Overlay */}
        {showSettings && (
          <div className="bg-zinc-950/90 border-b border-white/5 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        Response Length
                        <InfoButton onClick={() => setHelp({
                            title: "Response Length",
                            content: "Set the amount of detail provided in responses. 'Long' mode is useful for generating thorough research plans, while 'Short' is better for quick technical questions."
                        })} />
                      </span>
                  </div>
                  <div className="flex gap-2">
                      {Object.values(CopilotLength).map(l => (
                          <button 
                              key={l}
                              onClick={() => setPrefLength(l)}
                              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${prefLength === l ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300'}`}
                          >
                              {l}
                          </button>
                      ))}
                  </div>
              </div>
              <div>
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        Persona Tone
                        <InfoButton onClick={() => setHelp({
                            title: "Persona Tone",
                            content: "Toggle the personality of the AI. 'Detective' focuses on finding hidden patterns and 'clues' in behavioral data. 'Intellectual' uses formal academic and statistical terminology."
                        })} />
                      </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {Object.values(CopilotTone).map(t => (
                          <button 
                              key={t}
                              onClick={() => setPrefTone(t)}
                              className={`flex-1 min-w-[100px] py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${prefTone === t ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300'}`}
                          >
                              {t.replace('_', ' ')}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 bg-transparent custom-scrollbar">
            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                        m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-zinc-900 border border-white/5 text-zinc-300 rounded-tl-sm'
                    }`}>
                        {renderMessageContent(m.content)}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-zinc-900 rounded-2xl p-3 px-4 rounded-tl-sm border border-white/5 flex items-center gap-2 text-xs text-zinc-500">
                        <Loader2 className="animate-spin" size={14} /> Processing request...
                    </div>
                </div>
            )}
        </div>

        {/* Input */}
        <div className="p-4 bg-zinc-950/50 border-t border-white/5 flex gap-2 relative">
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about cohorts, experiments, analysis..."
                className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-700"
            />
            <button 
                onClick={handleSend}
                disabled={loading}
                className="p-3 bg-white hover:bg-zinc-200 rounded-xl text-black disabled:opacity-50 transition-colors shadow-lg active:scale-95"
            >
                <Send size={18} />
            </button>
        </div>
    </div>
  );
};

export default Copilot;
