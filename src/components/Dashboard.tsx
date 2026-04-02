
import React, { useState, useRef, useEffect } from 'react';
import { ContractAnalysis, ChatMessage, AuditEntry, UserPreferences } from '../types/types';
import RedFlagCard from './RedFlagCard';
import { 
  generateVoiceSummary, 
  decodeBase64, 
  decodeAudioData, 
  chatWithDocument
} from '../services/geminiService';

interface DashboardProps {
  analysis: ContractAnalysis;
  sealUrl?: string;
  onConfirm: () => void;
  onRestart: () => void;
  onDecline: () => void;
  auditTrail: AuditEntry[];
  preferences: UserPreferences;
}

const Dashboard: React.FC<DashboardProps> = ({ analysis, sealUrl, onConfirm, onRestart, onDecline, auditTrail, preferences }) => {
  const [activeTab, setActiveTab] = useState<'risk' | 'negotiate' | 'intel'>('risk');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatOpen]);

  const score = analysis?.signerScore || 0;
  const getScoreColor = (s: number) => {
    if (s > 75) return 'bg-emerald-500';
    if (s > 40) return 'bg-amber-500';
    return 'bg-red-600';
  };

  const handleListen = async () => {
    setIsGeneratingVoice(true);
    try {
      const b64 = await generateVoiceSummary(analysis?.summary || "Analyzing document risks.");
      const ctx = new AudioContext();
      const b = await decodeAudioData(decodeBase64(b64), ctx);
      const s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start();
    } catch (e) { alert("Audio interrupted."); } finally { setIsGeneratingVoice(false); }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const r = await chatWithDocument(userMsg, analysis, chatHistory, preferences);
      setChatHistory(prev => [...prev, { role: 'model', text: r.text, citations: r.citations }]);
    } finally { setIsChatLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
         <div className="absolute top-0 right-0 p-6 flex items-center gap-4">
           {sealUrl && (
             <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-slate-100 group hover:scale-110 transition-transform">
               <img src={sealUrl} alt="Forensic Seal" className="w-full h-full object-cover" />
             </div>
           )}
           <button onClick={handleListen} disabled={isGeneratingVoice} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 transition shadow-sm">
             <i className={`fa-solid ${isGeneratingVoice ? 'fa-spinner fa-spin' : 'fa-volume-high'}`}></i>
           </button>
         </div>
         <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="relative shrink-0">
               <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={`${score * 2.82} 282`} strokeLinecap="round" className={getScoreColor(score).replace('bg-', 'text-')} />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-900">{score}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Safety Score</span>
               </div>
            </div>
            <div className="flex-1 text-center md:text-left">
               <div className="flex items-center gap-3 mb-2">
                 <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-full">{preferences.provider} CORE</span>
                 <span className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">{preferences.preferredModel}</span>
               </div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase">Forensic Audit Result</h2>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Exposure</span>
                   <p className="text-xs font-bold text-slate-900">{analysis?.liabilityModel?.estimatedExposure || 'TBD'}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Risk Logic</span>
                   <p className="text-xs font-bold text-indigo-600 truncate">{preferences.provider}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Jurisdiction</span>
                   <p className="text-xs font-bold text-slate-900 truncate">{preferences.defaultJurisdiction}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Hazards</span>
                   <p className="text-xs font-bold text-red-600">{analysis?.redFlags?.length || 0} Flags</p>
                 </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
          <nav className="flex border-b border-slate-100 bg-slate-50/50">
            {[
              { id: 'risk', label: 'Forensic Audit', icon: 'fa-shield-halved' },
              { id: 'intel', label: 'Titan Logic', icon: 'fa-brain' },
              { id: 'negotiate', label: 'Arsenal', icon: 'fa-handshake' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition ${activeTab === tab.id ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className={`fa-solid ${tab.icon} text-sm`}></i>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="p-10 min-h-[500px]">
            {activeTab === 'risk' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {(analysis?.redFlags || []).map((f, i) => <RedFlagCard key={i} {...f} id={i.toString()} />)}
                </div>
                <div className="space-y-6">
                   <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl">
                     <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Executive Briefing</h4>
                     <p className="text-sm leading-relaxed opacity-90">{analysis?.summary}</p>
                   </div>
                </div>
              </div>
            )}
            
            {activeTab === 'intel' && (
              <div className="space-y-8 animate-in zoom-in-95">
                <div className="bg-white p-12 rounded-[3rem] border-2 border-slate-100">
                   <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
                     <i className="fa-solid fa-scale-unbalanced-flip text-indigo-500"></i> Asymmetry Scanner
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {(analysis?.asymmetricClauses || []).map((ac, i) => (
                       <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                         <h5 className="text-[10px] font-black uppercase text-indigo-600 mb-4">{ac.category}</h5>
                         <div className="grid grid-cols-2 gap-6">
                           <div>
                             <span className="text-[7px] font-black uppercase text-slate-400 block mb-1">Counterparty</span>
                             <p className="text-[10px] font-bold text-slate-800 leading-relaxed">{ac.counterpartyRight}</p>
                           </div>
                           <div className="border-l border-slate-200 pl-6">
                             <span className="text-[7px] font-black uppercase text-slate-400 block mb-1">Signer</span>
                             <p className="text-[10px] font-bold text-slate-800 leading-relaxed">{ac.signerRight}</p>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Chat Sentinel */}
        <div className={`fixed bottom-8 right-8 w-[450px] bg-white rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col transition-all duration-500 z-[100] ${isChatOpen ? 'h-[600px] opacity-100' : 'h-20 w-20 rounded-full'}`}>
           {!isChatOpen ? (
             <button onClick={() => setIsChatOpen(true)} className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 transition">
                <i className="fa-solid fa-user-shield text-2xl"></i>
             </button>
           ) : (
             <div className="flex flex-col h-full overflow-hidden">
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-shield-halved text-sm"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Sentinel Chat</h4>
                        <span className="text-[8px] text-emerald-400 font-bold uppercase">{preferences.provider} ENGINE</span>
                      </div>
                   </div>
                   <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>
                <div className="flex-grow overflow-y-auto p-8 space-y-6">
                   {chatHistory.map((msg, i) => (
                     <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-800 border border-slate-100'}`}>
                           <p className="text-[11px] font-medium leading-relaxed">{msg.text}</p>
                        </div>
                     </div>
                   ))}
                   {isChatLoading && <div className="animate-pulse flex gap-2"><div className="w-2 h-2 bg-indigo-200 rounded-full"></div><div className="w-2 h-2 bg-indigo-200 rounded-full animate-delay-150"></div></div>}
                   <div ref={chatEndRef} />
                </div>
                <div className="p-8 border-t border-slate-100">
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendChat()}
                        placeholder="Forensic query..."
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                      />
                      <button onClick={handleSendChat} disabled={isChatLoading} className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-indigo-600 transition">
                         <i className="fa-solid fa-bolt text-sm"></i>
                      </button>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
