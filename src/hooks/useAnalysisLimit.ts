import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { usePlan } from './usePlan';

const FREE_LIMIT = 3;

interface AnalysisLimitState {
  used: number;
  limit: number;
  remaining: number;
  isAtLimit: boolean;
  loading: boolean;
}

export function useAnalysisLimit(): AnalysisLimitState {
  const { user } = useAuth();
  const { isPro, loading: planLoading } = usePlan();
  const [state, setState] = useState<AnalysisLimitState>({
    used: 0,
    limit: FREE_LIMIT,
    remaining: FREE_LIMIT,
    isAtLimit: false,
    loading: true,
  });

  useEffect(() => {
    if (!user || planLoading) return;

    if (isPro) {
      setState({ used: 0, limit: Infinity, remaining: Infinity, isAtLimit: false, loading: false });
      return;
    }

    (async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const col = collection(db, 'users', user.uid, 'documents');
      const q = query(
        col,
        where('uploadedAt', '>=', Timestamp.fromDate(monthStart)),
        where('status', 'in', ['pending', 'analyzing', 'complete'])
      );
      const snap = await getDocs(q);
      const used = snap.size;
      setState({
        used,
        limit: FREE_LIMIT,
        remaining: Math.max(0, FREE_LIMIT - used),
        isAtLimit: used >= FREE_LIMIT,
        loading: false,
      });
    })();
  }, [user, isPro, planLoading]);

  return state;
}
