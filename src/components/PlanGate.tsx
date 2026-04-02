import React from 'react';
import { useAnalysisLimit } from '../hooks/useAnalysisLimit';
import UpgradePrompt from './UpgradePrompt';

interface PlanGateProps {
  children: React.ReactNode;
}

const PlanGate: React.FC<PlanGateProps> = ({ children }) => {
  const { used, limit, isAtLimit, loading } = useAnalysisLimit();

  if (loading) return <>{children}</>;

  if (isAtLimit) {
    return <UpgradePrompt used={used} limit={limit} />;
  }

  return <>{children}</>;
};

export default PlanGate;
