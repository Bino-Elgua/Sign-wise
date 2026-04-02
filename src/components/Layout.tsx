import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLink = (path: string, label: string) => {
    const active = location.pathname === path;
    return (
      <button
        onClick={() => navigate(path)}
        className={`hover:text-indigo-600 transition ${active ? 'text-indigo-600' : ''}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-slate-900 bg-slate-50/30 overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 md:space-x-3 cursor-pointer group shrink-0"
            onClick={() => navigate(user ? '/' : '/login')}
          >
            <div className="bg-slate-900 p-1.5 md:p-2.5 rounded-xl md:rounded-2xl shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-user-shield text-white text-base md:text-xl"></i>
            </div>
            <h1 className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">
              Sign<span className="text-indigo-600">Wise</span>{' '}
              <span className="text-[10px] md:text-xs font-black uppercase text-indigo-400 align-top">AI</span>
            </h1>
          </div>

          {/* Nav links (authenticated only) */}
          {user && !isAuthPage && (
            <nav className="hidden md:flex space-x-8 text-[10px] xl:text-[11px] font-black uppercase tracking-widest text-slate-400">
              {navLink('/', 'Dashboard')}
              {navLink('/upload', 'Upload')}
              {navLink('/settings', 'Settings')}
            </nav>
          )}

          {/* User section */}
          {user && !isAuthPage && (
            <div className="flex items-center gap-3 md:gap-5">
              <div className="hidden sm:flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-slate-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <span className="text-[10px] font-bold text-slate-500 truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-right-from-bracket text-[9px]"></i>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile sub-nav */}
        {user && !isAuthPage && (
          <nav className="md:hidden flex border-t border-slate-100 bg-white/50 overflow-x-auto whitespace-nowrap scrollbar-hide px-4 py-2 space-x-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
            {navLink('/', 'Dashboard')}
            {navLink('/upload', 'Upload')}
            {navLink('/settings', 'Settings')}
          </nav>
        )}
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-slate-900 text-slate-400 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <i className="fa-solid fa-user-shield text-white text-xs"></i>
              </div>
              <span className="text-sm font-black text-white tracking-tighter">SignWise AI</span>
            </div>
            <p className="text-[8px] md:text-[9px] max-w-lg text-center md:text-right leading-relaxed text-slate-600 uppercase font-black tracking-tight">
              DISCLAIMER: AI analysis only — not legal advice. Consult a licensed attorney before signing binding agreements. &copy; 2025 SignWise AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
