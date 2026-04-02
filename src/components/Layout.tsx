
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: 'upload' | 'vault' | 'help' | 'pricing' | 'privacy' | 'terms' | 'auth' | 'analytics' | 'obligations' | 'collaboration' | 'settings') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-slate-900 bg-slate-50/30 overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 md:space-x-3 cursor-pointer group shrink-0"
            onClick={() => onNavigate('upload')}
          >
            <div className="bg-slate-900 p-1.5 md:p-2.5 rounded-xl md:rounded-2xl shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-user-shield text-white text-base md:text-xl"></i>
            </div>
            <h1 className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">
              Guardian<span className="text-indigo-600">Pact</span> <span className="text-[10px] md:text-xs font-black uppercase text-indigo-400 align-top">AI</span>
            </h1>
          </div>
          
          <nav className="hidden lg:flex space-x-6 xl:space-x-8 text-[10px] xl:text-[11px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => onNavigate('upload')} className="hover:text-indigo-600 transition">Audit Batch</button>
            <button onClick={() => onNavigate('vault')} className="hover:text-indigo-600 transition">Secure Vault</button>
            <button onClick={() => onNavigate('analytics')} className="hover:text-indigo-600 transition">Forensics</button>
            <button onClick={() => onNavigate('obligations')} className="hover:text-indigo-600 transition">Deadlines</button>
            <button onClick={() => onNavigate('settings')} className="hover:text-indigo-600 transition flex items-center gap-2">
              <i className="fa-solid fa-sliders text-[8px]"></i> Intelligence Hub
            </button>
          </nav>

          <div className="flex items-center space-x-3 md:space-x-6">
            <button 
              onClick={() => onNavigate('auth')}
              className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition"
            >
              Agent Access
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="bg-indigo-600 text-white px-4 md:px-7 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 active:scale-95 whitespace-nowrap"
            >
              Get Shield Pro
            </button>
          </div>
        </div>
        {/* Mobile Sub-nav */}
        <nav className="lg:hidden flex border-t border-slate-100 bg-white/50 overflow-x-auto whitespace-nowrap scrollbar-hide px-4 py-2 space-x-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <button onClick={() => onNavigate('upload')} className="hover:text-indigo-600 transition">Audit</button>
          <button onClick={() => onNavigate('vault')} className="hover:text-indigo-600 transition">Vault</button>
          <button onClick={() => onNavigate('settings')} className="hover:text-indigo-600 transition">Settings</button>
          <button onClick={() => onNavigate('obligations')} className="hover:text-indigo-600 transition">Dates</button>
          <button onClick={() => onNavigate('collaboration')} className="hover:text-indigo-600 transition">Team</button>
        </nav>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
            <div className="sm:col-span-2">
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <i className="fa-solid fa-user-shield text-white text-xs"></i>
                </div>
                <h2 className="text-lg md:text-xl font-black text-white tracking-tighter">GuardianPact AI</h2>
              </div>
              <p className="text-sm max-w-sm leading-relaxed text-slate-400">The ultimate signer-first forensic legal bodyguard. Empowering signers to spot hidden traps and quantify asymmetry before they sign.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:col-span-2 md:col-span-2 md:grid-cols-2">
              <div>
                <h4 className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6">Forensics</h4>
                <ul className="space-y-3 md:space-y-4 text-xs">
                  <li><button onClick={() => onNavigate('pricing')} className="hover:text-white transition">Pricing</button></li>
                  <li><button onClick={() => onNavigate('analytics')} className="hover:text-white transition">Risk Stats</button></li>
                  <li><button onClick={() => onNavigate('settings')} className="hover:text-white transition">Settings</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6">Legal</h4>
                <ul className="space-y-3 md:space-y-4 text-xs">
                  <li><button onClick={() => onNavigate('privacy')} className="hover:text-white transition">Privacy Protocol</button></li>
                  <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition">Terms of Service</button></li>
                  <li><button onClick={() => onNavigate('help')} className="hover:text-white transition">Shield Support</button></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-8 md:pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-600 text-center md:text-left">
              &copy; 2024 GuardianPact AI Labs.
            </p>
            <p className="text-[8px] md:text-[9px] max-w-md text-center md:text-right leading-relaxed text-slate-700 uppercase font-black tracking-tight">
              DISCLAIMER: This is AI analysis, NOT legal advice. Consult a licensed attorney for binding interpretation. Files processed ephemerally.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
