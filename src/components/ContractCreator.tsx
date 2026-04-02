
import React, { useState } from 'react';
// Added UserPreferences to support core engine logic
import { UserPreferences } from '../types/types';
import { refineContract } from '../services/geminiService';

interface ContractCreatorProps {
  initialContent: string;
  onConfirm: (content: string) => void;
  onRestart: () => void;
  // Added preferences to ensure refinement uses the correct AI model and tools
  preferences: UserPreferences;
}

const ContractCreator: React.FC<ContractCreatorProps> = ({ initialContent, onConfirm, onRestart, preferences }) => {
  const [content, setContent] = useState(initialContent);
  const [isRefining, setIsRefining] = useState(false);

  const handleRefine = async (instruction: string) => {
    setIsRefining(true);
    try {
      // Fixed: Passed preferences as the 3rd required argument to refineContract
      const refined = await refineContract(content, instruction, preferences);
      setContent(refined);
    } catch (e) {
      alert("Refining failed.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">AI Contract Architect</span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Drafter Mode</h2>
        </div>
        <button 
          onClick={onRestart}
          className="text-slate-400 hover:text-slate-600 font-bold text-sm transition"
        >
          Discard & Restart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legal Document Editor</span>
              {isRefining && <span className="text-xs font-bold text-indigo-600 animate-pulse">Refining with AI...</span>}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[600px] p-8 font-serif text-lg leading-relaxed focus:outline-none resize-none bg-white text-slate-800"
              placeholder="Your contract will appear here..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
             <div className="flex items-center gap-3 mb-4">
                <i className="fa-solid fa-wand-magic-sparkles text-2xl text-indigo-200"></i>
                <h3 className="text-xl font-bold">Smart Controls</h3>
             </div>
             
             <div className="space-y-3">
               <button 
                onClick={() => handleRefine("Apply standard fair terms for all parties and ensure compliance with typical consumer protection laws.")}
                disabled={isRefining}
                className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
               >
                 <i className="fa-solid fa-scale-balanced"></i>
                 Standardize Terms
               </button>
               <button 
                onClick={() => handleRefine("Simplify the language to a 10th-grade reading level, removing complex legalese while preserving legal intent.")}
                disabled={isRefining}
                className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
               >
                 <i className="fa-solid fa-language"></i>
                 Simplify Language
               </button>
               <button 
                onClick={() => handleRefine("Add a clear termination clause that allows the signer to exit with 30 days notice.")}
                disabled={isRefining}
                className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
               >
                 <i className="fa-solid fa-door-open"></i>
                 Add Exit Clause
               </button>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
             <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-file-signature text-emerald-500"></i>
                Deployment
             </h4>
             <button 
                onClick={() => onConfirm(content)}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
             >
                Prepare for E-Sign
                <i className="fa-solid fa-arrow-right"></i>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCreator;
