
import React, { useState } from 'react';
import { User } from '../types';
import { signInWithGoogle, signInWithApple, signInWithEmail, enterAsGuest, getActiveConfigStatus } from '../services/firebase';
import { Rat, Loader2, AlertCircle, Mail, Apple, Globe, ExternalLink, Play, FlaskConical, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const configStatus = getActiveConfigStatus();

  const handleAuthError = (err: any) => {
    const message = err.message || '';
    if (message.startsWith('UNAUTHORIZED_DOMAIN|')) {
      setUnauthorizedDomain(message.split('|')[1]);
      setError('Firebase Domain Authorization Required');
    } else {
      setError(message || "Connection failed.");
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError('');
    try {
      const user = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      onLogin(user);
    } catch (err: any) {
       handleAuthError(err);
    } finally {
        setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    const user = enterAsGuest("Researcher", "demo@ratlab.local");
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-zinc-100 font-sans relative overflow-hidden">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none opacity-20"></div>
       
       <div className="w-full max-w-md bg-zinc-900/30 border border-white/5 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in duration-700 relative z-10">
           <div className="mb-10 flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-zinc-950 border border-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-2xl group ring-1 ring-white/10">
                    <Rat className="text-indigo-500 group-hover:scale-110 transition-transform duration-500" size={40} strokeWidth={1.5} />
               </div>
               <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase italic">Rat Lab</h1>
               <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] opacity-80 flex items-center gap-2 justify-center">
                   <ShieldCheck size={12} className="text-indigo-500/50" /> Behavioral Inference Engine
               </p>
           </div>

           <div className="space-y-4">
                {/* Primary Sandbox Access */}
                <button 
                  onClick={handleQuickDemo}
                  className="group relative w-full h-14 bg-white hover:bg-zinc-200 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
                >
                    <Play size={16} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" /> 
                    Launch Local Sandbox
                </button>

                <div className="relative py-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center text-[9px]"><span className="bg-black/40 backdrop-blur px-3 text-zinc-600 font-black uppercase tracking-[0.3em]">Cloud Sync Access</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleSocialLogin('google')} disabled={loading} className="h-12 bg-zinc-900 border border-white/5 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-[11px] hover:bg-zinc-800">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-4 h-4" />
                        Google
                    </button>
                    <button onClick={() => handleSocialLogin('apple')} disabled={loading} className="h-12 bg-zinc-900 border border-white/5 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-[11px] hover:bg-zinc-800">
                        <Apple size={16} fill="currentColor" />
                        Apple
                    </button>
                </div>

                {error && (
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-3 text-red-400 text-[11px] animate-in shake duration-500">
                        <div className="flex items-center gap-3 font-bold uppercase tracking-wider">
                          <AlertCircle size={14} /> <span>{error}</span>
                        </div>
                        {unauthorizedDomain && (
                          <div className="p-3 bg-black/40 rounded-xl border border-red-500/10 text-[9px] text-zinc-500 leading-relaxed font-mono">
                            Domain <span className="text-red-300">{unauthorizedDomain}</span> is not authorized. Whitelist it in Firebase Console &gt; Auth &gt; Settings.
                          </div>
                        )}
                    </div>
                )}
           </div>
           
           <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-zinc-950/50 rounded-full border border-white/5 shadow-inner">
                    <Globe size={12} className={configStatus === 'REAL' ? 'text-emerald-500' : 'text-amber-500'} />
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-black">
                        {configStatus === 'REAL' ? 'Network: RAT-LAB-CLOUD-01' : 'Local Instance Operational'}
                    </span>
                </div>
           </div>
       </div>
    </div>
  );
};

export default Login;
