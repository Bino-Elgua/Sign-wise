import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentRecord, RiskRating } from '../types/types';

const statusStyle: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Pending', icon: 'fa-clock' },
  analyzing: { bg: 'bg-indigo-100', text: 'text-indigo-600', label: 'Analyzing', icon: 'fa-spinner fa-spin' },
  complete: { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Complete', icon: 'fa-check' },
  failed: { bg: 'bg-red-100', text: 'text-red-600', label: 'Failed', icon: 'fa-xmark' },
};

const riskStyle: Record<RiskRating, { bg: string; text: string }> = {
  LOW: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-600' },
  HIGH: { bg: 'bg-red-50', text: 'text-red-600' },
};

const fileIcon = (type: string) => {
  if (type.includes('pdf')) return 'fa-file-pdf text-red-400';
  if (type.includes('word') || type.includes('openxml')) return 'fa-file-word text-blue-400';
  if (type.includes('image')) return 'fa-file-image text-amber-400';
  return 'fa-file text-slate-300';
};

function formatDate(ts: any): string {
  if (!ts) return '';
  // Firestore Timestamp or ISO string
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface DocumentCardProps {
  doc: DocumentRecord;
  onDelete: (doc: DocumentRecord) => void;
  onReAnalyze: (docId: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc: record, onDelete, onReAnalyze }) => {
  const navigate = useNavigate();
  const status = statusStyle[record.status];
  const risk = record.status === 'complete' && record.analysisResult
    ? riskStyle[record.analysisResult.riskRating]
    : null;

  return (
    <div
      onClick={() => navigate(`/analyze/${record.docId}`)}
      className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-5">
        {/* File icon */}
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
          <i className={`fa-solid ${fileIcon(record.fileType)} text-2xl`}></i>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base md:text-lg font-black text-slate-900 tracking-tight truncate mb-1">
            {record.filename}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {formatDate(record.uploadedAt)}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Engine badge */}
          {record.status === 'complete' && (
            <span className={`${record.engine === 'ollama' ? 'bg-cyan-50 text-cyan-600' : 'bg-indigo-50 text-indigo-600'} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest`}>
              {record.engine === 'ollama' && record.model ? record.model : 'Gemini'}
            </span>
          )}
          {risk && (
            <span className={`${risk.bg} ${risk.text} px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest`}>
              {record.analysisResult!.riskRating}
            </span>
          )}
          <span className={`${status.bg} ${status.text} px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
            <i className={`fa-solid ${status.icon} text-[8px]`}></i>
            {status.label}
          </span>

          {/* Re-analyze (failed only) */}
          {record.status === 'failed' && (
            <button
              onClick={(e) => { e.stopPropagation(); onReAnalyze(record.docId); }}
              className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition"
              title="Re-analyze"
            >
              <i className="fa-solid fa-rotate-right text-xs"></i>
            </button>
          )}

          {/* Delete (disabled while analyzing) */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(record); }}
            disabled={record.status === 'analyzing'}
            className="w-9 h-9 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
            title={record.status === 'analyzing' ? 'Cannot delete while analyzing' : 'Delete'}
          >
            <i className="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
