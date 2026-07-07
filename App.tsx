
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import PersonaBuilder from './components/PersonaBuilder';
import Societies from './components/Societies';
import ExperimentLab from './components/ExperimentLab';
import AnalysisDashboard from './components/AnalysisDashboard';
import AssetsManager from './components/AssetsManager';
import Login from './components/Login';
import Copilot from './components/Copilot';
import QuickActions from './components/QuickActions';
import ProductTour from './components/ProductTour';
import APIPlayground from './components/APIPlayground';
import ShortcutsModal from './components/ShortcutsModal';
import { AppView, Persona, SimulationResult, PersonaSegment, User, Asset, AgentActions, PlanTier, SavedSimulation, Question, QuestionType, Society, PersonalSociety, TargetSociety } from './types';
import { loadUserData, saveUserData, auth, logoutUser } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useKeyboardShortcuts, createAppShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Global State
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [segments, setSegments] = useState<PersonaSegment[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [personalSocieties, setPersonalSocieties] = useState<PersonalSociety[]>([]);
  const [targetSocieties, setTargetSocieties] = useState<TargetSociety[]>([]);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactionalData, setTransactionalData] = useState<string>('');
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', type: QuestionType.SHORT_ANSWER, text: 'How much do you trust this product claim?', order: 1 },
    { id: 'q2', type: QuestionType.PARAGRAPH, text: 'What is your single biggest concern when looking at this?', order: 2 }
  ]);
  
  // Experiment Context State
  const [experimentContext, setExperimentContext] = useState('');
  const [experimentPrompt, setExperimentPrompt] = useState('');
  
  // UI State
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProductTour, setShowProductTour] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  // Token usage tracking
  useEffect(() => {
    const handleTokenUsage = (event: CustomEvent) => {
      const usage = event.detail as { total_tokens: number };
      if (user && usage.total_tokens) {
        // Deduct tokens from user balance
        setUser(prev => {
          if (!prev) return prev;
          const newTokens = Math.max(0, (prev.tokens || 1000) - usage.total_tokens);
          console.log(`💰 Token usage: ${usage.total_tokens} tokens used. Balance: ${newTokens}`);
          return { ...prev, tokens: newTokens };
        });
      }
    };
    
    window.addEventListener('openai-token-usage', handleTokenUsage as EventListener);
    return () => {
      window.removeEventListener('openai-token-usage', handleTokenUsage as EventListener);
    };
  }, [user]);
  
  // Note: Token count is saved automatically via the existing auto-save mechanism
  // when user state changes, since tokens are part of the user object

  // URL Routing: Map AppView to URL paths
  const viewToPath = (view: AppView): string => {
    const pathMap: Record<AppView, string> = {
      [AppView.LOGIN]: '/login',
      [AppView.DASHBOARD]: '/',
      [AppView.PERSONA_BUILDER]: '/cohorts',
      [AppView.SOCIETIES]: '/societies',
      [AppView.EXPERIMENT_LAB]: '/simulations',
      [AppView.ANALYSIS]: '/analysis',
      [AppView.ASSETS]: '/assets',
      [AppView.API_PLAYGROUND]: '/api',
    };
    return pathMap[view] || '/';
  };

  const pathToView = (path: string): AppView => {
    const pathMap: Record<string, AppView> = {
      '/login': AppView.LOGIN,
      '/': AppView.DASHBOARD,
      '/cohorts': AppView.PERSONA_BUILDER,
      '/societies': AppView.SOCIETIES,
      '/simulations': AppView.EXPERIMENT_LAB,
      '/analysis': AppView.ANALYSIS,
      '/assets': AppView.ASSETS,
      '/api': AppView.API_PLAYGROUND,
    };
    // Remove query params and hash for matching
    const cleanPath = path.split('?')[0].split('#')[0];
    return pathMap[cleanPath] || AppView.DASHBOARD;
  };

  // Sync URL with currentView (for deep linking and browser history)
  useEffect(() => {
    if (!user || currentView === AppView.LOGIN) return;
    
    const path = viewToPath(currentView);
    const currentPath = window.location.pathname;
    
    // Only update URL if it's different to avoid unnecessary history entries
    if (currentPath !== path) {
      window.history.pushState({ view: currentView }, '', path);
      console.log(`🔗 URL updated to: ${path}`);
    }
  }, [currentView, user]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (!user) return;
    
    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname;
      const view = pathToView(path);
      
      // Use functional update to avoid dependency on currentView
      setCurrentView(prevView => {
        if (view !== prevView) {
          console.log(`🔙 Browser navigation: ${path} -> ${view}`);
          return view;
        }
        return prevView;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Handle initial URL on mount (deep linking)
  useEffect(() => {
    if (!isHydrated || !user) return;
    
    const path = window.location.pathname;
    const view = pathToView(path);
    
    // Only set view if it's different from current and not login (to avoid overriding demo mode)
    setCurrentView(prevView => {
      if (view !== prevView && view !== AppView.LOGIN) {
        console.log(`🔗 Deep link detected: ${path} -> ${view}`);
        return view;
      }
      return prevView;
    });
  }, [isHydrated, user]);

  // Demo mode: Check for demo URL parameter to bypass login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true' && !user && isHydrated) {
      console.log('🎭 Demo mode activated');
      const demoUser: User = {
        id: 'demo-user-' + Date.now(),
        name: 'Demo Researcher',
        email: 'demo@ratlab.com',
        plan: PlanTier.PRO,
        avatar: 'https://ui-avatars.com/api/?name=Demo+Researcher&background=6366f1&color=fff',
        tokens: 1000
      };
      setUser(demoUser);
      setCurrentView(AppView.DASHBOARD);
      setIsRestoringSession(false);
    }
  }, [user, isHydrated]);

  // Keyboard Shortcuts
  const shortcuts = createAppShortcuts(
    setCurrentView,
    () => {
      // Save action - can be implemented later
      console.log('Save triggered');
    },
    () => {
      // New action - open QuickActions
      setShowQuickActions(true);
    }
  );

  // Add Ctrl+K shortcut for QuickActions
  shortcuts.push({
    key: 'k',
    ctrlKey: true,
    action: () => setShowQuickActions(true),
    description: 'Open Quick Actions'
  });

  useKeyboardShortcuts(shortcuts, !!user && currentView !== AppView.LOGIN);

  // 1. Session Restoration on Mount
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    let isMounted = true;
    let hasUser = false;
    
    if (auth) {
        console.log("Setting up auth state listener");
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("Auth state changed", { user: firebaseUser ? firebaseUser.uid : 'none' });
            
            // Only hydrate if we don't already have a user (to prevent double hydration)
            if (firebaseUser && !hasUser) {
                hasUser = true;
                // Load user data first to get saved token count
                const savedData = await loadUserData(firebaseUser.uid);
                const savedTokens = savedData?.tokens !== undefined ? savedData.tokens : 1000;
                
                // Generate avatar URL properly
                let avatarUrl = firebaseUser.photoURL;
                if (!avatarUrl || avatarUrl === '') {
                    const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
                    avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=128&bold=true`;
                }
                
                const restoredUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Researcher',
                    email: firebaseUser.email || '',
                    plan: PlanTier.PRO,
                    avatar: avatarUrl,
                    tokens: savedTokens
                };
                
                console.log("👤 Restored user avatar:", {
                    photoURL: firebaseUser.photoURL,
                    avatar: avatarUrl,
                    name: restoredUser.name
                });
                if (isMounted) {
                    await hydrateUser(restoredUser);
                }
            } else if (!firebaseUser) {
                hasUser = false;
                console.log("No user authenticated");
                if (isMounted) {
                    setIsRestoringSession(false);
                    setIsHydrated(true);
                }
            }
        });
    } else {
        console.warn("Auth not initialized");
        setIsRestoringSession(false);
        setIsHydrated(true);
    }

    const timeout = setTimeout(() => {
        if (!hasUser && isRestoringSession && isMounted) {
            console.log("Session restoration timeout");
            setIsRestoringSession(false);
            setIsHydrated(true);
        }
    }, 3000);

    return () => {
        isMounted = false;
        unsubscribe();
        clearTimeout(timeout);
    };
  }, []);

  const hydrateUser = async (u: User) => {
      console.log("🔄 Hydrating user", { id: u.id, name: u.name, email: u.email, tokens: u.tokens });
      setUser(u);
      setCurrentView(AppView.DASHBOARD); // Set view immediately so user sees dashboard
      try {
          const data = await loadUserData(u.id);
          if (data) {
              console.log("✅ Setting user data from Firestore", { 
                personas: data.personas?.length || 0, 
                segments: data.segments?.length || 0,
                results: data.results?.length || 0,
                assets: data.assets?.length || 0,
                tokens: data.tokens || u.tokens
              });
              
              // Update user tokens if saved in Firestore
              if (data.tokens !== undefined && data.tokens !== u.tokens) {
                setUser(prev => prev ? { ...prev, tokens: data.tokens! } : prev);
              }
              setPersonas(data.personas || []);
              setSegments(data.segments || []);
              setSocieties(data.societies || []);
              setPersonalSocieties(data.personalSocieties || []);
              setTargetSocieties(data.targetSocieties || []);
              setResults(data.results || []);
              setAssets(data.assets || []);
              setTransactionalData(data.transactionalData || '');
              setSavedSimulations(data.savedSimulations || []);
              if (data.questions && data.questions.length > 0) {
                setQuestions(data.questions);
              }
          } else {
              console.log("ℹ️ No existing data in Firestore, starting with empty state");
              // Create initial user document in Firestore
              console.log("💾 Creating initial user document in Firestore");
              await saveUserData(u.id, {
                  personas: [],
                  segments: [],
                  societies: [],
                  personalSocieties: [],
                  targetSocieties: [],
                  results: [],
                  assets: [],
                  transactionalData: '',
                  savedSimulations: [],
                  questions: [
                    { id: 'q1', type: QuestionType.SHORT_ANSWER, text: 'How much do you trust this product claim?', order: 1 },
                    { id: 'q2', type: QuestionType.PARAGRAPH, text: 'What is your single biggest concern when looking at this?', order: 2 }
                  ]
              });
          }
      } catch (e: any) {
          console.error("❌ Hydration failed", e);
          console.error("Error details:", {
              code: e.code,
              message: e.message,
              userId: u.id
          });
          // Continue even if hydration fails - user can still use the app
      } finally {
          console.log("✅ Hydration complete, user ready", { userId: u.id });
          setIsHydrated(true);
          setIsRestoringSession(false);
      }
  };

  // 2. Atomic Save Function
  const triggerManualSave = useCallback(() => {
    if (!user || !isHydrated) {
      console.log("⏸️ Save skipped", { hasUser: !!user, isHydrated });
      return;
    }
    console.log("💾 Triggering manual save", { userId: user.id, tokens: user.tokens, questionsCount: questions.length });
    saveUserData(user.id, {
        personas,
        segments,
        societies,
        personalSocieties,
        targetSocieties,
        results,
        assets,
        transactionalData,
        tokens: user.tokens,
        savedSimulations,
        questions
    });
  }, [user, isHydrated, personas, segments, societies, personalSocieties, targetSocieties, results, assets, transactionalData, questions]);

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
  }, [user, isHydrated, personas, segments, societies, personalSocieties, targetSocieties, results, assets, transactionalData, questions, triggerManualSave]);

  const handleLogin = async (loggedInUser: User) => {
      console.log("🔐 handleLogin called", { id: loggedInUser.id, name: loggedInUser.name });
      // Immediately update user state and view to show dashboard
      setUser(loggedInUser);
      setIsRestoringSession(false);
      // Hydrate user data (this will also set the view to DASHBOARD)
      await hydrateUser(loggedInUser);
  };

  const handleLogout = () => {
      logoutUser();
      setUser(undefined);
      setCurrentView(AppView.LOGIN);
      setPersonas([]);
      setSegments([]);
      setSocieties([]);
      setPersonalSocieties([]);
      setTargetSocieties([]);
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
    // Don't check user here - let the main render logic handle it
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard personas={personas} results={results} onChangeView={setCurrentView} savedSimulations={savedSimulations} />;
      case AppView.PERSONA_BUILDER:
        return (
          <PersonaBuilder 
            personas={personas} setPersonas={setPersonas}
            segments={segments} setSegments={setSegments}
            user={user} transactionalData={transactionalData} setTransactionalData={setTransactionalData}
            onOpenConversationLab={undefined}
          />
        );
      case AppView.SOCIETIES:
        return (
          <Societies 
            personas={personas}
            segments={segments}
            societies={societies}
            setSocieties={setSocieties}
            personalSocieties={personalSocieties}
            setPersonalSocieties={setPersonalSocieties}
            targetSocieties={targetSocieties}
            setTargetSocieties={setTargetSocieties}
            onChangeView={setCurrentView}
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
            savedSimulations={savedSimulations}
            setSavedSimulations={setSavedSimulations}
            questions={questions}
            setQuestions={setQuestions}
          />
        );
      case AppView.ANALYSIS:
        return <AnalysisDashboard results={results} segments={segments} context={experimentContext} user={user} personas={personas} />;
      case AppView.API_PLAYGROUND:
        return <APIPlayground user={user} />;
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

  // Show login if no user OR if explicitly on login view
  if (!user || currentView === AppView.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout currentView={currentView} onChangeView={setCurrentView} user={user} onLogout={handleLogout}>
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
        <Copilot 
            user={user} 
            context={`View: ${currentView}. Personas: ${personas.length}. Results: ${results.length}`}
            onNavigate={setCurrentView}
            agentActions={agentActions}
        />
      </Layout>
      
      {/* Quick Actions Modal */}
      <QuickActions
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        onNavigate={setCurrentView}
        onCreateCohort={() => {
          setCurrentView(AppView.PERSONA_BUILDER);
        }}
        onCreateSimulation={() => {
          setCurrentView(AppView.EXPERIMENT_LAB);
        }}
      />
      
      {/* Product Tour */}
      <ProductTour
        isOpen={showProductTour}
        onClose={() => setShowProductTour(false)}
        onNavigate={setCurrentView}
      />
      
      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </>
  );
};

export default App;
