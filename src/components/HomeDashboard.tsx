import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { subscribeToDocuments, deleteDocument, reAnalyzeDocument } from '../services/documentService';
import { DocumentRecord, RiskRating } from '../types/types';
import DocumentCard from './DocumentCard';
import ConfirmModal from './ConfirmModal';

const HomeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Initial subscription
  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToDocuments(
      user.uid,
      null,
      (docs, last, more) => {
        setDocuments(docs);
        setLastDoc(last);
        setHasMore(more);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const loadMore = useCallback(() => {
    if (!user || !lastDoc || loadingMore) return;
    setLoadingMore(true);

    const unsub = subscribeToDocuments(
      user.uid,
      lastDoc,
      (docs, last, more) => {
        setDocuments((prev) => {
          const ids = new Set(prev.map((d) => d.docId));
          const unique = docs.filter((d) => !ids.has(d.docId));
          return [...prev, ...unique];
        });
        setLastDoc(last);
        setHasMore(more);
        setLoadingMore(false);
      },
      (err) => {
        setError(err.message);
        setLoadingMore(false);
      }
    );

    // Clean up paginated listener after first snapshot
    setTimeout(() => unsub(), 1000);
  }, [user, lastDoc, loadingMore]);

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(user.uid, deleteTarget);
      setDocuments((prev) => prev.filter((d) => d.docId !== deleteTarget.docId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleReAnalyze = async (docId: string) => {
    try {
      await reAnalyzeDocument(docId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Stats
  const completed = documents.filter((d) => d.status === 'complete' && d.analysisResult);
  const riskCounts: Record<RiskRating, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  completed.forEach((d) => {
    const r = d.analysisResult!.riskRating;
    if (riskCounts[r] !== undefined) riskCounts[r]++;
  });

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <div className="h-10 bg-slate-100 rounded-2xl w-64 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-[2rem] animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-[2rem] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && documents.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] mx-auto flex items-center justify-center mb-8">
          <i className="fa-solid fa-circle-exclamation text-3xl text-red-500"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Something went wrong</h2>
        <p className="text-sm text-slate-500 mb-8">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Dashboard.</h1>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Upload Contract
        </button>
      </div>

      {/* Stats Bar */}
      {completed.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
          <div className="bg-white p-5 md:p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Analyzed</p>
            <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{completed.length}</p>
          </div>
          <div className="bg-emerald-50 p-5 md:p-6 rounded-[1.5rem] border border-emerald-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">Low Risk</p>
            <p className="text-3xl md:text-4xl font-black text-emerald-600 tracking-tighter">{riskCounts.LOW}</p>
          </div>
          <div className="bg-amber-50 p-5 md:p-6 rounded-[1.5rem] border border-amber-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Medium Risk</p>
            <p className="text-3xl md:text-4xl font-black text-amber-600 tracking-tighter">{riskCounts.MEDIUM}</p>
          </div>
          <div className="bg-red-50 p-5 md:p-6 rounded-[1.5rem] border border-red-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">High Risk</p>
            <p className="text-3xl md:text-4xl font-black text-red-600 tracking-tighter">{riskCounts.HIGH}</p>
          </div>
        </div>
      )}

      {/* Error banner (non-fatal) */}
      {error && documents.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold mb-6">
          <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
          {error}
        </div>
      )}

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="text-center py-20 md:py-32">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl mb-10">
            <i className="fa-solid fa-shield-halved text-white text-3xl md:text-5xl"></i>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
            No contracts yet.
          </h2>
          <p className="text-base md:text-lg text-slate-500 font-medium mb-10 max-w-md mx-auto">
            Upload your first contract and let SignWise AI protect you from hidden terms.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-700 transition active:scale-95"
          >
            Upload First Contract
          </button>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {documents.map((d) => (
            <DocumentCard
              key={d.docId}
              doc={d}
              onDelete={setDeleteTarget}
              onReAnalyze={handleReAnalyze}
            />
          ))}

          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white px-10 py-4 rounded-2xl border border-slate-200 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore ? <><i className="fa-solid fa-spinner animate-spin"></i> Loading</> : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Document"
          message={`Permanently delete "${deleteTarget.filename}"? This will remove the document and its analysis from your account.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default HomeDashboard;
