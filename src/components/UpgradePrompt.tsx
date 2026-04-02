import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

interface UpgradePromptProps {
  used: number;
  limit: number;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ used, limit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const createCheckout = httpsCallable<{}, { url: string }>(functions, 'createCheckoutSession');
      const result = await createCheckout({});
      window.location.href = result.data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout.');
      setLoading(false);
    }
  };

  const pct = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-8 md:p-12 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-crown text-amber-300 text-xl"></i>
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight">Upgrade to Pro</h3>
          <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">$9/month • Unlimited analyses</p>
        </div>
      </div>

      {/* Usage meter */}
      <div className="mb-6">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">
          <span>Monthly usage</span>
          <span>{used} / {limit}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${pct >= 100 ? 'bg-red-400' : pct >= 66 ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2 mb-8">
        {[
          'Unlimited contract analyses',
          'PDF report downloads',
          'Priority processing',
        ].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm font-bold text-indigo-100">
            <i className="fa-solid fa-check text-emerald-400 text-xs"></i>
            {f}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-[10px] font-bold text-red-300 mb-4">{error}</p>
      )}

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-50 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <><i className="fa-solid fa-spinner animate-spin"></i> Redirecting to Stripe</>
        ) : (
          <><i className="fa-solid fa-bolt"></i> Upgrade Now — $9/mo</>
        )}
      </button>
    </div>
  );
};

export default UpgradePrompt;
