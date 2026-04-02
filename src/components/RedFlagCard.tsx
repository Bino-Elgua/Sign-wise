
import React, { useState } from 'react';

interface RedFlagProps {
  id: string;
  issue: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  suggestion: {
    whyItMatters: string;
    strategy: string;
    counterOffer: string;
    rephrasedClause: string;
    renegotiationKeywords?: string[];
    tacticalTips?: string[];
    psychologicalInsight: string;
  };
  originalText: string;
}

const RedFlagCard: React.FC<RedFlagProps> = ({ id, issue, riskLevel, suggestion, originalText }) => {
  const [feedback, setFeedback] = useState<'useful' | 'not-useful' | null>(null);
  const [showInsights, setShowInsights] = useState(true);

  const getBadgeStyles = () => {
    switch (riskLevel) {
      case 'High': return 'bg-red-600 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      default: return 'bg-indigo-600 text-white';
    }
  };

  return (
    <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-l-[6px] md:border-l-[10px] transition-all hover:shadow-xl bg-white border border-slate-200 group overflow-hidden ${riskLevel === 'High' ? 'border-l-red-600 shadow-red-100' : riskLevel === 'Medium' ? 'border-l-amber-500 shadow-amber-100' : 'border-l-indigo-600'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${getBadgeStyles()}`}>
            <i className={`fa-solid ${riskLevel === 'High' ? 'fa-bolt-lightning' : riskLevel === 'Medium' ? 'fa-triangle-exclamation' : 'fa-magnifying-glass'} text-sm md:text-base`}></i>
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-base md:text-lg text-slate-900 leading-tight truncate">{issue}</h4>
            <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getBadgeStyles()}`}>{riskLevel} Risk Exposure</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <i className="fa-solid fa-code text-indigo-400"></i> Predatory Clause Fragment
        </p>
        <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 font-serif text-[11px] md:text-xs italic text-slate-600 leading-relaxed break-words">
          "{originalText}"
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
          <span className="text-indigo-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <i className="fa-solid fa-brain"></i> Strategic Reasoning
          </span>
          <button 
            onClick={() => setShowInsights(!showInsights)}
            className="text-white/50 text-[8px] font-black uppercase tracking-widest hover:text-white transition"
          >
            {showInsights ? 'Contract Logic' : 'Expand Insights'}
          </button>
        </div>
        
        <div className="p-4 md:p-6 space-y-4">
          {showInsights && (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-900/30">
                <h5 className="text-indigo-400 text-[8px] uppercase font-black mb-1 tracking-widest">Drafter's Likely Intent</h5>
                <p className="text-indigo-100 text-[10px] leading-relaxed italic">"{suggestion.psychologicalInsight}"</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h5 className="text-slate-400 text-[8px] uppercase font-black mb-1 tracking-widest">Negotiation Strategy</h5>
                <p className="text-slate-200 text-[10px] leading-relaxed">{suggestion.strategy}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h5 className="text-slate-400 text-[8px] uppercase font-black mb-1 tracking-widest">Rephrased Clause</h5>
                <p className="text-slate-200 text-[10px] leading-relaxed italic">"{suggestion.rephrasedClause}"</p>
              </div>
              <div className="bg-amber-900/10 p-4 rounded-xl border border-amber-900/20">
                <h5 className="text-amber-500 text-[8px] uppercase font-black mb-1 tracking-widest">Tactical Defense Strategies</h5>
                <ul className="space-y-1">
                  {suggestion.tacticalTips?.map((tip, idx) => (
                    <li key={idx} className="text-amber-50/70 text-[10px] leading-relaxed flex items-start gap-2">
                      <span className="text-amber-500">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h5 className="text-slate-400 text-[8px] uppercase font-black mb-1 tracking-widest">Renegotiation Keywords</h5>
                <div className="flex flex-wrap gap-2">
                  {suggestion.renegotiationKeywords?.map((keyword, idx) => (
                    <span key={idx} className="bg-slate-700 text-slate-200 text-[9px] px-2 py-1 rounded-full">{keyword}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h5 className="text-slate-500 text-[8px] uppercase font-black mb-1 tracking-widest">Risk Implication</h5>
            <p className="text-slate-300 text-[10px] md:text-xs leading-relaxed font-medium">{suggestion.whyItMatters}</p>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-900/50 p-3 md:p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
               <h5 className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">Signer-First Counter-Offer</h5>
               <button onClick={() => { navigator.clipboard.writeText(suggestion.counterOffer); alert("Protective text secured."); }} className="text-emerald-400 hover:text-white transition bg-emerald-900/50 p-1 rounded-md"><i className="fa-solid fa-copy text-xs"></i></button>
            </div>
            <p className="text-emerald-50 text-[11px] md:text-xs font-mono leading-relaxed bg-black/40 p-3 rounded-lg border border-emerald-900/30">
              {suggestion.counterOffer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedFlagCard;
