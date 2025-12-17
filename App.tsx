
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PersonaBuilder from './components/PersonaBuilder';
import ExperimentLab from './components/ExperimentLab';
import AnalysisDashboard from './components/AnalysisDashboard';
import AssetsManager from './components/AssetsManager';
import Login from './components/Login';
import Copilot from './components/Copilot';
import { AppView, Persona, SimulationResult, PersonaSegment, User, Asset, AgentActions, PlanTier } from './types';
import { loadUserData, saveUserData, auth, logoutUser } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Global State
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [segments, setSegments] = useState<PersonaSegment[]>([]);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactionalData, setTransactionalData] = useState<string>('');
  
  // Experiment Context State
  const [experimentContext, setExperimentContext] = useState('');
  const [experimentPrompt, setExperimentPrompt] = useState('');

  // 1. Session Restoration on Mount
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    
    if (auth) {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const restoredUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Researcher',
                    email: firebaseUser.email || '',
                    plan: PlanTier.PRO,
                    avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}&background=6366f1&color=fff`,
                    tokens: 1000
                };
                await hydrateUser(restoredUser);
            } else {
                // Check for Guest
                const localGuest = localStorage.getItem('labrat_guest_user');
                if (localGuest) {
                    hydrateUser(JSON.parse(localGuest));
                } else {
                    setIsRestoringSession(false);
                    setIsHydrated(true); // Nothing to hydrate, we are fresh
                }
            }
        });
    }

    const timeout = setTimeout(() => {
        if (!user && isRestoringSession) {
            setIsRestoringSession(false);
            setIsHydrated(true);
        }
    }, 3000);

    return () => {
        unsubscribe();
        clearTimeout(timeout);
    };
  }, []);

  const hydrateUser = async (u: User) => {
      setUser(u);
      try {
          const data = await loadUserData(u.id);
          if (data) {
              setPersonas(data.personas || []);
              setSegments(data.segments || []);
              setResults(data.results || []);
              setAssets(data.assets || []);
              setTransactionalData(data.transactionalData || '');
          }
      } catch (e) {
          console.error("Hydration failed", e);
      } finally {
          setIsHydrated(true);
          setIsRestoringSession(false);
          setCurrentView(AppView.DASHBOARD);
      }
  };

  // 2. Atomic Save Function
  const triggerManualSave = useCallback(() => {
    if (!user || !isHydrated) return;
    saveUserData(user.id, {
        personas,
        segments,
        results,
        assets,
        transactionalData
    });
  }, [user, isHydrated, personas, segments, results, assets, transactionalData]);

  // 3. Auto-Save Logic (Debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // CRITICAL: Never save until hydration is confirmed. This prevents overwriting cloud data with empty local state.
    if (!user || !isHydrated) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
        triggerManualSave();
    }, 2000);

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [user, isHydrated, personas, segments, results, assets, transactionalData, triggerManualSave]);

  const handleLogin = (loggedInUser: User) => {
      hydrateUser(loggedInUser);
  };

  const handleLogout = () => {
      logoutUser();
      setUser(undefined);
      setCurrentView(AppView.LOGIN);
      setPersonas([]);
      setSegments([]);
      setResults([]);
      setAssets([]);
      setIsHydrated(false);
  };

  const agentActions: AgentActions = {
    addSegment: (name, desc, count) => {
        const newSeg: PersonaSegment = {
            id: crypto.randomUUID(),
            name,
            description: desc,
            count,
            color: '#6366f1',
            grounding: { useSearch: true, useMaps: false, locationStr: 'Boston, MA' },
            traits: {
                riskAversion: 50,
                lossAversion: 50,
                priceSensitivity: 50,
                cognitiveReflection: 50,
                socialConformity: 50,
                noveltySeeking: 50
            },
            heuristics: { availability: 50, anchoring: 50, socialProof: 50, scarcity: 50 },
            isExpanded: true
        };
        setSegments(prev => [...prev, newSeg]);
        setCurrentView(AppView.PERSONA_BUILDER);
    },
    setContext: (ctx) => {
        setExperimentContext(ctx);
        setCurrentView(AppView.EXPERIMENT_LAB);
    },
    setTaskPrompt: (prompt) => {
        setExperimentPrompt(prompt);
        setCurrentView(AppView.EXPERIMENT_LAB);
    },
    addResult: (result) => {
        setResults(prev => [...prev, result]);
    }
  };

  const renderContent = () => {
    if (!user) return <Login onLogin={handleLogin} />;

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard personas={personas} results={results} onChangeView={setCurrentView} />;
      case AppView.PERSONA_BUILDER:
        return (
          <PersonaBuilder 
            personas={personas} setPersonas={setPersonas}
            segments={segments} setSegments={setSegments}
            user={user} transactionalData={transactionalData} setTransactionalData={setTransactionalData}
          />
        );
      case AppView.ASSETS:
        return <AssetsManager assets={assets} setAssets={setAssets} user={user} />;
      case AppView.EXPERIMENT_LAB:
        return (
          <ExperimentLab 
            personas={personas} segments={segments} results={results} setResults={setResults}
            onNavigateToAnalysis={() => setCurrentView(AppView.ANALYSIS)}
            assets={assets} user={user} context={experimentContext} setContext={setExperimentContext}
            taskPrompt={experimentPrompt} setTaskPrompt={setExperimentPrompt}
          />
        );
      case AppView.ANALYSIS:
        return <AnalysisDashboard results={results} segments={segments} context={experimentContext} user={user} />;
      default:
        return <Dashboard personas={personas} results={results} onChangeView={setCurrentView} />;
    }
  };

  if (isRestoringSession) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500 gap-4">
              <div className="w-16 h-16 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center animate-pulse">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.3em] opacity-50">Initializing System Core...</div>
          </div>
      );
  }

  return (
    <>
      {currentView === AppView.LOGIN ? (
         <Login onLogin={handleLogin} />
      ) : (
        <Layout currentView={currentView} onChangeView={setCurrentView} user={user} onLogout={handleLogout}>
          {renderContent()}
          {user && (
            <Copilot 
                user={user} 
                context={`View: ${currentView}. Personas: ${personas.length}. Results: ${results.length}`}
                onNavigate={setCurrentView}
                agentActions={agentActions}
            />
          )}
        </Layout>
      )}
    </>
  );
};

export default App;
