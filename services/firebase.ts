
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { User, PlanTier, Persona, PersonaSegment, SimulationResult, Asset } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyCdr84A00wwS_zGr34TLYxpHxjpenutS5I",
  authDomain: "rat-lab-2f583.firebaseapp.com",
  projectId: "rat-lab-2f583",
  storageBucket: "rat-lab-2f583.firebasestorage.app",
  messagingSenderId: "909063304558",
  appId: "1:909063304558:web:7101d2f5affb9d4bb2bd7f",
  measurementId: "G-WY1JV4BP70"
};

let app;
try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
    console.error("Firebase Init Failed", e);
}

const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export interface UserData {
  personas: Persona[];
  segments: PersonaSegment[];
  results: SimulationResult[];
  assets: Asset[];
  transactionalData: string;
}

const mapFirebaseUserToAppUser = (fbUser: FirebaseUser): User => ({
    id: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || "Researcher",
    email: fbUser.email || "",
    plan: PlanTier.PRO,
    avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${fbUser.displayName || 'User'}&background=6366f1&color=fff`,
    tokens: 1000
});

export const enterAsGuest = (name: string = "Researcher", email: string = "guest@ratlab.local"): User => {
    const guestUser: User = {
        id: 'guest_' + Date.now(),
        name: name,
        email: email,
        plan: PlanTier.FREE,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=333&color=fff`,
        tokens: 100
    };
    localStorage.setItem('labrat_guest_user', JSON.stringify(guestUser));
    return guestUser;
};

const handleAuthError = (err: any) => {
    if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        const domain = window.location.hostname || "local-preview";
        throw new Error(`UNAUTHORIZED_DOMAIN|${domain}`);
    }
    throw err;
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUserToAppUser(result.user);
  } catch (err) {
    return handleAuthError(err);
  }
};

export const signInWithApple = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return mapFirebaseUserToAppUser(result.user);
  } catch (err) {
    return handleAuthError(err);
  }
};

export const signInWithEmail = async (email: string, pass: string, isSignUp: boolean): Promise<User> => {
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
    await signOut(auth);
    localStorage.removeItem('labrat_guest_user');
};

export const saveUserData = async (userId: string, data: UserData) => {
  if (!userId) return;
  if (!userId.startsWith('guest_')) {
      try {
          await setDoc(doc(db, "users", userId), { lastUpdated: Date.now(), ...data }, { merge: true });
          return;
      } catch (error) {
          console.warn("Cloud save failed", error);
      }
  }
  localStorage.setItem(`labrat_data_${userId}`, JSON.stringify(data));
};

export const loadUserData = async (userId: string): Promise<UserData | null> => {
  if (!userId) return null;
  if (!userId.startsWith('guest_')) {
      try {
          const docSnap = await getDoc(doc(db, "users", userId));
          if (docSnap.exists()) return docSnap.data() as UserData;
      } catch (error) {
          console.warn("Cloud load failed", error);
      }
  }
  const local = localStorage.getItem(`labrat_data_${userId}`);
  return local ? JSON.parse(local) as UserData : null;
};

export const getActiveConfigStatus = () => {
    return auth && auth.app.options.apiKey ? 'REAL' : 'DEMO';
};

export { auth, db };
