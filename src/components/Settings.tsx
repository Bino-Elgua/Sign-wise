
import React, { useState } from 'react';
import { UserPreferences, LLMModel, LLMProvider } from '../types/types';

interface SettingsProps {
  preferences: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ preferences, onUpdate, onBack }) => {
  const [activeProvider, setActiveProvider] = useState<LLMProvider>(preferences.provider || 'GEMINI');
  const [showCustomModel, setShowCustomModel] = useState(!!preferences.customModelId);

  const providerIcons: Record<LLMProvider, string> = {
    GEMINI: 'fa-google',
    ANTHROPIC: 'fa-ghost',
    MISTRAL: 'fa-wind',
    DEEPSEEK: 'fa-brain',
    OPENAI: 'fa-robot'
  };

  const modelPresets: Record<LLMProvider, { id: LLMModel; name: string; desc: string; icon: string; tier: string }[]> = {
    GEMINI: [
      { id: 'gemini-3-flash-preview', name: 'Rapid Sentinel', desc: 'Real-time triage. High quota.', icon: 'fa-bolt-lightning', tier: 'Flash' },
      { id: 'gemini-3-pro-preview', name: 'Forensic Architect', desc: 'Deep reasoning engine.', icon: 'fa-brain-circuit', tier: 'Pro' },
      { id: 'gemini-2.5-flash', name: 'Legacy Guard', desc: 'Stabilized core.', icon: 'fa-shield-halved', tier: 'Standard' }
    ],
    ANTHROPIC: [
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', desc: 'State-of-the-art reasoning.', icon: 'fa-feather', tier: 'Elite' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', desc: 'Complex long-form analysis.', icon: 'fa-scroll', tier: 'Master' }
    ],
    MISTRAL: [
      { id: 'mistral-large', name: 'Mistral Large', desc: 'Logical European model.', icon: 'fa-mountain', tier: 'Base' },
      { id: 'pixtral-12b', name: 'Pixtral', desc: 'Visual legal intelligence.', icon: 'fa-eye', tier: 'Edge' }
    ],
    DEEPSEEK: [
      { id: 'deepseek-v3', name: 'DeepSeek V3', desc: 'Advanced global context.', icon: 'fa-compass', tier: 'V3' },
      { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'Chain-of-thought forensic specialist.', icon: 'fa-link', tier: 'Reasoning' }
    ],
    OPENAI: [
      { id: 'gpt-4o', name: 'GPT-4o', desc: 'Multimodal precision.', icon: 'fa-check-double', tier: 'Omni' },
      { id: 'o1-preview', name: 'o1 Reasoning', desc: 'Deep problem-solving architecture.', icon: 'fa-microscope', tier: 'NextGen' }
    ]
  };

  const updateField = <K extends keyof UserPreferences>(field: K, value: UserPreferences[K]) => {
    onUpdate({ ...preferences, [field]: value });
  };

  const handleProviderSwitch = (p: LLMProvider) => {
    setActiveProvider(p);
    updateField('provider', p);
    // Auto-select first model of new provider
    if (modelPresets[p]) {
      updateField('preferredModel', modelPresets[p][0].id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase">Intelligence Hub</h2>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-2">Signer-First Multi-Model Orchestration</p>
        </div>
        <button onClick={onBack} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition shadow-xl active:scale-95">
          Save Shield Config
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Providers */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-4">AI Providers</h3>
          {(['GEMINI', 'ANTHROPIC', 'MISTRAL', 'DEEPSEEK', 'OPENAI'] as LLMProvider[]).map(p => (
            <button
              key={p}
              onClick={() => handleProviderSwitch(p)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeProvider === p ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
            >
              <i className={`fa-brands ${providerIcons[p]} text-sm`}></i>
              {p}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <section className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-2 h-full ${activeProvider === 'GEMINI' ? 'bg-blue-500' : activeProvider === 'ANTHROPIC' ? 'bg-orange-500' : activeProvider === 'DEEPSEEK' ? 'bg-cyan-500' : 'bg-slate-900'}`}></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <i className={`fa-solid ${providerIcons[activeProvider]} text-indigo-600`}></i>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{activeProvider} Engine Config</h3>
              </div>
              <button 
                onClick={() => setShowCustomModel(!showCustomModel)}
                className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-700 underline underline-offset-4"
              >
                {showCustomModel ? 'Presets' : 'Override ID'}
              </button>
            </div>

            {activeProvider !== 'GEMINI' && (
              <div className="mb-8 p-6 bg-slate-900 rounded-[2rem] border border-slate-800 animate-in slide-in-from-top-2">
                <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">{activeProvider} API Connection</h4>
                <div className="relative">
                  <input 
                    type="password"
                    value={preferences.externalKeys?.[activeProvider] || ''}
                    onChange={(e) => {
                      const keys = { ...preferences.externalKeys, [activeProvider]: e.target.value };
                      updateField('externalKeys', keys);
                    }}
                    placeholder={`Paste ${activeProvider} API Key here...`}
                    className="w-full bg-slate-800 border-none rounded-xl px-6 py-4 text-xs font-mono font-bold text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  />
                  <i className="fa-solid fa-key absolute right-4 top-1/2 -translate-y-1/2 text-slate-600"></i>
                </div>
                <p className="mt-3 text-[8px] text-slate-500 font-bold uppercase tracking-widest italic">Note: App currently emulates this model via Gemini-Bridge for session persistence.</p>
              </div>
            )}

            {!showCustomModel ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modelPresets[activeProvider].map(model => (
                  <button
                    key={model.id}
                    onClick={() => updateField('preferredModel', model.id)}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden ${preferences.preferredModel === model.id ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <span className="absolute top-2 right-4 text-[7px] font-black uppercase text-slate-400">{model.tier}</span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${preferences.preferredModel === model.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      <i className={`fa-solid ${model.icon}`}></i>
                    </div>
                    <h4 className={`text-xs font-black uppercase mb-2 ${preferences.preferredModel === model.id ? 'text-indigo-900' : 'text-slate-700'}`}>{model.name}</h4>
                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{model.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="animate-in slide-in-from-top-2">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                  <h4 className="text-[10px] font-black uppercase mb-4 text-slate-500 tracking-widest">Advanced Model ID Override</h4>
                  <input 
                    type="text"
                    value={preferences.customModelId || ''}
                    onChange={(e) => updateField('customModelId', e.target.value)}
                    placeholder="e.g. gpt-4o-2024-08-06"
                    className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-xs font-mono font-bold text-indigo-400 outline-none shadow-inner"
                  />
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
               <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-1"></i>
               <p className="text-[10px] text-amber-900 font-bold leading-relaxed">
                 If you see "Requested entity not found (404)", your selected project might not have access to preview models. Try switching to a "Flash" or "Standard" tier model.
               </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Sentinel Toolset</h3>
              <div className="space-y-6">
                {[
                  { label: 'Search Grounding', field: 'enableSearch', icon: 'fa-globe', desc: 'Real-time research.' },
                  { label: 'Visual Sealing', field: 'highQualitySeals', icon: 'fa-stamp', desc: 'Pro image fidelity.' },
                  { label: 'Voice Sentinel', field: 'voiceSentinelEnabled', icon: 'fa-microphone', desc: 'Live audio briefings.' }
                ].map(tool => (
                  <div key={tool.field} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid ${tool.icon} text-slate-600`}></i>
                      <div>
                        <h4 className="text-xs font-black uppercase">{tool.label}</h4>
                        <p className="text-[9px] text-slate-500">{tool.desc}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateField(tool.field as any, !(preferences as any)[tool.field])}
                      className={`w-12 h-7 rounded-full relative transition-colors ${(preferences as any)[tool.field] ? 'bg-indigo-500' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${(preferences as any)[tool.field] ? 'translate-x-5' : ''}`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-200">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Signer Context</h3>
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <span className="text-[8px] font-black uppercase text-slate-400 mb-2 block">Default Jurisdiction</span>
                  <input 
                    type="text"
                    value={preferences.defaultJurisdiction}
                    onChange={(e) => updateField('defaultJurisdiction', e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-xs font-bold outline-none text-slate-900"
                  />
                </div>
                <button 
                  onClick={() => updateField('strictMode', !preferences.strictMode)}
                  className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition shadow-md ${preferences.strictMode ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {preferences.strictMode ? 'STRICT ADVERSARIAL: ACTIVE' : 'STRICT MODE: OFF'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
