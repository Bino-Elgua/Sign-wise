import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateFile, getAcceptString, uploadDocument } from '../services/uploadService';

const DocumentUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFile = (file: File) => {
    setError(null);
    setProgress(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const { docId } = await uploadDocument(selectedFile, setProgress);
      navigate(`/analyze/${docId}`);
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Please try again.');
      setProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const fileIcon = (type: string) => {
    if (type.includes('pdf')) return 'fa-file-pdf text-red-500';
    if (type.includes('word') || type.includes('openxml')) return 'fa-file-word text-blue-500';
    if (type.includes('image')) return 'fa-file-image text-amber-500';
    return 'fa-file text-slate-400';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-12 md:mb-16">
        <span className="inline-block px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-8 border border-slate-700">
          Secure Document Intake
        </span>
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4">
          Upload <span className="text-indigo-600">Contract.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 font-medium">
          PDF, DOCX, PNG, or JPG — 10MB max
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold mb-6 animate-in fade-in slide-in-from-top-2">
          <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
          {error}
        </div>
      )}

      <div
        className={`relative border-[4px] border-dashed rounded-[3rem] p-10 md:p-16 transition-all duration-500 bg-white group shadow-inner cursor-pointer text-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 scale-[0.98]'
            : 'border-slate-100 hover:border-indigo-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept={getAcceptString()}
          className="hidden"
          ref={fileInputRef}
          onChange={handleInputChange}
        />

        {selectedFile ? (
          <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] mx-auto flex items-center justify-center border-2 border-slate-100">
              <i className={`fa-solid ${fileIcon(selectedFile.type)} text-3xl`}></i>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-1">
                {selectedFile.name}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            {progress !== null && (
              <div className="max-w-md mx-auto">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  {progress < 100 ? `Uploading... ${progress}%` : 'Securing document...'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-spinner animate-spin"></i> Uploading
                  </span>
                ) : (
                  'Upload & Analyze'
                )}
              </button>
              <button
                onClick={() => { setSelectedFile(null); setProgress(null); setError(null); }}
                disabled={uploading}
                className="text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest transition disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 md:py-10">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl mb-8 md:mb-12 animate-bounce-slow">
              <i className="fa-solid fa-cloud-arrow-up text-white text-2xl md:text-4xl"></i>
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
              Drop your <span className="text-indigo-600">contract</span> here.
            </h3>
            <p className="text-sm md:text-lg text-slate-500 font-medium mb-10">
              or click to browse files
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <i className="fa-solid fa-file-pdf text-2xl md:text-3xl group-hover:text-red-500 transition"></i>
                <span className="text-[7px] font-black uppercase tracking-tighter">PDF</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <i className="fa-solid fa-file-word text-2xl md:text-3xl group-hover:text-blue-500 transition"></i>
                <span className="text-[7px] font-black uppercase tracking-tighter">DOCX</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <i className="fa-solid fa-file-image text-2xl md:text-3xl group-hover:text-amber-500 transition"></i>
                <span className="text-[7px] font-black uppercase tracking-tighter">PNG / JPG</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
