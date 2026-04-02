
import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { UserPreferences } from '../types/types';
import { SUPPORTED_MIME_TYPES } from '../services/geminiService';

interface UploadAreaProps {
  onUpload: (files: { base64: string; mimeType: string }[], preferences: UserPreferences) => void;
}

const EXTENSION_MAP: Record<string, string> = {
  'pdf': 'application/pdf',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'webp': 'image/webp',
  'txt': 'text/plain',
  'md': 'text/md',
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'js': 'text/plain',
  'ts': 'text/plain',
  'jsx': 'text/plain',
  'tsx': 'text/plain',
  'py': 'text/plain',
  'csv': 'text/csv',
  'xml': 'text/xml',
  'rtf': 'text/rtf'
};

const UploadArea: React.FC<UploadAreaProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{name: string, blob: Blob, type: string}[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newRule, setNewRule] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    strictMode: false,
    focusAreas: ['Liability', 'Financial', 'Privacy'],
    languagePreference: 'English',
    secureLocalMode: true,
    playbookRules: ['Liability must be capped at 1x deal value', 'Always flag mandatory arbitration']
  });
  const [showPrefs, setShowPrefs] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const list = Array.from(files);
    const newSelected: {name: string, blob: Blob, type: string}[] = [];

    for (const f of list) {
      const isZip = f.type === 'application/zip' || 
                    f.type === 'application/x-zip-compressed' || 
                    f.name.toLowerCase().endsWith('.zip');

      if (isZip) {
        setIsExtracting(true);
        try {
          const zip = new JSZip();
          const contents = await zip.loadAsync(f);
          
          for (const [path, file] of Object.entries(contents.files)) {
            const zipFile = file as any;
            if (!zipFile.dir && !path.includes('__MACOSX') && !path.startsWith('.')) {
              const blob = await zipFile.async('blob');
              const ext = path.split('.').pop()?.toLowerCase() || '';
              const type = EXTENSION_MAP[ext] || blob.type;

              if (SUPPORTED_MIME_TYPES.includes(type)) {
                newSelected.push({ name: path.split('/').pop() || path, blob, type });
              }
            }
          }
        } catch (err) {
          console.error("ZIP Error:", err);
          setErrorMessage(`Failed to extract ZIP: ${f.name}`);
        } finally {
          setIsExtracting(false);
        }
      } else {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        const mappedType = EXTENSION_MAP[ext] || f.type;
        
        if (SUPPORTED_MIME_TYPES.includes(mappedType)) {
          newSelected.push({ name: f.name, blob: f, type: mappedType });
        } else {
          setErrorMessage(`Unsupported format: ${f.name}. Use PDF, Images, Text, or ZIP.`);
        }
      }
    }

    if (newSelected.length > 0) {
      setSelectedFiles(prev => {
        const combined = [...prev, ...newSelected];
        const unique = Array.from(new Map(combined.map(item => [item.name, item])).values());
        return unique.slice(0, 30);
      });
    }
  };

  const processUpload = async () => {
    if (selectedFiles.length === 0) return;
    const payloads = await Promise.all(selectedFiles.map(file => {
      return new Promise<{ base64: string; mimeType: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ base64: (e.target?.result as string).split(',')[1], mimeType: file.type });
        reader.readAsDataURL(file.blob);
      });
    }));
    onUpload(payloads as any, preferences);
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setPreferences(prev => ({ ...prev, playbookRules: [...(prev.playbookRules || []), newRule] }));
    setNewRule('');
  };

  const removeRule = (idx: number) => {
    setPreferences(prev => ({ ...prev, playbookRules: prev.playbookRules?.filter((_, i) => i !== idx) }));
  };

  const templates = [
    { name: 'Mutual NDA', icon: 'fa-handshake-simple' },
    { name: 'Freelance', icon: 'fa-briefcase' },
    { name: 'Rent Lease', icon: 'fa-house-user' },
    { name: 'SaaS Terms', icon: 'fa-cloud' }
  ];

  const handleCloudIntake = (provider: string) => {
    // Redirecting to cloud provider picker or documentation
    const urls: Record<string, string> = {
      'Google Drive': 'https://drive.google.com',
      'Dropbox': 'https://www.dropbox.com',
      'OneDrive': 'https://onedrive.live.com'
    };
    window.open(urls[provider] || '#', '_blank');
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <i className="fa-solid fa-circle-exclamation text-amber-500"></i>
          {errorMessage}
        </div>
      )}

      {isExtracting && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center gap-3 text-indigo-800 text-xs font-bold animate-pulse">
          <i className="fa-solid fa-file-zipper text-indigo-500"></i>
          Sentinel is extracting your archive...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <button 
          onClick={() => setShowPrefs(!showPrefs)}
          className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-200 flex items-center justify-between hover:shadow-xl transition group text-left shadow-sm"
        >
          <div className="flex items-center gap-4 md:gap-5 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center text-indigo-600 group-hover:rotate-6 transition-transform">
              <i className="fa-solid fa-gavel text-sm md:text-base"></i>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-800 truncate block">Playbook Engine</span>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{preferences.playbookRules?.length || 0} active rules</p>
            </div>
          </div>
          <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform ${showPrefs ? 'rotate-180' : ''}`}></i>
        </button>

        <button 
          onClick={() => setShowTemplates(!showTemplates)}
          className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-200 flex items-center justify-between hover:shadow-xl transition group text-left shadow-sm"
        >
          <div className="flex items-center gap-4 md:gap-5 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center text-amber-600 group-hover:rotate-6 transition-transform">
              <i className="fa-solid fa-layer-group text-sm md:text-base"></i>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-800 truncate block">Template Vault</span>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">Verified Blueprints</p>
            </div>
          </div>
          <i className={`fa-solid fa-chevron-right text-slate-300 transition-transform ${showTemplates ? 'rotate-90' : ''}`}></i>
        </button>
      </div>

      {showPrefs && (
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-2xl animate-in zoom-in-95">
           <h4 className="text-[10px] md:text-xs font-black text-slate-900 uppercase mb-4 md:mb-6 tracking-widest px-1">Signer Constraints</h4>
           <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
             {preferences.playbookRules?.map((rule, i) => (
               <div key={i} className="flex items-center justify-between bg-slate-50 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-slate-100 group">
                 <div className="flex items-center gap-2 md:gap-3 min-w-0">
                   <i className="fa-solid fa-check text-emerald-500 shrink-0 text-xs"></i>
                   <span className="text-[10px] md:text-xs font-bold text-slate-600 truncate">{rule}</span>
                 </div>
                 <button onClick={() => removeRule(i)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 shrink-0 ml-2"><i className="fa-solid fa-trash text-xs"></i></button>
               </div>
             ))}
           </div>
           <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
             <input 
              type="text" 
              value={newRule} 
              onChange={e => setNewRule(e.target.value)}
              placeholder="e.g. Always flag 24 month terms..."
              className="flex-1 bg-slate-100 border-none rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-inner"
             />
             <button onClick={addRule} className="w-full sm:w-auto bg-slate-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest active:scale-95 transition">Add</button>
           </div>
        </div>
      )}

      {showTemplates && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-in slide-in-from-top-4 px-1">
           {templates.map((t, i) => (
             <div key={i} className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 md:gap-4 cursor-pointer hover:border-indigo-400 hover:shadow-xl transition group">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition shadow-inner">
                  <i className={`fa-solid ${t.icon} text-xl md:text-3xl`}></i>
                </div>
                <span className="text-[8px] md:text-[10px] font-black text-slate-800 uppercase tracking-tight text-center truncate w-full">{t.name}</span>
             </div>
           ))}
        </div>
      )}

      {/* Cloud Intake Actions */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 px-2">
        <button onClick={() => handleCloudIntake('Google Drive')} className="flex-1 sm:flex-none bg-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-slate-200 text-[9px] md:text-xs font-black text-slate-500 hover:border-blue-400 transition flex items-center justify-center gap-2">
          <i className="fa-brands fa-google-drive text-blue-500 text-base md:text-lg"></i> Drive
        </button>
        <button onClick={() => handleCloudIntake('Dropbox')} className="flex-1 sm:flex-none bg-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-slate-200 text-[9px] md:text-xs font-black text-slate-500 hover:border-blue-400 transition flex items-center justify-center gap-2">
          <i className="fa-brands fa-dropbox text-blue-600 text-base md:text-lg"></i> Dropbox
        </button>
        <button onClick={() => handleCloudIntake('OneDrive')} className="flex-1 sm:flex-none bg-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-slate-200 text-[9px] md:text-xs font-black text-slate-500 hover:border-blue-400 transition flex items-center justify-center gap-2">
          <i className="fa-solid fa-cloud text-sky-500 text-base md:text-lg"></i> OneDrive
        </button>
      </div>

      <div 
        className={`relative border-[4px] md:border-[6px] border-dashed rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 transition-all duration-700 bg-white group shadow-inner cursor-pointer text-center ${
          isDragging ? 'border-indigo-500 bg-indigo-50 scale-98' : 'border-slate-100 hover:border-indigo-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          accept={SUPPORTED_MIME_TYPES.join(',') + ',.zip,application/zip,application/x-zip-compressed'}
          className="hidden" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files && handleFiles(e.target.files)} 
        />
        {selectedFiles.length > 0 ? (
          <div className="space-y-6 md:space-y-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Analysis Batch ({selectedFiles.length})</h3>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 px-4 max-h-[300px] overflow-y-auto py-4 scrollbar-hide">
              {selectedFiles.map((f, i) => (
                <div key={i} className="bg-slate-50 px-4 md:px-6 py-2.5 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 flex items-center gap-2 md:gap-3 relative group/f shadow-sm min-w-0 max-w-full">
                  <i className={`fa-solid ${f.type.includes('pdf') ? 'fa-file-pdf' : f.type.includes('image') ? 'fa-file-image' : 'fa-file-lines'} text-indigo-500 shrink-0 text-sm`}></i>
                  <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-600 truncate max-w-[100px] sm:max-w-[150px]">{f.name}</span>
                  <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-300 hover:text-red-500 transition shrink-0 ml-1"><i className="fa-solid fa-circle-xmark"></i></button>
                </div>
              ))}
              {selectedFiles.length < 30 && (
                <button onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-dashed border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-2 md:py-4 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center">
                  <i className="fa-solid fa-plus-circle text-lg"></i>
                </button>
              )}
            </div>
            <button onClick={processUpload} className="w-full sm:w-auto bg-indigo-600 text-white px-10 md:px-20 py-4 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-[0_20px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-700 transition active:scale-95">Analyze Protective Batch</button>
          </div>
        ) : (
          <div className="py-6 md:py-10">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-600 rounded-[1.5rem] md:rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl mb-8 md:mb-12 animate-bounce-slow shrink-0">
              <i className="fa-solid fa-shield-halved text-white text-2xl md:text-4xl"></i>
            </div>
            <h3 className="text-3xl md:text-6xl font-black text-slate-900 mb-4 md:mb-6 tracking-tighter leading-none text-balance">Universal <span className="text-indigo-600">Secure</span> Intake.</h3>
            <p className="text-sm md:text-xl text-slate-500 mb-10 md:mb-16 max-w-lg mx-auto font-medium leading-relaxed px-4">Securely ingest PDFs, scans, ZIPs, or folders. Archives are extracted client-side for maximum privacy.</p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-slate-300 px-4">
               <div className="flex flex-col items-center gap-1.5 md:gap-2 group cursor-default">
                  <i className="fa-solid fa-file-pdf text-2xl md:text-4xl group-hover:text-red-500 transition-all"></i>
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter">PDF</span>
               </div>
               <div className="flex flex-col items-center gap-1.5 md:gap-2 group cursor-default">
                  <i className="fa-solid fa-file-zipper text-2xl md:text-4xl group-hover:text-indigo-500 transition-all"></i>
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter">Archives</span>
               </div>
               <div className="flex flex-col items-center gap-1.5 md:gap-2 group cursor-default">
                  <i className="fa-solid fa-camera text-2xl md:text-4xl group-hover:text-amber-500 transition-all"></i>
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter">Scans</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadArea;
