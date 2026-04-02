import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { DocumentRecord, AnalysisResult, AnalysisEngine, FlaggedClause, RiskRating, OllamaModel, OLLAMA_MODELS } from '../types/types';
import { useAnalysisLimit } from '../hooks/useAnalysisLimit';
import { usePlan } from '../hooks/usePlan';
import UpgradePrompt from './UpgradePrompt';
import EngineSelector from './EngineSelector';

const riskColor: Record<RiskRating, { bg: string; text: string; border: string; icon: string }> = {
  LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'fa-shield-halved' },
  MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'fa-triangle-exclamation' },
  HIGH: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'fa-skull-crossbones' },
};

const ClauseList: React.FC<{ title: string; icon: string; items: FlaggedClause[]; color: string }> = ({ title, icon, items, color }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 px-8 pt-8 pb-4 flex items-center gap-3">
        <i className={`fa-solid ${icon} ${color}`}></i>
        {title} ({items.length})
      </h3>
      <div className="divide-y divide-slate-50">
        {items.map((item, i) => (
          <div key={i} className="px-8 py-5">
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))}
              className="w-full text-left flex items-start justify-between gap-4 group"
            >
              <p className="text-sm font-bold text-slate-700 leading-relaxed flex-1">
                "{item.clause}"
              </p>
              <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform mt-1 ${expanded[i] ? 'rotate-180' : ''}`}></i>
            </button>
            {expanded[i] && (
              <div className="mt-3 pl-0 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl">
                  {item.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function engineLabel(record: DocumentRecord): string {
  if (record.engine === 'ollama' && record.model) {
    return `${record.model} via Ollama`;
  }
  return 'Gemini 2.5 Flash';
}

const AnalysisPage: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPro } = usePlan();
  const { used, limit, isAtLimit } = useAnalysisLimit();

  // Engine selection state
  const [selectedEngine, setSelectedEngine] = useState<AnalysisEngine>('gemini');
  const [selectedModel, setSelectedModel] = useState<OllamaModel>(OLLAMA_MODELS[0]);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Real-time listener on the document
  useEffect(() => {
    if (!user || !docId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'documents', docId),
      (snap) => {
        if (!snap.exists()) {
          setError('Document not found.');
          setLoading(false);
          return;
        }
        setDocument(snap.data() as DocumentRecord);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, docId]);

  const triggerAnalysis = async (engine?: AnalysisEngine, model?: OllamaModel) => {
    if (!docId || triggering) return;
    const eng = engine ?? selectedEngine;
    const mdl = model ?? selectedModel;

    setTriggering(true);
    setError(null);
    try {
      if (eng === 'ollama') {
        const analyze = httpsCallable(functions, 'analyzeWithOllama');
        await analyze({ docId, model: mdl });
      } else {
        const analyze = httpsCallable(functions, 'analyzeDocument');
        await analyze({ docId });
      }
    } catch (err: any) {
      const msg = err?.message || 'Analysis failed.';
      setError(msg);
      // If Ollama unreachable, don't auto-retry
      if (msg.includes('unreachable') || msg.includes('UNAVAILABLE')) {
        setAutoTriggered(false);
      }
    } finally {
      setTriggering(false);
    }
  };

  const handleSwitchToGemini = () => {
    setSelectedEngine('gemini');
    setError(null);
    triggerAnalysis('gemini');
  };

  const downloadReport = (result: AnalysisResult) => {
    const lines = [
      '═══════════════════════════════════════════',
      '  SIGNWISE AI — FORENSIC CONTRACT REPORT',
      '═══════════════════════════════════════════',
      '',
      `Risk Rating: ${result.riskRating}`,
      `Reason: ${result.riskReason}`,
      `Engine: ${result.engine === 'ollama' && result.model ? `${result.model} via Ollama` : 'Gemini 2.5 Flash'}`,
      '',
      '── SUMMARY ──',
      result.summary,
      '',
    ];

    if (result.redFlags.length > 0) {
      lines.push('── RED FLAGS ──');
      result.redFlags.forEach((f, i) => {
        lines.push(`${i + 1}. "${f.clause}"`);
        lines.push(`   → ${f.explanation}`);
        lines.push('');
      });
    }

    if (result.hiddenTerms.length > 0) {
      lines.push('── HIDDEN TERMS ──');
      result.hiddenTerms.forEach((t, i) => {
        lines.push(`${i + 1}. "${t.clause}"`);
        lines.push(`   → ${t.explanation}`);
        lines.push('');
      });
    }

    lines.push('── DISCLAIMER ──');
    lines.push(result.disclaimer);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `SignWise_Report_${docId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="relative w-48 h-48 md:w-64 md:h-64">
          <div className="absolute inset-0 border-x-[10px] border-slate-900 rounded-full animate-spin"></div>
          <div className="absolute inset-8 bg-white rounded-full shadow-2xl flex items-center justify-center">
            <i className="fa-solid fa-magnifying-glass-chart text-4xl md:text-6xl text-indigo-600 animate-pulse"></i>
          </div>
        </div>
        <h2 className="text-xl md:text-3xl font-black mt-16 text-slate-900 tracking-[0.2em] uppercase">Loading Document...</h2>
      </div>
    );
  }

  // ── Error / not found ──
  if (error && !document) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] mx-auto flex items-center justify-center mb-8">
          <i className="fa-solid fa-circle-exclamation text-3xl text-red-500"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">{error}</h2>
        <button onClick={() => navigate('/upload')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] mt-6">
          Back to Upload
        </button>
      </div>
    );
  }

  if (!document) return null;

  // ── Pending but at limit — show upgrade prompt ──
  if (document.status === 'pending' && !isPro && isAtLimit) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-8">
        <div className="text-center mb-4">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">Analysis Limit Reached</h2>
          <p className="text-sm text-slate-500 font-medium">Upgrade to Pro for unlimited contract analyses.</p>
        </div>
        <UpgradePrompt used={used} limit={limit} />
      </div>
    );
  }

  // ── Pending — show engine selector + analyze button ──
  if (document.status === 'pending' && !triggering) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-2">
            Choose <span className="text-indigo-600">Engine.</span>
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{document.filename}</p>
        </div>

        <EngineSelector
          engine={selectedEngine}
          model={selectedModel}
          onChange={(e, m) => { setSelectedEngine(e); setSelectedModel(m); }}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
            <span className="flex-1">{error}</span>
            {selectedEngine === 'ollama' && (
              <button onClick={handleSwitchToGemini} className="bg-white px-4 py-2 rounded-xl text-indigo-600 font-black text-[9px] uppercase tracking-widest border border-indigo-200 hover:bg-indigo-50 transition shrink-0">
                Switch to Gemini
              </button>
            )}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => triggerAnalysis()}
            className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-700 transition active:scale-95"
          >
            Analyze with {selectedEngine === 'ollama' ? selectedModel : 'Gemini 2.5 Flash'}
          </button>
        </div>
      </div>
    );
  }

  // ── Analyzing state ──
  if (document.status === 'pending' || document.status === 'analyzing') {
    const engineName = selectedEngine === 'ollama' ? `${selectedModel} via Ollama` : 'Gemini Forensic Engine';
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="relative w-48 h-48 md:w-72 md:h-72">
          <div className={`absolute inset-0 border-x-[12px] rounded-full animate-spin ${selectedEngine === 'ollama' ? 'border-cyan-600' : 'border-indigo-600'}`}></div>
          <div className="absolute inset-8 bg-white rounded-full shadow-2xl flex items-center justify-center">
            <i className={`fa-solid ${selectedEngine === 'ollama' ? 'fa-server' : 'fa-user-shield'} text-4xl md:text-7xl ${selectedEngine === 'ollama' ? 'text-cyan-600' : 'text-indigo-600'} animate-pulse`}></i>
          </div>
        </div>
        <h2 className="text-xl md:text-4xl font-black mt-16 text-slate-900 tracking-[0.15em] uppercase text-center">
          Sentinel Analyzing...
        </h2>
        <p className="text-slate-400 font-bold mt-4 uppercase text-[9px] tracking-[0.3em]">
          {document.filename} • {engineName} Active
        </p>
      </div>
    );
  }

  // ── Failed state ──
  if (document.status === 'failed') {
    const isOllamaError = document.error?.includes('unreachable') || document.error?.includes('UNAVAILABLE');
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] mx-auto flex items-center justify-center mb-8">
          <i className="fa-solid fa-shield-xmark text-3xl text-red-500"></i>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Analysis Failed</h2>
        <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">{document.error || 'An unknown error occurred during analysis.'}</p>
        {error && <p className="text-xs text-red-500 font-bold mb-6">{error}</p>}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => triggerAnalysis()}
            disabled={triggering}
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {triggering ? <><i className="fa-solid fa-spinner animate-spin mr-2"></i>Retrying...</> : 'Retry Analysis'}
          </button>
          {isOllamaError && (
            <button
              onClick={handleSwitchToGemini}
              className="bg-cyan-50 text-cyan-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-cyan-200 hover:bg-cyan-100 transition"
            >
              Switch to Gemini
            </button>
          )}
          <button onClick={() => navigate('/upload')} className="text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition">
            Upload New
          </button>
        </div>
      </div>
    );
  }

  // ── Complete state — render results ──
  const result = document.analysisResult!;
  const risk = riskColor[result.riskRating];
  const analyzedBy = engineLabel(document);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-block px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6 border border-slate-700">
          Forensic Report
        </span>
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter mb-2">
          Analysis <span className="text-indigo-600">Complete.</span>
        </h1>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">{document.filename}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
          Analyzed by: {analyzedBy}
        </p>
      </div>

      {/* Risk Badge */}
      <div className={`${risk.bg} ${risk.border} border rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-10`}>
        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] ${risk.bg} flex items-center justify-center border-2 ${risk.border}`}>
          <i className={`fa-solid ${risk.icon} text-3xl md:text-4xl ${risk.text}`}></i>
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <span className={`text-3xl md:text-5xl font-black tracking-tighter ${risk.text}`}>
              {result.riskRating}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${risk.text} opacity-70`}>Risk</span>
          </div>
          <p className={`text-sm md:text-base font-bold ${risk.text} opacity-80`}>{result.riskReason}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 md:p-12">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-3">
          <i className="fa-solid fa-file-lines text-indigo-600"></i>
          Plain Summary
        </h3>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium">{result.summary}</p>
      </div>

      {/* Red Flags */}
      <ClauseList title="Red Flags" icon="fa-flag" items={result.redFlags} color="text-red-500" />

      {/* Hidden Terms */}
      <ClauseList title="Hidden Terms" icon="fa-eye-slash" items={result.hiddenTerms} color="text-amber-500" />

      {/* Disclaimer */}
      <div className="bg-slate-900 text-white rounded-[2rem] p-8 md:p-12">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-3">
          <i className="fa-solid fa-scale-balanced"></i>
          Legal Disclaimer
        </h3>
        <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">{result.disclaimer}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={() => downloadReport(result)}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-700 transition active:scale-95 flex items-center gap-3"
        >
          <i className="fa-solid fa-download"></i> Download Report {isPro ? '(PDF)' : '(.txt)'}
        </button>
        <button
          onClick={() => navigate('/upload')}
          className="text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition"
        >
          Analyze Another
        </button>
      </div>
    </div>
  );
};

export default AnalysisPage;
