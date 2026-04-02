import React from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white rounded-[2rem] p-8 md:p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
        <div className="w-14 h-14 bg-red-50 rounded-2xl mx-auto flex items-center justify-center mb-6">
          <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500"></i>
        </div>
        <h3 className="text-xl font-black text-slate-900 text-center tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-slate-500 text-center mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-4 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-4 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><i className="fa-solid fa-spinner animate-spin"></i> Deleting</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
