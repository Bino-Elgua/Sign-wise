import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export type Plan = 'free' | 'pro';

interface PlanState {
  plan: Plan;
  isPro: boolean;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  planExpiresAt: string | null;
  loading: boolean;
}

export function usePlan(): PlanState {
  const { user } = useAuth();
  const [state, setState] = useState<PlanState>({
    plan: 'free',
    isPro: false,
    stripeCustomerId: null,
    subscriptionId: null,
    planExpiresAt: null,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const plan: Plan = data.plan === 'pro' ? 'pro' : 'free';
        setState({
          plan,
          isPro: plan === 'pro',
          stripeCustomerId: data.stripeCustomerId || null,
          subscriptionId: data.subscriptionId || null,
          planExpiresAt: data.planExpiresAt || null,
          loading: false,
        });
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    return unsub;
  }, [user]);

  return state;
}
