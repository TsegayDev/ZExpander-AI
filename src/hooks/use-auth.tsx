
"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation';
import type { AppUser, UserPlan, Feature, PlanDetails } from "@/lib/types";

const DEMO_USER_STORAGE_KEY = 'zexpander-demo-user';
const USER_PLAN_STORAGE_KEY_PREFIX = 'zexpander-user-plan-';

export const PLAN_LIMITS: Record<UserPlan, { tokens: number; fileUploads: number }> = {
  Free: { tokens: 5000, fileUploads: 5 },
  Pro: { tokens: 100000, fileUploads: 50 },
  Unlimited: { tokens: -1, fileUploads: -1 }, // -1 for unlimited
};


const demoUser: Omit<AppUser, keyof PlanDetails> = {
    uid: 'demouser',
    email: 'demo@example.com',
    displayName: 'Demo User',
    photoURL: 'https://i.ibb.co/6RJ2S7b/avatar.png',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    providerId: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'demotoken',
    getIdTokenResult: async () => ({
        token: 'demotoken',
        expirationTime: '',
        authTime: '',
        issuedAtTime: '',
        signInProvider: null,
        signInSecondFactor: null,
        claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({}),
};


interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInDemo: () => Promise<void>;
  canUseFeature: (feature: Feature, cost?: number) => boolean;
  incrementUsage: (feature: Feature, amount?: number) => Promise<void>;
  updateUserPlan: (plan: UserPlan) => Promise<void>;
  getRemaining: (feature: Feature) => number | string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadPlanDetails = useCallback((uid: string): PlanDetails => {
    const storedPlanRaw = (typeof window !== 'undefined' && typeof localStorage !== 'undefined')
      ? localStorage.getItem(`${USER_PLAN_STORAGE_KEY_PREFIX}${uid}`)
      : null;
    let planDetails: PlanDetails;

    const todaysDate = new Date().toISOString().split('T')[0];

    if (storedPlanRaw) {
        planDetails = JSON.parse(storedPlanRaw);
        // Reset daily usage if it's a new day
        if (planDetails.lastUsageDate !== todaysDate) {
            planDetails.dailyTokensUsed = 0;
            planDetails.dailyFileUploadsUsed = 0;
            planDetails.lastUsageDate = todaysDate;
        }
    } else {
        planDetails = {
            plan: 'Free',
            isPremium: false,
            dailyTokensUsed: 0,
            dailyFileUploadsUsed: 0,
            lastUsageDate: todaysDate,
        };
    }
     if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
       localStorage.setItem(`${USER_PLAN_STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(planDetails));
     }
     return planDetails;
  }, []);

  const updateUserPlan = useCallback(async (planId: UserPlan) => {
    if (!user) return;

    const newPlanDetails: PlanDetails = {
        plan: planId,
        isPremium: planId !== 'Free',
        dailyTokensUsed: 0,
        dailyFileUploadsUsed: 0,
        lastUsageDate: new Date().toISOString().split('T')[0]
    };

    const key = user.uid === 'demouser' ? `${USER_PLAN_STORAGE_KEY_PREFIX}demouser` : `${USER_PLAN_STORAGE_KEY_PREFIX}${user.uid}`;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(newPlanDetails));
    }
    
    setUser(currentUser => {
        if (!currentUser) return null;
        return { ...currentUser, ...newPlanDetails };
    });
  }, [user]);

  useEffect(() => {
    const demoUserActive = (typeof window !== 'undefined' && typeof localStorage !== 'undefined')
      ? localStorage.getItem(DEMO_USER_STORAGE_KEY)
      : null;
    if (demoUserActive === 'true') {
        const planDetails = loadPlanDetails('demouser');
        setUser({ ...demoUser, ...planDetails });
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const planDetails = loadPlanDetails(firebaseUser.uid);
        const appUser: AppUser = {
            ...firebaseUser,
            ...planDetails,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadPlanDetails]);

  const signOut = async () => {
    const demoUserActive = (typeof window !== 'undefined' && typeof localStorage !== 'undefined')
      ? localStorage.getItem(DEMO_USER_STORAGE_KEY)
      : null;
    if (demoUserActive === 'true') {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        }
    } else {
        await firebaseSignOut(auth);
    }
    setUser(null);
    router.push('/signin');
  };

  const signInDemo = async () => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, 'true');
    }
    const planDetails = loadPlanDetails('demouser');
    setUser({ ...demoUser, ...planDetails });
    router.push('/expand');
  };

  const canUseFeature = useCallback((feature: Feature, cost: number = 1) => {
    if (!user) return false;
    if (user.plan === 'Unlimited') return true;

    const limits = PLAN_LIMITS[user.plan];
    if (feature === 'expansions') {
        return user.dailyTokensUsed + cost <= limits.tokens;
    }
    if (feature === 'fileUploads') {
        return user.dailyFileUploadsUsed + cost <= limits.fileUploads;
    }

    return false;
  }, [user]);

  const incrementUsage = useCallback(async (feature: Feature, amount: number = 1) => {
    if (!user || user.plan === 'Unlimited') return;
    
    const todaysDate = new Date().toISOString().split('T')[0];
    let { dailyTokensUsed, dailyFileUploadsUsed, lastUsageDate } = user;

    if (lastUsageDate !== todaysDate) {
        dailyTokensUsed = 0;
        dailyFileUploadsUsed = 0;
        lastUsageDate = todaysDate;
    }

    if (feature === 'expansions') {
      dailyTokensUsed += amount;
    }
    if(feature === 'fileUploads'){
      dailyFileUploadsUsed += amount;
    }

    const newPlanDetails: PlanDetails = {
        ...user,
        dailyTokensUsed,
        dailyFileUploadsUsed,
        lastUsageDate
    };

    const key = user.uid === 'demouser' ? `${USER_PLAN_STORAGE_KEY_PREFIX}demouser` : `${USER_PLAN_STORAGE_KEY_PREFIX}${user.uid}`;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(newPlanDetails));
    }

    setUser(currentUser => {
        if (!currentUser) return null;
        return { ...currentUser, ...newPlanDetails };
    });

  }, [user]);

  const getRemaining = useCallback((feature: Feature): number | string => {
    if (!user) return 0;
    if (user.plan === 'Unlimited') return 'Unlimited';
    
    const limits = PLAN_LIMITS[user.plan];
    if (feature === 'expansions') {
      return limits.tokens - user.dailyTokensUsed;
    }
    if (feature === 'fileUploads') {
      return limits.fileUploads - user.dailyFileUploadsUsed;
    }
    return 0;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signInDemo, canUseFeature, incrementUsage, updateUserPlan, getRemaining }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
