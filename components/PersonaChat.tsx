import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Persona } from '../types';
import { chatWithPersona } from '../services/geminiService';
import { createUserFriendlyError, logError } from '../utils/errorHandling';

interface PersonaChatProps {
  personaId: string;
  persona: Persona;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const PersonaChat: React.FC<PersonaChatProps> = ({ personaId, persona }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create context for the persona
      const personaContext = `
        You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation} from ${persona.location}.
        
        Bio: ${persona.bio}
        Psychographics: ${persona.psychographics}
        Spending Habits: ${persona.spendingHabits}
        
        Behavioral Traits:
        - Risk Aversion: ${persona.traits.riskAversion}/100
        - Loss Aversion: ${persona.traits.lossAversion}/100
        - Price Sensitivity: ${persona.traits.priceSensitivity}/100
        - Cognitive Reflection: ${persona.traits.cognitiveReflection}/100
        - Social Conformity: ${persona.traits.socialConformity}/100
        - Novelty Seeking: ${persona.traits.noveltySeeking}/100
        
        Respond as this persona would, maintaining their personality, tone, and perspective.
      `;

      const response = await chatWithPersona(personaContext, input, messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })));

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const e = error instanceof Error ? error : new Error(String(error));
      const friendly = createUserFriendlyError(e, { component: 'PersonaChat', action: 'chatWithPersona' });
      logError(e, { component: 'PersonaChat', action: 'chatWithPersona' });
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: friendly.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 py-12">
            <Bot className="mx-auto mb-4 text-zinc-600" size={48} />
            <p className="text-sm">Start a conversation with {persona.name}</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="text-indigo-400" size={16} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl p-4 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-white'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-50 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="text-zinc-400" size={16} />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Bot className="text-indigo-400" size={16} />
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder={`Message ${persona.name}...`}
          className="flex-1 px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default PersonaChat;


