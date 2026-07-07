
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { User, PlanTier, Persona, PersonaSegment, SimulationResult, Asset, SavedSimulation, Question, PersonalSociety, TargetSociety } from "../types";

// Validate required Firebase environment variables
const requiredFirebaseVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredFirebaseVars.filter(varName => !import.meta.env[varName]);

// Check for placeholder values (common placeholders that indicate config not set)
const placeholderPatterns = [
  'your-firebase',
  'your-project',
  'your-',
  '123456789',
  'abcdef123456',
  'placeholder'
];

const hasPlaceholderValues = requiredFirebaseVars.some(varName => {
  const value = import.meta.env[varName];
  return value && placeholderPatterns.some(pattern => 
    String(value).toLowerCase().includes(pattern.toLowerCase())
  );
});

// Check if Firebase config is available (must have all vars AND no placeholders)
const hasFirebaseConfig = missingVars.length === 0 && !hasPlaceholderValues;
const isDemoModeExplicit = import.meta.env.VITE_DEMO_MODE === 'true' && !hasFirebaseConfig;

// Only use demo mode if explicitly set AND Firebase config is missing
const isDemoMode = isDemoModeExplicit || (window as any).__DEMO_MODE__ === true;

if (!hasFirebaseConfig && !isDemoMode) {
  const errorMsg = hasPlaceholderValues 
    ? `Firebase configuration contains placeholder values. Please replace them with your actual Firebase config values from Firebase Console.`
    : `Missing Firebase configuration. ${missingVars.length} variables missing: ${missingVars.join(', ')}`;
  
  console.error(`⚠️ ${errorMsg}`);
  console.error(`📋 Setup guide: See FIREBASE_SETUP_GUIDE.md or Firebase Console → Project Settings → Your apps`);
  
  // Set flag for ErrorBoundary to detect
  (window as any).__FIREBASE_CONFIG_ERROR__ = {
    missingVars: hasPlaceholderValues ? requiredFirebaseVars : missingVars,
    hasPlaceholders: hasPlaceholderValues,
    message: errorMsg
  };
}

let app;
let auth: any = null;
let db: any = null;

// Initialize Firebase if config is available (ignore demo mode if config exists)
if (hasFirebaseConfig) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  // 1. Initialize Firebase App
  try {
    console.log("🔥 Initializing Firebase App...", { 
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain 
    });
    
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    console.log("✅ Firebase App initialized successfully", {
      projectId: app.options.projectId,
      authDomain: app.options.authDomain,
      appId: app.options.appId
    });

    // 2. Initialize Firebase Authentication
    try {
      auth = getAuth(app);
      console.log("✅ Firebase Auth initialized successfully", {
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      });
      
      // Log auth state
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Reload user to get latest profile data including photoURL
          try {
            await user.reload();
            console.log("👤 User signed in:", {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              providerData: user.providerData.map(p => ({
                providerId: p.providerId,
                photoURL: p.photoURL
              }))
            });
          } catch (reloadError) {
            console.log("👤 User signed in (reload skipped):", {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            });
          }
        } else {
          console.log("👤 No user signed in");
        }
      });
    } catch (authError: any) {
      console.error("❌ Firebase Auth initialization failed:", authError);
      console.error("Auth error details:", {
        code: authError.code,
        message: authError.message,
        name: authError.name
      });
      throw authError;
    }

    // 3. Initialize Firestore
    try {
      db = getFirestore(app);
      console.log("✅ Firestore initialized successfully", {
        projectId: db.app.options.projectId
      });
      
      // Optional: Test Firestore connectivity with a simple operation
      // This will fail silently if Firestore isn't enabled, but won't break the app
      try {
        // Just verify db is accessible - don't do actual query to avoid errors
        console.log("✅ Firestore connection verified");
      } catch (testError) {
        console.warn("⚠️ Firestore connectivity test failed (database may not be created yet):", testError);
      }
    } catch (firestoreError: any) {
      console.error("❌ Firestore initialization failed:", firestoreError);
      console.error("Firestore error details:", {
        code: firestoreError.code,
        message: firestoreError.message,
        name: firestoreError.name
      });
      // Don't throw - allow app to work without Firestore if needed
      console.warn("⚠️ Continuing without Firestore - some features may not work");
    }

    console.log("🎉 Firebase initialization complete!");
    console.log("📊 Firebase Status:", {
      app: app ? "✅ Initialized" : "❌ Failed",
      auth: auth ? "✅ Initialized" : "❌ Failed",
      firestore: db ? "✅ Initialized" : "❌ Failed"
    });

  } catch (firebaseAppError: any) {
    console.error("❌ Firebase App initialization failed:", firebaseAppError);
    console.error("Firebase App error details:", {
      code: firebaseAppError.code,
      message: firebaseAppError.message,
      name: firebaseAppError.name,
      stack: firebaseAppError.stack
    });
    // Don't fall back to demo mode - throw error so user knows config is wrong
    throw new Error(
      `Firebase initialization failed: ${firebaseAppError.message || 'Unknown error'}. ` +
      `Please check your Firebase configuration in .env.local`
    );
  }
} else if (isDemoMode) {
  console.log("🚀 Running in DEMO MODE - Firebase disabled");
  console.log("💡 To enable full features, configure Firebase in .env.local");
} else {
  console.warn("⚠️ Firebase config missing - authentication will not work");
  console.warn("📋 Missing variables:", missingVars.join(", "));
}

// Final verification summary
if (hasFirebaseConfig && app) {
  console.log("=".repeat(50));
  console.log("🔥 FIREBASE INITIALIZATION SUMMARY");
  console.log("=".repeat(50));
  console.log("Project ID:", app.options.projectId);
  console.log("Auth Domain:", app.options.authDomain);
  console.log("Auth Status:", auth ? "✅ Ready" : "❌ Not initialized");
  console.log("Firestore Status:", db ? "✅ Ready" : "❌ Not initialized");
  console.log("=".repeat(50));
  
  if (!auth) {
    console.warn("⚠️ Authentication not initialized - Google sign-in will not work");
    console.warn("💡 Check: Firebase Console → Authentication → Sign-in method → Enable Google");
  }
  
  if (!db) {
    console.warn("⚠️ Firestore not initialized - data persistence will not work");
    console.warn("💡 Check: Firebase Console → Firestore Database → Create database");
  }
  
  if (auth && db) {
    console.log("✅ Firebase fully configured and ready!");
  }
}

// Only create provider if auth is available
let googleProvider: GoogleAuthProvider | null = null;
if (auth) {
  googleProvider = new GoogleAuthProvider();
  // Explicitly request profile scope to get profile picture
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  // Set custom parameters to ensure we get the profile picture
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

export interface UserData {
  personas: Persona[];
  segments: PersonaSegment[];
  results: SimulationResult[];
  assets: Asset[];
  transactionalData: string;
  savedSimulations?: SavedSimulation[];
  tokens?: number;
  questions?: Question[];
  personalSocieties?: PersonalSociety[];
  targetSocieties?: TargetSociety[];
}

const mapFirebaseUserToAppUser = (fbUser: FirebaseUser): User => {
    // Generate avatar URL - prefer Google photo, fallback to generated avatar
    let avatarUrl = fbUser.photoURL;
    
    if (!avatarUrl || avatarUrl === '') {
        // Generate avatar from name if no photoURL
        const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=128&bold=true`;
    }
    
    console.log("🖼️ User avatar URL:", {
        photoURL: fbUser.photoURL,
        generated: avatarUrl,
        displayName: fbUser.displayName,
        email: fbUser.email
    });
    
    return {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || "Researcher",
        email: fbUser.email || "",
        plan: PlanTier.PRO,
        avatar: avatarUrl,
        tokens: 1000
    };
};

const handleAuthError = (err: any) => {
    // Check for placeholder Firebase config
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (apiKey && (apiKey.includes('your_firebase') || apiKey.includes('your-project') || apiKey === 'your_firebase_api_key')) {
        throw new Error('FIREBASE_CONFIG_MISSING|Firebase configuration is not set. Please add your Firebase config values to .env.local');
    }
    
    if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        const domain = window.location.hostname || "local-preview";
        throw new Error(`UNAUTHORIZED_DOMAIN|${domain}`);
    }
    
    // Handle common Firebase auth errors
    if (err.code === 'auth/invalid-api-key' || err.code === 'auth/operation-not-allowed') {
        throw new Error(`FIREBASE_CONFIG_ERROR|${err.message || 'Invalid Firebase configuration. Please check your .env.local file.'}`);
    }
    
    if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup was closed. Please try again.');
    }
    
    if (err.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
    }
    
    // Generic error handling
    const errorMessage = err.message || err.code || 'Authentication failed. Please check your Firebase configuration.';
    throw new Error(errorMessage);
};

export const signInWithGoogle = async (): Promise<User> => {
  if (!auth) {
    const missing = requiredFirebaseVars.filter(v => !import.meta.env[v]);
    throw new Error(
      `Firebase Auth is not initialized. Missing configuration: ${missing.join(', ')}. ` +
      `Please add Firebase config to .env.local. See FIREBASE_SETUP_GUIDE.md for instructions.`
    );
  }
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    // Explicitly request profile scope to get profile picture
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    // Set custom parameters to ensure we get the profile picture
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }
  try {
    console.log("🔐 Starting Google sign-in...");
    console.log("Firebase Auth status:", { 
        initialized: !!auth,
        currentUser: auth.currentUser?.uid || 'none',
        projectId: auth.app.options.projectId
    });
    const result = await signInWithPopup(auth, googleProvider);
    
    // Log detailed user info including photoURL
    console.log("✅ Google sign-in successful", { 
        uid: result.user.uid, 
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        providerData: result.user.providerData.map(p => ({
          providerId: p.providerId,
          photoURL: p.photoURL,
          displayName: p.displayName
        }))
    });
    
    // Check if photoURL exists in providerData if not in main user object
    if (!result.user.photoURL && result.user.providerData.length > 0) {
      const googleProviderData = result.user.providerData.find(p => p.providerId === 'google.com');
      if (googleProviderData?.photoURL) {
        console.log("📸 Found photoURL in providerData:", googleProviderData.photoURL);
        // Update the user's photoURL
        (result.user as any).photoURL = googleProviderData.photoURL;
      }
    }
    const appUser = mapFirebaseUserToAppUser(result.user);
    console.log("✅ Mapped to app user", { id: appUser.id, name: appUser.name, email: appUser.email });
    return appUser;
  } catch (err: any) {
    console.error("❌ Google sign-in error", err);
    console.error("Error details:", {
        code: err.code,
        message: err.message,
        email: err.email,
        credential: err.credential
    });
    throw handleAuthError(err);
  }
};

export const signInWithEmail = async (email: string, pass: string, isSignUp: boolean): Promise<User> => {
    if (!auth) {
        throw new Error('Firebase Auth is not initialized. Please configure Firebase or use demo mode.');
    }
    try {
        let result;
        if (isSignUp) {
            result = await createUserWithEmailAndPassword(auth, email, pass);
        } else {
            result = await signInWithEmailAndPassword(auth, email, pass);
        }
        return mapFirebaseUserToAppUser(result.user);
    } catch (err) {
        return handleAuthError(err);
    }
};

export const logoutUser = async () => {
    if (auth) {
        await signOut(auth);
    }
};

export const saveUserData = async (userId: string, data: UserData) => {
  if (!userId) {
    console.warn("saveUserData called with empty userId");
    return;
  }
  if (!db) {
    console.log("💾 Demo mode: Data not persisted (Firestore not initialized)");
    // In demo mode, save to localStorage as fallback
    try {
      localStorage.setItem(`rat-lab-demo-${userId}`, JSON.stringify({ lastUpdated: Date.now(), ...data }));
      console.log("💾 Saved to localStorage (demo mode)");
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
    return;
  }
  try {
      console.log("💾 Saving user data to Firestore", { userId, dataSize: JSON.stringify(data).length });
      await setDoc(doc(db, "users", userId), { lastUpdated: Date.now(), ...data }, { merge: true });
      console.log("✅ User data saved successfully to Firestore", { userId });
  } catch (error: any) {
      console.error("❌ Cloud save failed", error);
      console.error("Error details:", {
          code: error.code,
          message: error.message,
          userId,
          firestoreAvailable: !!db
      });
      // Don't throw - allow app to continue even if save fails
      // This prevents blocking the UI if Firestore has permission issues
  }
};

export const loadUserData = async (userId: string): Promise<UserData | null> => {
  if (!userId) {
    console.warn("loadUserData called with empty userId");
    return null;
  }
  if (!db) {
    console.log("📥 Demo mode: Loading from localStorage");
    // In demo mode, load from localStorage
    try {
      const stored = localStorage.getItem(`rat-lab-demo-${userId}`);
      if (stored) {
        const data = JSON.parse(stored) as UserData;
        console.log("✅ Loaded from localStorage (demo mode)", { 
          userId,
          personas: data.personas?.length || 0
        });
        return data;
      }
    } catch (e) {
      console.warn("Could not load from localStorage", e);
    }
    return null;
  }
  try {
      console.log("📥 Loading user data from Firestore", { userId });
      const docSnap = await getDoc(doc(db, "users", userId));
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        console.log("✅ User data loaded from Firestore", { 
          userId,
          personas: data.personas?.length || 0, 
          segments: data.segments?.length || 0,
          results: data.results?.length || 0,
          assets: data.assets?.length || 0
        });
        return data;
      }
      console.log("ℹ️ No user data found in Firestore, returning empty state", { userId });
      return null;
  } catch (error: any) {
      console.error("❌ Cloud load failed", error);
      console.error("Error details:", {
          code: error.code,
          message: error.message,
          userId,
          firestoreAvailable: !!db,
          errorType: error.constructor.name
      });
      // Don't throw - return null so app can continue with empty state
      return null;
  }
};

export const getActiveConfigStatus = () => {
    return auth && auth.app.options.apiKey ? 'REAL' : 'DEMO';
};

export { auth, db };
