
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppUser, UserPlan, Feature, PlanDetails } from '@/lib/types';
import { PLAN_LIMITS } from '@/lib/constants';

// ─── Storage keys ────────────────────────────────────────────────────────────
const SESSION_KEY = 'zexpander-session';           // stores current user uid
const USERS_KEY   = 'zexpander-users';             // Map uid → {email,password,displayName}
const PLAN_KEY    = (uid: string) => `zexpander-plan-${uid}`;

// ─── Demo user ───────────────────────────────────────────────────────────────
const DEMO_UID = 'demo-user';
const demoUser: AppUser = {
  uid: DEMO_UID,
  email: 'demo@zexpander.ai',
  displayName: 'Demo User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  plan: 'Free',
  isPremium: false,
  dailyTokensUsed: 0,
  dailyFileUploadsUsed: 0,
  lastUsageDate: new Date().toISOString().split('T')[0],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadPlan(uid: string): PlanDetails {
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(PLAN_KEY(uid));
    if (raw) {
      const p: PlanDetails = JSON.parse(raw);
      if (p.lastUsageDate !== today) {
        p.dailyTokensUsed = 0;
        p.dailyFileUploadsUsed = 0;
        p.lastUsageDate = today;
      }
      localStorage.setItem(PLAN_KEY(uid), JSON.stringify(p));
      return p;
    }
  } catch { /* ignore */ }
  const defaults: PlanDetails = {
    plan: 'Free', isPremium: false,
    dailyTokensUsed: 0, dailyFileUploadsUsed: 0,
    lastUsageDate: today,
  };
  localStorage.setItem(PLAN_KEY(uid), JSON.stringify(defaults));
  return defaults;
}

function savePlan(uid: string, plan: PlanDetails) {
  localStorage.setItem(PLAN_KEY(uid), JSON.stringify(plan));
}

interface StoredUserRecord {
  uid: string;
  email: string;
  password: string;
  displayName: string;
}

function loadUsers(): StoredUserRecord[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

function saveUsers(users: StoredUserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Context type ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AppUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInDemo: () => Promise<void>;
  canUseFeature: (feature: Feature, cost?: number) => boolean;
  incrementUsage: (feature: Feature, amount?: number) => Promise<void>;
  updateUserPlan: (plan: UserPlan) => Promise<void>;
  updateProfile: (data: { displayName?: string }) => Promise<void>;
  getRemaining: (feature: Feature) => number | string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof localStorage === 'undefined') return null;
    const uid = localStorage.getItem(SESSION_KEY);
    if (!uid) return null;

    if (uid === DEMO_UID) {
      const plan = loadPlan(DEMO_UID);
      return { ...demoUser, ...plan };
    } else {
      const users = loadUsers();
      const record = users.find(u => u.uid === uid);
      if (record) {
        const plan = loadPlan(uid);
        return {
          uid: record.uid,
          email: record.email,
          displayName: record.displayName,
          photoURL: null,
          emailVerified: true,
          isAnonymous: false,
          ...plan,
        };
      }
    }
    return null;
  });
  const navigate = useNavigate();

  const signIn = useCallback(async (email: string, password: string) => {
    const users = loadUsers();
    const record = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!record) throw new Error('No account found with that email.');
    if (record.password !== password) throw new Error('Incorrect password.');
    const plan = loadPlan(record.uid);
    localStorage.setItem(SESSION_KEY, record.uid);
    setUser({
      uid: record.uid, email: record.email,
      displayName: record.displayName, photoURL: null,
      emailVerified: true, isAnonymous: false,
      ...plan,
    });
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const users = loadUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const uid = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newRecord: StoredUserRecord = { uid, email, password, displayName };
    saveUsers([...users, newRecord]);
    const plan = loadPlan(uid);
    localStorage.setItem(SESSION_KEY, uid);
    setUser({
      uid, email, displayName, photoURL: null,
      emailVerified: true, isAnonymous: false,
      ...plan,
    });
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    navigate('/signin');
  }, [navigate]);

  const signInDemo = useCallback(async () => {
    const plan = loadPlan(DEMO_UID);
    localStorage.setItem(SESSION_KEY, DEMO_UID);
    setUser({ ...demoUser, ...plan });
    navigate('/expand');
  }, [navigate]);

  const updateProfile = useCallback(async (data: { displayName?: string }) => {
    if (!user) throw new Error('Not signed in.');
    if (user.uid !== DEMO_UID && data.displayName) {
      const users = loadUsers();
      const idx = users.findIndex(u => u.uid === user.uid);
      if (idx !== -1) { users[idx].displayName = data.displayName!; saveUsers(users); }
    }
    setUser(cur => cur ? { ...cur, ...data } : cur);
  }, [user]);

  const updateUserPlan = useCallback(async (planId: UserPlan) => {
    if (!user) return;
    const newPlan: PlanDetails = {
      plan: planId, isPremium: planId !== 'Free',
      dailyTokensUsed: 0, dailyFileUploadsUsed: 0,
      lastUsageDate: new Date().toISOString().split('T')[0],
    };
    savePlan(user.uid, newPlan);
    setUser(cur => cur ? { ...cur, ...newPlan } : cur);
  }, [user]);

  const canUseFeature = useCallback((feature: Feature, cost = 1) => {
    if (!user) return false;
    if (user.plan === 'Unlimited') return true;
    const limits = PLAN_LIMITS[user.plan];
    if (feature === 'expansions') return user.dailyTokensUsed + cost <= limits.tokens;
    if (feature === 'fileUploads') return user.dailyFileUploadsUsed + cost <= limits.fileUploads;
    return false;
  }, [user]);

  const incrementUsage = useCallback(async (feature: Feature, amount = 1) => {
    if (!user || user.plan === 'Unlimited') return;
    const today = new Date().toISOString().split('T')[0];
    let { dailyTokensUsed, dailyFileUploadsUsed, lastUsageDate } = user;
    if (lastUsageDate !== today) {
      dailyTokensUsed = 0; dailyFileUploadsUsed = 0; lastUsageDate = today;
    }
    if (feature === 'expansions') dailyTokensUsed += amount;
    if (feature === 'fileUploads') dailyFileUploadsUsed += amount;
    const updated: PlanDetails = { ...user, dailyTokensUsed, dailyFileUploadsUsed, lastUsageDate };
    savePlan(user.uid, updated);
    setUser(cur => cur ? { ...cur, ...updated } : cur);
  }, [user]);

  const getRemaining = useCallback((feature: Feature): number | string => {
    if (!user) return 0;
    if (user.plan === 'Unlimited') return '∞';
    const limits = PLAN_LIMITS[user.plan];
    if (feature === 'expansions') return Math.max(0, limits.tokens - user.dailyTokensUsed);
    if (feature === 'fileUploads') return Math.max(0, limits.fileUploads - user.dailyFileUploadsUsed);
    return 0;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      signIn, signUp, signOut, signInDemo,
      canUseFeature, incrementUsage, updateUserPlan, updateProfile, getRemaining,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
