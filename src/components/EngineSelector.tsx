import React from 'react';
import { AnalysisEngine, OLLAMA_MODELS, OllamaModel } from '../types/types';

interface EngineSelectorProps {
  engine: AnalysisEngine;
  model: OllamaModel;
  onChange: (engine: AnalysisEngine, model: OllamaModel) => void;
  disabled?: boolean;
}

const EngineSelector: React.FC<EngineSelectorProps> = ({ engine, model, onChange, disabled }) => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
        <i className="fa-solid fa-microchip text-indigo-600"></i> Analysis Engine
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Gemini */}
        <button
          onClick={() => onChange('gemini', model)}
          disabled={disabled}
          className={`p-4 md:p-5 rounded-2xl border-2 text-left transition-all ${
            engine === 'gemini'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-slate-100 hover:border-slate-200'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              engine === 'gemini' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <i className="fa-solid fa-bolt text-sm"></i>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Gemini</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400">2.5 Flash • Cloud</p>
        </button>

        {/* Ollama */}
        <button
          onClick={() => onChange('ollama', model)}
          disabled={disabled}
          className={`p-4 md:p-5 rounded-2xl border-2 text-left transition-all ${
            engine === 'ollama'
              ? 'border-cyan-600 bg-cyan-50'
              : 'border-slate-100 hover:border-slate-200'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              engine === 'ollama' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <i className="fa-solid fa-server text-sm"></i>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Ollama</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400">Local & Cloud Models</p>
        </button>
      </div>

      {/* Ollama model dropdown */}
      {engine === 'ollama' && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
            Select Model
          </label>
          <select
            value={model}
            onChange={(e) => onChange('ollama', e.target.value as OllamaModel)}
            disabled={disabled}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
          >
            {OLLAMA_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default EngineSelector;
