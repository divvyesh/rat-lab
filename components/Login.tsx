
import React, { useState } from 'react';
import { User, PlanTier } from '../types';
import { signInWithGoogle, signInWithEmail, getActiveConfigStatus } from '../services/firebase';
import { Rat, Loader2, Mail, Globe, ShieldCheck } from 'lucide-react';
import ErrorDisplay from './ErrorDisplay';

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
  const isFirebaseConfigured = configStatus === 'REAL';

  // Demo mode bypass - create demo user without Firebase
  const handleDemoMode = () => {
    console.log('🎭 Entering demo mode - bypassing Firebase');
    const demoUser: User = {
      id: 'demo-user-' + Date.now(),
      name: 'Demo Researcher',
      email: 'demo@ratlab.com',
      plan: PlanTier.PRO,
      avatar: 'https://ui-avatars.com/api/?name=Demo+Researcher&background=6366f1&color=fff',
      tokens: 1000
    };
    onLogin(demoUser);
  };

  const handleAuthError = (err: any) => {
    const message = err.message || '';
    
    if (message.includes('Firebase Auth is not initialized') || 
        message.includes('Missing configuration') ||
        message.includes('placeholder values')) {
      setError('Firebase Configuration Required');
      const hasPlaceholders = (window as any).__FIREBASE_CONFIG_ERROR__?.hasPlaceholders;
      if (hasPlaceholders) {
        setUnauthorizedDomain('Your .env.local contains placeholder values. Replace them with actual Firebase config from Firebase Console.');
      } else {
        setUnauthorizedDomain('Please add Firebase config to .env.local. See FIREBASE_SETUP_GUIDE.md or run ./setup-firebase.sh');
      }
    } else if (message.startsWith('FIREBASE_CONFIG_MISSING|')) {
      const detail = message.split('|')[1];
      setError('Firebase Configuration Missing');
      setUnauthorizedDomain(detail);
    } else if (message.startsWith('FIREBASE_CONFIG_ERROR|')) {
      const detail = message.split('|')[1];
      setError('Firebase Configuration Error');
      setUnauthorizedDomain(detail);
    } else if (message.startsWith('UNAUTHORIZED_DOMAIN|')) {
      setUnauthorizedDomain(message.split('|')[1]);
      setError('Firebase Domain Authorization Required');
    } else {
      setError(message || "Connection failed.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      console.log("Login button clicked, starting Google sign-in");
      const user = await signInWithGoogle();
      console.log("Sign-in successful, calling onLogin", { id: user.id, name: user.name });
      onLogin(user);
    } catch (err: any) {
      console.error("Login error", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
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
                <button 
                  onClick={handleGoogleLogin} 
                  disabled={loading} 
                  className="w-full h-14 bg-zinc-900 border border-white/5 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                            Continue with Google
                        </>
                    )}
                </button>

                <div className="relative py-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center text-[9px]"><span className="bg-black/40 backdrop-blur px-3 text-zinc-600 font-black uppercase tracking-[0.3em]">Or use email</span></div>
                </div>

                {showEmailForm ? (
                    <div className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full h-12 bg-zinc-950 border border-white/10 rounded-xl px-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full h-12 bg-zinc-950 border border-white/10 rounded-xl px-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    setError('');
                                    try {
                                        const user = await signInWithEmail(email, password, isSignUp);
                                        onLogin(user);
                                    } catch (err: any) {
                                        handleAuthError(err);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading || !email || !password}
                                className="flex-1 h-12 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSignUp ? 'Sign Up' : 'Sign In'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowEmailForm(false);
                                    setEmail('');
                                    setPassword('');
                                }}
                                className="px-4 h-12 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowEmailForm(true)}
                        className="w-full h-12 bg-zinc-900 border border-white/5 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm hover:bg-zinc-800"
                    >
                        <Mail size={16} />
                        Continue with Email
                    </button>
                )}

                {error && (
                    <ErrorDisplay
                      message={error}
                      title=""
                      variant="banner"
                      dismissible
                      onDismiss={() => { setError(''); setUnauthorizedDomain(null); }}
                      className="text-[11px] animate-in shake duration-500"
                      details={unauthorizedDomain ? (
                        <div className="p-3 bg-black/40 rounded-xl border border-red-500/10 text-[9px] text-zinc-500 leading-relaxed font-mono mt-2">
                          {error.includes('Configuration') ? (
                            <>
                              <div className="mb-2 text-red-300 font-bold">Setup Required:</div>
                              <div className="mb-1">1. Go to Firebase Console: <span className="text-indigo-400">https://console.firebase.google.com</span></div>
                              <div className="mb-1">2. Create/select a project</div>
                              <div className="mb-1">3. Enable Authentication → Google sign-in</div>
                              <div className="mb-1">4. Get your config from Project Settings → General</div>
                              <div className="mb-1">5. Update <span className="text-yellow-400">.env.local</span> with your Firebase values</div>
                              <div className="mt-2 text-zinc-400">{unauthorizedDomain}</div>
                            </>
                          ) : (
                            <>
                              Domain <span className="text-red-300">{unauthorizedDomain}</span> is not authorized. Whitelist it in Firebase Console &gt; Auth &gt; Settings.
                            </>
                          )}
                        </div>
                      ) : undefined}
                    />
                )}
           </div>

           {/* Demo Mode Button - Show when Firebase not configured */}
           {!isFirebaseConfigured && (
             <div className="mt-6 pt-6 border-t border-white/5">
               <button
                 onClick={handleDemoMode}
                 disabled={loading}
                 className="w-full h-12 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ShieldCheck size={16} />
                 Try Demo Mode (No Firebase Required)
               </button>
               <p className="text-[9px] text-zinc-600 text-center mt-2">
                 Demo mode lets you explore the app without Firebase setup. Data won't persist.
               </p>
             </div>
           )}
           
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
